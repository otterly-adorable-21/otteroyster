# 🦦 Otter & Oyster

A cozy virtual-pet world for [otteroyster.online](https://otteroyster.online). Adopt a
sleepy little otter, keep them happy, dress them up, send them on adventures, play
minigames, and bring them along to Discord, where friends can play together.

## What's in it

- **Pet care:** four needs (Full, Happy, Energy, Clean) that drift down gently in real time. Snacks, cuddles, bubble baths and naps. Your otter's face changes with their mood.
- **Closet & shop:** hats, eyewear, neckwear and extras layered onto your otter. Rare pieces only come from missions.
- **Missions:** real-time expeditions (1 minute to 3 hours) that run while you're away and bring back pearls, stories and rare finds.
- **Arcade, 10 games:**
  - Arcade: Oyster Dive, Fish Frenzy, Bubble Hop
  - Skill: Tide Fishing, Bubble Burst, Crab Catcher
  - Puzzle: Shell Match, Pearl Pop (match-3), Shell Shuffle, Word Tide (word search)
- **Discord bot:** the same otter follows you into Discord with 9 solo games, 3 friend challenges, 5 voice-chat party games, daily chests, missions and leaderboards. See [`server/README.md`](server/README.md).

The website works on its own (progress saved in the browser). Linking Discord
(`/link` in Discord, then enter the code on the site's Discord tab) makes one shared
otter across both.

## Brand art

Put the official artwork in [`assets/`](assets/README.md) (`logo.png`, `emblem.png`,
`lily-border.png`, `pond.jpg`, `otter-float.jpg`). The site picks each file up
automatically. Until they're there, matching drawn versions are shown.

## Project layout

```
index.html            page shell, pond scene, lily/sparkle drawings
css/style.css         night-pond theme + all game styles
js/core.js            game rules (shared with the Discord bot!)
js/data.js            items, snacks, missions, arcade catalog
js/otter.js           the otter drawing + outfit layering
js/main.js            website UI
js/sync.js            talks to the server for Discord linking/sync
js/assets.js          detects brand art in /assets
js/games/*.js         one file per arcade game (kit.js = shared helpers)
server/               API + Discord bot (Node 22)
assets/               brand artwork
CNAME                 custom domain for GitHub Pages
```

### Adding a game

1. Create `js/games/mygame.js` exporting `start(root, onEnd)`. It returns a cleanup function and calls `onEnd({ pearls, best, summary })` once.
2. Add it to `LOADERS` in `js/games/index.js` and to `GAME_LIST` in `js/data.js`.

Rewards, energy, records and leaderboards come for free.

## Running locally

```bash
cd server && npm install && npm start
```

Then open http://localhost:8787 (website + API). For the website alone, any static server works, e.g. `python3 -m http.server`.

## Deploying

- **Website** → GitHub Pages: Settings → Pages → deploy from `main` / root. `CNAME` sets otteroyster.online. At your registrar, add `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, and a `CNAME` for `www` → `<github-username>.github.io`. Then tick **Enforce HTTPS**.
- **Server + bot** → any always-on Node host with a persistent disk, at `api.otteroyster.online`. Step-by-step instructions are in [`server/README.md`](server/README.md).
