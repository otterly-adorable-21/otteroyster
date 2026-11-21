// Single-player Discord games: they work in DMs, servers and group chats.
// Every game: start({ s, user, ctx }) -> message payload, action({ i, s, action, arg, ctx }).
import { embed, btn, row, select, textModal, ButtonStyle, GREEN, RED, GOLD, COLOR } from '../ui.js';
import { sid, endSession, later, refresh, clearTimers } from '../sessions.js';
import { TRIVIA, EMOJI, SCRAMBLE_WORDS, HANGMAN_WORDS, FISH } from '../content.js';
import { shuffle, pick, randInt, weighted, notYours, LETTERS } from './_util.js';

const again = (id) => row(btn(`play:${id}`, 'Play again', ButtonStyle.Primary, { emoji: '🔁' }));

// Award pearls, end the session, and describe the reward.
async function wrapUp(s, ctx, user, pearls, reason, board) {
  endSession(s);
  if (board) ctx.recordScore(user, board.game, board.score);
  const got = ctx.award(user, pearls, reason);
  return ctx.rewardNote(got, pearls);
}

// ---------------------------------------------------------------- quizzes
function quiz({ id, name, emoji, bank, rounds, per, board, prompt }) {
  const render = (s, reveal) => {
    const d = s.data;
    const q = d.qs[d.idx];
    const e = embed(`${emoji} ${name} · ${d.idx + 1}/${rounds}`, `${prompt(q)}\n\n${q.opts.map((o, k) => `${LETTERS[k]} ${o}`).join('\n')}`)
      .setFooter({ text: `Score: ${d.correct}` });
    if (reveal) {
      e.setColor(reveal.right ? GREEN : RED);
      e.addFields({ name: reveal.right ? '✅ Correct!' : '❌ Not quite', value: `The answer was **${q.answer}**.` });
    }
    const buttons = q.opts.map((o, k) => {
      let style = ButtonStyle.Secondary;
      if (reveal && o === q.answer) style = ButtonStyle.Success;
      else if (reveal && k === reveal.pick) style = ButtonStyle.Danger;
      return btn(sid(s, 'a', k), null, style, { emoji: LETTERS[k], disabled: !!reveal });
    });
    const rows = [row(...buttons)];
    if (reveal) rows.push(row(btn(sid(s, 'next'), d.idx + 1 >= rounds ? 'See results' : 'Next', ButtonStyle.Primary)));
    return { embeds: [e], components: rows };
  };
  return {
    id, name, emoji, mode: 'solo',
    start({ s }) {
      s.data = {
        idx: 0, correct: 0, answered: false,
        qs: shuffle(bank).slice(0, rounds).map(([clue, answer, ...wrong]) => ({ clue, answer, opts: shuffle([answer, ...wrong]) })),
      };
      return render(s);
    },
    async action({ i, s, action, arg, ctx }) {
      if (notYours(i, s)) return;
      const d = s.data;
      if (action === 'a' && !d.answered) {
        d.answered = true;
        const k = Number(arg);
        const right = d.qs[d.idx].opts[k] === d.qs[d.idx].answer;
        if (right) d.correct += 1;
        return i.update(render(s, { right, pick: k }));
      }
      if (action === 'next' && d.answered) {
        d.idx += 1;
        d.answered = false;
        if (d.idx < rounds) return i.update(render(s));
        const note = await wrapUp(s, ctx, i.user, d.correct * per, `Scored ${d.correct}/${rounds} in ${name} on Discord.`, board && { game: board, score: d.correct });
        const e = embed(`${emoji} ${name} complete!`, `You got **${d.correct}/${rounds}** right.\n${note}`, d.correct >= rounds - 1 ? GOLD : COLOR);
        return i.update({ embeds: [e], components: [again(id)] });
      }
      return i.deferUpdate();
    },
  };
}

