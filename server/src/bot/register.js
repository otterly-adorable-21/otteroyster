// Registers slash commands with Discord. Run after changing commands:
//   npm run register
import { REST, Routes } from 'discord.js';
import { loadEnv } from '../env.js';
import { commands } from './commands.js';

loadEnv();
const { DISCORD_TOKEN, DISCORD_APP_ID, DISCORD_DEV_GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !DISCORD_APP_ID) {
  console.error('Set DISCORD_TOKEN and DISCORD_APP_ID in server/.env first.');
  process.exit(1);
}

const rest = new REST().setToken(DISCORD_TOKEN);
const route = DISCORD_DEV_GUILD_ID
  ? Routes.applicationGuildCommands(DISCORD_APP_ID, DISCORD_DEV_GUILD_ID)
  : Routes.applicationCommands(DISCORD_APP_ID);
const data = await rest.put(route, { body: commands });
console.log(`✅ Registered ${data.length} commands ${DISCORD_DEV_GUILD_ID ? `in test server ${DISCORD_DEV_GUILD_ID}` : 'globally (can take a few minutes to appear)'}.`);
