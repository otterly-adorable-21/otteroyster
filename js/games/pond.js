// Pond Games: the Discord solo games, playable in the website arcade.
// They use the same questions and word lists as Discord (js/game-words.js).
// Each export follows the arcade contract in kit.js: start(root, onEnd) -> cleanup.
import { hud, randInt, pick, shuffle } from './kit.js';
import { TRIVIA, EMOJI, SCRAMBLE_WORDS, HANGMAN_WORDS, FISH as CATCH } from '../game-words.js';

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LETTERS = ['🅰️', '🅱️', '🇨', '🇩'];

// Timers that stop when the player quits.
function timers() {
  const ids = new Set();
  return {
    after(ms, fn) { const id = setTimeout(() => { ids.delete(id); fn(); }, ms); ids.add(id); return id; },
    clear() { ids.forEach(clearTimeout); ids.clear(); },
  };
}

// ---------------------------------------------------------------- quizzes
function quiz({ bank, rounds, per, title, prompt }) {
  return (root, onEnd) => {
    const qs = shuffle([...bank]).slice(0, rounds).map(([clue, answer, ...wrong]) => ({ clue, answer, opts: shuffle([answer, ...wrong]) }));
    let idx = 0;
    let correct = 0;
    const draw = (reveal) => {
      const q = qs[idx];
      root.innerHTML = `${hud({ q: `❓ <b>${idx + 1}</b>/${rounds}`, s: `✅ <b>${correct}</b>` }).html}
        <div class="pg-card"><div class="pg-prompt">${prompt(q)}</div>
        <div class="pg-opts">${q.opts.map((o, k) => {
          const cls = reveal ? (o === q.answer ? 'right' : k === reveal.pick ? 'wrong' : '') : '';
          return `<button class="pg-opt ${cls}" data-k="${k}" ${reveal ? 'disabled' : ''}><span>${LETTERS[k]}</span>${esc(o)}</button>`;
        }).join('')}</div>
        ${reveal ? `<p class="pg-note ${reveal.right ? 'good' : 'bad'}">${reveal.right ? '✅ Correct!' : `❌ The answer was <b>${esc(q.answer)}</b>.`}</p>
          <button class="btn primary pg-next" data-next>${idx + 1 >= rounds ? 'See results' : 'Next'}</button>` : ''}</div>`;
    };
    const click = (e) => {
      const opt = e.target.closest('[data-k]');
      if (opt && !opt.disabled) {
        const k = Number(opt.dataset.k);
        const right = qs[idx].opts[k] === qs[idx].answer;
        if (right) correct += 1;
        return draw({ right, pick: k });
      }
      if (e.target.closest('[data-next]')) {
        idx += 1;
        if (idx < rounds) return draw();
        onEnd({ pearls: correct * per, best: correct, summary: `You got <b>${correct}/${rounds}</b> right in ${title}.` });
      }
      return null;
    };
    root.addEventListener('click', click);
    draw();
    return () => root.removeEventListener('click', click);
  };
}

export const trivia = { start: quiz({ bank: TRIVIA, rounds: 5, per: 8, title: 'Trivia', prompt: (q) => `<b>${esc(q.clue)}</b>` }) };
export const emoji = { start: quiz({ bank: EMOJI, rounds: 5, per: 6, title: 'Emoji Mystery', prompt: (q) => `<small>What does this mean?</small><div class="pg-emoji">${q.clue}</div>` }) };

// ---------------------------------------------------------------- word scramble
const mix = (w) => { let out = w; while (out === w) out = shuffle([...w]).join(''); return out; };

