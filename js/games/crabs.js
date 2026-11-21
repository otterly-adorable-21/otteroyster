// Crab Catcher: whack-a-mole on the beach.
import { hud, rand, randInt } from './kit.js';

const TIME = 30;
const HOLES = 9;

export function start(root, onEnd) {
  const h = hud({ score: '🦀 <b>0</b>', miss: '', time: `⏱ <b>${TIME}</b>` });
  root.innerHTML = `${h.html}<div class="beach-grid">${Array.from({ length: HOLES }, (_, i) => `
    <button class="hole" data-hole="${i}" aria-label="Sand hole"><span class="critter"></span></button>`).join('')}</div>
    <p class="hint">Tap the crabs 🦀 (golden 🦞 = 3). Leave the pufferfish 🐡 alone!</p>`;
  const set = h.bind(root);
  const holes = [...root.querySelectorAll('.hole')];
  let score = 0;
  let caught = 0;
  let time = TIME;
  let done = false;
  const timers = new Set();

  function later(fn, ms) {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
  }

  function popUp() {
    if (done) return;
    const free = holes.filter((hEl) => !hEl.dataset.kind);
    if (free.length) {
      const hole = free[randInt(0, free.length - 1)];
      const r = Math.random();
      const kind = r < 0.1 ? 'lobster' : r < 0.28 ? 'puffer' : 'crab';
      hole.dataset.kind = kind;
      hole.querySelector('.critter').textContent = kind === 'crab' ? '🦀' : kind === 'lobster' ? '🦞' : '🐡';
      hole.classList.add('up');
      const elapsed = TIME - time;
      const stay = Math.max(520, rand(1100, 1500) - elapsed * 22);
      const token = Math.random();
      hole.dataset.token = token;
      later(() => { if (hole.dataset.token === String(token)) hide(hole); }, stay);
    }
    later(popUp, Math.max(260, rand(520, 820) - (TIME - time) * 14));
  }

  function hide(hole) {
    hole.classList.remove('up', 'hit', 'oops');
    delete hole.dataset.kind;
    delete hole.dataset.token;
  }

  function onHit(e) {
    const hole = e.target.closest('.hole');
    if (!hole || done || !hole.dataset.kind || hole.classList.contains('hit') || hole.classList.contains('oops')) return;
    const kind = hole.dataset.kind;
    if (kind === 'puffer') {
      score = Math.max(0, score - 2);
      hole.classList.add('oops');
      set('miss', '<span class="bad">-2 🐡</span>');
    } else {
      score += kind === 'lobster' ? 3 : 1;
      caught += 1;
      hole.classList.add('hit');
      set('miss', '');
    }
    set('score', `🦀 <b>${score}</b>`);
    hole.dataset.token = '';
    later(() => hide(hole), 250);
  }

  root.addEventListener('pointerdown', onHit);
  popUp();
  const clock = setInterval(() => {
    time -= 1;
    set('time', `⏱ <b>${Math.max(0, time)}</b>`);
    if (time <= 0) finish();
  }, 1000);

  function cleanup() {
    done = true;
    clearInterval(clock);
    timers.forEach(clearTimeout);
    root.removeEventListener('pointerdown', onHit);
  }

  function finish() {
    cleanup();
    onEnd({ pearls: score, best: score, summary: `You caught <b>${caught}</b> critters for <b>${score}</b> points!` });
  }

  return cleanup;
}
