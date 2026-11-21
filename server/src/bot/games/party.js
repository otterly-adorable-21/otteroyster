// Party games for groups and voice chats. Talking happens in voice;
// the bot runs the lobby, secret roles, timers, votes and scores.
import { embed, btn, row, select, ButtonStyle, GOLD, GREEN, RED, COLOR } from '../ui.js';
import { sid, endSession, later, refresh, clearTimers } from '../sessions.js';
import { IMPOSTOR_PAIRS, TRIVIA, CATEGORIES, WOULD_YOU_RATHER, FORBIDDEN } from '../content.js';
import { shuffle, pick, mention, whisper, EPHEMERAL, LETTERS } from './_util.js';

const upd = (i, s, payload) => { s.hook = i; return i.update(payload); };
const isHost = (i, s) => i.user.id === s.owner;
const inGame = (i, s) => s.players.some((p) => p.id === i.user.id);
const names = (s) => s.players.map((p) => p.name).join(', ');

async function payout(s, ctx, amounts) {
  const lines = [];
  for (const p of s.players) {
    const amt = amounts[p.id] || 0;
    const got = ctx.award(p, amt, amt ? `Played ${s.gameName} with friends on Discord.` : null);
    lines.push(`${p.name}: ${got ? `+${got} ⚪` : amt ? '*(adopt an otter with /pet to earn pearls)*' : '—'}`);
  }
  return lines.join('\n');
}

const playAgain = (id) => row(btn(`party:${id}`, 'New game', ButtonStyle.Primary, { emoji: '🔁' }));

// ---------------------------------------------------------------- impostor
export const impostor = {
  id: 'impostor', name: 'Impostor', emoji: '🕵️', min: 3, max: 12,
  desc: "Everyone gets the same secret word except the impostor. Give one-word clues in voice chat, then vote out who's faking!",
  begin(s) {
    const [word, fake] = shuffle(pick(IMPOSTOR_PAIRS));
    const order = shuffle(s.players);
    s.data = { word, fake, impostor: pick(s.players).id, order, phase: 'clues', votes: {}, seen: {} };
  },
  render(s, note = '') {
    const d = s.data;
    if (d.phase === 'clues') {
      const e = embed('🕵️ Impostor', `1. Everyone taps **👀 My secret word** (only you can see it).\n2. In voice chat, go around in this order and say **one word** that hints at your word:\n${d.order.map((p, k) => `**${k + 1}.** ${p.name}${d.seen[p.id] ? ' 👀' : ''}`).join('\n')}\n3. One player has a *slightly different* word. Do two rounds of clues, then the host starts the vote!${note ? `\n\n${note}` : ''}`);
      return { embeds: [e], components: [row(
        btn(sid(s, 'word'), 'My secret word', ButtonStyle.Primary, { emoji: '👀' }),
        btn(sid(s, 'vote'), 'Start vote (host)', ButtonStyle.Danger, { emoji: '🗳️' }),
      )] };
    }
    const voted = Object.keys(d.votes).length;
    const e = embed('🗳️ Who is the impostor?', `Pick who you think had the different word. You can change your vote until the host reveals.\n\nVotes in: **${voted}/${s.players.length}**${note ? `\n\n${note}` : ''}`);
    return { embeds: [e], components: [
      row(select(sid(s, 'pick'), 'Vote for a player…', s.players.map((p) => ({ label: p.name.slice(0, 100), value: p.id })))),
      row(btn(sid(s, 'reveal'), 'Reveal (host)', ButtonStyle.Danger, { emoji: '🎭' })),
    ] };
  },
  async action({ i, s, action, ctx }) {
    const d = s.data;
    if (!inGame(i, s)) return whisper(i, "You're not in this round. Join the next one!");
    if (action === 'word') {
      d.seen[i.user.id] = true;
      await upd(i, s, this.render(s));
      const w = i.user.id === d.impostor ? d.fake : d.word;
      return i.followUp({ content: `Your secret word is **${w}**. 🤫\n(Is it the same as everyone else's? You'll have to listen carefully…)`, flags: EPHEMERAL });
    }
    if (action === 'vote') {
      if (!isHost(i, s)) return whisper(i, 'Only the host can start the vote.');
      d.phase = 'vote';
      return upd(i, s, this.render(s));
    }
    if (action === 'pick') {
      d.votes[i.user.id] = i.values[0];
      await upd(i, s, this.render(s));
      if (Object.keys(d.votes).length === s.players.length) return this.finish(s, ctx);
      return null;
    }
    if (action === 'reveal') {
      if (!isHost(i, s)) return whisper(i, 'Only the host can reveal.');
      s.hook = i;
      await i.deferUpdate();
      return this.finish(s, ctx);
    }
    return i.deferUpdate();
  },
  async finish(s, ctx) {
    if (s.ended) return null;
    const d = s.data;
    const tally = {};
    for (const v of Object.values(d.votes)) tally[v] = (tally[v] || 0) + 1;
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    const accused = top.length && (top.length === 1 || top[0][1] > top[1][1]) ? top[0][0] : null;
    const imp = s.players.find((p) => p.id === d.impostor);
    const caught = accused === d.impostor;
    const amounts = {};
    for (const p of s.players) amounts[p.id] = p.id === d.impostor ? (caught ? 3 : 20) : (caught ? 10 : 3);
    endSession(s);
    const rewards = await payout(s, ctx, amounts);
    const votes = s.players.map((p) => `${p.name} → ${s.players.find((x) => x.id === d.votes[p.id])?.name ?? '(no vote)'}`).join('\n');
    const head = caught ? `🎉 The crew caught the impostor, **${imp.name}**!` : accused ? `😈 Wrong otter! The impostor was **${imp.name}**.` : `😈 It was a tie, so **${imp.name}** the impostor escaped!`;
    return refresh(s, { embeds: [embed('🎭 The reveal', `${head}\n\nEveryone else had **${d.word}**. The impostor had **${d.fake}**.\n\n${votes}\n\n${rewards}`, caught ? GREEN : RED)], components: [playAgain('impostor')] });
  },
};

