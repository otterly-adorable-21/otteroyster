// Two-player challenges: /challenge @friend game
import { embed, btn, row, ButtonStyle, GREEN, GOLD, COLOR } from '../ui.js';
import { sid, endSession } from '../sessions.js';
import { mention, whisper, EPHEMERAL } from './_util.js';
import { rpsWinner } from './solo.js';

const upd = (i, s, payload) => { s.hook = i; return i.update(payload); };

async function settle(s, ctx, winnerId) {
  endSession(s);
  const [a, b] = s.players;
  const lines = [];
  for (const p of [a, b]) {
    const won = winnerId === p.id;
    const draw = !winnerId;
    const got = ctx.award(p, won ? 12 : draw ? 5 : 3, won ? `Won a ${s.game} challenge on Discord.` : `Played a ${s.game} challenge on Discord.`);
    if (won) ctx.addWin(p);
    lines.push(`${mention(p.id)}: ${got ? `+${got} ⚪` : '*(no otter yet, use /pet to adopt one)*'}`);
  }
  ctx.addChallengePoints?.(a, b);
  return lines.join('\n');
}

const rematch = (game, opponentId) => row(btn(`rematch:${game}:${opponentId}`, 'Rematch', ButtonStyle.Primary, { emoji: '🔁' }));

// ---------------------------------------------------------------- connect four
const R = 6;
const C = 7;
const DISC = ['⚪', '🔴', '🟡'];

function c4Winner(b) {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const v = b[r][c];
    if (!v) continue;
    for (const [dr, dc] of dirs) {
      let k = 1;
      while (k < 4 && b[r + dr * k]?.[c + dc * k] === v) k++;
      if (k === 4) return v;
    }
  }
  return 0;
}

