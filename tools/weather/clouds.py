# Cloud in-betweens by matching each separate cloud between frames and sliding it.
import numpy as np, cv2


def blobs(f):
    """Separate clouds in a frame: list of (mask, centroid x, centroid y, area)."""
    m = (f[..., 3] > 0.04).astype(np.uint8)
    m = cv2.dilate(m, np.ones((9, 9), np.uint8))  # puffs of one cloud count as one
    n, lab, stats, cents = cv2.connectedComponentsWithStats(m)
    out = []
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < 40:
            continue
        out.append(((lab == i).astype(np.float32), cents[i][0], cents[i][1], stats[i, cv2.CC_STAT_AREA]))
    return out


def move(img, dx, dy):
    M = np.float32([[1, 0, dx], [0, 1, dy]])
    h, w = img.shape[:2]
    return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def match(ba, bb, w):
    """Pair each cloud in A with the nearest cloud in B (clouds drift, so allow big moves)."""
    pairs, used = [], set()
    for i, (_, ax, ay, aa) in enumerate(ba):
        best, bd = None, 1e9
        for j, (_, bx, by, ab) in enumerate(bb):
            if j in used:
                continue
            d = abs(bx - ax) + 2.5 * abs(by - ay) + 0.02 * abs(ab - aa)
            if d < bd:
                best, bd = j, d
        if best is not None and bd < w * 0.45:
            used.add(best)
            pairs.append((i, best))
    return pairs, used


def tween_clouds(keys, steps, ease):
    """`steps` in-betweens per drawn frame on average, shared out by how far the clouds
    travel in each stretch, so they drift at one steady speed."""
    out = []
    h, w = keys[0].shape[:2]
    segs = []
    for k in range(len(keys)):
        A, B = keys[k], keys[(k + 1) % len(keys)]
        ba, bb = blobs(A), blobs(B)
        pairs, used = match(ba, bb, w)
        travel = np.mean([abs(bb[j][1] - ba[i][1]) + abs(bb[j][2] - ba[i][2]) for i, j in pairs]) if pairs else None
        segs.append((A, B, ba, bb, pairs, used, travel))
    known = [t for *_r, t in segs if t]
    avg = np.mean(known) if known else 1
    total = steps * len(keys)
    weights = [(t if t else avg) for *_r, t in segs]
    counts = [max(3, round(total * wgt / sum(weights))) for wgt in weights]
    for (A, B, ba, bb, pairs, used, _t), n in zip(segs, counts):
        paired_a = {i for i, _ in pairs}
        for s in range(n):
            t = s / n
            te = ease(t)
            fr = np.zeros_like(A)
            for i, j in pairs:
                ma, ax, ay, _ = ba[i]
                mb, bx, by, _ = bb[j]
                dx, dy = bx - ax, by - ay
                pa = move(A * ma[..., None], t * dx, t * dy)
                pb = move(B * mb[..., None], -(1 - t) * dx, -(1 - t) * dy)
                fr += pa * (1 - te) + pb * te
            for i, (ma, *_r) in enumerate(ba):  # clouds leaving: fade out where they are
                if i not in paired_a:
                    fr += A * ma[..., None] * (1 - te)
            for j, (mb, *_r) in enumerate(bb):  # clouds arriving: fade in
                if j not in used:
                    fr += B * mb[..., None] * te
            out.append(np.clip(fr, 0, 1))
    return out
