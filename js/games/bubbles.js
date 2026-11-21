// Bubble Burst: pop rising bubbles for 30 seconds.
import { hud, rand } from './kit.js';

const TIME = 30;

export function start(root, onEnd) {
  const h = hud({ score: '🔵 <b>0</b>', combo: '', time: `⏱ <b>${TIME}</b>` });
  root.innerHTML = `${h.html}<div class="bubble-field" data-field></div>
    <p class="hint">Tap bubbles to pop them. Golden = 3 points. Don't pop the spiky purple ones!</p>`;
  const set = h.bind(root);
  const field = root.querySelector('[data-field]');
  let score = 0;
  let pops = 0;
  let combo = 0;
  let lastPop = 0;
  let time = TIME;
  let spawnTimer = 0;
  let clock = 0;
  let done = false;

  function spawn() {
    if (done) return;
    const elapsed = TIME - time;
    const r = Math.random();
    const kind = r < 0.1 ? 'gold' : r < 0.1 + Math.min(0.2, 0.06 + elapsed * 0.005) ? 'urchin' : 'plain';
    const size = kind === 'gold' ? rand(38, 46) : rand(40, 70);
    const b = document.createElement('button');
    b.className = `bubble ${kind}`;
    b.setAttribute('aria-label', kind === 'urchin' ? 'Urchin' : 'Bubble');
    b.style.width = b.style.height = `${size}px`;
    b.style.left = `${rand(0, 100 - (size / field.clientWidth) * 100)}%`;
    const dur = Math.max(2.2, rand(4.5, 6.5) - elapsed * 0.08) * (kind === 'gold' ? 0.75 : 1);
    b.style.animationDuration = `${dur}s, ${rand(1.5, 2.5)}s`;
    if (kind === 'urchin') b.textContent = '✹';
    b.addEventListener('animationend', (e) => { if (e.animationName === 'bubble-rise') b.remove(); });
    field.appendChild(b);
    spawnTimer = setTimeout(spawn, Math.max(180, rand(380, 620) - elapsed * 10));
  }

  function onPop(e) {
    const b = e.target.closest('.bubble');
    if (!b || done || b.classList.contains('popped')) return;
    b.classList.add('popped');
    const now = performance.now();
    let pts;
    if (b.classList.contains('urchin')) {
      pts = -3;
      combo = 0;
    } else {
      combo = now - lastPop < 700 ? combo + 1 : 1;
      lastPop = now;
      pts = (b.classList.contains('gold') ? 3 : 1) + (combo >= 5 ? 1 : 0);
      pops += 1;
    }
    score = Math.max(0, score + pts);
    const label = document.createElement('span');
    label.className = `pop-label ${pts < 0 ? 'bad' : ''}`;
    label.textContent = pts > 0 ? `+${pts}` : `${pts}`;
    const fr = field.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    label.style.left = `${br.left - fr.left + br.width / 2}px`;
    label.style.top = `${br.top - fr.top}px`;
    field.appendChild(label);
    setTimeout(() => label.remove(), 700);
    setTimeout(() => b.remove(), 200);
    set('score', `🔵 <b>${score}</b>`);
    set('combo', combo >= 5 ? `🔥 x${combo}` : '');
  }

  field.addEventListener('pointerdown', onPop);
  spawn();
  clock = setInterval(() => {
    time -= 1;
    set('time', `⏱ <b>${Math.max(0, time)}</b>`);
    if (time <= 0) finish();
  }, 1000);

  function cleanup() {
    done = true;
    clearTimeout(spawnTimer);
    clearInterval(clock);
    field.removeEventListener('pointerdown', onPop);
  }

  function finish() {
    cleanup();
    field.querySelectorAll('.bubble').forEach((b) => b.classList.add('popped'));
    setTimeout(() => onEnd({ pearls: Math.round(score * 0.8), best: score, summary: `You popped <b>${pops}</b> bubbles for <b>${score}</b> points!` }), 400);
  }

  return cleanup;
}