// ---------------------------------------------------------------- trivia battle
const Q_TIME = 20_000;
const ROUNDS = 6;

export const triviaBattle = {
  id: 'trivia', name: 'Trivia Battle', emoji: '🧠', min: 1, max: 20,
  desc: 'Everyone answers at once. Correct answers score, and the fastest correct answer gets a bonus!',
  begin(s) {
    s.data = { qs: shuffle(TRIVIA).slice(0, ROUNDS).map(([q, a, ...w]) => ({ q, a, opts: shuffle([a, ...w]) })), idx: 0, answers: {}, score: {}, open: true, startedAt: Date.now() };
    for (const p of s.players) s.data.score[p.id] = 0;
  },
  scoreboard(s) {
    return [...s.players].sort((a, b) => s.data.score[b.id] - s.data.score[a.id]).map((p, k) => `${['🥇', '🥈', '🥉'][k] || '▫️'} ${p.name}: **${s.data.score[p.id]}**`).join('\n');
  },
  render(s, reveal = false) {
    const d = s.data;
    const q = d.qs[d.idx];
    const answered = Object.keys(d.answers).length;
    let body = `**${q.q}**\n\n${q.opts.map((o, k) => `${LETTERS[k]} ${o}${reveal && o === q.a ? ' ✅' : ''}`).join('\n')}`;
    if (reveal) {
      const right = s.players.filter((p) => q.opts[d.answers[p.id]?.k] === q.a);
      body += `\n\n${right.length ? `Correct: ${right.map((p) => p.name).join(', ')}` : 'Nobody got it!'}\n\n${this.scoreboard(s)}`;
    } else {
      body += `\n\n⏱️ ${Math.round(Q_TIME / 1000)} seconds · answered: **${answered}/${s.players.length}**`;
    }
    const e = embed(`🧠 Trivia Battle · ${d.idx + 1}/${ROUNDS}`, body, reveal ? GOLD : COLOR);
    return { embeds: [e], components: reveal ? [] : [row(...q.opts.map((_, k) => btn(sid(s, 'a', `${d.idx}.${k}`), null, ButtonStyle.Secondary, { emoji: LETTERS[k] })))] };
  },
  started(s, ctx) { this.arm(s, ctx); },
  arm(s, ctx) {
    s.data.open = true;
    s.data.askedAt = Date.now();
    later(s, Q_TIME, () => this.close(s, ctx));
  },
  async close(s, ctx) {
    const d = s.data;
    if (!d.open) return;
    d.open = false;
    clearTimers(s);
    const q = d.qs[d.idx];
    const right = Object.entries(d.answers).filter(([, v]) => q.opts[v.k] === q.a).sort((a, b) => a[1].t - b[1].t);
    right.forEach(([id], k) => { d.score[id] += k === 0 ? 2 : 1; });
    await refresh(s, this.render(s, true));
    later(s, 5000, async () => {
      d.idx += 1;
      d.answers = {};
      if (d.idx >= ROUNDS) return this.finish(s, ctx);
      await refresh(s, this.render(s));
      this.arm(s, ctx);
    });
  },
  async finish(s, ctx) {
    const d = s.data;
    const ranked = [...s.players].sort((a, b) => d.score[b.id] - d.score[a.id]);
    const amounts = {};
    ranked.forEach((p, k) => { amounts[p.id] = d.score[p.id] * 3 + (k === 0 && d.score[p.id] > 0 ? 10 : 0); });
    endSession(s);
    const rewards = await payout(s, ctx, amounts);
    return refresh(s, { embeds: [embed('🏆 Trivia Battle results', `${this.scoreboard(s)}\n\n${rewards}`, GOLD)], components: [playAgain('trivia')] });
  },
  async action({ i, s, action, arg, ctx }) {
    const d = s.data;
    if (action !== 'a') return i.deferUpdate();
    if (!inGame(i, s)) return whisper(i, "You're not in this game. Join the next one!");
    const [qi, k] = arg.split('.').map(Number);
    if (!d.open || qi !== d.idx) return i.deferUpdate();
    if (!d.answers[i.user.id]) d.answers[i.user.id] = { k, t: Date.now() };
    await upd(i, s, this.render(s));
    if (Object.keys(d.answers).length === s.players.length) await this.close(s, ctx);
    return null;
  },
};

