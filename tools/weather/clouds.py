# Cloud in-betweens: follow each cloud from one drawn frame to the next and slide it there.
# Frames play in file-number order (1.png, 2.png, ...).
#
# Each separate cloud in a frame is found, then its exact shape is searched for in the next
# frame (so two clouds that overlap, or one drifting off the edge, are still followed
# separately). The next frame's clouds are split up the same way, and both are slid toward
# each other while they blend. Clouds that leave or arrive fade out or in as they keep moving.
import numpy as np
import cv2

PAD = 200  # room around the frame so clouds can be followed off the edge


def blobs(f):
    """Separate clouds in a frame: list of (mask, x, y) with their centres."""
    m = (f[..., 3] > 0.04).astype(np.uint8)
    m = cv2.dilate(m, np.ones((5, 5), np.uint8))
    n, lab, stats, cents = cv2.connectedComponentsWithStats(m)
    return [((lab == i).astype(np.float32), cents[i][0], cents[i][1]) for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= 40]


def move(img, dx, dy):
    M = np.float32([[1, 0, dx], [0, 1, dy]])
    h, w = img.shape[:2]
    return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def find_shift(A, mask, B, search=(-60, 160, -45, 45)):
    """Where does this cloud's shape (from A) appear in B? Returns (dx, dy, score)."""
    ys, xs = np.where(mask > 0)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    tpl = (A[..., 3] * mask)[y0:y1, x0:x1].astype(np.float32)
    big = np.pad(B[..., 3], PAD).astype(np.float32)
    sx0, sx1, sy0, sy1 = search
    X0, X1 = x0 + PAD + sx0, x1 + PAD + sx1
    Y0, Y1 = y0 + PAD + sy0, y1 + PAD + sy1
    X0, Y0 = max(X0, 0), max(Y0, 0)
    region = big[Y0:min(Y1, big.shape[0]), X0:min(X1, big.shape[1])]
    if region.shape[0] < tpl.shape[0] or region.shape[1] < tpl.shape[1]:
        return 0.0, 0.0, 0.0
    # Sum of squared differences, so a cloud half off the edge still finds where it went.
    res = cv2.matchTemplate(region, tpl, cv2.TM_SQDIFF)
    _, _, mn, _ = cv2.minMaxLoc(res)
    best = res[mn[1], mn[0]]
    worst = float((tpl ** 2).sum()) + 1e-6  # what "nothing there" would score
    score = 1 - best / worst
    return float(X0 + mn[0] - PAD - x0), float(Y0 + mn[1] - PAD - y0), float(score)


def over(src, dst):
    """Premultiplied "src over dst": overlapping clouds don't double up into bright seams."""
    return src + dst * (1 - src[..., 3:4])


def tween_clouds(keys, steps, ease):
    """`steps` in-betweens per drawn frame on average, shared out by how far the clouds
    travel in each stretch, so they drift at one steady speed. Each cloud keeps its
    identity from frame to frame, so overlapping clouds stay separate."""
    h, w = keys[0].shape[:2]
    masks = [m for m, _x, _y in blobs(keys[0])]  # the clouds being followed
    segs = []
    last_v = (30.0, 0.0)
    for k in range(len(keys)):
        A, B = keys[k], keys[(k + 1) % len(keys)]
        moves = []
        for mask in masks:
            dx, dy, sc = find_shift(A, mask, B)
            moves.append((dx, dy, sc > 0.45 and -15 < dx < 100))  # clouds drift right at a gentle pace; anything else is a mismatch
        fol = [(dx, dy) for dx, dy, ok in moves if ok]
        v = (float(np.mean([m[0] for m in fol])), float(np.mean([m[1] for m in fol]))) if fol else last_v
        last_v = v
        moves = [(dx, dy, ok) if ok else (v[0], v[1], False) for dx, dy, ok in moves]  # leaving clouds keep drifting
        # Split B into the clouds that came from A (nearest moved cloud); the rest are arriving.
        # Each connected shape in B belongs, pixel by pixel, to the nearest followed cloud that
        # moved into it; a shape no followed cloud reached is a new arrival.
        claim = np.full((h, w), -1, np.int32)
        dists = []
        for i, (mask, (dx, dy, ok)) in enumerate(zip(masks, moves)):
            if not ok:
                dists.append(None)
                continue
            mv = (move(mask, dx, dy) > 0.5).astype(np.uint8)
            dists.append(cv2.distanceTransform(1 - mv, cv2.DIST_L2, 3))
        nb, lab = cv2.connectedComponents(cv2.dilate((B[..., 3] > 0.04).astype(np.uint8), np.ones((5, 5), np.uint8)))
        for c in range(1, nb):
            comp = lab == c
            owners = [i for i, d in enumerate(dists) if d is not None and (d[comp] < 12).any()]
            if not owners:
                continue
            stack = np.stack([dists[i] for i in owners])
            nearest = np.array(owners)[np.argmin(stack, axis=0)]
            claim[comp] = nearest[comp]
        travel = float(np.mean([abs(dx) + abs(dy) for dx, dy, ok in moves if ok])) if fol else None
        segs.append((A, B, masks, moves, claim, travel))
        # Next frame's clouds: the followed ones (their claimed part of B) plus any new arrivals.
        drawn = (B[..., 3] > 0.04)
        nxt = [((claim == i) & drawn).astype(np.float32) for i, (_d, _e, ok) in enumerate(moves) if ok and ((claim == i) & drawn).sum() > 40]
        arrivals = (claim < 0) & drawn
        nxt += [m for m, _x, _y in blobs(B * arrivals[..., None])]
        masks = nxt
    known = [s[-1] for s in segs if s[-1]]
    avg = np.mean(known) if known else 1
    total = steps * len(keys)
    weights = [(s[-1] if s[-1] else avg) for s in segs]
    counts = [max(3, round(total * wgt / sum(weights))) for wgt in weights]

    out = []
    for (A, B, masks_k, moves, claim, _t), n in zip(segs, counts):
        for s in range(n):
            t = s / n
            te = ease(t)
            fr = np.zeros_like(A)
            for i, (mask, (dx, dy, ok)) in enumerate(zip(masks_k, moves)):
                # Each cloud is its own blend of where it was (A) and where it's going (B)...
                c = move(A * mask[..., None], t * dx, t * dy) * (1 - te)
                if ok:
                    c += move(B * (claim == i)[..., None], -(1 - t) * dx, -(1 - t) * dy) * te
                fr = over(np.clip(c, 0, 1), fr)  # ...and clouds are layered over each other, not added
            fr = over(B * (claim < 0)[..., None] * te, fr)  # arriving clouds fade in
            out.append(np.clip(fr, 0, 1))
    return out
