# Otter & Oyster server (API + Discord bot)

One Node process that:

- runs the **Discord bot**: pet care, missions, daily chests, solo games, challenges and party games;
- serves the **API** the website uses for account linking, syncing saves and leaderboards;
- can also serve the **website itself**, which is handy for local testing or if you'd rather not use GitHub Pages.

Game rules live in `../js/core.js` and `../js/data.js`. That's the *same file* the
website runs, so a feed, a purchase or a mission works identically in both places.

## Run it locally

Needs **Node 22.13+** (it uses the built-in SQLite driver, so there's nothing native to compile).

```bash
cd server
npm install
npm start
```

Open http://localhost:8787. Without a Discord token it runs website + API only.

```bash
npm test
```

The tests play every bot command and game against simulated Discord interactions,
and cover the linking/sync API.

## Create the Discord bot

1. Go to https://discord.com/developers/applications → **New Application** → name it "Otter & Oyster".
   Upload `assets/emblem.png` as the app icon.
2. **Bot** tab → **Reset Token** → copy it into `server/.env` as `DISCORD_TOKEN`.
   No privileged intents are needed.
3. **General Information** → copy the **Application ID** into `.env` as `DISCORD_APP_ID`.
4. **Installation** tab:
   - Tick both **Guild Install** and **User Install**. User Install lets people use the bot in any DM or group chat.
   - Guild Install scopes: `applications.commands`, `bot`. Permissions: *Send Messages, Embed Links, Attach Files, Use External Emojis*.
   - User Install scopes: `applications.commands`.
5. Register the slash commands (run this again whenever commands change):

   ```bash
   cp .env.example .env   # then fill it in
   npm run register
   ```

   Tip: set `DISCORD_DEV_GUILD_ID` to your test server's ID while developing. Commands then appear instantly instead of after a few minutes.
6. `npm start`. You should see `🦦 Discord bot logged in as …`.

## Host it

The server must stay online all the time and needs a **persistent disk** for the
database. The repo includes a `Dockerfile`, so most hosts can build it straight
from GitHub. Railway is the easiest:

1. Sign in at railway.com with GitHub → **New Project** → **Deploy from GitHub repo** → pick `otteroyster`.
   In the service's **Settings**, set the branch to the one GitHub Pages uses. Railway finds the `Dockerfile` by itself.
2. **Add a volume:** right-click the service → **Attach volume** → mount path `/data`. That's where everyone's otters are saved.
3. **Variables** tab:
   - `SITE_URL` = `https://otteroyster.online`
   - `ALLOWED_ORIGINS` = `https://otteroyster.online,https://www.otteroyster.online`
   - `DISCORD_TOKEN` and `DISCORD_APP_ID` (from the Discord steps above). Leave them out to run without the bot for now.
4. **Settings → Networking → Custom domain:** enter `api.otteroyster.online`. Railway shows a `CNAME` record. Add it at your domain registrar.
5. When the domain shows a green check, open https://api.otteroyster.online/api/info. It should say `"app":"otteroyster"`.
   The website's Friends tab then connects automatically.

Hosting like this usually costs a few dollars a month; check the host's current pricing.
Fly.io and Render work the same way: deploy the `Dockerfile`, attach a volume at `/data`,
and set the same variables.

## Bot commands

| Command | What it does |
| --- | --- |
| `/pet` | Your otter's picture and stats, with feed, cuddle, bath and nap buttons |
| `/adopt name` | Adopt an otter on Discord |
| `/link` | Get a one-time code to connect with the website |
| `/den` | A picture of your decorated den and its coziness |
| `/visit @friend` | Peek inside a friend's den |
| `/explore place` | Explore a place on the map and discover creatures and treasures |
| `/collection [@user]` | The collection journal |
| `/friend add/list/remove` | Friends: add by @mention or friend code, accept requests, open gifts |
| `/hug @friend` | Cheer up a friend's otter (once a day) |
| `/gift @friend` | Send pearls (up to 100 a day) |
| `/daily` | Pick one of three treasure chests (once a day) |
| `/mission` | Start, check or recall an expedition |
| `/play` | Solo: Trivia, Emoji Mystery, Word Scramble, Raft Rescue (hangman), Number Hunt, Higher or Lower, Rock Paper Scissors, Urchin Sweeper (minesweeper), Fishing |
| `/challenge @friend` | Connect Four, Tic-Tac-Toe, Rock Paper Scissors (best of 3, secret picks) |
| `/party` | Voice-chat party games: Impostor, Trivia Battle, Hot Potato Categories, Would You Rather, Forbidden Word |
| `/leaderboard` | Top scores for website games and Discord games |
| `/profile [@user]` | Show off an otter |

Party games are designed for voice channels: players talk out loud while the bot
handles the lobby, secret words, timers, votes and scoring through buttons. They
work in a voice channel's text chat or any normal channel.

## Economy and fairness notes

- Discord games pay out at most **300 pearls per player per day** (`BOT_DAILY_CAP` in `src/players.js`).
- Website saves are trusted as sent (it's a casual game). If cheating ever becomes a problem, the next step is to move website minigame rewards server-side the way Discord's already are.
- Link codes are single-use, expire after 10 minutes, and the link endpoint is rate-limited. Website login tokens are stored hashed.
