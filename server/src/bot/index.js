// The OtterOyster Discord bot: pet care, missions, daily chests and the game router.
import { Client, GatewayIntentBits, Events, ActivityType } from 'discord.js';
import * as core from '../../../js/core.js';
import { ITEMS, SNACKS, MISSIONS, GAME_LIST } from '../../../js/data.js';
import { FURNITURE } from '../../../js/den-data.js';
import { embed, btn, row, select, linkBtn, textModal, petCard, denCard, ButtonStyle, GOLD, GREEN, COLOR } from './ui.js';
import { createSession, getSession } from './sessions.js';
import { SOLO } from './games/solo.js';
import { DUELS, inviteMessage, handleInvite } from './games/duel.js';
import { PARTY, lobbyMessage, handleLobby } from './games/party.js';
import { whisper, EPHEMERAL, shuffle } from './games/_util.js';
import { BOT_BOARDS, BOT_DAILY_CAP } from '../players.js';
import { LOCATIONS, LOC, RARITY, FINDS, TOTAL_FINDS, SET_REWARD } from '../../../js/world.js';
import { heartsText, friendLevel } from '../../../js/social.js';
import { eventEndsAt, nextEvent } from '../../../js/events.js';

const solo = Object.fromEntries(SOLO.map((g) => [g.id, g]));
const duels = Object.fromEntries(DUELS.map((g) => [g.id, g]));
const parties = Object.fromEntries(PARTY.map((g) => [g.id, g]));

const asPlayer = (u) => ({ id: u.id, name: u.displayName || u.globalName || u.username, username: u.username });