// ---------------------------------------------------------------- hot potato categories
export const hotpotato = {
  id: 'hotpotato', name: 'Hot Potato Categories', emoji: '🥔', min: 2, max: 12,
  desc: 'Name something in the category out loud, then pass the potato before it bursts! Each turn gets shorter.',
  begin(s) {
    s.data = { cat: pick(CATEGORIES), alive: shuffle(s.players).map((p) => p.id), turn: 0, passes: 0, out: [] };
  },
  turnMs(s) { return Math.max(4000, 10000 - s.data.passes * 350); },
  render(s, note = '') {
    const d = s.data;
    const cur = s.players.find((p) => p.id === d.alive[d.turn]);
    const secs = Math.round(this.turnMs(s) / 1000);
    const e = embed(`🥔 Hot Potato: ${d.cat}`, `${mention(cur.id)} has the potato! Say something in **${d.cat}** out loud, then tap **Pass**.\n⏱️ You have about **${secs}s** (bursts <t:${Math.floor((d.deadline || Date.now()) / 1000)}:R>)\n\nStill in: ${d.alive.map((id) => s.players.find((p) => p.id === id).name).join(' → ')}${d.out.length ? `\nOut: ${d.out.join(', ')}` : ''}${note ? `\n\n${note}` : ''}`);
    return { content: mention(cur.id), allowedMentions: { users: [cur.id] }, embeds: [e], components: [row(
      btn(sid(s, 'pass'), 'Said it! Pass', ButtonStyle.Success, { emoji: '🥔' }),
      btn(sid(s, 'boo'), 'Repeat / invalid (others)', ButtonStyle.Secondary, { emoji: '🙅' }),
    )] };
  },
  started(s, ctx) { this.arm(s, ctx); },
  arm(s, ctx) {
    const d = s.data;
    d.deadline = Date.now() + this.turnMs(s);
    const turnId = `${d.passes}:${d.alive[d.turn]}`;
    d.turnId = turnId;
    later(s, this.turnMs(s), () => { if (d.turnId === turnId) this.burst(s, ctx, '💥 **POP!** Too slow!'); });
  },
  async burst(s, ctx, why) {
    const d = s.data;
    clearTimers(s);
    const outId = d.alive[d.turn];
    const out = s.players.find((p) => p.id === outId);
    d.out.push(out.name);
    d.alive.splice(d.turn, 1);
    if (d.turn >= d.alive.length) d.turn = 0;
    if (d.alive.length <= 1) {
      const winner = s.players.find((p) => p.id === d.alive[0]);
      const amounts = {};
      for (const p of s.players) amounts[p.id] = p.id === winner.id ? 15 : 3;
      endSession(s);
      const rewards = await payout(s, ctx, amounts);
      return refresh(s, { content: '', embeds: [embed('🏆 Last otter standing!', `${why} ${out.name} is out.\n\n**${winner.name}** wins Hot Potato (${d.cat})!\n\n${rewards}`, GOLD)], components: [playAgain('hotpotato')] });
    }
    d.cat = d.passes > 0 ? pick(CATEGORIES) : d.cat;
    await refresh(s, this.render(s, `${why} **${out.name}** is out! New category: **${d.cat}**`));
    this.arm(s, ctx);
    await refresh(s, this.render(s, `${why} **${out.name}** is out! New category: **${d.cat}**`));
    return null;
  },
  async action({ i, s, action, ctx }) {
    const d = s.data;
    if (!inGame(i, s)) return whisper(i, "You're not in this game. Join the next one!");
    if (action === 'pass') {
      if (i.user.id !== d.alive[d.turn]) return whisper(i, "You don't have the potato! 🥔");
      clearTimers(s);
      d.passes += 1;
      d.turn = (d.turn + 1) % d.alive.length;
      this.arm(s, ctx);
      return upd(i, s, this.render(s));
    }
    if (action === 'boo') {
      if (i.user.id === d.alive[d.turn]) return whisper(i, 'Nice try! Someone else has to call it.');
      s.hook = i;
      await i.deferUpdate();
      return this.burst(s, ctx, `🙅 ${i.user.username} called it invalid!`);
    }
    return i.deferUpdate();
  },
};

