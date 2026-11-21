// Oyster Dive: catch falling oysters (+1) and pearls (+3), avoid urchins.
const W = 360;
const H = 480;
const DURATION = 45;
const OTTER_Y = H - 62;

export function start(root, onEnd) {
  root.innerHTML = `
    <div class="game-hud">
      <span>🦪 <b data-score>0</b></span>
      <span data-lives>❤️❤️❤️</span>
      <span>⏱ <b data-time>${DURATION}</b></span>
    </div>
    <canvas class="game-canvas" style="aspect-ratio:3/4" aria-label="Oyster Dive game"></canvas>
    <p class="hint">Move with ← → / A D, or drag. Oysters +1, pearls +3, and dodge the urchins!</p>`;

  const cv = root.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = W * dpr;
  cv.height = H * dpr;
  ctx.scale(dpr, dpr);

  const hud = {
    score: root.querySelector('[data-score]'),
    lives: root.querySelector('[data-lives]'),
    time: root.querySelector('[data-time]'),
  };

  let px = W / 2;
  let targetX = null;
  const keys = { left: false, right: false };
  let items = [];
  let pops = [];
  let score = 0;
  let lives = 3;
  let time = DURATION;
  let spawn = 0.4;
  let flash = 0;
  let raf = 0;
  let last = performance.now();
  let done = false;
  const bubbles = Array.from({ length: 14 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 3, v: 15 + Math.random() * 25 }));

  const onKey = (down) => (e) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { keys.left = down; targetX = null; e.preventDefault(); }
    if (k === 'arrowright' || k === 'd') { keys.right = down; targetX = null; e.preventDefault(); }
  };
  const kd = onKey(true);
  const ku = onKey(false);
  const toX = (e) => {
    const r = cv.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * W;
  };
  const pd = (e) => { targetX = toX(e); cv.setPointerCapture?.(e.pointerId); };
  const pm = (e) => { if (e.buttons || e.pointerType === 'touch' || e.pointerType === 'mouse') targetX = toX(e); };

  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  cv.addEventListener('pointerdown', pd);
  cv.addEventListener('pointermove', pm);

  function cleanup() {
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', kd);
    window.removeEventListener('keyup', ku);
  }

  function finish() {
    if (done) return;
    done = true;
    cleanup();
    onEnd({ score, pearls: score, summary: `You caught <b>${score}</b> points of treasure!`, best: score });
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    time -= dt;
    if (time <= 0 || lives <= 0) {
      draw();
      finish();
      return;
    }
    const elapsed = DURATION - time;

    if (keys.left) px -= 330 * dt;
    if (keys.right) px += 330 * dt;
    if (targetX !== null) px += (targetX - px) * Math.min(1, dt * 12);
    px = Math.max(26, Math.min(W - 26, px));

    spawn -= dt;
    if (spawn <= 0) {
      spawn = Math.max(0.26, 0.75 - elapsed * 0.011);
      const r = Math.random();
      const urchinChance = Math.min(0.38, 0.16 + elapsed * 0.005);
      const type = r < 0.12 ? 'pearl' : r < 0.12 + urchinChance ? 'urchin' : 'oyster';
      const speed = (105 + elapsed * 4.2) * (type === 'pearl' ? 1.3 : 1) * (0.85 + Math.random() * 0.3);
      items.push({ type, x: 20 + Math.random() * (W - 40), y: -20, vy: speed, rot: Math.random() * 6 });
    }

    for (const it of items) {
      it.y += it.vy * dt;
      it.rot += dt * 2;
      const dx = it.x - px;
      const dy = it.y - OTTER_Y;
      if (dx * dx + dy * dy < 34 * 34) {
        it.dead = true;
        if (it.type === 'urchin') {
          lives -= 1;
          flash = 0.35;
          pops.push({ x: it.x, y: it.y, text: 'ouch!', color: '#ff6b6b', life: 0.8 });
        } else {
          const pts = it.type === 'pearl' ? 3 : 1;
          score += pts;
          pops.push({ x: it.x, y: it.y, text: `+${pts}`, color: it.type === 'pearl' ? '#fff3bf' : '#e3fafc', life: 0.8 });
        }
      }
      if (it.y > H + 30) it.dead = true;
    }
    items = items.filter((i) => !i.dead);
    for (const p of pops) { p.life -= dt; p.y -= 40 * dt; }
    pops = pops.filter((p) => p.life > 0);
    for (const b of bubbles) { b.y -= b.v * dt; if (b.y < -5) { b.y = H + 5; b.x = Math.random() * W; } }
    flash = Math.max(0, flash - dt);

    hud.score.textContent = score;
    hud.lives.textContent = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(3 - Math.max(0, lives));
    hud.time.textContent = Math.ceil(time);

    draw();
    raf = requestAnimationFrame(loop);
  }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#3bc9db');
    g.addColorStop(0.6, '#1098ad');
    g.addColorStop(1, '#0b7285');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(40 + i * 90, 0);
      ctx.lineTo(80 + i * 90, 0);
      ctx.lineTo(20 + i * 90, H);
      ctx.lineTo(-20 + i * 90, H);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (const b of bubbles) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); }

    ctx.fillStyle = '#e9d8a6';
    ctx.beginPath();
    ctx.moveTo(0, H - 22);
    ctx.quadraticCurveTo(W / 2, H - 38, W, H - 22);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();

    for (const it of items) drawItem(it);
    drawOtter(px, OTTER_Y);

    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const p of pops) {
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;

    if (flash > 0) {
      ctx.fillStyle = `rgba(255,80,80,${flash})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawItem(it) {
    ctx.save();
    ctx.translate(it.x, it.y);
    if (it.type === 'oyster') {
      ctx.rotate(Math.sin(it.rot) * 0.3);
      ctx.fillStyle = '#adb5bd';
      ctx.strokeStyle = '#495057';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, 16, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-11, -1); ctx.quadraticCurveTo(0, -10, 11, -1);
      ctx.moveTo(-8, 5); ctx.quadraticCurveTo(0, -2, 8, 5); ctx.stroke();
    } else if (it.type === 'pearl') {
      ctx.shadowColor = '#fff3bf';
      ctx.shadowBlur = 14;
      const rg = ctx.createRadialGradient(-3, -3, 1, 0, 0, 10);
      rg.addColorStop(0, '#ffffff');
      rg.addColorStop(1, '#e9e3d5');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.rotate(it.rot);
      ctx.strokeStyle = '#2b1d3a';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8); ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20); ctx.stroke();
      }
      ctx.fillStyle = '#5f3dc4';
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawOtter(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#6b4329';
    ctx.beginPath(); ctx.arc(-20, -20, 9, 0, Math.PI * 2); ctx.arc(20, -20, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a5a3b';
    ctx.beginPath(); ctx.ellipse(0, 26, 30, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f1dcc0';
    ctx.beginPath(); ctx.ellipse(0, 9, 15, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1a10';
    ctx.beginPath(); ctx.arc(-10, -4, 4, 0, Math.PI * 2); ctx.arc(10, -4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-8.5, -5.5, 1.4, 0, Math.PI * 2); ctx.arc(11.5, -5.5, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b2418';
    ctx.beginPath(); ctx.ellipse(0, 4, 5, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4329';
    ctx.beginPath(); ctx.arc(-26, -26, 7, 0, Math.PI * 2); ctx.arc(26, -26, 7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  draw();
  raf = requestAnimationFrame((t) => { last = t; loop(t); });
  return cleanup;
}
