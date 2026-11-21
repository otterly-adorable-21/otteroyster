// Tide Fishing: cast, wait for a bite, then time three reel-ins on a moving meter.
import { hud, rand, pick } from './kit.js';

const CASTS = 5;
const SPECIES = [
  { name: 'Sardine', icon: '🐟', pts: 3, speed: 1.0, zone: 0.26, weight: 40 },
  { name: 'Clownfish', icon: '🐠', pts: 5, speed: 1.3, zone: 0.22, weight: 28 },
  { name: 'Pufferfish', icon: '🐡', pts: 7, speed: 1.6, zone: 0.19, weight: 18 },
  { name: 'Squid', icon: '🦑', pts: 10, speed: 1.9, zone: 0.16, weight: 10 },
  { name: 'Golden Koi', icon: '✨', pts: 20, speed: 2.4, zone: 0.12, weight: 4 },
];
const TOTAL = SPECIES.reduce((a, s) => a + s.weight, 0);

export function start(root, onEnd) {
  const h = hud({ casts: `🎣 <b>1</b>/${CASTS}`, score: '⭐ <b>0</b>' });
  root.innerHTML = `${h.html}
    <div class="fishing">
      <div class="fish-sky"></div>
      <div class="fish-water"><div class="bobber" data-bobber></div><div class="fish-ripple" data-ripple></div></div>
      <div class="fish-msg" data-msg>Tap <b>Cast</b> to throw your line!</div>
      <div class="meter" data-meter hidden><div class="meter-zone" data-zone></div><div class="meter-mark" data-mark></div></div>
      <div class="catch-row" data-catches></div>
      <button class="btn primary big-btn" data-btn>Cast 🎣</button>
    </div>
    <p class="hint">Press the button or Space. Rarer fish wriggle faster!</p>`;
  const set = h.bind(root);
  const q = (s) => root.querySelector(s);
  const btn = q('[data-btn]');
  const msg = q('[data-msg]');
  const bobber = q('[data-bobber]');
  const meter = q('[data-meter]');
  const zoneEl = q('[data-zone]');
  const mark = q('[data-mark]');
  const catches = q('[data-catches]');

  let phase = 'idle'; // idle | waiting | bite | reel | done
  let cast = 1;
  let score = 0;
  let fish = null;
  let timer = 0;
  let raf = 0;
  let pos = 0;
  let dir = 1;
  let zoneAt = 0;
  let hits = 0;
  let misses = 0;
  let last = 0;

  function setPhase(p) {
    phase = p;
    bobber.className = `bobber ${p}`;
  }

  function castLine() {
    setPhase('waiting');
    msg.innerHTML = 'Waiting for a bite…';
    btn.textContent = 'Reel!';
    let r = Math.random() * TOTAL;
    fish = SPECIES.find((s) => (r -= s.weight) < 0) || SPECIES[0];
    timer = setTimeout(bite, rand(1200, 3800));
  }

  function bite() {
    setPhase('bite');
    msg.innerHTML = '<b class="alert">❗ Something bit! Reel now!</b>';
    timer = setTimeout(() => {
      if (phase === 'bite') escape('Too slow! It got away.');
    }, 900);
  }

  function startReel() {
    clearTimeout(timer);
    setPhase('reel');
    hits = 0;
    misses = 0;
    meter.hidden = false;
    newZone();
    msg.innerHTML = `Hooked! Stop the marker in the green zone. <b>${hits}/3</b>`;
    btn.textContent = 'Reel! 🎣';
    last = performance.now();
    raf = requestAnimationFrame(step);
  }

  function newZone() {
    zoneAt = rand(0.05, 0.95 - fish.zone);
    zoneEl.style.left = `${zoneAt * 100}%`;
    zoneEl.style.width = `${fish.zone * 100}%`;
  }

  function step(t) {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    pos += dir * dt * 0.9 * fish.speed;
    if (pos > 1) { pos = 1; dir = -1; }
    if (pos < 0) { pos = 0; dir = 1; }
    mark.style.left = `${pos * 100}%`;
    if (phase === 'reel') raf = requestAnimationFrame(step);
  }

  function reel() {
    if (pos >= zoneAt && pos <= zoneAt + fish.zone) {
      hits += 1;
      if (hits >= 3) return landed();
      newZone();
      msg.innerHTML = `Nice! Keep going. <b>${hits}/3</b>`;
    } else {
      misses += 1;
      if (misses >= 2) return escape(`The line snapped! The ${fish.name.toLowerCase()} escaped.`);
      msg.innerHTML = `Missed! Careful… <b>${hits}/3</b>`;
    }
  }

  function landed() {
    cancelAnimationFrame(raf);
    score += fish.pts;
    catches.insertAdjacentHTML('beforeend', `<span title="${fish.name}">${fish.icon}</span>`);
    endCast(`You caught a <b>${fish.name}</b>! ${fish.icon} +${fish.pts}`);
  }

  function escape(text) {
    cancelAnimationFrame(raf);
    catches.insertAdjacentHTML('beforeend', '<span class="miss">✖</span>');
    endCast(text);
  }

  function endCast(text) {
    setPhase('idle');
    meter.hidden = true;
    msg.innerHTML = text;
    set('score', `⭐ <b>${score}</b>`);
    if (cast >= CASTS) {
      phase = 'done';
      btn.textContent = 'See results';
      return;
    }
    cast += 1;
    set('casts', `🎣 <b>${cast}</b>/${CASTS}`);
    btn.textContent = 'Cast again 🎣';
  }

  function press() {
    if (phase === 'idle') castLine();
    else if (phase === 'waiting') { clearTimeout(timer); escape(pick(['Too early! You scared the fish away.', 'Oops, nothing there yet!'])); }
    else if (phase === 'bite') startReel();
    else if (phase === 'reel') reel();
    else if (phase === 'done') finish();
  }

  function finish() {
    cleanup();
    onEnd({ pearls: Math.round(score * 1.2), best: score, summary: `You scored <b>${score}</b> points of fish in ${CASTS} casts!` });
  }

  const onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); press(); } };
  btn.addEventListener('click', press);
  window.addEventListener('keydown', onKey);

  function cleanup() {
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey);
  }
  return cleanup;
}