export const trivia = quiz({
  id: 'trivia', name: 'Trivia', emoji: '🧠', bank: TRIVIA, rounds: 5, per: 4, board: 'd-trivia',
  prompt: (q) => `**${q.clue}**`,
});
trivia.desc = '5 questions about the ocean, animals and the world.';

export const emoji = quiz({
  id: 'emoji', name: 'Emoji Mystery', emoji: '🔮', bank: EMOJI, rounds: 5, per: 3,
  prompt: (q) => `What does this mean?\n# ${q.clue}`,
});
emoji.desc = 'Decode the emoji clue.';

// ---------------------------------------------------------------- scramble
function scrambleWord(w) {
  let out = w;
  while (out === w) out = shuffle([...w]).join('');
  return out;
}

export const scramble = {
  id: 'scramble', name: 'Word Scramble', emoji: '🔤', mode: 'solo', desc: 'Unscramble 5 ocean words.',
  render(s, note = '') {
    const d = s.data;
    const w = d.words[d.idx];
    const hint = d.hint ? `\nHint: starts with **${w.slice(0, 2)}**` : '';
    const e = embed(`🔤 Word Scramble · ${d.idx + 1}/5`, `## ${[...d.mixed].join(' ')}${hint}${note ? `\n\n${note}` : ''}`).setFooter({ text: `Points: ${d.points}` });
    return {
      embeds: [e],
      components: [row(
        btn(sid(s, 'answer'), 'Answer', ButtonStyle.Primary, { emoji: '✏️' }),
        btn(sid(s, 'hint'), 'Hint', ButtonStyle.Secondary, { emoji: '💡', disabled: d.hint }),
        btn(sid(s, 'skip'), 'Skip', ButtonStyle.Secondary, { emoji: '⏭️' }),
      )],
    };
  },
  start({ s }) {
    const words = shuffle(SCRAMBLE_WORDS).slice(0, 5);
    s.data = { words, idx: 0, points: 0, hint: false, mixed: scrambleWord(words[0]) };
    return this.render(s);
  },
  async next(i, s, ctx, note) {
    const d = s.data;
    d.idx += 1;
    d.hint = false;
    if (d.idx >= 5) {
      const reward = await wrapUp(s, ctx, i.user, d.points, 'Played Word Scramble on Discord.');
      return i.update({ embeds: [embed('🔤 Scramble complete!', `${note}\n\nYou scored **${d.points}** points.\n${reward}`, GOLD)], components: [again('scramble')] });
    }
    d.mixed = scrambleWord(d.words[d.idx]);
    return i.update(this.render(s, note));
  },
  async action({ i, s, action, ctx }) {
    if (notYours(i, s)) return;
    const d = s.data;
    const w = d.words[d.idx];
    if (action === 'answer') return i.showModal(textModal(sid(s, 'guess'), 'Unscramble the word', `Letters: ${d.mixed}`, { max: 20 }));
    if (action === 'hint') { d.hint = true; return i.update(this.render(s)); }
    if (action === 'skip') return this.next(i, s, ctx, `⏭️ Skipped. It was **${w}**.`);
    if (action === 'guess') {
      const guess = i.fields.getTextInputValue('answer').trim().toUpperCase();
      if (guess === w) {
        const pts = d.hint ? 2 : 4;
        d.points += pts;
        return this.next(i, s, ctx, `✅ **${w}** is right! +${pts}`);
      }
      return i.update(this.render(s, `❌ **${guess || '…'}** isn't it. Try again!`));
    }
    return i.deferUpdate();
  },
};

// ---------------------------------------------------------------- hangman
const RAFT = [
  '☀️\n🦦\n🛶\n🌊',
  '☀️\n🦦\n🛶\n🌊🌊',
  '🌤️\n🦦\n🛶💧\n🌊🌊🌊',
  '⛅\n🦦\n🛶💧💧\n🌊🌊🌊🌊',
  '🌥️\n😰\n🛶💧💧💧\n🌊🌊🌊🌊🌊',
  '🌧️\n😱\n💧🛶💧💧💧\n🌊🌊🌊🌊🌊🌊',
  '⛈️\n🫧\n🌊🌊🌊🌊🌊🌊🌊',
];