export const scramble = {
  start(root, onEnd) {
    const words = shuffle([...SCRAMBLE_WORDS]).slice(0, 5);
    let idx = 0;
    let points = 0;
    let hint = false;
    let mixed = mix(words[0]);
    let note = '';
    const draw = () => {
      root.innerHTML = `${hud({ q: `🔤 <b>${idx + 1}</b>/5`, s: `⭐ <b>${points}</b>` }).html}
        <div class="pg-card"><div class="pg-tiles">${[...mixed].map((c) => `<span>${c}</span>`).join('')}</div>
        ${hint ? `<p class="pg-note">💡 Starts with <b>${words[idx].slice(0, 2)}</b></p>` : ''}
        <form class="pg-form" data-guess><input name="g" maxlength="20" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Your answer" aria-label="Your answer" required><button class="btn primary" type="submit">Check</button></form>
        <div class="row"><button class="btn small" data-hint ${hint ? 'disabled' : ''}>💡 Hint</button><button class="btn small" data-skip>⏭️ Skip</button></div>
        ${note ? `<p class="pg-note">${note}</p>` : ''}</div>`;
      root.querySelector('input')?.focus();
    };
    const next = (msg) => {
      note = msg;
      idx += 1;
      hint = false;
      if (idx >= 5) return onEnd({ pearls: points * 2, best: points, summary: `${msg}<br>You scored <b>${points}</b> points unscrambling words.` });
      mixed = mix(words[idx]);
      return draw();
    };
    const submit = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const g = e.target.g.value.trim().toUpperCase();
      if (g === words[idx]) { const pts = hint ? 2 : 4; points += pts; return next(`✅ <b>${words[idx]}</b> is right! +${pts}`); }
      note = `❌ <b>${esc(g || '…')}</b> isn't it. Try again!`;
      return draw();
    };
    const click = (e) => {
      if (e.target.closest('[data-hint]')) { hint = true; note = ''; draw(); }
      if (e.target.closest('[data-skip]')) next(`⏭️ Skipped. It was <b>${words[idx]}</b>.`);
    };
    root.addEventListener('submit', submit);
    root.addEventListener('click', click);
    draw();
    return () => { root.removeEventListener('submit', submit); root.removeEventListener('click', click); };
  },
};

// ---------------------------------------------------------------- raft rescue (hangman)
const RAFT = ['☀️🦦🛶', '☀️🦦🛶💧', '🌤️🦦🛶💧💧', '⛅🦦🛶💧💧💧', '🌥️😰🛶💧💧💧💧', '🌧️😱💧🛶💧💧💧💧', '⛈️🫧🌊🌊🌊'];

export const hangman = {
  start(root, onEnd) {
    const word = pick(HANGMAN_WORDS);
    const guessed = new Set();
    let misses = 0;
    let note = 'Guess a letter!';
    let over = false;
    const draw = () => {
      const masked = [...word].map((c) => `<span>${guessed.has(c) || over ? c : ''}</span>`).join('');
      root.innerHTML = `${hud({ l: `💧 <b>${6 - misses}</b> splashes left` }).html}
        <div class="pg-card"><div class="pg-raft" aria-hidden="true">${RAFT[Math.min(6, misses)]}</div>
        <div class="pg-word">${masked}</div><p class="pg-note">${note}</p>
        <div class="pg-keys">${[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((c) => `<button data-l="${c}" class="${guessed.has(c) ? (word.includes(c) ? 'right' : 'wrong') : ''}" ${guessed.has(c) || over ? 'disabled' : ''}>${c}</button>`).join('')}</div></div>`;
    };
    const finish = (won) => {
      over = true;
      draw();
      onEnd(won
        ? { pearls: 16 + (6 - misses) * 4, best: 6 - misses, summary: `🎉 You saved the otter! The word was <b>${word}</b>.` }
        : { pearls: 3, best: 0, summary: `💦 Splash! The word was <b>${word}</b>. (The otter swam to shore, they're fine.)` });
    };
    const key = (c) => {
      if (over || guessed.has(c) || !/^[A-Z]$/.test(c)) return;
      guessed.add(c);
      if (word.includes(c)) note = `✅ <b>${c}</b> is in the word!`;
      else { misses += 1; note = `❌ No <b>${c}</b>.`; }
      if ([...word].every((x) => guessed.has(x))) return finish(true);
      if (misses >= 6) return finish(false);
      return draw();
    };
    const click = (e) => { const b = e.target.closest('[data-l]'); if (b) key(b.dataset.l); };
    const kd = (e) => { if (e.key.length === 1) key(e.key.toUpperCase()); };
    root.addEventListener('click', click);
    window.addEventListener('keydown', kd);
    draw();
    return () => { root.removeEventListener('click', click); window.removeEventListener('keydown', kd); };
  },
};

