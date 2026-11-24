# Weather overlay builder

Turns hand-drawn frames (transparent PNGs, 1600 × 1000, exported from Procreate with
the background hidden) into the animated WebP overlays in `assets/art/weather/`.

```
pip install numpy pillow opencv-python-headless
python3 tools/weather/build.py <folder with Misty/ Sunny/ Rainy/ Breezy/ Cloudy/> assets/art/weather [misty sunny ...]
```

Each folder holds its frames named `1.png`, `2.png`, …

| Overlay | How it's animated |
| --- | --- |
| misty | Slow: each frame melts into the next over a second (6 fps, dithered, lossless transparency so the fog never bands). |
| sunny | Slow cross-fades between frames, with a fresh dither every frame over the rays for the shine (8 fps). |
| cloudy | Smooth and slow: each cloud is found and slid to its spot in the next frame (10 fps). |
| rainy | Fast, frames as drawn (15 fps). |
| breezy | All frames at 4 fps, then all again at 8 fps, alternating. |

Mist, sun and clouds are built at 480 × 300 (they're soft; the game stretches them), rain and wind at full size.
