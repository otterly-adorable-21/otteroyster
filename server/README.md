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

The bot must stay online, so it needs an always-on Node host with a **persistent disk**
for the SQLite file (`DB_PATH`). Good fits: Railway, Fly.io, or a small VPS. Hosts with a
throwaway filesystem would lose everyone's otters on each restart unless you attach a
volume.

1. Deploy the **whole repo** (the server imports `../js`). The start command is `cd server && npm install && npm start`.
2. Set the `.env` values as environment variables on the host. Point `DB_PATH` at the mounted volume.
3. Give it the domain **api.otteroyster.online**: add a `CNAME` record at your registrar pointing to the host. The website automatically talks to `https://api.otteroyster.online` when it's served from otteroyster.online.

## Bot commands

| Command | What it does |
| --- | --- |
| `/pet` | Your otter's picture and stats, with feed, cuddle, bath and nap buttons |
| `/adopt name` | Adopt an otter on Discord |
| `/link` | Get a one-time code to connect with the website |
| `/den` | A picture of your decorated den and its coziness |
| `/visit @friend` | Peek inside a friend's den |
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
