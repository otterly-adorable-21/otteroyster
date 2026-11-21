// Shared helpers for arcade minigames.
//
// A game module exports `start(root, onEnd)` which renders into `root`, calls
// `onEnd({ pearls, best, summary })` exactly once when the round is over, and
// returns a cleanup function (called if the player quits early).

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// HUD: pass {key: initialHtml}; returns setter set(key, html).
export function hud(fields) {
  const html = `<div class="game-hud">${Object.entries(fields).map(([k, v]) => `<span data-h="${k}">${v}</span>`).join('')}</div>`;
  return {
    html,
    bind(root) {
      const els = {};
      root.querySelectorAll('[data-h]').forEach((el) => { els[el.dataset.h] = el; });
      return (k, v) => { if (els[k] && els[k].innerHTML !== String(v)) els[k].innerHTML = v; };
    },
  };
}

// Create a crisp, responsive canvas with logical size W×H.
export function canvas(root, W, H, { hudHtml = '', hint = '' } = {}) {
  root.innerHTML = `${hudHtml}<canvas class="game-canvas" style="aspect-ratio:${W}/${H}"></canvas>${hint ? `<p class="hint">${hint}</p>` : ''}`;
  const cv = root.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = W * dpr;
  cv.height = H * dpr;
  ctx.scale(dpr, dpr);
  return { cv, ctx };
}

// requestAnimationFrame loop. fn(dt, t) returns false to stop. Returns stop().
export function loop(fn) {
  let raf = 0;
  let stopped = false;
  let last = 0;
  const step = (t) => {
    if (stopped) return;
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    if (fn(dt, t) === false) { stopped = true; return; }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}

// Keyboard state for arrows/WASD/space. Returns { k, off }.
export function keyboard() {
  const k = { left: false, right: false, up: false, down: false, action: false };
  const map = {
    arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
    arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', ' ': 'action', enter: 'action',
  };
  const on = (down) => (e) => {
    const name = map[e.key.toLowerCase()];
    if (!name) return;
    k[name] = down;
    e.preventDefault();
  };
  const kd = on(true);
  const ku = on(false);
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  return { k, off: () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); } };
}

// Pointer position in canvas logical coordinates. Returns { p, off }.
export function pointer(cv, W, H) {
  const p = { x: null, y: null, down: false };
  const pos = (e) => {
    const r = cv.getBoundingClientRect();
    p.x = ((e.clientX - r.left) / r.width) * W;
    p.y = ((e.clientY - r.top) / r.height) * H;
  };
  const pd = (e) => { pos(e); p.down = true; cv.setPointerCapture?.(e.pointerId); };
  const pm = (e) => { pos(e); };
  const pu = () => { p.down = false; };
  cv.addEventListener('pointerdown', pd);
  cv.addEventListener('pointermove', pm);
  cv.addEventListener('pointerup', pu);
  cv.addEventListener('pointercancel', pu);
  return { p, off: () => { cv.removeEventListener('pointerdown', pd); cv.removeEventListener('pointermove', pm); } };
}

// Floating "+3" style labels.
export function popups() {
  let list = [];
  return {
    add(x, y, text, color = '#fff') { list.push({ x, y, text, color, life: 0.8 }); },
    update(dt) { for (const p of list) { p.life -= dt; p.y -= 40 * dt; } list = list.filter((p) => p.life > 0); },
    draw(ctx) {
      ctx.font = 'bold 18px Nunito, system-ui, sans-serif';
      ctx.textAlign = 'center';
      for (const p of list) {
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
      }
      ctx.globalAlpha = 1;
    },
  };
}

export function waterBackground(ctx, W, H, top = '#3bc9db', bottom = '#0b7285') {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// Simple otter head sprite, centred at (x, y) with radius r.
export function drawOtter(ctx, x, y, r = 24, { flip = false, happy = true } = {}) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  const s = r / 28;
  ctx.scale(s, s);
  ctx.fillStyle = '#6b4329';
  ctx.beginPath(); ctx.arc(-21, -20, 9, 0, Math.PI * 2); ctx.arc(21, -20, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a5a3b';
  ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f1dcc0';
  ctx.beginPath(); ctx.ellipse(0, 9, 15, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b1a10';
  ctx.beginPath(); ctx.arc(-10, -4, 4, 0, Math.PI * 2); ctx.arc(10, -4, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-8.5, -5.5, 1.4, 0, Math.PI * 2); ctx.arc(11.5, -5.5, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3b2418';
  ctx.beginPath(); ctx.ellipse(0, 4, 5, 3.4, 0, 0, Math.PI * 2); ctx.fill();
  if (happy) {
    ctx.strokeStyle = '#3b2418';
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-5, 11); ctx.quadraticCurveTo(-2.5, 14, 0, 11); ctx.quadraticCurveTo(2.5, 14, 5, 11); ctx.stroke();
  }
  ctx.restore();
}

export function drawFish(ctx, x, y, size, color, dir = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-size * 0.8, 0);
  ctx.lineTo(-size * 1.5, -size * 0.6);
  ctx.lineTo(-size * 1.5, size * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(size * 0.45, -size * 0.12, size * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#212529';
  ctx.beginPath(); ctx.arc(size * 0.5, -size * 0.12, size * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawJelly(ctx, x, y, r, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = 'rgba(255,192,235,0.8)';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.35, 0);
    ctx.quadraticCurveTo(i * r * 0.35 + Math.sin(t * 4 + i) * 6, r * 0.9, i * r * 0.35, r * 1.6);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(247,131,172,0.9)';
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI, 0);
  ctx.quadraticCurveTo(0, r * 0.4, -r, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.45, r * 0.2, r * 0.12, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