// ---------------------------------------------------------------- would you rather
const WYR_ROUNDS = 5;
export const wyr = {
  id: 'wyr', name: 'Would You Rather', emoji: '🤔', min: 1, max: 25,
  desc: 'Vote on silly choices, then defend your pick in voice chat!',
  begin(s) { s.data = { qs: shuffle(WOULD_YOU_RATHER).slice(0, WYR_ROUNDS), idx: 0, votes: {}, count: {} }; },
  render(s, reveal = false) {
    const d = s.data;
    const [a, b] = d.qs[d.idx];
    const voters = (k) => s.players.filter((p) => d.votes[p.id] === k);
    const n = Object.keys(d.votes).length;
    let body = `🅰️ **${a}**\n\n…or…\n\n🅱️ **${b}**`;
    if (reveal) {
      const pct = (k) => (n ? Math.round((voters(k).length / n) * 100) : 0);
      body += `\n\n🅰️ ${pct(0)}% ${voters(0).map((p) => p.name).join(', ')}\n🅱️ ${pct(1)}% ${voters(1).map((p) => p.name).join(', ')}\n\n🎙️ Time to explain yourselves in voice chat!`;
    } else body += `\n\nVotes: **${n}/${s.players.length}**`;
    const comps = reveal
      ? [row(btn(sid(s, 'next'), d.idx + 1 >= WYR_ROUNDS ? 'Finish (host)' : 'Next question (host)', ButtonStyle.Primary, { emoji: '➡️' }))]
      : [row(
        btn(sid(s, 'v', 0), 'A', ButtonStyle.Primary, { emoji: '🅰️' }),
        btn(sid(s, 'v', 1), 'B', ButtonStyle.Primary, { emoji: '🅱️' }),
        btn(sid(s, 'show'), 'Reveal (host)', ButtonStyle.Secondary, { emoji: '👀' }),
      )];
    return { embeds: [embed(`🤔 Would you rather… (${d.idx + 1}/${WYR_ROUNDS})`, body, reveal ? GOLD : COLOR)], components: comps };
  },
  async action({ i, s, action, arg, ctx }) {
    const d = s.data;
    if (!inGame(i, s)) return whisper(i, "You're not in this game. Join the next one!");
    if (action === 'v') {
      d.votes[i.user.id] = Number(arg);
      return upd(i, s, this.render(s, Object.keys(d.votes).length === s.players.length));
    }
    if (!isHost(i, s)) return whisper(i, 'Only the host can do that.');
    if (action === 'show') return upd(i, s, this.render(s, true));
    if (action === 'next') {
      for (const id of Object.keys(d.votes)) d.count[id] = (d.count[id] || 0) + 1;
      d.idx += 1;
      d.votes = {};
      if (d.idx >= WYR_ROUNDS) {
        const amounts = {};
        for (const p of s.players) amounts[p.id] = (d.count[p.id] || 0) * 2;
        endSession(s);
        s.hook = i;
        await i.deferUpdate();
        const rewards = await payout(s, ctx, amounts);
        return refresh(s, { embeds: [embed('🤔 Thanks for playing!', `That was fun. Here's a little something for voting:\n\n${rewards}`, GREEN)], components: [playAgain('wyr')] });
      }
      return upd(i, s, this.render(s));
    }
    return i.deferUpdate();
  },
};

