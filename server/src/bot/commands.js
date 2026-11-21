// Slash command definitions. Usable in servers, the bot's DMs, and (when the
// app is installed to a user's account) any DM or group chat.
import { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } from 'discord.js';
import { GAME_LIST } from '../../../js/data.js';
import { SOLO } from './games/solo.js';
import { DUELS } from './games/duel.js';
import { PARTY } from './games/party.js';
import { BOT_BOARDS } from '../players.js';
import { LOCATIONS } from '../../../js/world.js';
import { GIFT_PEARL_OPTIONS } from '../../../js/social.js';

const everywhere = (b) => b
  .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
  .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall);

export const commands = [
  everywhere(new SlashCommandBuilder().setName('pet').setDescription('See your otter and feed, cuddle, bathe or nap')),
  everywhere(new SlashCommandBuilder().setName('adopt').setDescription('Adopt your very own otter')
    .addStringOption((o) => o.setName('name').setDescription("Your otter's name").setRequired(true).setMaxLength(16))
    .addStringOption((o) => o.setName('kind').setDescription('Sea otter or river otter?').addChoices({ name: '🌊 Sea otter', value: 'sea' }, { name: '🏞️ River otter', value: 'river' }))),
  everywhere(new SlashCommandBuilder().setName('den').setDescription("Peek inside your otter's cozy den")),
  everywhere(new SlashCommandBuilder().setName('visit').setDescription("Visit a friend's den")
    .addUserOption((o) => o.setName('friend').setDescription('Whose den?').setRequired(true))),
  everywhere(new SlashCommandBuilder().setName('explore').setDescription('Explore a place around the pond and discover creatures and treasures')
    .addStringOption((o) => o.setName('place').setDescription('Where to?').setRequired(true)
      .addChoices(...LOCATIONS.map((l) => ({ name: `${l.icon} ${l.name}${l.level > 1 ? ` (Lv ${l.level})` : ''}`, value: l.id }))))),
  everywhere(new SlashCommandBuilder().setName('collection').setDescription('Your collection journal of discoveries')
    .addUserOption((o) => o.setName('user').setDescription("Peek at a friend's journal"))),
  everywhere(new SlashCommandBuilder().setName('friend').setDescription('Make friends with other otters')
    .addSubcommand((c) => c.setName('list').setDescription('Your friends, friend code and requests'))
    .addSubcommand((c) => c.setName('add').setDescription('Send a friend request')
      .addUserOption((o) => o.setName('user').setDescription('A Discord friend'))
      .addStringOption((o) => o.setName('code').setDescription('Or a friend code from the website, like OTR-AB3CD')))
    .addSubcommand((c) => c.setName('remove').setDescription('Remove a friend')
      .addUserOption((o) => o.setName('user').setDescription('Who?').setRequired(true)))),
  everywhere(new SlashCommandBuilder().setName('hug').setDescription("Give a friend's otter a hug (once a day)")
    .addUserOption((o) => o.setName('friend').setDescription('Whose otter?').setRequired(true))),
  everywhere(new SlashCommandBuilder().setName('gift').setDescription('Send pearls to a friend')
    .addUserOption((o) => o.setName('friend').setDescription('Who?').setRequired(true))
    .addIntegerOption((o) => o.setName('pearls').setDescription('How many?').setRequired(true)
      .addChoices(...GIFT_PEARL_OPTIONS.map((n) => ({ name: `${n} pearls`, value: n }))))
    .addStringOption((o) => o.setName('note').setDescription('A little note').setMaxLength(80))),
  everywhere(new SlashCommandBuilder().setName('garden').setDescription('Your garden: plant seeds, water and harvest')),
  everywhere(new SlashCommandBuilder().setName('companion').setDescription('Play with your pet companion')),
  everywhere(new SlashCommandBuilder().setName('world').setDescription("What's happening around the pond today, and who's where")),
  everywhere(new SlashCommandBuilder().setName('lore').setDescription('Your Lore Book: mysteries, the pond folk and their stories')),
  everywhere(new SlashCommandBuilder().setName('legacy').setDescription('Lifelong goals for Wise Otters: Legend ranks and titles')),
  everywhere(new SlashCommandBuilder().setName('museum').setDescription('The community Pond Museum: exhibits, milestones and top donors')),
  everywhere(new SlashCommandBuilder().setName('event').setDescription("This season's event: quests, tokens and the limited shop")),
  everywhere(new SlashCommandBuilder().setName('daily').setDescription('Open your daily treasure chest')),
  everywhere(new SlashCommandBuilder().setName('mission').setDescription('Send your otter on an adventure, or check on them')),
  everywhere(new SlashCommandBuilder().setName('play').setDescription('Play a solo game for pearls')
    .addStringOption((o) => o.setName('game').setDescription('Which game?').setRequired(true)
      .addChoices(...SOLO.map((g) => ({ name: `${g.emoji} ${g.name}`, value: g.id }))))),
  everywhere(new SlashCommandBuilder().setName('challenge').setDescription('Challenge a friend to a game')
    .addUserOption((o) => o.setName('friend').setDescription('Who are you challenging?').setRequired(true))
    .addStringOption((o) => o.setName('game').setDescription('Which game?').setRequired(true)
      .addChoices(...DUELS.map((g) => ({ name: `${g.emoji} ${g.name}`, value: g.id }))))),
  everywhere(new SlashCommandBuilder().setName('party').setDescription('Start a group game, great in voice chat')
    .addStringOption((o) => o.setName('game').setDescription('Which game?').setRequired(true)
      .addChoices(...PARTY.map((g) => ({ name: `${g.emoji} ${g.name} (${g.min}+ players)`, value: g.id }))))),
  everywhere(new SlashCommandBuilder().setName('leaderboard').setDescription('Top scores across the website and Discord')
    .addStringOption((o) => o.setName('game').setDescription('Which game?').setRequired(true)
      .addChoices(
        ...GAME_LIST.map((g) => ({ name: `${g.icon} ${g.name} (website)`, value: g.id })),
        ...Object.entries(BOT_BOARDS).map(([id, b]) => ({ name: b.name, value: id })),
      ))),
  everywhere(new SlashCommandBuilder().setName('profile').setDescription("Show off your otter, or peek at a friend's")
    .addUserOption((o) => o.setName('user').setDescription('Whose otter?'))),
  everywhere(new SlashCommandBuilder().setName('link').setDescription('Connect your Discord otter with otteroyster.online')),
  everywhere(new SlashCommandBuilder().setName('help').setDescription('How to play OtterOyster on Discord')),
].map((c) => c.toJSON());