export const hangman = {
  id: 'hangman', name: 'Raft Rescue', emoji: '🛶', mode: 'solo', desc: 'Hangman: guess the word before the raft sinks!',
  render(s, note = '', over = false) {
    const d = s.data;
    const masked = [...d.word].map((c) => (d.guessed.includes(c) || over ? c : '＿')).join(' ');
    const wrong = d.guessed.filter((c) => !d.word.includes(c));
    const e = embed('🛶 Raft Rescue', `${RAFT[Math.min(6, wrong.length)]}\n\n## ${masked}\n${wrong.length ? `Wrong: ${wrong.join(' ')}` : 'Guess a letter!'}${note ? `\n\n${note}` : ''}`)
      .setFooter({ text: `${6 - wrong.length} splashes left` });
    if (over) return { embeds: [e], components: [] };
    const opt = (c) => ({ label: c, value: c });
    const am = [...'ABCDEFGHIJKLM'].filter((c) => !d.guessed.includes(c)).map(opt);
    const nz = [...'NOPQRSTUVWXYZ'].filter((c) => !d.guessed.includes(c)).map(opt);
    const rows = [];
    if (am.length) rows.push(row(select(sid(s, 'l', 'am'), 'Letters A–M', am)));
    if (nz.length) rows.push(row(select(sid(s, 'l', 'nz'), 'Letters N–Z', nz)));
    rows.push(row(btn(sid(s, 'word'), 'Guess the whole word', ButtonStyle.Primary, { emoji: '💡' })));
    return { embeds: [e], components: rows };
  },
  start({ s }) {
    s.data = { word: pick(HANGMAN_WORDS), guessed: [] };
    return this.render(s);
  },
  async check(i, s, ctx, note) {
    const d = s.data;
    const wrong = d.guessed.filter((c) => !d.word.includes(c)).length + (d.badWords || 0);
    const won = [...d.word].every((c) => d.guessed.includes(c));
    if (won) {
      const reward = await wrapUp(s, ctx, i.user, 8 + (6 - wrong) * 2, 'Won Raft Rescue on Discord.');
      const view = this.render(s, `🎉 You saved the otter! The word was **${d.word}**.\n${reward}`, true);
      view.embeds[0].setColor(GREEN);
      return i.update({ ...view, components: [again('hangman')] });
    }
    if (wrong >= 6) {
      const reward = await wrapUp(s, ctx, i.user, 2, null);
      const view = this.render(s, `💦 Splash! The word was **${d.word}**. (The otter swam to shore, they're fine.)\n${reward}`, true);
      view.embeds[0].setColor(RED);
      return i.update({ ...view, components: [again('hangman')] });
    }
    return i.update(this.render(s, note));
  },
  async action({ i, s, action, ctx }) {
    if (notYours(i, s)) return;
    const d = s.data;
    if (action === 'l') {
      const c = i.values[0];
      if (!d.guessed.includes(c)) d.guessed.push(c);
      return this.check(i, s, ctx, d.word.includes(c) ? `✅ **${c}** is in the word!` : `❌ No **${c}**.`);
    }
    if (action === 'word') return i.showModal(textModal(sid(s, 'guessword'), 'Guess the word', 'Your guess', { max: 20 }));
    if (action === 'guessword') {
      const g = i.fields.getTextInputValue('answer').trim().toUpperCase();
      if (g === d.word) { d.guessed.push(...d.word); return this.check(i, s, ctx); }
      d.badWords = (d.badWords || 0) + 1;
      d.guessed.push(`(${g.slice(0, 12)})`);
      return this.check(i, s, ctx, `❌ It's not **${g}**.`);
    }
    return i.deferUpdate();
  },
};

