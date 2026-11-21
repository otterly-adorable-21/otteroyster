// Word Tide: ocean word search. Drag across letters in a straight line.
import { hud, shuffle, randInt, pick } from './kit.js';

const N = 10;
const BANK = [
  'OTTER', 'OYSTER', 'PEARL', 'CORAL', 'KELP', 'WAVE', 'SHELL', 'CRAB', 'TIDE', 'REEF',
  'SQUID', 'WHALE', 'SEAL', 'CLAM', 'SAND', 'SHORE', 'SHARK', 'SKATE', 'SPONGE', 'ANCHOR',
  'BUBBLE', 'FLIPPER', 'LAGOON', 'OCTOPUS', 'ISLAND', 'BOAT', 'SAIL', 'DRIFT', 'SNAIL', 'URCHIN',
];
const DIRS = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
const WORDS = 8;

function build() {
  for (let attempt = 0; attempt < 50; attempt++) {
    const g = Array.from({ length: N }, () => Array(N).fill(''));
    const chosen = shuffle([...BANK]).filter((w) => w.length <= N);
    const placed = [];
    for (const w of chosen) {
      if (placed.length >= WORDS) break;
      let ok = false;
      for (let tries = 0; tries < 80 && !ok; tries++) {
        const [dr, dc] = placed.length < 3 ? pick(DIRS.slice(0, 3)) : pick(DIRS);
        const r0 = randInt(0, N - 1);
        const c0 = randInt(0, N - 1);
        const r1 = r0 + dr * (w.length - 1);
        const c1 = c0 + dc * (w.length - 1);
        if (r1 < 0 || r1 >= N || c1 < 0 || c1 >= N) continue;
        let fits = true;
        for (let i = 0; i < w.length; i++) {
          const ch = g[r0 + dr * i][c0 + dc * i];
          if (ch && ch !== w[i]) { fits = false; break; }
        }
        if (!fits) continue;
        for (let i = 0; i < w.length; i++) g[r0 + dr * i][c0 + dc * i] = w[i];
        placed.push({ w, cells: Array.from({ length: w.length }, (_, i) => `${r0 + dr * i},${c0 + dc * i}`) });
        ok = true;
      }
    }
    if (placed.length < WORDS) continue;
    const letters = 'ABCDEFGHIKLMNOPRSTUWY';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!g[r][c]) g[r][c] = pick([...letters]);
    return { g, placed };
  }
  throw new Error('could not build word grid');
}

export function start(root, onEnd) {
  const { g, placed } = build();
  const h = hud({ found: `🔤 <b>0</b>/${WORDS}`, time: '⏱ <b>0</b>s' });
  root.innerHTML = `${h.html}
    <div class="word-grid" style="--n:${N}" data-grid>${g.map((row, r) => row.map((ch, c) => `<span class="letter" data-r="${r}" data-c="${c}">${ch}</span>`).join('')).join('')}</div>
    <div class="word-list">${placed.map((p) => `<span data-word="${p.w}">${p.w}</span>`).join('')}</div>
    <p class="hint">Words go across, down, diagonally and even backwards.</p>`;
  const set = h.bind(root);
  const grid = root.querySelector('[data-grid]');
  const cell = (r, c) => grid.querySelector(`[data-r="${r}"][data-c="${c}"]`);
  let start0 = null;
  let current = [];
  let found = 0;
  let secs = 0;
  let alive = true;

  const clock = setInterval(() => { secs += 1; set('time', `⏱ <b>${secs}</b>s`); }, 1000);

  function lineTo(r, c) {
    const dr = r - start0.r;
    const dc = c - start0.c;
    const len = Math.max(Math.abs(dr), Math.abs(dc));
    if (len === 0) return [`${start0.r},${start0.c}`];
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return current; // not a straight line
    const sr = Math.sign(dr);
    const sc = Math.sign(dc);
    return Array.from({ length: len + 1 }, (_, i) => `${start0.r + sr * i},${start0.c + sc * i}`);
  }

  function paint() {
    grid.querySelectorAll('.letter.sel').forEach((el) => el.classList.remove('sel'));
    for (const k of current) { const [r, c] = k.split(','); cell(r, c)?.classList.add('sel'); }
  }

  function fromPoint(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    return el && el.classList.contains('letter') && grid.contains(el) ? { r: +el.dataset.r, c: +el.dataset.c } : null;
  }

  function onDown(e) {
    const p = fromPoint(e);
    if (!p) return;
    e.preventDefault();
    start0 = p;
    current = lineTo(p.r, p.c);
    paint();
  }
  function onMove(e) {
    if (!start0) return;
    const p = fromPoint(e);
    if (!p) return;
    current = lineTo(p.r, p.c);
    paint();
  }
  function onUp() {
    if (!start0) return;
    const word = current.map((k) => { const [r, c] = k.split(','); return g[r][c]; }).join('');
    const key = current.join('|');
    const rev = [...current].reverse().join('|');
    const hit = placed.find((p) => !p.done && (p.cells.join('|') === key || p.cells.join('|') === rev));
    if (hit && word.length > 1) {
      hit.done = true;
      found += 1;
      for (const k of hit.cells) { const [r, c] = k.split(','); cell(r, c).classList.add('found', `f${found % 6}`); }
      root.querySelector(`[data-word="${hit.w}"]`).classList.add('done');
      set('found', `🔤 <b>${found}</b>/${WORDS}`);
      if (found === WORDS) setTimeout(finish, 500);
    }
    start0 = null;
    current = [];
    paint();
  }

  grid.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);

  function cleanup() {
    alive = false;
    clearInterval(clock);
    grid.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  }
  function finish() {
    if (!alive) return;
    cleanup();
    onEnd({ pearls: Math.max(15, 60 - Math.floor(secs / 5)), best: secs, summary: `You found all ${WORDS} words in <b>${secs}</b> seconds!` });
  }
  return cleanup;
}