// ---------------------------------------------------------------- number hunt
export const numberhunt = {
  start(root, onEnd) {
    const n = randInt(1, 100);
    const log = [];
    let tries = 0;
    let note = '';
    const draw = () => {
      root.innerHTML = `${hud({ t: `🔢 <b>${7 - tries}</b> tries left` }).html}
        <div class="pg-card"><p>I buried a pearl at a number between <b>1 and 100</b>.</p>
        <form class="pg-form" data-guess><input name="g" type="number" inputmode="numeric" min="1" max="100" placeholder="1–100" aria-label="Your guess" required><button class="btn primary" type="submit">Guess</button></form>
        ${note ? `<p class="pg-note">${note}</p>` : ''}
        <ol class="pg-log">${log.map((l) => `<li>${l}</li>`).join('')}</ol></div>`;
      root.querySelector('input')?.focus();
    };
    const submit = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const g = parseInt(e.target.g.value, 10);
      if (!Number.isInteger(g) || g < 1 || g > 100) { note = 'Enter a whole number from 1 to 100.'; return draw(); }
      tries += 1;
      if (g === n) return onEnd({ pearls: 10 + (8 - tries) * 4, best: tries, summary: `It was <b>${n}</b>! You found it in <b>${tries}</b> ${tries === 1 ? 'try' : 'tries'}.` });
      const d = Math.abs(g - n);
      const heat = d <= 3 ? '🔥 Super hot' : d <= 10 ? '♨️ Warm' : d <= 25 ? '🌤️ Cool' : '🧊 Freezing';
      log.unshift(`<b>${g}</b> · ${heat} · go ${g < n ? '⬆️ higher' : '⬇️ lower'}`);
      note = '';
      if (tries >= 7) return onEnd({ pearls: 2, best: null, summary: `Out of tries! The pearl was at <b>${n}</b>.` });
      return draw();
    };
    root.addEventListener('submit', submit);
    draw();
    return () => root.removeEventListener('submit', submit);
  },
};

// ---------------------------------------------------------------- higher or lower
const SUITS = ['🐚', '⭐', '🐟', '🦀'];
const cardName = (n) => ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }[n] || String(n));
const deal = () => ({ n: randInt(1, 13), suit: pick(SUITS) });
const cardHTML = (c, cls = '') => `<div class="pg-cardface ${cls}"><b>${cardName(c.n)}</b><span>${c.suit}</span></div>`;

export const higherlower = {
  start(root, onEnd) {
    let cur = deal();
    let streak = 0;
    let note = 'Will the next card be higher or lower?';
    let busy = false;
    const t = timers();
    const draw = (flip) => {
      root.innerHTML = `${hud({ s: `🔥 Streak <b>${streak}</b>`, c: `💰 Cash out: <b>${streak * 5}</b>` }).html}
        <div class="pg-card"><div class="pg-cards">${cardHTML(cur)}${flip ? cardHTML(flip, 'flip') : '<div class="pg-cardface back">?</div>'}</div>
        <p class="pg-note">${note}</p>
        <div class="row"><button class="btn primary" data-hl="hi" ${busy ? 'disabled' : ''}>⬆️ Higher</button><button class="btn primary" data-hl="lo" ${busy ? 'disabled' : ''}>⬇️ Lower</button></div>
        <button class="btn" data-cash ${!streak || busy ? 'disabled' : ''}>💰 Cash out</button></div>`;
    };
    const click = (e) => {
      if (busy) return;
      if (e.target.closest('[data-cash]') && streak) {
        onEnd({ pearls: streak * 5, best: streak, summary: `You cashed out with a streak of <b>${streak}</b>!` });
        return;
      }
      const b = e.target.closest('[data-hl]');
      if (!b) return;
      const next = deal();
      const prev = cur;
      busy = true;
      if (next.n === prev.n) note = 'Same number! That\'s a free pass.';
      else if ((b.dataset.hl === 'hi') === (next.n > prev.n)) { streak += 1; note = '✅ Nice!'; }
      else {
        note = `Oh no! It was ${cardName(next.n)}.`;
        draw(next);
        t.after(900, () => onEnd({ pearls: streak * 2, best: streak, summary: `Your streak ended at <b>${streak}</b>. (Cash out sooner for more pearls!)` }));
        return;
      }
      draw(next);
      t.after(700, () => { cur = next; busy = false; draw(); });
    };
    root.addEventListener('click', click);
    draw();
    return () => { t.clear(); root.removeEventListener('click', click); };
  },
};

// ---------------------------------------------------------------- rock paper scissors vs Otto
const RPS = { rock: '🪨', paper: '📄', scissors: '✂️' };
const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

