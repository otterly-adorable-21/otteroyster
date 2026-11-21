// Bubble Hop: endless vertical bouncer.
import { canvas, loop, keyboard, pointer, popups, hud, drawOtter, rand, clamp } from './kit.js';

const W = 360;
const H = 520;
const GRAV = 1100;
const JUMP = -560;

export function start(root, onEnd) {
  const h = hud({ height: '⬆️ <b>0</b> m', stars: '⭐ <b>0</b>' });
  const { cv, ctx } = canvas(root, W, H, { hudHtml: h.html, hint: 'Steer with ← → / A D or by pointing. Pink bubbles pop after one bounce!' });
  const set = h.bind(root);
  const kb = keyboard();
  const ptr = pointer(cv, W, H);
  const pops = popups();

  const me = { x: W / 2, y: H - 80, vx: 0, vy: JUMP };
  let camY = 0; // world y at top of screen
  let best = 0;
  let stars = 0;
  let plats = [];
  let pickups = [];
  let topY = H - 30;
  let over = false;
  let t = 0;

  function addPlat(y) {
    const height = Math.max(0, -y) / 10;
    const r = Math.random();
    const type = height > 40 && r < 0.22 ? 'fragile' : height > 80 && r < 0.4 ? 'moving' : 'normal';
    const p = { x: rand(40, W - 40), y, w: rand(52, 70) - Math.min(18, height / 20), type, vx: type === 'moving' ? rand(50, 90) * (Math.random() < 0.5 ? -1 : 1) : 0 };
    plats.push(p);
    if (Math.random() < 0.12) pickups.push({ x: p.x, y: y - 30 });
  }
  plats.push({ x: W / 2, y: H - 30, w: 90, type: 'normal', vx: 0 });
  while (topY > -H) { topY -= rand(55, 85); addPlat(topY); }

  function finish() {
    stop(); kb.off(); ptr.off();
    const m = Math.floor(best / 10);
    onEnd({ pearls: Math.floor(m / 8) + stars * 3, best: m, summary: `You climbed <b>${m} m</b> and grabbed ${stars} star${stars === 1 ? '' : 's'}!` });
  }

  const stop = loop((dt) => {
    t += dt;
    if (over) return false;
    const steer = (kb.k.right ? 1 : 0) - (kb.k.left ? 1 : 0);
    if (steer) me.vx = steer * 300;
    else if (ptr.p.x !== null) me.vx = clamp((ptr.p.x - me.x) * 6, -320, 320);
    else me.vx *= 0.9;
    me.x += me.vx * dt;
    if (me.x < -20) me.x = W + 20;
    if (me.x > W + 20) me.x = -20;
    const prevY = me.y;
    me.vy += GRAV * dt;
    me.y += me.vy * dt;

    for (const p of plats) {
      if (p.vx) { p.x += p.vx * dt; if (p.x < p.w / 2 || p.x > W - p.w / 2) p.vx *= -1; }
      if (me.vy > 0 && prevY + 20 <= p.y && me.y + 20 >= p.y && Math.abs(me.x - p.x) < p.w / 2 + 10) {
        me.y = p.y - 20;
        me.vy = JUMP;
        if (p.type === 'fragile') { p.dead = true; pops.add(p.x, p.y - camY, 'pop!', '#ffc9de'); }
      }
    }
    for (const s of pickups) {
      if (Math.hypot(s.x - me.x, s.y - me.y) < 28) { s.dead = true; stars += 1; pops.add(s.x, s.y - camY, '+⭐', '#ffe066'); }
    }

    // camera follows upward
    const target = me.y - H * 0.42;
    if (target < camY) camY = target;
    best = Math.max(best, H - 80 - me.y);

    // generate & cull
    while (topY > camY - 100) { topY -= rand(60, 90 + Math.min(40, best / 150)); addPlat(topY); }
    plats = plats.filter((p) => !p.dead && p.y < camY + H + 40);
    pickups = pickups.filter((s) => !s.dead && s.y < camY + H + 40);
    pops.update(dt);

    if (me.y - camY > H + 40) { over = true; draw(); setTimeout(finish, 0); return false; }

    set('height', `⬆️ <b>${Math.floor(best / 10)}</b> m`);
    set('stars', `⭐ <b>${stars}</b>`);
    draw();
  });

  function draw() {
    const depth = clamp(-camY / 8000, 0, 1);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `hsl(${195 - depth * 40}, 75%, ${70 - depth * 40}%)`);
    g.addColorStop(1, `hsl(${190 - depth * 30}, 70%, ${45 - depth * 25}%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (const p of plats) {
      const y = p.y - camY;
      ctx.fillStyle = p.type === 'fragile' ? 'rgba(255,192,222,0.75)' : p.type === 'moving' ? 'rgba(178,242,187,0.75)' : 'rgba(255,255,255,0.7)';
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(p.x, y, p.w / 2, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.ellipse(p.x - p.w / 5, y - 4, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.font = '24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const s of pickups) ctx.fillText('⭐', s.x, s.y - camY + Math.sin(t * 4 + s.x) * 3);
    drawOtter(ctx, me.x, me.y - camY, 20, { flip: me.vx < 0 });
    pops.draw(ctx);
    ctx.textBaseline = 'alphabetic';
  }

  return () => { stop(); kb.off(); ptr.off(); };
}