export const connect4 = {
  id: 'connect4', name: 'Connect Four', emoji: '🔴', mode: 'duel', desc: 'Drop discs and get four in a row.',
  render(s, note = '', over = false) {
    const d = s.data;
    const grid = d.board.map((r) => r.map((v) => DISC[v]).join('')).join('\n');
    const turn = s.players[d.turn];
    const e = embed('🔴 Connect Four 🟡', `${mention(s.players[0].id)} 🔴 vs 🟡 ${mention(s.players[1].id)}\n\n${grid}\n1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣\n\n${note || `${DISC[d.turn + 1]} **${turn.name}**'s turn`}`);
    if (over) return { embeds: [e], components: [] };
    const full = (c) => d.board[0][c] !== 0;
    const b = (c) => btn(sid(s, 'drop', c), String(c + 1), ButtonStyle.Secondary, { disabled: full(c) });
    return { embeds: [e], components: [row(b(0), b(1), b(2), b(3)), row(b(4), b(5), b(6))] };
  },
  setup(s) { s.data = { board: Array.from({ length: R }, () => Array(C).fill(0)), turn: 0 }; },
  async action({ i, s, action, arg, ctx }) {
    const d = s.data;
    if (action !== 'drop') return i.deferUpdate();
    if (i.user.id !== s.players[d.turn].id) return whisper(i, s.players.some((p) => p.id === i.user.id) ? "It's not your turn yet!" : 'This match is between two other players.');
    const c = Number(arg);
    let r = R - 1;
    while (r >= 0 && d.board[r][c]) r--;
    if (r < 0) return i.deferUpdate();
    d.board[r][c] = d.turn + 1;
    const w = c4Winner(d.board);
    if (w) {
      const winner = s.players[w - 1];
      const rewards = await settle(s, ctx, winner.id);
      const v = this.render(s, `🏆 **${winner.name}** wins!\n${rewards}`, true);
      v.embeds[0].setColor(GOLD);
      v.components = [rematch('connect4', s.players[w === 1 ? 1 : 0].id)];
      return upd(i, s, v);
    }
    if (d.board[0].every((v) => v)) {
      const rewards = await settle(s, ctx, null);
      return upd(i, s, { ...this.render(s, `🤝 It's a draw!\n${rewards}`, true), components: [rematch('connect4', s.players[1].id)] });
    }
    d.turn = 1 - d.turn;
    return upd(i, s, this.render(s));
  },
};

// ---------------------------------------------------------------- tic-tac-toe
const MARK = ['🦦', '🦪'];
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

export const tictactoe = {
  id: 'tictactoe', name: 'Tic-Tac-Toe', emoji: '❌', mode: 'duel', desc: 'Otters vs oysters, three in a row.',
  render(s, note = '', over = false) {
    const d = s.data;
    const e = embed('🦦 Tic-Tac-Toe 🦪', `${mention(s.players[0].id)} ${MARK[0]} vs ${MARK[1]} ${mention(s.players[1].id)}\n\n${note || `${MARK[d.turn]} **${s.players[d.turn].name}**'s turn`}`);
    const rows = [0, 1, 2].map((r) => row(...[0, 1, 2].map((c) => {
      const k = r * 3 + c;
      const v = d.cells[k];
      const win = d.win?.includes(k);
      return btn(sid(s, 'm', k), v === null ? '​' : null, win ? ButtonStyle.Success : ButtonStyle.Secondary, { emoji: v === null ? undefined : MARK[v], disabled: over || v !== null });
    })));
    return { embeds: [e], components: rows };
  },
  setup(s) { s.data = { cells: Array(9).fill(null), turn: 0 }; },
  async action({ i, s, action, arg, ctx }) {
    const d = s.data;
    if (action !== 'm') return i.deferUpdate();
    if (i.user.id !== s.players[d.turn].id) return whisper(i, s.players.some((p) => p.id === i.user.id) ? "It's not your turn yet!" : 'This match is between two other players.');
    const k = Number(arg);
    if (d.cells[k] !== null) return i.deferUpdate();
    d.cells[k] = d.turn;
    d.win = LINES.find((l) => l.every((x) => d.cells[x] === d.turn));
    if (d.win) {
      const winner = s.players[d.turn];
      const rewards = await settle(s, ctx, winner.id);
      const v = this.render(s, `🏆 **${winner.name}** wins!\n${rewards}`, true);
      v.embeds[0].setColor(GOLD);
      v.components.push(rematch('tictactoe', s.players[1 - d.turn].id));
      return upd(i, s, v);
    }
    if (d.cells.every((v) => v !== null)) {
      const rewards = await settle(s, ctx, null);
      const v = this.render(s, `🤝 Draw!\n${rewards}`, true);
      v.components.push(rematch('tictactoe', s.players[1].id));
      return upd(i, s, v);
    }
    d.turn = 1 - d.turn;
    return upd(i, s, this.render(s));
  },
};

// ---------------------------------------------------------------- rock paper scissors (vs friend)
const RPS = { rock: '🪨', paper: '📄', scissors: '✂️' };

export const rpsDuel = {
  id: 'rps', name: 'Rock Paper Scissors', emoji: '✂️', mode: 'duel', desc: 'Best of 3. Picks stay secret until both are in.',
  render(s, note = '') {
    const d = s.data;
    const [a, b] = s.players;
    const status = (p) => (d.picks[p.id] ? '✅ picked' : '🤔 choosing…');
    const e = embed('✂️ Rock Paper Scissors', `First to **2**!\n${mention(a.id)} **${d.score[0]}** – **${d.score[1]}** ${mention(b.id)}\n\n${a.name}: ${status(a)}\n${b.name}: ${status(b)}${note ? `\n\n${note}` : ''}`);
    return { embeds: [e], components: [row(...Object.entries(RPS).map(([k, em]) => btn(sid(s, 'p', k), k[0].toUpperCase() + k.slice(1), ButtonStyle.Primary, { emoji: em })))] };
  },
  setup(s) { s.data = { picks: {}, score: [0, 0] }; },
  async action({ i, s, action, arg, ctx }) {
    const d = s.data;
    if (action !== 'p' || !RPS[arg]) return i.deferUpdate();
    const idx = s.players.findIndex((p) => p.id === i.user.id);
    if (idx < 0) return whisper(i, 'This match is between two other players.');
    d.picks[i.user.id] = arg;
    const [a, b] = s.players;
    if (!d.picks[a.id] || !d.picks[b.id]) {
      await upd(i, s, this.render(s));
      return i.followUp({ content: `You picked ${RPS[arg]} **${arg}**. Shh! 🤫`, flags: EPHEMERAL });
    }
    const pa = d.picks[a.id];
    const pb = d.picks[b.id];
    const w = rpsWinner(pa, pb);
    if (w) d.score[w - 1] += 1;
    d.picks = {};
    const line = `${a.name} ${RPS[pa]} vs ${RPS[pb]} ${b.name} · ${w === 0 ? 'Tie!' : `**${(w === 1 ? a : b).name}** takes the round!`}`;
    if (d.score[0] >= 2 || d.score[1] >= 2) {
      const winner = d.score[0] >= 2 ? a : b;
      const rewards = await settle(s, ctx, winner.id);
      return upd(i, s, { embeds: [embed('🏆 Match over!', `${line}\n\n**${winner.name}** wins ${d.score[0]}–${d.score[1]}!\n${rewards}`, GOLD)], components: [rematch('rps', winner.id === a.id ? b.id : a.id)] });
    }
    return upd(i, s, this.render(s, line));
  },
};

export const DUELS = [connect4, tictactoe, rpsDuel];

// ---------------------------------------------------------------- invitation flow
export function inviteMessage(s, game) {
  const [a, b] = s.players;
  return {
    content: mention(b.id),
    embeds: [embed(`${game.emoji} ${game.name} challenge!`, `${mention(a.id)} challenges ${mention(b.id)} to **${game.name}**.\n${game.desc}`, COLOR)],
    components: [row(
      btn(sid(s, 'accept'), 'Accept', ButtonStyle.Success, { emoji: '✅' }),
      btn(sid(s, 'decline'), 'Decline', ButtonStyle.Danger),
    )],
    allowedMentions: { users: [b.id] },
  };
}

export async function handleInvite({ i, s, action, game }) {
  const opponent = s.players[1];
  if (action === 'accept' || action === 'decline') {
    if (i.user.id !== opponent.id) {
      if (action === 'decline' && i.user.id === s.players[0].id) {
        endSession(s);
        return i.update({ content: '', embeds: [embed('Challenge cancelled', `${s.players[0].name} withdrew the challenge.`)], components: [] });
      }
      return whisper(i, 'Only the challenged player can answer this.');
    }
    if (action === 'decline') {
      endSession(s);
      return i.update({ content: '', embeds: [embed('Challenge declined', `${opponent.name} said no thanks this time. 🦦`)], components: [] });
    }
    game.setup(s);
    s.data.started = true;
    return upd(i, s, { content: '', ...game.render(s) });
  }
  return null;
}

export { GREEN };