// ---------------------------------------------------------------- number hunt
export const numberhunt = {
  id: 'numberhunt', name: 'Number Hunt', emoji: '🌡️', mode: 'solo', desc: 'Find the hidden number 1–100 with hot/cold clues.',
  render(s, note = '') {
    const d = s.data;
    const e = embed('🌡️ Number Hunt', `I buried a pearl at a number between **1 and 100**.\nYou have **${7 - d.tries}** tries left.${d.log.length ? `\n\n${d.log.join('\n')}` : ''}${note ? `\n\n${note}` : ''}`);
    return { embeds: [e], components: [row(btn(sid(s, 'guess'), 'Guess', ButtonStyle.Primary, { emoji: '🔢' }))] };
  },
  start({ s }) {
    s.data = { n: randInt(1, 100), tries: 0, log: [] };
    return this.render(s);
  },
  async action({ i, s, action, ctx }) {
    if (notYours(i, s)) return;
    const d = s.data;
    if (action === 'guess') return i.showModal(textModal(sid(s, 'num'), 'Number Hunt', 'A number from 1 to 100', { max: 3 }));
    if (action === 'num') {
      const g = parseInt(i.fields.getTextInputValue('answer'), 10);
      if (!Number.isInteger(g) || g < 1 || g > 100) return i.update(this.render(s, 'Please enter a whole number from 1 to 100.'));
      d.tries += 1;
      if (g === d.n) {
        const reward = await wrapUp(s, ctx, i.user, 5 + (8 - d.tries) * 2, 'Won Number Hunt on Discord.');
        return i.update({ embeds: [embed('🌡️ Found it!', `It was **${d.n}**! You found it in **${d.tries}** ${d.tries === 1 ? 'try' : 'tries'}.\n${reward}`, GREEN)], components: [again('numberhunt')] });
      }
      const diff = Math.abs(g - d.n);
      const heat = diff <= 3 ? '🔥 Super hot' : diff <= 10 ? '♨️ Warm' : diff <= 25 ? '🌤️ Cool' : '🧊 Freezing';
      d.log.push(`\`${String(g).padStart(3)}\` ${heat} · go ${g < d.n ? '⬆️ higher' : '⬇️ lower'}`);
      if (d.tries >= 7) {
        const reward = await wrapUp(s, ctx, i.user, 1, null);
        return i.update({ embeds: [embed('🌡️ Out of tries', `${d.log.join('\n')}\n\nThe pearl was at **${d.n}**.\n${reward}`, RED)], components: [again('numberhunt')] });
      }
      return i.update(this.render(s));
    }
    return i.deferUpdate();
  },
};

// ---------------------------------------------------------------- higher / lower
const SUITS = ['🐚', '⭐', '🐟', '🦀'];
const cardName = (n) => ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }[n] || String(n));
const card = () => ({ n: randInt(1, 13), suit: pick(SUITS) });
const showCard = (c) => `\`${cardName(c.n).padStart(2)}\` ${c.suit}`;

