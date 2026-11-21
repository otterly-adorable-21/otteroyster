// OtterOyster server: website + API + Discord bot in one process.
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadEnv } from './env.js';
import { openDb } from './db.js';
import { createStore } from './players.js';
import { startHttp } from './http.js';

loadEnv();
const here = dirname(fileURLToPath(import.meta.url));
const env = process.env;

const db = openDb(resolve(here, '..', env.DB_PATH || './data/otteroyster.db'));
const store = createStore(db);
const siteUrl = env.SITE_URL || 'https://otteroyster.online';
const allowedOrigins = (env.ALLOWED_ORIGINS || 'https://otteroyster.online,https://www.otteroyster.online').split(',').map((s) => s.trim()).filter(Boolean);

let bot = null;
const invite = env.DISCORD_APP_ID ? `https://discord.com/oauth2/authorize?client_id=${env.DISCORD_APP_ID}` : null;

startHttp({
  store,
  port: Number(env.PORT || 8787),
  siteRoot: resolve(here, '..', '..'),
  allowedOrigins,
  info: () => ({ invite, bot: !!bot?.isReady() }),
});

if (env.DISCORD_TOKEN) {
  const { startBot } = await import('./bot/index.js');
  try {
    bot = await startBot({ token: env.DISCORD_TOKEN, store, siteUrl });
  } catch (err) {
    console.error('❌ Discord login failed:', err.message);
  }
} else {
  console.log('ℹ️  DISCORD_TOKEN not set: running website + API only. See server/README.md to add the bot.');
}

const shutdown = () => { bot?.destroy(); db.close(); process.exit(0); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
