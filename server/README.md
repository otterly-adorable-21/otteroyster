# Otter & Oyster server (API + Discord bot)

One Node process that:

- runs the **Discord bot**: pet care, missions, daily chests, solo games, challenges and party games;
- serves the **API** the website uses for account linking, syncing saves and leaderboards;
- serves the **website itself**, so the whole game lives at one address: **otteroyster.online**.

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
2. **Installation** tab:
   - Tick both **Guild Install** and **User Install**. User Install lets people use the bot in any DM or group chat.
   - Guild Install scopes: `applications.commands`, `bot`. Permissions: *Send Messages, Embed Links, Attach Files, Use External Emojis*.
   - User Install scopes: `applications.commands`.
3. **General Information** → copy the **Application ID**. It isn't secret.
4. **Bot** tab → **Reset Token** → copy the token. **This one is secret** (see below).
   No privileged intents are needed.

The bot registers its slash commands automatically every time it starts, so there's
no separate setup step.

### Keeping the token secret

The token is like a password for the bot. It never goes in the code, in GitHub or on
the website. The code only *reads* it from an environment variable called
`DISCORD_TOKEN`, and you put the value in one of two private places:

- **On your host (normal setup):** paste it into the host's variables or secrets
  screen (on Railway, the service's **Variables** tab). Hosts keep those values
  private and hand them to the server when it starts.
- **On your own computer (only for testing):** copy `.env.example` to `.env` and
  paste it there. `.env` is listed in `.gitignore`, so git never commits it.

If a token is ever exposed (pasted in a chat, a screenshot, a commit), go to the
**Bot** tab and press **Reset Token**. The old one stops working immediately; put the
new one in your host's variables.

### Run it on your own computer (optional)

```bash
cd server
cp .env.example .env   # then paste DISCORD_TOKEN and DISCORD_APP_ID into .env
npm install
npm start
```

You should see `🦦 Discord bot logged in as …` and `✅ Registered … slash commands`.
Tip: set `DISCORD_DEV_GUILD_ID` to your test server's ID while developing. Commands
then appear there instantly instead of after a few minutes.

## Host it

One server runs everything (website, API and Discord bot) at **otteroyster.online**.
It must stay online all the time and needs a **persistent disk** for the database.
The repo includes a `Dockerfile`, so most hosts can build it straight from GitHub.
Railway is the easiest:

1. Sign in at railway.com with GitHub → **New Project** → **Deploy from GitHub repo** → pick `otteroyster`.
   In the service's **Settings**, choose the branch with the game on it. Railway finds the `Dockerfile` by itself
   and redeploys automatically whenever that branch changes.
2. **Add a volume:** right-click the service → **Attach volume** → mount path `/data`. That's where everyone's otters are saved.
3. **Variables** tab:
   - `SITE_URL` = `https://otteroyster.online`
   - `DISCORD_APP_ID` (the Application ID) and `DISCORD_TOKEN` (the secret token). Railway keeps variables private. Leave both out to run without the bot for now.
4. Check it works before moving the domain: Railway gives the service a temporary address
   (Settings → Networking → **Generate domain**, something like `otteroyster-production.up.railway.app`).
   Open it. You should see the game, and `/api/info` on that address should say `"app":"otteroyster"`.
5. **Move otteroyster.online to Railway:**
   - Railway: Settings → Networking → **Custom domain** → `otteroyster.online`. Add `www.otteroyster.online` too
     (the server redirects `www` to the main address). Railway shows the DNS record to create for each.
   - At your domain registrar: **delete the four GitHub `A` records** (`185.199.108–111.153`) and the old `www` record,
     then add the records Railway showed you.
     - The bare domain (`otteroyster.online`, also written `@`) needs a record type called **ALIAS**, **ANAME** or
       "CNAME flattening". Most registrars offer one of these. If yours doesn't, move the domain's DNS to Cloudflare (free),
       which supports it.
   - GitHub: Settings → Pages → **Remove** the custom domain (or unpublish the Pages site), so GitHub stops claiming it.
6. DNS changes take a few minutes to a few hours. When Railway shows a green check next to the domain,
   https://otteroyster.online is served by the new server, and Friends and Discord light up on the website.

Hosting like this usually costs a few dollars a month; check the host's current pricing.
Fly.io and Render work the same way: deploy the `Dockerfile`, attach a volume at `/data`,
set the same variables, and point the domain at it.

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
| `/event` | This season's event: quests (with claim buttons), tokens and the limited shop |
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