export const higherlower = {
  id: 'higherlower', name: 'Higher or Lower', emoji: '🃏', mode: 'solo', desc: 'Guess if the next card is higher or lower. Cash out any time!',
  render(s, note = '') {
    const d = s.data;
    const e = embed('🃏 Higher or Lower', `Current card: # ${showCard(d.cur)}\nStreak: **${d.streak}** · Cash out now for **${d.streak * 3}** pearls${note ? `\n\n${note}` : ''}`);
    return {
      embeds: [e],
      components: [row(
        btn(sid(s, 'hi'), 'Higher', ButtonStyle.Primary, { emoji: '⬆️' }),
        btn(sid(s, 'lo'), 'Lower', ButtonStyle.Primary, { emoji: '⬇️' }),
        btn(sid(s, 'cash'), 'Cash out', ButtonStyle.Success, { emoji: '💰', disabled: d.streak === 0 }),
      )],
    };
  },
  start({ s }) {
    s.data = { cur: card(), streak: 0 };
    return this.render(s);
  },
  async action({ i, s, action, ctx }) {
    if (notYours(i, s)) return;
    const d = s.data;
    if (action === 'cash') {
      const reward = await wrapUp(s, ctx, i.user, d.streak * 3, `Cashed out a ${d.streak} streak in Higher or Lower.`, { game: 'd-higherlower', score: d.streak });
      return i.update({ embeds: [embed('💰 Cashed out!', `You walked away with a streak of **${d.streak}**.\n${reward}`, GOLD)], components: [again('higherlower')] });
    }
    if (action === 'hi' || action === 'lo') {
      const next = card();
      const prev = d.cur;
      d.cur = next;
      if (next.n === prev.n) return i.update(this.render(s, `${showCard(next)} Same number! That's a free pass.`));
      const right = action === 'hi' ? next.n > prev.n : next.n < prev.n;
      if (right) { d.streak += 1; return i.update(this.render(s, `✅ ${showCard(next)} Nice!`)); }
      const reward = await wrapUp(s, ctx, i.user, d.streak, d.streak ? `Higher or Lower streak of ${d.streak}.` : null, { game: 'd-higherlower', score: d.streak });
      return i.update({ embeds: [embed('🃏 Oh no!', `The card was ${showCard(next)}. Your streak ended at **${d.streak}**.\n${reward}`, RED)], components: [again('higherlower')] });
    }
    return i.deferUpdate();
  },
};

// ---------------------------------------------------------------- rock paper scissors (vs bot)
const RPS = { rock: '🪨', paper: '📄', scissors: '✂️' };
const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
export const rpsWinner = (a, b) => (a === b ? 0 : BEATS[a] === b ? 1 : 2);

export const rps = {
  id: 'rps', name: 'Rock Paper Scissors', emoji: '✂️', mode: 'solo', desc: 'Best of 3 against Otto the otter.',
  render(s, note = '') {
    const d = s.data;
    const e = embed('✂️ Rock Paper Scissors', `First to **2** wins!\nYou **${d.me}** · **${d.bot}** Otto 🦦${note ? `\n\n${note}` : ''}`);
    return { embeds: [e], components: [row(...Object.entries(RPS).map(([k, em]) => btn(sid(s, 'p', k), k[0].toUpperCase() + k.slice(1), ButtonStyle.Primary, { emoji: em })))] };
  },
  start({ s }) { s.data = { me: 0, bot: 0 }; return this.render(s); },
  async action({ i, s, action, arg, ctx }) {
    if (notYours(i, s)) return;
    if (action !== 'p' || !RPS[arg]) return i.deferUpdate();
    const d = s.data;
    const bot = pick(Object.keys(RPS));
    const w = rpsWinner(arg, bot);
    if (w === 1) d.me += 1;
    if (w === 2) d.bot += 1;
    const line = `${RPS[arg]} vs ${RPS[bot]} · ${w === 0 ? 'Tie!' : w === 1 ? 'You win the round!' : 'Otto wins the round!'}`;
    if (d.me >= 2 || d.bot >= 2) {
      const won = d.me >= 2;
      const reward = await wrapUp(s, ctx, i.user, won ? 6 : 2, won ? 'Beat Otto at Rock Paper Scissors.' : null);
      return i.update({ embeds: [embed(won ? '🏆 You win!' : '🦦 Otto wins!', `${line}\nFinal: **${d.me} – ${d.bot}**\n${reward}`, won ? GREEN : RED)], components: [again('rps')] });
    }
    return i.update(this.render(s, line));
  },
};

// ---------------------------------------------------------------- minesweeper
const ROWS = 4;
const COLS = 5;
const MINES = 4;
const NUM = ['▫️', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

function neighbours(r, c) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if ((dr || dc) && r + dr >= 0 && r + dr < ROWS && c + dc >= 0 && c + dc < COLS) out.push([r + dr, c + dc]);
  }
  return out;
}