// ---------------------------------------------------------------- forbidden word
const ROUND_MS = 60_000;
export const forbidden = {
  id: 'forbidden', name: 'Forbidden Word', emoji: '🤐', min: 2, max: 12,
  desc: "Describe the secret word in voice chat without saying any of the forbidden words. Everyone takes a turn as the describer.",
  begin(s) {
    s.data = { deck: shuffle(FORBIDDEN), order: shuffle(s.players).map((p) => p.id), turn: 0, score: {}, card: null, choosing: false };
    for (const p of s.players) s.data.score[p.id] = 0;
    this.draw(s);
  },
  draw(s) { const d = s.data; d.card = d.deck.pop() || pick(FORBIDDEN); },
  describer(s) { return s.players.find((p) => p.id === s.data.order[s.data.turn]); },
  render(s, note = '') {
    const d = s.data;
    const desc = this.describer(s);
    const board = [...s.players].sort((a, b) => d.score[b.id] - d.score[a.id]).map((p) => `${p.name}: **${d.score[p.id]}**`).join(' · ');
    const e = embed(`🤐 Forbidden Word · describer ${d.turn + 1}/${d.order.length}`, `🎙️ **${desc.name}** is describing! Tap **👀 Card** to see the word.\nEveryone else: shout your guesses in voice chat!\n⏱️ Round ends <t:${Math.floor((d.deadline || Date.now()) / 1000)}:R>\n\n${board}${note ? `\n\n${note}` : ''}`);
    const comps = d.choosing
      ? [row(select(sid(s, 'who'), 'Who guessed it?', s.players.filter((p) => p.id !== desc.id).map((p) => ({ label: p.name.slice(0, 100), value: p.id }))))]
      : [row(
        btn(sid(s, 'card'), 'Card (describer)', ButtonStyle.Primary, { emoji: '👀' }),
        btn(sid(s, 'got'), 'Got it!', ButtonStyle.Success, { emoji: '✅' }),
        btn(sid(s, 'skip'), 'Skip', ButtonStyle.Secondary, { emoji: '⏭️' }),
        btn(sid(s, 'buzz'), 'Buzz! They said it', ButtonStyle.Danger, { emoji: '🚨' }),
      )];
    return { embeds: [e], components: comps };
  },
  started(s, ctx) { this.arm(s, ctx); },
  arm(s, ctx) {
    const d = s.data;
    d.deadline = Date.now() + ROUND_MS;
    later(s, ROUND_MS, () => this.nextDescriber(s, ctx, "⏰ Time's up!"));
  },
  async nextDescriber(s, ctx, note) {
    const d = s.data;
    clearTimers(s);
    d.choosing = false;
    d.turn += 1;
    if (d.turn >= d.order.length) {
      const amounts = {};
      for (const p of s.players) amounts[p.id] = d.score[p.id] * 4;
      endSession(s);
      const board = [...s.players].sort((a, b) => d.score[b.id] - d.score[a.id]).map((p, k) => `${['🥇', '🥈', '🥉'][k] || '▫️'} ${p.name}: **${d.score[p.id]}**`).join('\n');
      const rewards = await payout(s, ctx, amounts);
      return refresh(s, { embeds: [embed('🤐 Game over!', `${note}\n\n${board}\n\n${rewards}`, GOLD)], components: [playAgain('forbidden')] });
    }
    this.draw(s);
    this.arm(s, ctx);
    return refresh(s, this.render(s, `${note} Next up: **${this.describer(s).name}**`));
  },
  async action({ i, s, action, ctx }) {
    const d = s.data;
    if (!inGame(i, s)) return whisper(i, "You're not in this game. Join the next one!");
    const desc = this.describer(s);
    const me = i.user.id === desc.id;
    if (action === 'card') {
      if (!me) return whisper(i, 'Only the describer can see the card! No peeking. 👀');
      return whisper(i, `Your word: **${d.card[0]}**\n🚫 Don't say: ${d.card.slice(1).map((w) => `~~${w}~~`).join(', ')}`);
    }
    if (action === 'got') {
      if (!me) return whisper(i, 'The describer taps this when someone guesses right.');
      d.choosing = true;
      return upd(i, s, this.render(s));
    }
    if (action === 'who') {
      if (!me) return whisper(i, 'Only the describer picks who guessed.');
      d.score[desc.id] += 1;
      d.score[i.values[0]] = (d.score[i.values[0]] || 0) + 1;
      const guesser = s.players.find((p) => p.id === i.values[0]);
      d.choosing = false;
      const word = d.card[0];
      this.draw(s);
      await upd(i, s, this.render(s, `✅ **${guesser.name}** guessed **${word}**! +1 each`));
      if (me) await i.followUp({ content: `Next word: **${d.card[0]}**\n🚫 Don't say: ${d.card.slice(1).map((w) => `~~${w}~~`).join(', ')}`, flags: EPHEMERAL });
      return null;
    }
    if (action === 'skip') {
      if (!me) return whisper(i, 'Only the describer can skip.');
      const word = d.card[0];
      this.draw(s);
      await upd(i, s, this.render(s, `⏭️ Skipped **${word}**.`));
      return i.followUp({ content: `Next word: **${d.card[0]}**\n🚫 Don't say: ${d.card.slice(1).map((w) => `~~${w}~~`).join(', ')}`, flags: EPHEMERAL });
    }
    if (action === 'buzz') {
      if (me) return whisper(i, "You can't buzz yourself!");
      d.score[desc.id] = Math.max(0, d.score[desc.id] - 1);
      const word = d.card[0];
      this.draw(s);
      return upd(i, s, this.render(s, `🚨 ${i.user.username} buzzed! ${desc.name} loses a point. (The word was **${word}**.) New card!`));
    }
    return i.deferUpdate();
  },
};

