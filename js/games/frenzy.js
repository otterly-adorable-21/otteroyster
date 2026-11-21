// Fish Frenzy: swim freely, eat fish, avoid jellyfish.
import { canvas, loop, keyboard, pointer, popups, hud, waterBackground, drawOtter, drawFish, drawJelly, rand, clamp } from './kit.js';

const W = 360;
const H = 480;
const TIME = 45;
const FISH = [
  { pts: 1, size: 9, color: '#ffa94d', speed: [90, 140], weight: 60 },
  { pts: 2, size: 13, color: '#74c0fc', speed: [70, 110], weight: 30 },
  { pts: 5, size: 17, color: '#ffd43b', speed: [130, 170], weight: 10 },
];

export function start(root, onEnd) {
  const h = hud({ score: '🐟 <b>0</b>', lives: '❤️❤️❤️', time: `⏱ <b>${TIME}</b>` });
  const { cv, ctx } = canvas(root, W, H, { hudHtml: h.html, hint: 'Move with arrow keys / WASD, or point and drag. Gold fish are worth 5!' });
  const set = h.bind(root);
  const kb = keyboard();
  const ptr = pointer(cv, W, H);
  const pops = popups();

  const me = { x: W / 2, y: H / 2, vx: 0, vy: 0, inv: 0, face: 1 };
  let fish = [];
  let jellies = [];
  let score = 0;
  let lives = 3;
  let time = TIME;
  let spawnF = 0;
  let spawnJ = 2;
  let t = 0;

  const totalWeight = FISH.reduce((a, f) => a + f.weight, 0);
  function spawnFish() {
    let r = Math.random() * totalWeight;
    const kind = FISH.find((f) => (r -= f.weight) < 0) || FISH[0];
    const dir = Math.random() < 0.5 ? 1 : -1;
    fish.push({ ...kind, x: dir > 0 ? -30 : W + 30, y: rand(40, H - 40), vx: dir * rand(...kind.speed), wob: rand(0, 6) });
  }
  function spawnJelly() {
    jellies.push({ x: rand(30, W - 30), y: H + 30, vy: -rand(30, 55 + (TIME - time)), r: rand(13, 18), phase: rand(0, 6) });
  }

  function finish() {
    stop();
    kb.off(); ptr.off();
    onEnd({ pearls: score, best: score, summary: `You gobbled <b>${score}</b> points of fish!` });
  }

  const stop = loop((dt) => {
    t += dt;
    time -= dt;
    if (time <= 0 || lives <= 0) { draw(); setTimeout(finish, 0); return false; }

    // movement
    let ax = (kb.k.right ? 1 : 0) - (kb.k.left ? 1 : 0);
    let ay = (kb.k.down ? 1 : 0) - (kb.k.up ? 1 : 0);
    if (ax || ay) {
      me.vx += ax * 900 * dt; me.vy += ay * 900 * dt;
    } else if (ptr.p.x !== null) {
      me.vx += (ptr.p.x - me.x) * 10 * dt; me.vy += (ptr.p.y - me.y) * 10 * dt;
    }
    me.vx *= 0.9; me.vy *= 0.9;
    me.vx = clamp(me.vx, -260, 260); me.vy = clamp(me.vy, -260, 260);
    me.x = clamp(me.x + me.vx * dt, 20, W - 20);
    me.y = clamp(me.y + me.vy * dt, 20, H - 20);
    if (Math.abs(me.vx) > 10) me.face = me.vx > 0 ? 1 : -1;
    me.inv = Math.max(0, me.inv - dt);

    spawnF -= dt;
    if (spawnF <= 0) { spawnFish(); spawnF = rand(0.35, 0.7); }
    spawnJ -= dt;
    if (spawnJ <= 0) { spawnJelly(); spawnJ = Math.max(0.8, 2.4 - (TIME - time) * 0.04); }

    for (const f of fish) {
      f.x += f.vx * dt;
      f.wob += dt * 3;
      const dx = f.x - me.x;
      const dy = f.y + Math.sin(f.wob) * 4 - me.y;
      if (dx * dx + dy * dy < (22 + f.size) ** 2) {
        f.dead = true;
        score += f.pts;
        pops.add(f.x, f.y, `+${f.pts}`, f.pts === 5 ? '#ffe066' : '#fff');
      }
      if (f.x < -50 || f.x > W + 50) f.dead = true;
    }
    for (const j of jellies) {
      j.y += j.vy * dt;
      j.phase += dt;
      const jx = j.x + Math.sin(j.phase * 1.5) * 18;
      const dx = jx - me.x;
      const dy = j.y - me.y;
      if (!me.inv && dx * dx + dy * dy < (18 + j.r) ** 2) {
        lives -= 1;
        me.inv = 1.2;
        pops.add(me.x, me.y - 30, 'zap!', '#ff8787');
      }
      if (j.y < -50) j.dead = true;
    }
    fish = fish.filter((f) => !f.dead);
    jellies = jellies.filter((j) => !j.dead);
    pops.update(dt);

    set('score', `🐟 <b>${score}</b>`);
    set('lives', '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(3 - Math.max(0, lives)));
    set('time', `⏱ <b>${Math.ceil(time)}</b>`);
    draw();
  });

  function draw() {
    waterBackground(ctx, W, H, '#4dd4e6', '#0c6b80');
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 5; i++) ctx.fillRect(((i * 97 + t * 12) % (W + 60)) - 30, 0, 22, H);
    for (const f of fish) drawFish(ctx, f.x, f.y + Math.sin(f.wob) * 4, f.size, f.color, Math.sign(f.vx));
    for (const j of jellies) drawJelly(ctx, j.x + Math.sin(j.phase * 1.5) * 18, j.y, j.r, t);
    if (!(me.inv && Math.floor(me.inv * 10) % 2)) drawOtter(ctx, me.x, me.y, 22, { flip: me.face < 0 });
    pops.draw(ctx);
  }

  return () => { stop(); kb.off(); ptr.off(); };
}