export const minesweeper = {
  id: 'minesweeper', name: 'Urchin Sweeper', emoji: '💣', mode: 'solo', desc: `Minesweeper: uncover the sand without touching the ${MINES} sea urchins.`,
  render(s, note = '', over = false) {
    const d = s.data;
    const rows = [];
    for (let r = 0; r < ROWS; r++) {
      rows.push(row(...Array.from({ length: COLS }, (_, c) => {
        const k = r * COLS + c;
        const open = d.open[k] || over;
        let emoji = '🟦';
        let style = ButtonStyle.Secondary;
        if (d.flag[k] && !open) { emoji = '🚩'; style = ButtonStyle.Primary; }
        if (open) {
          if (d.mines?.[k]) { emoji = d.boom === k ? '💥' : '🟣'; style = ButtonStyle.Danger; }
          else emoji = NUM[d.count[k]];
        }
        return btn(sid(s, 'c', k), null, style, { emoji, disabled: open || over });
      })));
    }
    rows.push(row(
      btn(sid(s, 'mode'), d.flagMode ? 'Flag mode: ON' : 'Flag mode: off', d.flagMode ? ButtonStyle.Success : ButtonStyle.Secondary, { emoji: '🚩', disabled: over }),
    ));
    const e = embed('💣 Urchin Sweeper', `Uncover every safe tile. Numbers count nearby urchins 🟣.\nTurn on **flag mode** to mark suspicious tiles.${note ? `\n\n${note}` : ''}`);
    return { embeds: [e], components: rows };
  },
  start({ s }) {
    s.data = { open: {}, flag: {}, count: {}, mines: null, flagMode: false };
    return this.render(s);
  },
  place(d, safe) {
    d.mines = {};
    const cells = shuffle([...Array(ROWS * COLS).keys()].filter((k) => k !== safe && !neighbours(Math.floor(safe / COLS), safe % COLS).some(([r, c]) => r * COLS + c === k)));
    for (const k of cells.slice(0, MINES)) d.mines[k] = true;
    for (let k = 0; k < ROWS * COLS; k++) d.count[k] = neighbours(Math.floor(k / COLS), k % COLS).filter(([r, c]) => d.mines[r * COLS + c]).length;
  },
  reveal(d, k) {
    const stack = [k];
    while (stack.length) {
      const x = stack.pop();
      if (d.open[x]) continue;
      d.open[x] = true;
      delete d.flag[x];
      if (d.count[x] === 0) for (const [r, c] of neighbours(Math.floor(x / COLS), x % COLS)) if (!d.open[r * COLS + c]) stack.push(r * COLS + c);
    }
  },
  async action({ i, s, action, arg, ctx }) {
    if (notYours(i, s)) return;
    const d = s.data;
    if (action === 'mode') { d.flagMode = !d.flagMode; return i.update(this.render(s)); }
    if (action !== 'c') return i.deferUpdate();
    const k = Number(arg);
    if (d.flagMode) { d.flag[k] = !d.flag[k]; return i.update(this.render(s)); }
    if (d.flag[k]) return i.update(this.render(s, 'That tile is flagged. Turn off flag mode to dig it up.'));
    if (!d.mines) this.place(d, k);
    if (d.mines[k]) {
      d.boom = k;
      const reward = await wrapUp(s, ctx, i.user, 1, null);
      const v = this.render(s, `💥 Ouch, an urchin! Better luck next time.\n${reward}`, true);
      v.embeds[0].setColor(RED);
      v.components.push(again('minesweeper'));
      return i.update(v);
    }
    this.reveal(d, k);
    const safeLeft = ROWS * COLS - MINES - Object.keys(d.open).length;
    if (safeLeft <= 0) {
      const reward = await wrapUp(s, ctx, i.user, 15, 'Cleared Urchin Sweeper on Discord.');
      const v = this.render(s, `🎉 You cleared the beach!\n${reward}`, true);
      v.embeds[0].setColor(GREEN);
      v.components.push(again('minesweeper'));
      return i.update(v);
    }
    return i.update(this.render(s));
  },
};

