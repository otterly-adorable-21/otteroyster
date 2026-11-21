// OtterOyster server: website + API + Discord bot in one process.
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadEnv } from './env.js';
import { openDb } from './db.js';
import { createStore } from './players.js';
import { createSocial } from './social.js';
import { createSocial2 } from './social2.js';
import { createMuseum } from './museum.js';
import { createNeighborhood } from './neighborhood.js';
import { startHttp } from './http.js';
import { createAuth } from './auth.js';
import { loadServerArt } from './art.js';

loadEnv();
const here = dirname(fileURLToPath(import.meta.url));
const env = process.env;

// Keep the database on a persistent volume. On Railway, a mounted volume tells us
// where it is, so use it even if DB_PATH points somewhere else; without a volume
// every redeploy would start from an empty database (and sign everyone out).
const volume = env.RAILWAY_VOLUME_MOUNT_PATH;
let dbPath = resolve(here, '..', env.DB_PATH || './data/otteroyster.db');
if (volume && !dbPath.startsWith(resolve(volume))) dbPath = resolve(volume, 'otteroyster.db');
if (env.RAILWAY_ENVIRONMENT && !volume) {
  console.warn('⚠️  ⚠️  No Railway volume is attached! Players, sign-ins and progress will be WIPED on every redeploy.');
  console.warn('⚠️  Fix: in Railway, right-click the service → Attach volume, mount path /data. Then redeploy.');
}
const db = openDb(dbPath);
console.log(`💾 Database: ${dbPath}${volume ? ` (on the Railway volume at ${volume})` : ''}`);
const artCount = loadServerArt(resolve(here, '../..'));
if (artCount) console.log(`🎨 Custom art: ${artCount} pictures for Discord images`);
const store = createStore(db);
const social = createSocial(db, store);
const social2 = createSocial2(db, store, social);
const museum = createMuseum(db, store);
const lane = createNeighborhood(db, store, social, social2);
const siteUrl = env.SITE_URL || 'https://otteroyster.online';
const allowedOrigins = (env.ALLOWED_ORIGINS || 'https://otteroyster.online,https://www.otteroyster.online,https://otterly-adorable-21.github.io').split(',').map((s) => s.trim()).filter(Boolean);

const auth = createAuth({
  store,
  db,
  clientId: env.DISCORD_APP_ID,
  clientSecret: env.DISCORD_CLIENT_SECRET,
  publicUrl: env.PUBLIC_URL || siteUrl, // where this server is reachable (for the Discord redirect)
  siteUrl,
  allowedOrigins,
});
if (auth.enabled) console.log(`🔑 Sign in with Discord is on. Redirect URL: ${auth.redirectUri}`);
else console.log('ℹ️  Sign in with Discord is off (set DISCORD_APP_ID and DISCORD_CLIENT_SECRET to turn it on).');

let bot = null;
const invite = env.DISCORD_APP_ID ? `https://discord.com/oauth2/authorize?client_id=${env.DISCORD_APP_ID}` : null;

startHttp({
  store,
  social,
  social2,
  museum,
  lane,
  auth,
  port: Number(env.PORT || 8787),
  siteRoot: resolve(here, '..', '..'),
  allowedOrigins,
  info: () => ({ storage: volume ? 'railway-volume' : env.RAILWAY_ENVIRONMENT ? 'TEMPORARY (attach a volume!)' : 'local disk', invite, bot: !!bot?.isReady() }),
});

if (env.DISCORD_TOKEN) {
  const { startBot } = await import('./bot/index.js');
  try {
    bot = await startBot({ token: env.DISCORD_TOKEN, store, social, museum, siteUrl, devGuildId: env.DISCORD_DEV_GUILD_ID || null, registerCommands: env.REGISTER_COMMANDS !== 'false' });
  } catch (err) {
    console.error('❌ Discord login failed:', err.message);
  }
} else {
  console.log('ℹ️  DISCORD_TOKEN not set: running website + API only. See server/README.md to add the bot.');
}

const shutdown = () => { bot?.destroy(); db.close(); process.exit(0); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