export function createBot({ store, social, museum, siteUrl }) {
  // ---------- shared context for games ----------
  function makeCtx(user) {
    return {
      user,
      award: (u, n, reason) => store.award(store.forDiscord({ id: u.id, username: u.username }).id, n, reason),
      recordScore: (u, game, score) => store.recordScore(store.forDiscord({ id: u.id, username: u.username }).id, game, score),
      addWin: (u) => store.addToScore(store.forDiscord({ id: u.id, username: u.username }).id, 'd-wins', 1),
      addChallengePoints: (a, b) => social.addChallengePoints(store.forDiscord({ id: a.id, username: a.username }).id, store.forDiscord({ id: b.id, username: b.username }).id),
      rewardNote(got, wanted) {
        if (got) return `🦪 **+${got} pearls** for your otter!`;
        if (!wanted) return '';
        const p = store.getByDiscord(user.id);
        if (!p?.state.name) return '*Adopt an otter with `/pet` to earn pearls from games!*';
        return `*You've earned the daily max of ${BOT_DAILY_CAP} pearls from Discord games. More tomorrow!*`;
      },
    };
  }

  // ---------- pet panel ----------
  function reportText(state, reports) {
    return reports.map((r) => {
      if (r.achNote) return r.achNote;
      const m = MISSIONS.find((x) => x.id === r.id);
      return `${m.icon} **${state.name} is back from ${m.name}!** ${state.name} ${r.story} **+${r.pearls}** ⚪${r.found ? ` and found a **${ITEMS[r.found].name}** ${ITEMS[r.found].icon}!` : ''}${r.discovery && FINDS[r.discovery] ? ` Also brought back a ${FINDS[r.discovery].icon} **${FINDS[r.discovery].name}** for the journal!` : ''}`;
    }).join('\n');
  }

  // Load + tick a player's otter, take any unseen mission reports.
  function load(user, fn = () => null) {
    const p = store.forDiscord(user);
    const { state, result } = store.mutate(p.id, (s) => {
      const res = fn(s);
      return { res, reports: core.takeReports(s) };
    });
    // Achievements are checked inside mutate; announce (and clear) any new ones.
    const fresh = store.mutate(p.id, (s) => core.takeNewAchievements(s)).result;
    const achNote = fresh.map((id) => `🏅 **Achievement unlocked: ${core.ACH[id].name}!** +${core.ACH[id].reward} pearls`).join('\n');
    if (achNote) result.reports.push({ achNote });
    return { player: p, state, res: result.res, reports: result.reports };
  }

  function adoptPrompt(ownerId) {
    return {
      embeds: [embed('🦦 No otter yet!', `A baby otter is floating nearby, holding an oyster… Adopt them?\n\nAlready have an otter on **${siteUrl.replace(/^https?:\/\//, '')}**? Use \`/link\` to bring them here instead.`)],
      components: [row(btn(`adopt:${ownerId}`, 'Adopt an otter', ButtonStyle.Success, { emoji: '🦦' }), linkBtn(siteUrl, 'Visit the website'))],
    };
  }

  function petView(state, ownerId, note = '') {
    const card = petCard(state, { extra: note });
    const snackOpts = SNACKS.map((s) => ({ label: `${s.name} (${s.price ? `${s.price} pearls` : 'free'})`, value: s.id, emoji: s.icon, description: `+${s.hunger} full${s.happiness ? `, +${s.happiness} happy` : ''}` }));
    const busy = !!state.mission;
    card.components = [
      row(select(`pet:${ownerId}:feed`, busy ? 'Away on a mission…' : '🍽️ Feed a snack…', snackOpts, { disabled: busy })),
      row(
        btn(`pet:${ownerId}:cuddle`, 'Cuddle', ButtonStyle.Primary, { emoji: '🤗', disabled: busy }),
        btn(`pet:${ownerId}:bath`, 'Bath', ButtonStyle.Primary, { emoji: '🛁', disabled: busy }),
        btn(`pet:${ownerId}:sleep`, state.sleeping ? 'Wake up' : 'Nap', ButtonStyle.Secondary, { emoji: state.sleeping ? '☀️' : '🌙', disabled: busy }),
        btn(`pet:${ownerId}:refresh`, null, ButtonStyle.Secondary, { emoji: '🔄' }),
      ),
      row(linkBtn(siteUrl, 'Open otteroyster.online')),
    ];
    return card;
  }

  // ---------- missions ----------
  function missionView(state, ownerId, note = '') {
    const e = embed('🧭 Missions', note);
    if (state.mission) {
      const m = MISSIONS.find((x) => x.id === state.mission.id);
      const pct = Math.round(((Date.now() - state.mission.start) / (state.mission.endsAt - state.mission.start)) * 100);
      e.setDescription(`${note ? `${note}\n\n` : ''}${m.icon} **${state.name}** is on **${m.name}**.\nBack <t:${Math.ceil(state.mission.endsAt / 1000)}:R> (${Math.min(100, pct)}%)`);
      return { embeds: [e], components: [row(
        btn(`mis:${ownerId}:refresh`, 'Check again', ButtonStyle.Secondary, { emoji: '🔄' }),
        btn(`mis:${ownerId}:recall`, 'Call home early', ButtonStyle.Danger),
      )] };
    }
    e.setDescription(`${note ? `${note}\n\n` : ''}Where should **${state.name}** explore? Missions keep running while you're away.\n⚡ Energy: **${Math.round(state.stats.energy)}** · Level **${state.level}**\n\n${MISSIONS.map((m) => `${m.icon} **${m.name}** · ${m.minutes >= 60 ? `${m.minutes / 60}h` : `${m.minutes}m`} · ⚡${m.energy} · ⚪${m.pearls[0]}–${m.pearls[1]}${m.loot.length ? ` · rare: ${m.loot.map(([id]) => ITEMS[id].icon).join('')}` : ''}${state.level < m.level ? ` · 🔒 Lv ${m.level}` : ''}`).join('\n')}`);
    const opts = MISSIONS.map((m) => ({ label: `${m.name}${state.level < m.level ? ` (Lv ${m.level})` : ''}`, value: m.id, emoji: m.icon, description: `${m.minutes >= 60 ? `${m.minutes / 60} hours` : `${m.minutes} min`} · ${m.energy} energy` }));
    return { embeds: [e], components: [row(select(`mis:${ownerId}:go`, state.sleeping ? 'Wake your otter first…' : 'Choose a mission…', opts, { disabled: state.sleeping }))] };
  }

  // ---------- daily chest ----------
  function rollChest(s) {
    const r = Math.random();
    if (r < 0.1) {
      const forSale = Object.keys(ITEMS).filter((id) => ITEMS[id].price !== null && !s.owned.includes(id));
      if (forSale.length) {
        const id = forSale[Math.floor(Math.random() * forSale.length)];
        s.owned.push(id);
        return { text: `a **${ITEMS[id].name}** ${ITEMS[id].icon}! (It's in your closet.)`, icon: ITEMS[id].icon };
      }
      s.pearls += 100;
      return { text: '**100 pearls**! ✨', icon: '💎' };
    }
    if (r < 0.15) {
      s.stats.happiness = core.clamp(s.stats.happiness + 40);
      s.stats.hunger = core.clamp(s.stats.hunger + 30);
      s.pearls += 15;
      return { text: 'a **Golden Clam Feast**! +40 happy, +30 full and 15 pearls 🍽️', icon: '🌟' };
    }
    const p = r < 0.4 ? core.rand(50, 90) : core.rand(20, 45);
    s.pearls += p;
    return { text: `**${p} pearls**!`, icon: '⚪' };
  }

  // ---------- friends ----------
  function friendsView(user, note = '') {
    const me = store.forDiscord(user);
    const l = social.list(me.id);
    const e = embed('🦦 Friends', `${note ? `${note}\n\n` : ''}Your friend code: **\`${l.code}\`** (share it, or use \`/friend add @someone\`)`);
    e.addFields({ name: `Friends (${l.friends.length})`, value: l.friends.length ? l.friends.slice(0, 15).map((f) => `${heartsText(f.points)} **${f.name}**${f.owner ? ` (${f.owner})` : ''} · ${f.friendship}`).join('\n') : 'No friends yet. Add one!' });
    if (l.incoming.length) e.addFields({ name: '📬 Friend requests', value: l.incoming.map((f) => `**${f.name}**${f.owner ? ` (${f.owner})` : ''}`).join('\n') });
    if (l.outgoing.length) e.addFields({ name: '⏳ Waiting on', value: l.outgoing.map((f) => f.name).join(', ') });
    if (l.gifts) e.addFields({ name: '🎁 Gifts', value: `You have **${l.gifts}** unopened gift${l.gifts > 1 ? 's' : ''}!` });
    const rows = l.incoming.slice(0, 4).map((f) => row(
      btn(`fr:${user.id}:acc:${f.code}`, `Accept ${f.name}`.slice(0, 80), ButtonStyle.Success),
      btn(`fr:${user.id}:dec:${f.code}`, 'Decline', ButtonStyle.Secondary),
    ));
    if (l.gifts) rows.push(row(btn(`fr:${user.id}:open:all`, 'Open gifts', ButtonStyle.Primary, { emoji: '🎁' })));
    return { embeds: [e], components: rows.slice(0, 5) };
  }

  // ---------- seasonal event ----------
  function eventView(user, note = '') {
    const { state } = load(user);
    const st = core.eventStatus(state);
    if (!st) {
      const nx = nextEvent();
      return { embeds: [embed('📅 No event right now', nx ? `Next up: ${nx.event.icon} **${nx.event.name}** <t:${Math.floor(nx.at / 1000)}:R>!` : 'Check back soon!')], components: [] };
    }
    const ev = st.event;
    const e = embed(`${ev.icon} ${ev.name}`, `${note ? `${note}\n\n` : ''}*${ev.desc}*\nEnds <t:${Math.floor(eventEndsAt(ev) / 1000)}:R> · You have **${st.tokens}** ${ev.token.icon} ${ev.token.name}`, GOLD);
    e.addFields({ name: "Today's quests", value: st.quests.map((q) => `${q.claimed ? '✅' : q.p >= q.target ? '🎁' : '▫️'} ${q.text} · ${q.p}/${q.target} · ${ev.token.icon}${q.reward}`).join('\n') });
    e.addFields({ name: 'Limited shop (on the website)', value: ev.shop.map((x) => `${x.kind === 'item' ? ITEMS[x.id].icon : '🛋️'} ${x.kind === 'item' ? ITEMS[x.id].name : FURNITURE[x.id].name} · ${ev.token.icon}${x.tokens}`).join('\n') });
    e.setFooter({ text: `Arcade games and /explore also earn ${ev.token.name}. Limited finds: ${ev.finds.map((f) => f.icon).join(' ')}` });
    const ready = st.quests.filter((q) => !q.claimed && q.p >= q.target);
    const rows = [row(...(ready.length ? ready.map((q) => btn(`ev:${user.id}:claim:${q.kind}`, `Claim ${q.reward}`, ButtonStyle.Success, { emoji: ev.token.icon })) : [btn(`ev:${user.id}:refresh:x`, 'Refresh', ButtonStyle.Secondary, { emoji: '🔄' })]), linkBtn(`${siteUrl}/#event`, 'Event shop'))];
    return { embeds: [e], components: rows };
  }

  // ---------- command handlers ----------
  async function onCommand(i) {
    const user = i.user;
    const ctx = makeCtx(user);
    switch (i.commandName) {
      case 'pet': {
        const { state, reports } = load(user);
        if (!state.name) return i.reply(adoptPrompt(user.id));
        return i.reply(petView(state, user.id, reportText(state, reports)));
      }
      case 'adopt': {
        const name = i.options.getString('name').trim().slice(0, 16) || 'Pebble';
        const { state, res } = load(user, (s) => {
          if (s.name) return false;
          s.name = name;
          core.log(s, `${user.username} adopted ${name} on Discord! 🦦`);
          return true;
        });
        if (!res) return whisper(i, `You already have **${state.name}**! Use \`/pet\` to see them.`);
        return i.reply(petView(state, user.id, `🎉 Welcome to the family, **${state.name}**!`));
      }
      case 'den': {
        const { state } = load(user);
        if (!state.name) return i.reply({ ...adoptPrompt(user.id), flags: EPHEMERAL });
        const card = denCard(state);
        card.components = [row(linkBtn(`${siteUrl}/#den`, 'Decorate on the website'))];
        return i.reply(card);
      }
      case 'visit': {
        const friend = i.options.getUser('friend');
        const p = store.getByDiscord(friend.id);
        if (!p?.state.name) return whisper(i, `${friend.username} hasn't adopted an otter yet. Invite them with \`/pet\`!`);
        const me = store.forDiscord(user);
        const v = social.areFriends(me.id, p.id) ? social.visit(me.id, p.id) : null;
        const { state } = store.mutate(p.id, () => null);
        const card = denCard(state, { title: `🏡 Visiting ${state.name}'s Den` });
        if (v?.friend) card.embeds[0].addFields({ name: 'Friendship', value: `${heartsText(v.friend.points)} ${v.friend.friendship}`, inline: true });
        card.embeds[0].setFooter({ text: `${state.name} belongs to ${friend.displayName || friend.username}` });
        return i.reply(card);
      }
      case 'friend': {
        const sub = i.options.getSubcommand();
        const me = store.forDiscord(user);
        if (sub === 'list') return i.reply({ ...friendsView(user), flags: EPHEMERAL });
        if (sub === 'add') {
          const u = i.options.getUser('user');
          const code = i.options.getString('code');
          if (!u && !code) return whisper(i, 'Pick a Discord user or type a friend code (like `OTR-AB3CD`).');
          if (u?.bot) return whisper(i, "Bots can't be otter friends. 🤖");
          const other = u ? store.forDiscord(u).id : social.idByCode(code);
          const r = social.request(me.id, other);
          if (r.error) return whisper(i, r.error);
          if (r.accepted) return i.reply({ content: `🤝 You and **${r.friend.name}** are now friends!${u ? ` ${'<@'}${u.id}>` : ''}`, allowedMentions: { users: u ? [u.id] : [] } });
          return i.reply({ content: `📨 Friend request sent${u ? ` to <@${u.id}>` : ''}! They can accept with \`/friend list\`.`, allowedMentions: { users: u ? [u.id] : [] } });
        }
        if (sub === 'remove') {
          const u = i.options.getUser('user');
          social.remove(me.id, store.forDiscord(u).id);
          return whisper(i, `Removed ${u.username} from your friends.`);
        }
        return whisper(i, 'Unknown option.');
      }
      case 'hug': {
        const u = i.options.getUser('friend');
        const me = load(user).player;
        const other = store.getByDiscord(u.id);
        if (!other?.state.name) return whisper(i, `${u.username} doesn't have an otter yet.`);
        const r = social.hug(me.id, other.id, store.get(me.id).state.name || user.username);
        if (r.error) return whisper(i, r.status === 403 ? `You need to be friends first! Try \`/friend add\` with <@${u.id}>.` : r.error);
        return i.reply({ content: `🤗 ${user.username} gave <@${u.id}>'s otter **${other.state.name}** a big hug! (+happiness, +friendship)`, allowedMentions: { users: [u.id] } });
      }
      case 'gift': {
        const u = i.options.getUser('friend');
        const me = load(user).player;
        const other = store.getByDiscord(u.id);
        if (!other) return whisper(i, `${u.username} doesn't have an otter yet.`);
        const r = social.gift(me.id, other.id, { kind: 'pearls', amount: i.options.getInteger('pearls'), note: i.options.getString('note') });
        if (r.error) return whisper(i, r.status === 403 ? `You need to be friends first! Try \`/friend add\` with <@${u.id}>.` : r.error);
        return i.reply({ content: `🎁 ${user.username} sent <@${u.id}> **${i.options.getInteger('pearls')} pearls**! Open it with \`/friend list\` or on the website.`, allowedMentions: { users: [u.id] } });
      }
      case 'museum': {
        if (!museum) return whisper(i, 'The museum is closed right now.');
        const me = store.forDiscord(user);
        const m = museum.view(me.id);
        const filled = Math.round(m.pct / 10);
        const e = embed('🏛️ The Pond Museum', `${'🟨'.repeat(filled)}${'⬛'.repeat(10 - filled)} **${m.species}/${m.totalSpecies}** exhibits (${m.pct}%)\n${m.donations} donations from the community. Donate your spare discoveries on the website!`, GOLD);
        e.addFields({ name: 'Community milestones', value: m.milestones.map((x) => `${x.reached ? '✅' : '🔒'} ${x.pct}%: ${x.pearls} pearls${x.item ? ' + display case' : ''}${x.claimed ? ' (claimed)' : ''}`).join('\n') });
        if (m.patrons.length) e.addFields({ name: 'Top donors', value: m.patrons.slice(0, 5).map((x, k) => `${['🥇', '🥈', '🥉'][k] || '▫️'} ${x.name}: ${x.count}`).join('\n') });
        if (m.you) e.setFooter({ text: `You've donated ${m.you.donations} · ${m.you.firsts} firsts` });
        return i.reply({ embeds: [e], components: [row(linkBtn(siteUrl, 'Visit the museum'))] });
      }
      case 'event': {
        if (!load(user).state.name) return i.reply({ ...adoptPrompt(user.id), flags: EPHEMERAL });
        return i.reply(eventView(user));
      }
      case 'explore': {
        const locId = i.options.getString('place');
        const loc = LOC[locId];
        const { state, res } = load(user, (s) => (s.name ? core.explore(s, locId) : null));
        if (!state.name) return i.reply({ ...adoptPrompt(user.id), flags: EPHEMERAL });
        if (!res.ok) return whisper(i, `${loc.icon} ${res.msg}`);
        const e = embed(`${loc.icon} Exploring ${loc.name}`, `*${loc.desc}*\n\n${res.msg}${res.ups ? `\n⭐ **Level up!** ${state.name} is now level ${state.level}!` : ''}`, res.find?.rarity === 'legendary' ? GOLD : res.isNew ? GREEN : COLOR);
        if (res.find) {
          const r = RARITY[res.find.rarity];
          e.addFields({ name: res.isNew ? '✨ New for your journal' : 'Found again', value: `${res.find.icon} **${res.find.name}** · ${r.stars} ${r.name}`, inline: true },
            { name: `${loc.name} set`, value: `${loc.finds.filter((f) => state.collection[f.id]).length}/${loc.finds.length}${state.sets.includes(loc.id) ? ' 🏅' : ''}`, inline: true });
        }
        e.setFooter({ text: `⚡ ${Math.round(state.stats.energy)} energy left · explore here again in 20 min` });
        return i.reply({ embeds: [e] });
      }
      case 'collection': {
        const target = i.options.getUser('user') || user;
        const p = target.id === user.id ? load(user).player && store.getByDiscord(user.id) : store.getByDiscord(target.id);
        if (!p?.state.name) return whisper(i, target.id === user.id ? "You don't have an otter yet. Try `/pet`!" : `${target.username} hasn't adopted an otter yet.`);
        const s = p.state;
        const n = Object.keys(s.collection).filter((id) => FINDS[id]).length;
        const e = embed(`📖 ${s.name}'s collection journal`, `**${n}/${TOTAL_FINDS}** discovered · 🏅 **${s.sets.length}/${LOCATIONS.length}** sets complete\nFinish a place's set for a badge and ${SET_REWARD.pearls} pearls.`, GOLD);
        for (const l of LOCATIONS) {
          e.addFields({ name: `${l.icon} ${l.name} ${l.finds.filter((f) => s.collection[f.id]).length}/${l.finds.length}${s.sets.includes(l.id) ? ' 🏅' : ''}`, value: l.finds.map((f) => (s.collection[f.id] ? f.icon : '❔')).join(' '), inline: true });
        }
        return i.reply({ embeds: [e] });
      }
      case 'daily': {
        const { state } = load(user);
        if (!state.name) return i.reply({ ...adoptPrompt(user.id), flags: EPHEMERAL });
        if (state.lastChest === core.dayKey()) {
          const tomorrow = new Date();
          tomorrow.setUTCHours(24, 0, 0, 0);
          return whisper(i, `You already opened today's chest! Next one <t:${Math.floor(tomorrow / 1000)}:R>. 🗝️`);
        }
        return i.reply({
          embeds: [embed('🗝️ Daily treasure', `**${state.name}** dug up three chests on the beach. Pick one!`, GOLD)],
          components: [row(...[0, 1, 2].map((k) => btn(`chest:${user.id}:${k}`, null, ButtonStyle.Secondary, { emoji: '🎁' })))],
        });
      }
      case 'mission': {
        const { state, reports } = load(user);
        if (!state.name) return i.reply({ ...adoptPrompt(user.id), flags: EPHEMERAL });
        return i.reply(missionView(state, user.id, reportText(state, reports)));
      }
      case 'play': {
        const game = solo[i.options.getString('game')];
        return startSolo(i, game, ctx);
      }
      case 'challenge': {
        const friend = i.options.getUser('friend');
        const game = duels[i.options.getString('game')];
        return startChallenge(i, game, friend);
      }
      case 'party': {
        const game = parties[i.options.getString('game')];
        return startParty(i, game);
      }
      case 'leaderboard': {
        const id = i.options.getString('game');
        const meta = GAME_LIST.find((g) => g.id === id) || BOT_BOARDS[id];
        const top = store.leaderboard(id, 10);
        const medal = (k) => ['🥇', '🥈', '🥉'][k] || `\`${k + 1}.\``;
        const body = top.length ? top.map((r, k) => `${medal(k)} **${r.name}**${r.owner ? ` (${r.owner})` : ''}: ${r.score} ${meta.scoreLabel}`).join('\n') : 'No scores yet. Be the first!';
        return i.reply({ embeds: [embed(`🏆 ${meta.icon || ''} ${meta.name}`, body, GOLD)] });
      }
      case 'profile': {
        const target = i.options.getUser('user') || user;
        const p = target.id === user.id ? load(user).player && store.getByDiscord(user.id) : store.getByDiscord(target.id);
        if (!p?.state.name) return whisper(i, target.id === user.id ? "You don't have an otter yet. Try `/pet`!" : `${target.username} hasn't adopted an otter yet.`);
        const s = p.state;
        const best = Object.entries(s.best).map(([g, v]) => {
          const meta = GAME_LIST.find((x) => x.id === g);
          return meta ? `${meta.icon} ${v} ${meta.scoreLabel}` : null;
        }).filter(Boolean).join(' · ');
        const worn = Object.values(s.equipped).filter(Boolean).map((id) => ITEMS[id].icon).join(' ');
        const got = core.ACHIEVEMENTS.filter((a) => s.achievements?.[a.id]);
        const extra = `👗 **${s.owned.length}** items${worn ? ` · wearing ${worn}` : ''}\n🏅 **${got.length}/${core.ACHIEVEMENTS.length}** achievements ${got.slice(-6).map((a) => a.icon).join('')}${best ? `\n🏆 ${best}` : ''}`;
        return i.reply(petCard(s, { title: `${target.displayName || target.username}'s otter: ${s.name}`, extra }));
      }
      case 'link': {
        const p = store.forDiscord(user);
        const code = store.makeLinkCode(p.id);
        return i.reply({
          flags: EPHEMERAL,
          embeds: [embed('🔗 Link your account', `Go to **${siteUrl.replace(/^https?:\/\//, '')}** → **Discord** tab and enter this code:\n# \`${code}\`\nIt works once and expires in 10 minutes.\n\nIf you have otters in both places, the website will ask which one to keep.`)],
          components: [row(linkBtn(siteUrl, 'Open otteroyster.online'))],
        });
      }
      case 'help':
        return i.reply({ flags: EPHEMERAL, embeds: [embed('🦦 OtterOyster on Discord', [
          '**Your otter** follows you everywhere. It is the same otter as on the website!',
          '`/pet` care for your otter · `/adopt` get one · `/link` connect the website',
          '`/daily` daily treasure chest · `/mission` send your otter exploring',
          '`/den` show off your den · `/visit @friend` peek inside a friend\'s den',
          '`/explore` discover creatures and treasures · `/collection` your journal',
          '`/friend` add and list friends · `/hug @friend` · `/gift @friend` pearls',
          '`/event` this season\'s event: quests, tokens and limited items',
          '',
          `**Solo games** \`/play\`: ${SOLO.map((g) => `${g.emoji} ${g.name}`).join(', ')}`,
          `**Challenges** \`/challenge @friend\`: ${DUELS.map((g) => `${g.emoji} ${g.name}`).join(', ')}`,
          `**Party games** \`/party\` (great in voice chat): ${PARTY.map((g) => `${g.emoji} ${g.name}`).join(', ')}`,
          '',
          `Games earn pearls (up to ${BOT_DAILY_CAP} a day from Discord). \`/leaderboard\` shows top scores.`,
        ].join('\n'))], components: [row(linkBtn(siteUrl, 'Play on the website'))] });
      default:
        return whisper(i, 'Unknown command.');
    }
  }

  async function startSolo(i, game, ctx) {
    const s = createSession(game.id, i.user.id);
    s.kind = 'solo';
    s.user = i.user;
    const payload = game.start({ s, user: i.user, ctx });
    s.hook = i;
    return i.reply(payload);
  }

  async function startChallenge(i, game, friend) {
    if (!friend || friend.id === i.user.id) return whisper(i, "You can't challenge yourself, silly otter! Pick a friend.");
    if (friend.bot) return whisper(i, "Bots don't play fair. Challenge a human friend!");
    const s = createSession(game.id, i.user.id);
    s.kind = 'duel';
    s.players = [asPlayer(i.user), asPlayer(friend)];
    s.data = {};
    s.hook = i;
    return i.reply(inviteMessage(s, game));
  }

  async function startParty(i, game) {
    const s = createSession(game.id, i.user.id);
    s.kind = 'party';
    s.players = [asPlayer(i.user)];
    s.hook = i;
    return i.reply(lobbyMessage(s, game));
  }

  // ---------- component + modal handlers ----------
  async function onComponent(i) {
    const parts = i.customId.split(':');
    const [kind] = parts;
    const user = i.user;
    const ctx = makeCtx(user);

    if (kind === 's') {
      const [, id, action, arg = ''] = parts;
      const s = getSession(id);
      if (!s) return whisper(i, 'This game has ended. Start a new one! 🦦');
      if (s.kind === 'solo') return solo[s.game].action({ i, s, action, arg, ctx });
      if (s.kind === 'duel') {
        const game = duels[s.game];
        if (!s.data.started) return (await handleInvite({ i, s, action, game })) ?? i.deferUpdate();
        return game.action({ i, s, action, arg, ctx });
      }
      if (s.kind === 'party') {
        const game = parties[s.game];
        if (!s.started) return handleLobby({ i, s, action, game, ctx });
        return game.action({ i, s, action, arg, ctx });
      }
      return i.deferUpdate();
    }

    if (kind === 'play') return startSolo(i, solo[parts[1]], ctx);
    if (kind === 'party') return startParty(i, parties[parts[1]]);
    if (kind === 'rematch') {
      const game = duels[parts[1]];
      let friend = null;
      try { friend = await i.client.users.fetch(parts[2]); } catch { /* unknown */ }
      if (!friend) return whisper(i, "Couldn't find your opponent. Try `/challenge` again.");
      return startChallenge(i, game, friend);
    }

    // Owner-only panels: pet / mission / chest / adopt
    const ownerId = parts[1];
    if (['pet', 'mis', 'chest', 'adopt', 'adoptname', 'fr', 'ev'].includes(kind) && ownerId !== user.id) {
      return whisper(i, 'This otter belongs to someone else! Use `/pet` to see yours. 🦦');
    }

    if (kind === 'ev') {
      const [, , action, quest] = parts;
      let note = '';
      if (action === 'claim') {
        const { res } = load(user, (s) => core.claimQuest(s, quest));
        note = res.ok ? `🎉 ${res.msg}` : `⚠️ ${res.msg}`;
      }
      return i.update(eventView(user, note));
    }

    if (kind === 'fr') {
      const [, , action, code] = parts;
      const me = store.forDiscord(user);
      if (action === 'open') {
        const r = social.claim(me.id, 'all');
        return i.update(friendsView(user, r.error ? r.error : `🎁 You opened: ${r.opened.join(', ')}!`));
      }
      const r = social.respond(me.id, social.idByCode(code), action === 'acc');
      return i.update(friendsView(user, r.error ? `⚠️ ${r.error}` : r.accepted ? '🤝 New friend!' : 'Request declined.'));
    }

    if (kind === 'adopt') return i.showModal(textModal(`adoptname:${user.id}`, 'Adopt an otter', "What's your otter's name?", { max: 16, placeholder: 'Pebble' }));
    if (kind === 'adoptname') {
      const name = i.fields.getTextInputValue('answer').trim().slice(0, 16) || 'Pebble';
      const { state } = load(user, (s) => {
        if (!s.name) { s.name = name; core.log(s, `${user.username} adopted ${name} on Discord! 🦦`); }
      });
      return i.update(petView(state, user.id, `🎉 Welcome to the family, **${state.name}**!`));
    }

    if (kind === 'pet') {
      const action = parts[2];
      const { state, res, reports } = load(user, (s) => {
        switch (action) {
          case 'feed': return core.feed(s, i.values[0]);
          case 'cuddle': return core.cuddle(s);
          case 'bath': return core.bath(s);
          case 'sleep': return core.toggleSleep(s);
          default: return null;
        }
      });
      if (!state.name) return i.update(adoptPrompt(user.id));
      const msg = [reportText(state, reports), res ? `${res.ok ? '' : '⚠️ '}${res.msg}${res.ups ? `\n⭐ **Level up!** ${state.name} is now level ${state.level}!` : ''}` : ''].filter(Boolean).join('\n');
      return i.update(petView(state, user.id, msg));
    }

    if (kind === 'mis') {
      const action = parts[2];
      const { state, res, reports } = load(user, (s) => {
        if (action === 'go') return core.startMission(s, i.values[0]);
        if (action === 'recall') return core.recallMission(s);
        return null;
      });
      const msg = [reportText(state, reports), res ? `${res.ok ? '' : '⚠️ '}${res.msg}` : ''].filter(Boolean).join('\n');
      return i.update(missionView(state, user.id, msg));
    }

    if (kind === 'chest') {
      const pickK = Number(parts[2]);
      const { state, res } = load(user, (s) => {
        if (s.lastChest === core.dayKey()) return null;
        s.lastChest = core.dayKey();
        const prize = rollChest(s);
        core.log(s, `Opened a Discord treasure chest: ${prize.text.replace(/\*/g, '')}`);
        return prize;
      });
      if (!res) return i.update({ embeds: [embed('🗝️ Daily treasure', 'You already opened today\'s chest!')], components: [] });
      const decoys = shuffle(['⚪', '🐚', '⭐', '🦀', '💎', '🥾']);
      const buttons = [0, 1, 2].map((k) => btn(`chest:${user.id}:x${k}`, null, k === pickK ? ButtonStyle.Success : ButtonStyle.Secondary, { emoji: k === pickK ? res.icon : decoys[k], disabled: true }));
      return i.update({ embeds: [embed('🎉 Treasure!', `**${state.name}** opened the chest and found ${res.text}\nYou now have **${state.pearls}** pearls.`, GREEN)], components: [row(...buttons)] });
    }

    return i.deferUpdate();
  }

  async function handle(i) {
    try {
      if (i.isChatInputCommand()) return await onCommand(i);
      if (i.isButton() || i.isStringSelectMenu() || i.isModalSubmit()) return await onComponent(i);
    } catch (err) {
      console.error('[bot] interaction failed', i.customId || i.commandName, err);
      try { await whisper(i, 'Oops, something went wrong. 🫧 Please try again.'); } catch { /* already answered */ }
    }
    return null;
  }

  return { handle };
}

export async function startBot({ token, store, social, museum, siteUrl, devGuildId, registerCommands = true }) {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  const { handle } = createBot({ store, social, museum, siteUrl });
  client.on(Events.InteractionCreate, handle);
  client.once(Events.ClientReady, async (c) => {
    console.log(`🦦 Discord bot logged in as ${c.user.tag}`);
    c.user.setActivity('with oysters 🦪 · /pet', { type: ActivityType.Playing });
    // Keep Discord's slash commands in sync with the code on every start,
    // so nobody has to run a separate registration step with the token.
    if (registerCommands) {
      try {
        const { commands } = await import('./commands.js');
        if (devGuildId) await c.application.commands.set(commands, devGuildId);
        else await c.application.commands.set(commands);
        console.log(`✅ Registered ${commands.length} slash commands${devGuildId ? ' in the test server' : ' (new ones can take a few minutes to appear)'}`);
      } catch (err) {
        console.error('⚠️ Could not register slash commands:', err.message);
      }
    }
  });
  await client.login(token);
  return client;
}

export { COLOR };