// ---------------------------------------------------------------- fishing (timing)
const CASTS = 3;
export const fishing = {
  id: 'fishing', name: 'Fishing', emoji: '🎣', mode: 'solo', desc: 'Cast your line and reel in fast when something bites.',
  render(s, note = '') {
    const d = s.data;
    const scene = d.phase === 'waiting' ? '🌊🌊🌊🔴🌊🌊🌊\n*waiting for a bite…*'
      : d.phase === 'bite' ? '🌊🌊💦❗💦🌊🌊\n**SOMETHING BIT! REEL IT IN!**'
        : '🌊🌊🌊🌊🌊🌊🌊';
    const e = embed(`🎣 Fishing · cast ${Math.min(d.cast, CASTS)}/${CASTS}`, `${scene}${d.bag.length ? `\n\nBucket: ${d.bag.join(' ')}` : ''}${note ? `\n\n${note}` : ''}`)
      .setFooter({ text: `Points: ${d.score}` });
    const reel = d.phase === 'idle'
      ? btn(sid(s, 'cast'), 'Cast', ButtonStyle.Primary, { emoji: '🎣' })
      : btn(sid(s, 'reel'), 'Reel!', d.phase === 'bite' ? ButtonStyle.Success : ButtonStyle.Secondary, { emoji: '🌀' });
    return { embeds: [e], components: [row(reel)] };
  },
  start({ s }) {
    s.data = { cast: 1, phase: 'idle', score: 0, bag: [], biteAt: 0 };
    return this.render(s);
  },
  async endCast(i, s, ctx, note) {
    const d = s.data;
    clearTimers(s);
    d.phase = 'idle';
    if (d.cast >= CASTS) {
      const reward = await wrapUp(s, ctx, i?.user ?? s.user, d.score, `Caught ${d.score} points of fish on Discord.`, { game: 'd-fishing', score: d.score });
      const payload = { embeds: [embed('🎣 Gone fishing!', `${note}\n\nBucket: ${d.bag.join(' ') || 'empty'}\nTotal: **${d.score}** points.\n${reward}`, GOLD)], components: [again('fishing')] };
      return i ? i.update(payload) : refresh(s, payload);
    }
    d.cast += 1;
    return i ? i.update(this.render(s, note)) : refresh(s, this.render(s, note));
  },
  async action({ i, s, action, ctx }) {
    if (notYours(i, s)) return;
    const d = s.data;
    s.user = i.user;
    if (action === 'cast' && d.phase === 'idle') {
      d.phase = 'waiting';
      later(s, randInt(2000, 6000), async () => {
        d.phase = 'bite';
        d.biteAt = Date.now();
        await refresh(s, this.render(s));
        later(s, 3000, async () => {
          if (d.phase !== 'bite') return;
          d.bag.push('💨');
          await this.endCast(null, s, ctx, '💨 Too slow, it got away!');
        });
      });
      return i.update(this.render(s));
    }
    if (action === 'reel') {
      if (d.phase === 'waiting') { d.bag.push('💨'); return this.endCast(i, s, ctx, '😅 Too early! You scared the fish away.'); }
      if (d.phase === 'bite') {
        const fast = Date.now() - d.biteAt < 1200;
        const f = weighted(FISH);
        const pts = Math.round(f.pts * (fast ? 1.5 : 1));
        d.score += pts;
        d.bag.push(f.icon);
        return this.endCast(i, s, ctx, `${fast ? '⚡ Lightning reflexes! ' : ''}You caught a **${f.name}** ${f.icon} (+${pts})`);
      }
    }
    return i.deferUpdate();
  },
};

export const SOLO = [trivia, emoji, scramble, hangman, numberhunt, higherlower, rps, minesweeper, fishing];
