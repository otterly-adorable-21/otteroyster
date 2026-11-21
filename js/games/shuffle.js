// Shell Shuffle: follow the pearl under the shells. Each round is faster.
import { hud, randInt } from './kit.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function start(root, onEnd) {
  const h = hud({ round: '🏁 Round <b>1</b>', lives: '❤️❤️' });
  root.innerHTML = `${h.html}
    <div class="shuffle-table" data-table></div>
    <div class="shuffle-msg" data-msg>Watch the pearl…</div>
    <p class="hint">Keep your eye on the shell hiding the pearl, then tap it.</p>`;
  const set = h.bind(root);
  const table = root.querySelector('[data-table]');
  const msg = root.querySelector('[data-msg]');
  let alive = true;
  let round = 1;
  let wins = 0;
  let lives = 2;
  let shells = [];
  let slots = 3;
  let pearlShell = 0;
  let canPick = false;

  function layout(n) {
    slots = n;
    table.innerHTML = Array.from({ length: n }, (_, i) => `
      <button class="cup" data-id="${i}" aria-label="Shell ${i + 1}"><span class="cup-shell"></span></button>`).join('')
      + '<span class="pearl-ball" data-pearl></span>';
    shells = [...table.querySelectorAll('.cup')].map((el, i) => ({ el, slot: i }));
    place(0);
  }

  function slotX(i) { return ((i + 0.5) / slots) * 100; }

  function place(ms) {
    for (const s of shells) {
      s.el.style.transitionDuration = `${ms}ms`;
      s.el.style.left = `${slotX(s.slot)}%`;
    }
  }

  async function playRound() {
    if (!alive) return;
    const n = round >= 6 ? 5 : round >= 3 ? 4 : 3;
    if (n !== slots || !shells.length) layout(n);
    canPick = false;
    msg.textContent = 'Watch the pearl…';
    pearlShell = randInt(0, shells.length - 1);
    const pearl = table.querySelector('[data-pearl]');
    pearl.style.left = `${slotX(shells[pearlShell].slot)}%`;
    pearl.classList.add('show');
    shells.forEach((s) => s.el.classList.remove('lift', 'right', 'wrong'));
    shells[pearlShell].el.classList.add('lift');
    await wait(1100);
    if (!alive) return;
    shells[pearlShell].el.classList.remove('lift');
    await wait(350);
    pearl.classList.remove('show');
    const swaps = 4 + round * 2;
    const speed = Math.max(170, 520 - round * 45);
    for (let i = 0; i < swaps && alive; i++) {
      const a = randInt(0, shells.length - 1);
      let b = randInt(0, shells.length - 2);
      if (b >= a) b++;
      const t = shells[a].slot;
      shells[a].slot = shells[b].slot;
      shells[b].slot = t;
      place(speed);
      await wait(speed + 30);
    }
    if (!alive) return;
    msg.textContent = 'Where is the pearl? Tap a shell!';
    canPick = true;
  }

  async function onPick(e) {
    const cup = e.target.closest('.cup');
    if (!cup || !canPick) return;
    canPick = false;
    const id = +cup.dataset.id;
    const pearl = table.querySelector('[data-pearl]');
    pearl.style.transitionDuration = '0ms';
    pearl.style.left = `${slotX(shells[pearlShell].slot)}%`;
    pearl.classList.add('show');
    shells[pearlShell].el.classList.add('lift', 'right');
    if (id === pearlShell) {
      wins += 1;
      msg.textContent = '🎉 Found it!';
    } else {
      cup.classList.add('lift', 'wrong');
      lives -= 1;
      set('lives', '❤️'.repeat(lives) + '🖤'.repeat(2 - lives));
      msg.textContent = lives ? 'Not that one! One more chance…' : 'The pearl got away!';
    }
    await wait(1300);
    if (!alive) return;
    if (!lives) return finish();
    round += 1;
    set('round', `🏁 Round <b>${round}</b>`);
    pearl.style.transitionDuration = '';
    playRound();
  }

  table.addEventListener('click', onPick);
  layout(3);
  playRound();

  function cleanup() {
    alive = false;
    table.removeEventListener('click', onPick);
  }
  function finish() {
    cleanup();
    onEnd({ pearls: wins * 6, best: wins, summary: `You tracked the pearl <b>${wins}</b> time${wins === 1 ? '' : 's'}!` });
  }
  return cleanup;
}
