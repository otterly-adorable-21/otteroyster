// Pearl Pop: swap-to-match-three puzzle with cascades and combos.
import { hud, randInt } from './kit.js';

const N = 7;
const GEMS = ['🐚', '⭐', '🐠', '🦀', '💎', '🐙'];
const MOVES = 20;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function start(root, onEnd) {
  const h = hud({ moves: `🔁 <b>${MOVES}</b>`, combo: '', score: '💎 <b>0</b>' });
  root.innerHTML = `${h.html}<div class="pop-grid" style="--n:${N}" data-grid></div>
    <p class="hint">Swipe or tap two neighbouring tiles to swap. Line up 3+ to pop. Cascades multiply points!</p>`;
  const set = h.bind(root);
  const grid = root.querySelector('[data-grid]');
  let board = [];
  let moves = MOVES;
  let score = 0;
  let busy = false;
  let sel = null;
  let alive = true;
  let fresh = new Set();
  let clearing = new Set();

  const rnd = () => randInt(0, GEMS.length - 1);
  function init() {
    board = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        let g;
        do { g = rnd(); } while (
          (c >= 2 && board[r][c - 1] === g && board[r][c - 2] === g)
          || (r >= 2 && board[r - 1][c] === g && board[r - 2][c] === g)
        );
        board[r][c] = g;
      }
    }
    if (!hasMoves()) init();
  }

  function findMatches() {
    const out = new Set();
    for (let r = 0; r < N; r++) {
      let run = 1;
      for (let c = 1; c <= N; c++) {
        if (c < N && board[r][c] === board[r][c - 1] && board[r][c] !== null) run++;
        else {
          if (run >= 3) for (let k = c - run; k < c; k++) out.add(`${r},${k}`);
          run = 1;
        }
      }
    }
    for (let c = 0; c < N; c++) {
      let run = 1;
      for (let r = 1; r <= N; r++) {
        if (r < N && board[r][c] === board[r - 1][c] && board[r][c] !== null) run++;
        else {
          if (run >= 3) for (let k = r - run; k < r; k++) out.add(`${k},${c}`);
          run = 1;
        }
      }
    }
    return out;
  }

  function swap(a, b) {
    const t = board[a.r][a.c];
    board[a.r][a.c] = board[b.r][b.c];
    board[b.r][b.c] = t;
  }

  function hasMoves() {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        for (const [dr, dc] of [[0, 1], [1, 0]]) {
          const b = { r: r + dr, c: c + dc };
          if (b.r >= N || b.c >= N) continue;
          swap({ r, c }, b);
          const m = findMatches().size;
          swap({ r, c }, b);
          if (m) return true;
        }
      }
    }
    return false;
  }

  function render() {
    grid.innerHTML = board.map((row, r) => row.map((g, c) => {
      const k = `${r},${c}`;
      const cls = ['gem', `g${g}`];
      if (sel && sel.r === r && sel.c === c) cls.push('sel');
      if (fresh.has(k)) cls.push('fresh');
      if (clearing.has(k)) cls.push('clear');
      return `<button class="${cls.join(' ')}" data-r="${r}" data-c="${c}" aria-label="${GEMS[g] ?? ''}">${GEMS[g] ?? ''}</button>`;
    }).join('')).join('');
  }

  async function trySwap(a, b) {
    if (busy || moves <= 0) return;
    busy = true;
    sel = null;
    swap(a, b);
    if (!findMatches().size) {
      render();
      grid.querySelector(`[data-r="${b.r}"][data-c="${b.c}"]`)?.classList.add('shake');
      grid.querySelector(`[data-r="${a.r}"][data-c="${a.c}"]`)?.classList.add('shake');
      await wait(260);
      swap(a, b);
      render();
      busy = false;
      return;
    }
    moves -= 1;
    set('moves', `🔁 <b>${moves}</b>`);
    let combo = 1;
    for (;;) {
      const m = findMatches();
      if (!m.size || !alive) break;
      score += m.size * 10 * combo;
      set('score', `💎 <b>${score}</b>`);
      set('combo', combo > 1 ? `🔥 Combo x${combo}` : '');
      clearing = m;
      fresh = new Set();
      render();
      await wait(240);
      for (const k of m) { const [r, c] = k.split(',').map(Number); board[r][c] = null; }
      clearing = new Set();
      for (let c = 0; c < N; c++) {
        const col = [];
        for (let r = N - 1; r >= 0; r--) if (board[r][c] !== null) col.push(board[r][c]);
        for (let r = N - 1, i = 0; r >= 0; r--, i++) {
          if (i < col.length) board[r][c] = col[i];
          else { board[r][c] = rnd(); fresh.add(`${r},${c}`); }
        }
      }
      render();
      await wait(260);
      combo += 1;
    }
    fresh = new Set();
    if (!alive) return;
    if (!hasMoves()) {
      set('combo', '🔀 Shuffling…');
      await wait(400);
      init();
    }
    render();
    busy = false;
    if (moves <= 0) setTimeout(finish, 500);
  }

  let down = null;
  function onDown(e) {
    const cell = e.target.closest('.gem');
    if (!cell || busy) return;
    down = { r: +cell.dataset.r, c: +cell.dataset.c, x: e.clientX, y: e.clientY };
  }
  function onUp(e) {
    if (!down || busy) { down = null; return; }
    const dx = e.clientX - down.x;
    const dy = e.clientY - down.y;
    const from = { r: down.r, c: down.c };
    down = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 18) {
      const to = Math.abs(dx) > Math.abs(dy) ? { r: from.r, c: from.c + Math.sign(dx) } : { r: from.r + Math.sign(dy), c: from.c };
      if (to.r >= 0 && to.r < N && to.c >= 0 && to.c < N) trySwap(from, to);
      return;
    }
    // tap-tap selection
    if (sel && Math.abs(sel.r - from.r) + Math.abs(sel.c - from.c) === 1) trySwap(sel, from);
    else { sel = sel && sel.r === from.r && sel.c === from.c ? null : from; render(); }
  }

  grid.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  init();
  render();

  function cleanup() {
    alive = false;
    grid.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
  }
  function finish() {
    if (!alive) return;
    cleanup();
    onEnd({ pearls: Math.round(score / 20), best: score, summary: `You scored <b>${score}</b> points in ${MOVES} moves!` });
  }
  return cleanup;
}
