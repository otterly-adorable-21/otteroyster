// Shell Match: classic pairs memory game with sea creatures.
const FACES = ['🐚', '🦀', '🐠', '🐙', '🦑', '🐡', '⭐', '🐳'];

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function start(root, onEnd) {
  const deck = shuffle([...FACES, ...FACES]);
  root.innerHTML = `
    <div class="game-hud">
      <span>Moves: <b data-moves>0</b></span>
      <span>Pairs: <b data-pairs>0</b>/8</span>
    </div>
    <div class="memory-grid">
      ${deck.map((f, i) => `
        <button class="shell" data-i="${i}" aria-label="Hidden shell">
          <span class="shell-inner"><span class="shell-back"></span><span class="shell-front">${f}</span></span>
        </button>`).join('')}
    </div>
    <p class="hint">Fewer moves = more pearls. A perfect game is 8 moves.</p>`;

  const movesEl = root.querySelector('[data-moves]');
  const pairsEl = root.querySelector('[data-pairs]');
  let first = null;
  let lock = false;
  let moves = 0;
  let pairs = 0;
  let timer = 0;

  function onClick(e) {
    const btn = e.target.closest('.shell');
    if (!btn || lock || btn.classList.contains('flipped')) return;
    btn.classList.add('flipped');
    btn.setAttribute('aria-label', deck[btn.dataset.i]);
    if (!first) { first = btn; return; }
    moves++;
    movesEl.textContent = moves;
    const a = first;
    first = null;
    if (deck[a.dataset.i] === deck[btn.dataset.i]) {
      a.classList.add('matched');
      btn.classList.add('matched');
      pairs++;
      pairsEl.textContent = pairs;
      if (pairs === FACES.length) {
        timer = setTimeout(() => {
          const pearls = Math.max(8, 48 - (moves - 8) * 3);
          onEnd({ score: moves, pearls, summary: `You matched every shell in <b>${moves}</b> moves!`, best: moves });
        }, 600);
      }
    } else {
      lock = true;
      timer = setTimeout(() => {
        a.classList.remove('flipped');
        btn.classList.remove('flipped');
        a.setAttribute('aria-label', 'Hidden shell');
        btn.setAttribute('aria-label', 'Hidden shell');
        lock = false;
      }, 750);
    }
  }

  root.addEventListener('click', onClick);
  return () => {
    clearTimeout(timer);
    root.removeEventListener('click', onClick);
  };
}
