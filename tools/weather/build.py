# Weather overlays from the hand-drawn transparent PNG frames (Weather.zip).
#   python3 -I build2.py <folder with Misty/ Sunny/ Rainy/ Breezy/ Cloudy/> <out folder> [names...]
# Soft overlays (mist, sun, clouds) are built at 480 x 300 (the game scales them to fit);
# thin ones (rain, wind lines) stay 1600 x 1000.
import sys, os, struct
import numpy as np
from PIL import Image
import cv2

SRC, OUT = sys.argv[1], sys.argv[2]
ONLY = set(sys.argv[3:])
rng = np.random.default_rng(11)
HALF = (480, 300)  # soft overlays; the game stretches them to fill the pond


def frames_of(folder, size=None):
    names = sorted(os.listdir(os.path.join(SRC, folder)), key=lambda f: int(f.split('.')[0]))
    out = []
    for n in names:
        im = Image.open(os.path.join(SRC, folder, n)).convert('RGBA')
        if size:
            im = im.resize(size, Image.LANCZOS)
        a = np.asarray(im).astype(np.float32) / 255
        a[..., :3] *= a[..., 3:4]  # premultiplied, so blends and warps have no dark fringes
        out.append(a)
    return out


# A fixed ordered-dither pattern (8 x 8 Bayer), which breaks up banding but compresses well.
_B = np.array([[0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26], [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
               [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25], [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]], np.float32) / 64 - 0.5


def to_image(p, dither, shimmer=False):
    """Premultiplied float frame -> RGBA image. Dithering only where something is drawn
    (see-through areas stay clean): a fixed pattern, or for `shimmer` fresh sparkle every frame."""
    p = p.copy()
    if dither:
        h, w = p.shape[:2]
        n = rng.uniform(-0.5, 0.5, (h, w)).astype(np.float32) if shimmer else np.tile(_B, (h // 8 + 1, w // 8 + 1))[:h, :w]
        mask = (p[..., 3] > 0.03).astype(np.float32)
        p += (n * 2 * dither * mask / 255)[..., None]
    p = np.clip(p, 0, 1)
    a = p[..., 3:4]
    rgb = np.where(a > 1e-4, p[..., :3] / np.maximum(a, 1e-4), 0)
    return Image.fromarray((np.dstack([rgb, a]) * 255 + 0.5).clip(0, 255).astype(np.uint8), 'RGBA')


def ease(t):
    return t * t * (3 - 2 * t)


def crossfade(keys, steps):
    """Each key melts smoothly into the next (and the last back into the first)."""
    out = []
    for k in range(len(keys)):
        a, b = keys[k], keys[(k + 1) % len(keys)]
        for s in range(steps):
            t = ease(s / steps)
            out.append(a * (1 - t) + b * t)
    return out


def flow(a, b):
    """Optical flow between two frames, from how their drawn shapes moved."""
    ga = (a[..., 3] * 255).astype(np.uint8)
    gb = (b[..., 3] * 255).astype(np.uint8)
    return cv2.calcOpticalFlowFarneback(ga, gb, None, 0.5, 5, 41, 5, 7, 1.5, 0)


def warp(img, fl):
    h, w = img.shape[:2]
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    return cv2.remap(img, gx + fl[..., 0], gy + fl[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def tween(keys, steps):
    """In-between frames that slide the shapes along (motion), blended both ways."""
    out = []
    for k in range(len(keys)):
        a, b = keys[k], keys[(k + 1) % len(keys)]
        fab, fba = flow(a, b), flow(b, a)
        for s in range(steps):
            t = s / steps
            wa = warp(a, -t * fba)        # a moved forward toward b
            wb = warp(b, -(1 - t) * fab)  # b moved back toward a
            te = ease(t)
            out.append(wa * (1 - te) + wb * te)
    return out


def save(name, imgs, durations, q=72, aq=70):
    path = os.path.join(OUT, f'{name}.webp')
    imgs[0].save(path, save_all=True, append_images=imgs[1:], duration=durations, loop=0, quality=q, alpha_quality=aq, method=4)
    b = open(path, 'rb').read()
    i, durs = 12, []
    while i < len(b):
        tag = b[i:i + 4]
        size = struct.unpack('<I', b[i + 4:i + 8])[0]
        if tag == b'ANMF':
            durs.append(int.from_bytes(b[i + 8 + 12:i + 8 + 15], 'little'))
        i += 8 + size + (size & 1)
    print(f'{name}: {len(imgs)} frames, {sum(durs) / 1000:.2f} s loop, {os.path.getsize(path) // 1024} KB, {imgs[0].size[0]}x{imgs[0].size[1]}', flush=True)


def want(n):
    return not ONLY or n in ONLY

# Mist: slow; each of the 10 frames melts into the next over a second. 6 fps, 10 s.
if want('misty'):
    save('misty', [to_image(f, 2.5) for f in crossfade(frames_of('Misty', HALF), 6)], 167, q=80, aq=100)  # lossless alpha: no banding in the soft fog

# Sun: slow cross-fades between the 5 frames, with a fine dither that changes every
# frame so the rays shimmer ("shine"). 8 fps, 5 s.
if want('sunny'):
    save('sunny', [to_image(f, 2.5, shimmer=True) for f in crossfade(frames_of('Sunny', HALF), 8)], 125)

# Clouds: smooth and slow; in-between frames find each cloud and slide it to its next spot.
# 10 fps, about 10 s.
if want('cloudy'):
    exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'clouds.py')).read())
    save('cloudy', [to_image(f, 1.2) for f in tween_clouds(frames_of('Cloudy', HALF), 8, ease)], 100, q=78, aq=90)

# Rain: fast, the 4 frames as drawn. 15 fps.
if want('rainy'):
    save('rainy', [to_image(f, 0) for f in frames_of('Rainy')], [67, 67, 66, 67])

# Breeze: all 19 frames at 4 fps, then all 19 at 8 fps, round and round.
if want('breezy'):
    keys = [to_image(f, 0) for f in frames_of('Breezy')]
    save('breezy', keys + keys, [250] * len(keys) + [125] * len(keys))
