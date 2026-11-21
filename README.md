# 🦦 Otter & Oyster

A cozy virtual-pet world for [otteroyster.online](https://otteroyster.online). Adopt a
sleepy little otter, keep them happy, dress them up, send them on adventures, play
minigames, and bring them along to Discord, where friends can play together.

## What's in it

- **Pet care:** four needs (Full, Happy, Energy, Clean) that drift down gently in real time. Snacks, cuddles, bubble baths and naps. Your otter's face changes with their mood.
- **Otter's Den:** a cozy burrow you decorate. Buy furniture, plushies, rugs, wallpaper and floors, then drag everything into place. A cozier den makes happiness drop slower and naps more restful. Friends can `/visit` it from Discord.
- **Closet & shop:** hats, eyewear, neckwear and extras layered onto your otter. Rare pieces only come from missions.
- **Explore:** an illustrated map with 7 places around the pond. Each has its own missions, games and an Explore button for finding creatures and treasures.
- **Collection journal:** 35 discoveries in four rarities. Complete a place's set for a 🏅 badge and pearls.
- **Missions:** real-time expeditions (1 minute to 3 hours) that run while you're away and bring back pearls, stories, rare clothes and discoveries.
- **Arcade, 10 games:**
  - Arcade: Oyster Dive, Fish Frenzy, Bubble Hop
  - Skill: Tide Fishing, Bubble Burst, Crab Catcher
  - Puzzle: Shell Match, Pearl Pop (match-3), Shell Shuffle, Word Tide (word search)
- **Friends:** friend codes, visiting dens, daily hugs that cheer up friends' otters, gifts of pearls and furniture, and friendship levels. Works with a website-only account or through Discord.
- **Saving:** automatic saves on the device, an optional online save, one-time codes to load your otter on another device, and downloadable backups. A header badge always shows the save status.
- **Personalities:** otters become Adventurous, Sleepy, Foodie, Social, Competitive or Tidy from how you play, each with a small perk, and are born with a favorite snack, place and game.
- **Seasonal events:** six yearly events (Winter Lantern Festival, Sweetheart Shoals, Spring Bloom, Summer Splash, Spooky Seas, Harvest Moon) with their own tokens, 3 daily quests, a limited shop of outfits and den furniture, limited discoveries, and seasonal effects on the pond. Preview any event with `?event=spooky`.
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
js/den.js, den-data.js  the den drawing + furniture catalog (shared with the bot)
js/world.js, map.js   places, discoveries and the world map
js/social.js          friendship levels and gift limits
js/events.js          seasonal event calendar, quests and limited shop
js/personality.js     personality traits, perks and favorites
js/main.js            website UI
js/sync.js            talks to the server for Discord linking/sync
js/assets.js          detects brand art in /assets
js/games/*.js         one file per arcade game (kit.js = shared helpers)
server/               API + Discord bot (Node 22)
assets/               brand artwork
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

Everything (website, API and Discord bot) runs as one server at **otteroyster.online**, on any Docker host with a
persistent volume (the repo has a `Dockerfile`). A click-by-click Railway guide, including moving the domain over from
GitHub Pages, is in [`server/README.md`](server/README.md#host-it).

The website also still works as a plain static site (e.g. GitHub Pages). It then runs in offline mode: everything
except Friends, Discord linking and leaderboards.