export const rps = {
  start(root, onEnd) {
    let me = 0;
    let otto = 0;
    let line = 'First to 2 wins!';
    let done = false;
    const draw = () => {
      root.innerHTML = `${hud({ me: `You <b>${me}</b>`, o: `<b>${otto}</b> Otto 🦦` }).html}
        <div class="pg-card"><p class="pg-note big">${line}</p>
        <div class="pg-rps">${Object.entries(RPS).map(([k, em]) => `<button data-p="${k}" ${done ? 'disabled' : ''}><span>${em}</span>${k[0].toUpperCase()}${k.slice(1)}</button>`).join('')}</div></div>`;
    };
    const click = (e) => {
      const b = e.target.closest('[data-p]');
      if (!b || done) return;
      const mine = b.dataset.p;
      const his = pick(Object.keys(RPS));
      const w = mine === his ? 0 : BEATS[mine] === his ? 1 : 2;
      if (w === 1) me += 1;
      if (w === 2) otto += 1;
      line = `${RPS[mine]} vs ${RPS[his]} · ${w === 0 ? 'Tie!' : w === 1 ? 'You win the round!' : 'Otto wins the round!'}`;
      if (me >= 2 || otto >= 2) {
        done = true;
        draw();
        onEnd(me >= 2 ? { pearls: 12, best: null, summary: `🏆 You beat Otto <b>${me}–${otto}</b>!` } : { pearls: 3, best: null, summary: `🦦 Otto wins <b>${otto}–${me}</b>. Rematch?` });
        return;
      }
      draw();
    };
    root.addEventListener('click', click);
    draw();
    return () => root.removeEventListener('click', click);
  },
};

// ---------------------------------------------------------------- urchin sweeper
const R = 6;
const C = 6;
const URCHINS = 6;
const around = (k) => {
  const r = Math.floor(k / C);
  const c = k % C;
  const out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if ((dr || dc) && r + dr >= 0 && r + dr < R && c + dc >= 0 && c + dc < C) out.push((r + dr) * C + c + dc);
  return out;
};

export const minesweeper = {
  start(root, onEnd) {
    const open = new Set();
    const flag = new Set();
    let mines = null;
    let count = [];
    let flagMode = false;
    let over = false;
    let boom = -1;
    let started = 0;
    const draw = (note = '') => {
      root.innerHTML = `${hud({ u: `🟣 <b>${URCHINS - flag.size}</b> urchins`, m: `<button class="btn small ${flagMode ? 'primary' : ''}" data-mode ${over ? 'disabled' : ''}>🚩 Flag mode: ${flagMode ? 'on' : 'off'}</button>` }).html}
        <div class="pg-sweep" style="--c:${C}">${Array.from({ length: R * C }, (_, k) => {
          const shown = open.has(k) || (over && mines?.has(k));
          const label = !shown ? (flag.has(k) ? '🚩' : '') : mines?.has(k) ? (k === boom ? '💥' : '🟣') : (count[k] || '');
          return `<button data-c="${k}" class="${shown ? `open n${count[k] || 0}` : ''}" ${over || open.has(k) ? 'disabled' : ''} aria-label="Tile ${k + 1}">${label}</button>`;
        }).join('')}</div>
        <p class="hint">${note || 'Uncover every safe tile. Numbers count the urchins next to a tile. Long-press or use flag mode to mark one.'}</p>`;
    };
    const place = (safe) => {
      mines = new Set(shuffle([...Array(R * C).keys()].filter((k) => k !== safe && !around(safe).includes(k))).slice(0, URCHINS));
      count = Array.from({ length: R * C }, (_, k) => around(k).filter((x) => mines.has(x)).length);
      started = Date.now();
    };
    const dig = (k) => {
      const stack = [k];
      while (stack.length) {
        const x = stack.pop();
        if (open.has(x)) continue;
        open.add(x);
        flag.delete(x);
        if (count[x] === 0) stack.push(...around(x).filter((y) => !open.has(y)));
      }
    };
    const tap = (k, asFlag) => {
      if (over || open.has(k)) return;
      if (asFlag) { if (flag.has(k)) flag.delete(k); else flag.add(k); draw(); return; }
      if (flag.has(k)) { draw('That tile is flagged. Turn off flag mode to dig it up.'); return; }
      if (!mines) place(k);
      if (mines.has(k)) {
        over = true;
        boom = k;
        draw('💥 Ouch, an urchin!');
        onEnd({ pearls: 2, best: null, summary: '💥 Ouch, an urchin! Better luck next time.' });
        return;
      }
      dig(k);
      if (open.size >= R * C - URCHINS) {
        over = true;
        const secs = Math.max(1, Math.round((Date.now() - started) / 1000));
        draw('🎉 You cleared the beach!');
        onEnd({ pearls: 30, best: secs, summary: `🎉 You cleared the beach in <b>${secs}</b> seconds!` });
        return;
      }
      draw();
    };
    let pressTimer = 0;
    let pressed = false;
    const down = (e) => {
      const b = e.target.closest('[data-c]');
      if (!b) return;
      pressed = false;
      pressTimer = setTimeout(() => { pressed = true; tap(Number(b.dataset.c), true); }, 450);
    };
    const up = () => clearTimeout(pressTimer);
    const click = (e) => {
      if (e.target.closest('[data-mode]')) { flagMode = !flagMode; draw(); return; }
      const b = e.target.closest('[data-c]');
      if (!b || pressed) { pressed = false; return; }
      tap(Number(b.dataset.c), flagMode);
    };
    const ctx = (e) => { const b = e.target.closest('[data-c]'); if (b) { e.preventDefault(); } };
    root.addEventListener('click', click);
    root.addEventListener('pointerdown', down);
    root.addEventListener('pointerup', up);
    root.addEventListener('pointerleave', up);
    root.addEventListener('contextmenu', ctx);
    draw();
    return () => {
      clearTimeout(pressTimer);
      root.removeEventListener('click', click);
      root.removeEventListener('pointerdown', down);
      root.removeEventListener('pointerup', up);
      root.removeEventListener('pointerleave', up);
      root.removeEventListener('contextmenu', ctx);
    };
  },
};

