# 🦦 Otter Oyster

A cozy virtual pet game for [otteroyster.online](https://otteroyster.online).
Adopt a sea otter, keep them fed, clean and happy, dress them up, send them on
real-time ocean missions, and play minigames to earn pearls.

## Features

- **Care:** four needs (Full, Happy, Energy, Clean) that slowly drop in real time. Feed snacks, cuddle, give baths and put your otter down for naps.
- **Wardrobe & Shop:** hats, eyewear, neckwear and extras, drawn as layered SVG on the otter.
- **Missions:** timed adventures from 1 minute to 3 hours that keep running while the page is closed. They bring back pearls and sometimes rare items you can only get this way.
- **Minigames:** *Oyster Dive* (catch oysters and pearls, dodge urchins) and *Shell Match* (memory pairs).
- **Progress:** XP and levels unlock more items and missions, plus a daily pearl gift.

Progress is saved in the browser's `localStorage`, so it's per device.

## Running locally

It's plain HTML, CSS and JavaScript modules with no build step. Serve the folder with any static server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Project layout

```
index.html          page shell
css/style.css       all styles
js/main.js          game loop, actions, UI rendering
js/data.js          items, snacks, missions, games (add new content here)
js/otter.js         SVG otter drawing + outfit layering
js/state.js         save / load
js/games/dive.js    Oyster Dive minigame (canvas)
js/games/memory.js  Shell Match minigame
CNAME               custom domain for GitHub Pages
```

## Deploying to otteroyster.online (GitHub Pages)

1. Merge this into `main`.
2. In the repo, go to **Settings → Pages**, choose **Deploy from a branch**, pick `main` / `/ (root)`.
3. The `CNAME` file sets the custom domain to `otteroyster.online`.
4. At your domain registrar, add DNS records:
   - `A` records for `@` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - a `CNAME` record for `www` pointing to `<your-github-username>.github.io`
5. Once DNS works, tick **Enforce HTTPS** in the Pages settings.