export const PARTY = [impostor, triviaBattle, hotpotato, wyr, forbidden];

// ---------------------------------------------------------------- lobby
export function lobbyMessage(s, game, note = '') {
  const e = embed(`${game.emoji} ${game.name}: lobby`, `${game.desc}\n\n**Players (${s.players.length}/${game.max}):** ${names(s) || '—'}\nNeed at least **${game.min}**. 🎙️ Best played in a voice channel!${note ? `\n\n${note}` : ''}`)
    .setFooter({ text: `Host: ${s.players[0]?.name ?? '?'}` });
  return { embeds: [e], components: [row(
    btn(sid(s, 'join'), 'Join', ButtonStyle.Success, { emoji: '🙋' }),
    btn(sid(s, 'leave'), 'Leave', ButtonStyle.Secondary),
    btn(sid(s, 'start'), 'Start (host)', ButtonStyle.Primary, { emoji: '▶️', disabled: s.players.length < game.min }),
    btn(sid(s, 'cancel'), 'Cancel (host)', ButtonStyle.Danger),
  )] };
}

export async function handleLobby({ i, s, action, game, ctx }) {
  const player = { id: i.user.id, name: i.user.displayName || i.user.username, username: i.user.username };
  if (action === 'join') {
    if (inGame(i, s)) return whisper(i, "You're already in!");
    if (s.players.length >= game.max) return whisper(i, 'This lobby is full.');
    s.players.push(player);
    return upd(i, s, lobbyMessage(s, game));
  }
  if (action === 'leave') {
    if (!inGame(i, s)) return i.deferUpdate();
    if (isHost(i, s)) return whisper(i, "You're the host! Use Cancel to end the lobby.");
    s.players = s.players.filter((p) => p.id !== i.user.id);
    return upd(i, s, lobbyMessage(s, game));
  }
  if (!isHost(i, s)) return whisper(i, 'Only the host can do that.');
  if (action === 'cancel') {
    endSession(s);
    return i.update({ embeds: [embed(`${game.emoji} ${game.name}`, 'Lobby closed.')], components: [] });
  }
  if (action === 'start') {
    if (s.players.length < game.min) return whisper(i, `Need at least ${game.min} players.`);
    s.data = {};
    s.started = true;
    s.gameName = game.name;
    game.begin(s);
    await upd(i, s, game.render(s));
    if (game.started) game.started(s, ctx);
    if (game.id === 'hotpotato' || game.id === 'forbidden') await refresh(s, game.render(s));
    return null;
  }
  return i.deferUpdate();
}

export { RED };