// ---------------------------------------------------------------- quick cast (fishing)
const CASTS = 3;
const weighted = (list) => { let r = Math.random() * list.reduce((n, x) => n + x.weight, 0); return list.find((x) => (r -= x.weight) < 0) || list[0]; };

export const quickcast = {
  start(root, onEnd) {
    const t = timers();
    let cast = 1;
    let phase = 'idle'; // idle | waiting | bite
    let score = 0;
    let biteAt = 0;
    const bag = [];
    let note = 'Cast your line, then reel in the moment something bites!';
    const draw = () => {
      root.innerHTML = `${hud({ c: `🎣 Cast <b>${Math.min(cast, CASTS)}</b>/${CASTS}`, s: `⭐ <b>${score}</b>` }).html}
        <div class="pg-card"><div class="pg-water ${phase}"><span class="bob">${phase === 'bite' ? '❗' : phase === 'waiting' ? '🔴' : ''}</span></div>
        <p class="pg-note ${phase === 'bite' ? 'big' : ''}">${phase === 'bite' ? '<b>SOMETHING BIT! REEL IT IN!</b>' : phase === 'waiting' ? 'Waiting for a bite… (don\'t reel too early!)' : note}</p>
        <button class="btn ${phase === 'bite' ? 'primary' : ''} wide pg-big" data-go>${phase === 'idle' ? '🎣 Cast' : '🌀 Reel!'}</button>
        <p class="pg-bag">Bucket: ${bag.join(' ') || '—'}</p></div>`;
    };
    const endCast = (msg) => {
      t.clear();
      phase = 'idle';
      note = msg;
      if (cast >= CASTS) {
        draw();
        phase = 'done';
        onEnd({ pearls: Math.round(score * 1.5), best: score, summary: `${msg}<br>Bucket: ${bag.join(' ')} · <b>${score}</b> points.` });
        return;
      }
      cast += 1;
      draw();
    };
    const go = () => {
      if (phase === 'done') return;
      if (phase === 'idle') {
        phase = 'waiting';
        draw();
        t.after(randInt(2000, 6000), () => {
          phase = 'bite';
          biteAt = Date.now();
          draw();
          t.after(1800, () => { if (phase === 'bite') { bag.push('💨'); endCast('💨 Too slow, it got away!'); } });
        });
      } else if (phase === 'waiting') {
        bag.push('💨');
        endCast('😅 Too early! You scared the fish away.');
      } else if (phase === 'bite') {
        const fast = Date.now() - biteAt < 700;
        const f = weighted(CATCH);
        const pts = Math.round(f.pts * (fast ? 1.5 : 1));
        score += pts;
        bag.push(f.icon);
        endCast(`${fast ? '⚡ Lightning reflexes! ' : ''}You caught a <b>${f.name}</b> ${f.icon} (+${pts})`);
      }
    };
    const click = (e) => { if (e.target.closest('[data-go]')) go(); };
    const kd = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); go(); } };
    root.addEventListener('click', click);
    window.addEventListener('keydown', kd);
    draw();
    return () => { t.clear(); root.removeEventListener('click', click); window.removeEventListener('keydown', kd); };
  },
};
