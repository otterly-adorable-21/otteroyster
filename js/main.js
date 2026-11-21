import { ITEMS, SLOTS, SNACKS, MISSIONS, GAME_LIST, GAME_CATEGORIES, NAME_IDEAS } from './data.js';
import * as core from './core.js';
import { otterSVG, itemPreviewSVG } from './otter.js';
import { LOADERS } from './games/index.js';
import { sync } from './sync.js';
import { detectArt, art } from './assets.js';
import { FURNITURE, WALLPAPERS, FLOORS, DEN_CATS } from './den-data.js';
import { denSVG, furniturePreviewSVG } from './den.js';

// ---------- helpers ----------
const $ = (s) => document.querySelector(s);
const { clamp, rand } = core;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SAVE_KEY = 'otteroyster.save.v1';

function fmtTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
const fmtMinutes = (m) => (m >= 60 ? `${m / 60}h` : `${m} min`);
const NEEDS = { hunger: '🐟', energy: '💤', clean: '🛁', happiness: '🎾' };

function loadLocal() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? core.normalize(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
function saveLocal() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* storage blocked */ }
}

let state = loadLocal() || core.defaultState();
let tab = 'home';
let closetView = 'wardrobe';
let lastOtter = '';
let gameCleanup = null;
let gameOpen = false;
let linkedName = '';

// ---------- action plumbing ----------
function act(res) {
  if (!res.ok) { toast(res.msg); return res; }
  if (res.msg) toast(res.msg);
  if (res.fx) { burst(res.fx, 7); bounce(); }
  if (res.ups) levelUp();
  commit();
  return res;
}

function levelUp() {
  toast(`⭐ Level up! ${state.name} is now level ${state.level}`);
  burst(['⭐', '✨', '🎉'], 10);
}

function runTick() {
  const events = core.tick(state);
  let changed = false;
  for (const e of events) {
    if (e.type === 'woke') toast(`☀️ ${state.name} woke up!`);
    changed = true;
  }
  showReports();
  return changed;
}

function showReports() {
  if (gameOpen || !$('#modal').hidden) return;
  const reports = core.takeReports(state);
  if (!reports.length) return;
  commit();
  const r = reports[reports.length - 1];
  const m = MISSIONS.find((x) => x.id === r.id);
  if (r.ups) levelUp();
  showModal(`
    <div class="result">
      <div class="result-icon">${m.icon}</div>
      <h2>${esc(state.name)} is back!</h2>
      <p>${esc(state.name)} ${r.story}</p>
      <div class="rewards">
        <span class="chip"><span class="pearl-icon"></span> +${r.pearls}</span>
        <span class="chip">⭐ +${r.xp} XP</span>
      </div>
      ${r.found ? `<div class="loot"><div class="loot-art">${itemPreviewSVG(r.found)}</div><p>Found a rare item: <b>${ITEMS[r.found].name}</b>! Check your closet.</p></div>` : ''}
      ${reports.length > 1 ? `<p class="muted">+${reports.length - 1} more mission report${reports.length > 2 ? 's' : ''} in the journal.</p>` : ''}
      <button class="btn primary" data-close>Yay!</button>
    </div>`);
}

// ---------- minigames ----------
async function playGame(id) {
  const g = GAME_LIST.find((x) => x.id === id);
  const res = core.payForGame(state, id);
  if (!res.ok) return toast(res.msg);
  commit();
  gameOpen = true;
  showModal(`<div class="game-wrap"><div class="game-top"><h2>${g.icon} ${g.name}</h2>
    <button class="icon-btn" data-quit aria-label="Quit game">✕</button></div><div class="game-root"><p class="hint">Loading…</p></div></div>`, { wide: true });
  const root = $('#modal .game-root');
  try {
    const mod = await LOADERS[id]();
    if (!gameOpen) return;
    gameCleanup = mod.start(root, (r) => endGame(g, r));
  } catch (err) {
    console.error(err);
    root.innerHTML = '<p class="hint">Sorry, this game failed to load.</p>';
  }
}

function endGame(g, r) {
  gameCleanup = null;
  gameOpen = false;
  const res = core.rewardGame(state, g.id, r.pearls, r.best, !!g.lowerIsBetter);
  if (res.ups) levelUp();
  commit();
  sync.score(g.id, r.best);
  $('#modal-card').innerHTML = `
    <div class="result">
      <div class="result-icon">${g.icon}</div>
      <h2>${res.record ? 'New record! 🏆' : 'Nice job!'}</h2>
      <p>${r.summary}</p>
      <div class="rewards"><span class="chip"><span class="pearl-icon"></span> +${res.pearls}</span><span class="chip">💛 +10</span></div>
      <div class="row">
        <button class="btn" data-action="game" data-id="${g.id}">Play again</button>
        <button class="btn primary" data-close>Done</button>
      </div>
    </div>`;
}

function quitGame() {
  if (gameCleanup) { gameCleanup(); gameCleanup = null; }
  gameOpen = false;
  closeModal();
}

// ---------- rendering ----------
function renderHeader() {
  $('#otter-name').textContent = state.name || 'Otter & Oyster';
  $('#level').textContent = state.level;
  $('#xp-fill').style.width = `${(state.xp / core.xpNeed(state.level)) * 100}%`;
  $('#pearls').textContent = state.pearls;
  $('#sync-dot').hidden = !sync.linked;
  $('#sync-dot').classList.toggle('off', !sync.online);
}

function renderStats() {
  $('#stats').innerHTML = core.STAT_INFO.map((s) => {
    const v = Math.round(state.stats[s.id]);
    const cls = v < 25 ? 'low' : v < 55 ? 'mid' : 'high';
    return `<div class="stat ${cls}" title="${s.label}: ${v}%">
      <span class="stat-icon">${s.icon}</span>
      <div class="stat-body"><div class="stat-label">${s.label}<span>${v}</span></div>
      <div class="bar"><div style="width:${v}%"></div></div></div></div>`;
  }).join('');
}

function renderScene() {
  const away = !!state.mission;
  const scene = $('#scene');
  scene.classList.toggle('night', state.sleeping);
  scene.dataset.mood = core.mood(state);
  $('#otter-wrap').hidden = away;
  $('#away').hidden = !away;
  $('#zzz').hidden = !state.sleeping || away;

  if (away) {
    const m = MISSIONS.find((x) => x.id === state.mission.id);
    $('#away').innerHTML = `<div class="away-icon">${m.icon}</div><p><b>${esc(state.name)}</b> is on <b>${m.name}</b></p><p class="countdown">${fmtTime(state.mission.endsAt - Date.now())}</p>`;
  } else {
    const svg = otterSVG(state);
    if (svg !== lastOtter) { $('#otter').innerHTML = svg; lastOtter = svg; }
  }

  const thought = $('#thought');
  const low = Object.entries(state.stats).filter(([, v]) => v < 35).sort((a, b) => a[1] - b[1])[0];
  thought.hidden = !(!away && !state.sleeping && low);
  if (!thought.hidden) thought.textContent = NEEDS[low[0]];
}

function itemCard(id, mode) {
  const it = ITEMS[id];
  const owned = state.owned.includes(id);
  const worn = state.equipped[it.slot] === id;
  let action;
  if (mode === 'wardrobe') {
    action = `<button class="btn small ${worn ? 'primary' : ''}" data-action="wear" data-id="${id}">${worn ? 'Wearing ✓' : 'Wear'}</button>`;
  } else if (owned) {
    action = '<button class="btn small" disabled>Owned</button>';
  } else if (state.level < it.level) {
    action = `<button class="btn small" disabled>🔒 Lv ${it.level}</button>`;
  } else {
    action = `<button class="btn small primary" data-action="buy" data-id="${id}" ${state.pearls < it.price ? 'disabled' : ''}><span class="pearl-icon"></span> ${it.price}</button>`;
  }
  return `<div class="card item ${worn ? 'worn' : ''}"><div class="item-art">${itemPreviewSVG(id)}</div><div class="item-name">${it.name}</div>${action}</div>`;
}

function panelHome() {
  const claimed = state.lastDaily === core.dayKey();
  const asleep = state.sleeping;
  return `
    <h2 class="section-title">Snacks</h2>
    <div class="snacks">
      ${SNACKS.map((s) => `<button class="snack" data-action="feed" data-id="${s.id}" ${state.pearls < s.price ? 'disabled' : ''}>
        <span class="snack-icon">${s.icon}</span><span class="snack-name">${s.name}</span>
        <span class="snack-price">${s.price ? `<span class="pearl-icon"></span> ${s.price}` : 'Free'}</span></button>`).join('')}
    </div>
    <h2 class="section-title">Care</h2>
    <div class="actions">
      <button class="action" data-action="pet"><span>🤗</span>Cuddle</button>
      <button class="action" data-action="bath"><span>🛁</span>Bath</button>
      <button class="action" data-action="sleep"><span>${asleep ? '☀️' : '🌙'}</span>${asleep ? 'Wake up' : 'Nap'}</button>
      <button class="action ${claimed ? '' : 'glow'}" data-action="daily"><span>🎁</span>${claimed ? 'Gift claimed' : 'Daily gift'}</button>
    </div>
    <h2 class="section-title">Journal</h2>
    <ul class="journal">
      ${state.log.slice(0, 6).map((l) => `<li><time>${new Date(l.t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>${esc(l.msg)}</li>`).join('') || '<li>Nothing yet. Say hi to your otter!</li>'}
    </ul>
    <div class="settings">
      <button class="link" data-action="rename">Rename</button>·<button class="link" data-action="reset">Start over</button>
    </div>`;
}

function panelCloset() {
  const toggle = `<div class="segmented">
    <button data-closet="wardrobe" aria-pressed="${closetView === 'wardrobe'}">👗 My clothes</button>
    <button data-closet="shop" aria-pressed="${closetView === 'shop'}">🛍️ Shop</button></div>`;
  if (closetView === 'shop') {
    return toggle + SLOTS.map((slot) => {
      const ids = Object.keys(ITEMS).filter((id) => ITEMS[id].slot === slot.id && ITEMS[id].price !== null);
      return `<h2 class="section-title">${slot.name}</h2><div class="grid">${ids.map((id) => itemCard(id, 'shop')).join('')}</div>`;
    }).join('') + '<p class="note">✨ Some rare items can only be found on missions.</p>';
  }
  if (!state.owned.length) {
    return `${toggle}<div class="empty"><div class="empty-icon">👗</div><p>No clothes yet! Buy some in the <button class="link" data-closet="shop">shop</button> or find rare items on <button class="link" data-tab="missions">missions</button>.</p></div>`;
  }
  return toggle + SLOTS.map((slot) => {
    const ids = state.owned.filter((id) => ITEMS[id].slot === slot.id);
    if (!ids.length) return '';
    return `<h2 class="section-title">${slot.name}</h2><div class="grid">${ids.map((id) => itemCard(id, 'wardrobe')).join('')}</div>`;
  }).join('') + '<div class="settings"><button class="link" data-action="undress">Take everything off</button></div>';
}

function panelMissions() {
  let head = '';
  if (state.mission) {
    const m = MISSIONS.find((x) => x.id === state.mission.id);
    const pct = clamp(((Date.now() - state.mission.start) / (state.mission.endsAt - state.mission.start)) * 100);
    head = `<div class="card mission-active">
      <div class="mission-head"><span class="mission-icon">${m.icon}</span><div><b>${m.name}</b><div class="muted">Returns in <span data-live="mission-left">${fmtTime(state.mission.endsAt - Date.now())}</span></div></div></div>
      <div class="bar big"><div data-live="mission-bar" style="width:${pct}%"></div></div>
      <button class="link" data-action="recall">Call ${esc(state.name)} home early (no rewards)</button></div>`;
  }
  const list = MISSIONS.map((m) => {
    const locked = state.level < m.level;
    const loot = m.loot.map(([id]) => ITEMS[id].icon).join(' ');
    const disabled = locked || !!state.mission || state.sleeping || state.stats.energy < m.energy;
    return `<div class="card mission ${locked ? 'locked' : ''}">
      <div class="mission-head"><span class="mission-icon">${m.icon}</span>
        <div><b>${m.name}</b><div class="muted">⏱ ${fmtMinutes(m.minutes)} · ⚡ ${m.energy} energy</div>
        <div class="muted"><span class="pearl-icon"></span> ${m.pearls[0]}–${m.pearls[1]}${loot ? ` · rare: ${loot}` : ''}</div></div></div>
      <button class="btn small ${disabled ? '' : 'primary'}" data-action="mission" data-id="${m.id}" ${disabled ? 'disabled' : ''}>${locked ? `🔒 Lv ${m.level}` : 'Go!'}</button>
    </div>`;
  }).join('');
  return `${head}<h2 class="section-title">Missions</h2><div class="missions">${list}</div>
    <p class="note">Missions run in real time, even when this page is closed. You can also start them from Discord with <code>/mission</code>.</p>`;
}

function bestLabel(g) {
  const b = state.best[g.id];
  return b == null ? '' : `🏆 ${b} ${g.scoreLabel}`;
}

function panelArcade() {
  return GAME_CATEGORIES.map((cat) => `
    <h2 class="section-title">${cat.name} <small>${cat.desc}</small></h2>
    <div class="arcade">${GAME_LIST.filter((g) => g.category === cat.id).map((g) => `
      <div class="card arcade-card">
        <button class="arcade-play" data-action="game" data-id="${g.id}" aria-label="Play ${g.name}">
          <span class="arcade-icon">${g.icon}</span>
          <b>${g.name}</b>
          <span class="muted">${g.desc}</span>
        </button>
        <div class="arcade-foot"><span class="muted">⚡ ${g.energy}${bestLabel(g) ? ` · ${bestLabel(g)}` : ''}</span>
        ${sync.online ? `<button class="link small" data-action="board" data-id="${g.id}">Leaderboard</button>` : ''}</div>
      </div>`).join('')}
    </div>`).join('') + `<p class="note">Games cost a little energy, earn pearls and make ${esc(state.name || 'your otter')} happy.</p>`;
}

function panelDiscord() {
  const cmds = `
    <h2 class="section-title">Bot commands</h2>
    <div class="card cmd-list">
      <div><code>/pet</code> See your otter and feed, cuddle, bathe or nap</div>
      <div><code>/daily</code> Daily treasure chest</div>
      <div><code>/den</code> Show off your den · <code>/visit @friend</code> Peek inside a friend's den</div>
      <div><code>/mission</code> Send your otter on an adventure</div>
      <div><code>/play</code> Solo games: trivia, fishing, hangman, minesweeper and more</div>
      <div><code>/challenge</code> Challenge a friend: Connect Four, Tic-Tac-Toe, Rock Paper Scissors</div>
      <div><code>/party</code> Group games for voice chats: Impostor, Trivia Battle, Categories and more</div>
      <div><code>/leaderboard</code> Top scores · <code>/profile</code> Show off your otter</div>
    </div>`;
  if (!sync.online) {
    return `<div class="empty"><div class="empty-icon">📡</div><p>The OtterOyster server isn't reachable right now, so Discord linking is unavailable. Your otter is still saved on this device.</p>
      <button class="btn" data-action="recheck">Try again</button></div>${cmds}`;
  }
  const invite = sync.info?.invite;
  if (sync.linked) {
    return `<div class="card linked">
      <div class="linked-head"><span class="big-emoji">🔗</span><div><b>Linked to Discord</b>
      <div class="muted">${linkedName ? `Discord: <b>${esc(linkedName)}</b> · ` : ''}${esc(state.name || 'Your otter')} is shared between this website and the bot.</div></div></div>
      <div class="row"><button class="btn" data-action="syncnow">Sync now</button><button class="btn" data-action="unlink">Unlink</button></div>
    </div>${invite ? `<p class="note"><a href="${esc(invite)}" target="_blank" rel="noopener">Add the bot to a server or your account</a></p>` : ''}${cmds}`;
  }
  return `<div class="card">
    <img class="hero-art" src="${art.float || 'assets/web/otter-float.webp'}" alt="">
    <h2 class="section-title flush">Bring ${esc(state.name || 'your otter')} to Discord 🦦</h2>
    <ol class="steps">
      <li>${invite ? `<a href="${esc(invite)}" target="_blank" rel="noopener">Add the OtterOyster bot</a>` : 'Add the OtterOyster bot'} to your Discord account or a server.</li>
      <li>Type <code>/link</code> anywhere the bot is. It privately sends you a 6-letter code.</li>
      <li>Enter the code here:</li>
    </ol>
    <form class="link-form" data-form="link">
      <input name="code" maxlength="6" autocomplete="off" placeholder="ABC123" aria-label="Link code" required>
      <button class="btn primary" type="submit">Link</button>
    </form>
  </div>${cmds}`;
}

// ---------- the den ----------
let denEdit = false;
let denSel = null;
let denShop = 'furniture';

function denStageHTML() {
  return denSVG(state, { editable: denEdit, selected: denEdit ? denSel : null, extraAttrs: 'class="den-svg" role="img" aria-label="Your otter\'s den"' });
}

function cozyLine() {
  const c = core.coziness(state);
  const pct = Math.round((c / 60) * 100);
  return `<div class="cozy"><span>✨ Coziness <b>${c}</b>/${core.COZY_MAX}</span><div class="bar"><div style="width:${(c / core.COZY_MAX) * 100}%"></div></div>
    <small>${c ? `Happiness drops ${pct}% slower and naps are ${pct}% more restful.` : 'Add furniture to make your den cozier!'}</small></div>`;
}

function panelDen() {
  const sel = denSel && denSel !== 'otter' ? state.den.items.find((p) => p.uid === denSel) : null;
  const storage = Object.keys(FURNITURE).filter((id) => core.inStorage(state, id) > 0);
  const toolbar = denEdit
    ? `<div class="den-toolbar">
        ${sel ? `<span class="den-sel-name">${FURNITURE[sel.id].name}</span>
          <button class="btn small" data-action="den-flip">↔️ Flip</button>
          <button class="btn small" data-action="den-store">📦 Put away</button>`
        : '<span class="den-sel-name muted">Drag things around · tap one to flip or put it away</span>'}
        <button class="btn small primary" data-action="den-edit">✅ Done</button></div>`
    : `<div class="den-toolbar"><span class="den-sel-name muted">${state.mission ? `${esc(state.name)} is out exploring.` : `Tap ${esc(state.name)} for a cuddle.`}</span>
        <button class="btn small primary" data-action="den-edit">✏️ Decorate</button></div>`;

  const shopTabs = [...DEN_CATS, { id: 'walls', name: 'Walls & floors', icon: '🎨' }];
  let shop;
  if (denShop === 'walls') {
    const sw = (kind, id, it, owned, active) => `<button class="swatch ${active ? 'on' : ''}" data-action="den-${kind}" data-id="${id}" ${!owned && state.pearls < it.price ? 'disabled' : ''}>
        <span class="swatch-chip" style="background:${it.swatch}"></span><b>${it.name}</b>
        <small>${active ? 'In use ✓' : owned ? 'Owned' : `<span class="pearl-icon"></span> ${it.price}`}</small></button>`;
    shop = `<h3 class="den-sub">Wallpaper</h3><div class="swatches">${Object.entries(WALLPAPERS).map(([id, it]) => sw('wall', id, it, state.wallpapers.includes(id), state.den.wallpaper === id)).join('')}</div>
      <h3 class="den-sub">Floors</h3><div class="swatches">${Object.entries(FLOORS).map(([id, it]) => sw('floor', id, it, state.floors.includes(id), state.den.floor === id)).join('')}</div>`;
  } else {
    shop = `<div class="grid">${Object.entries(FURNITURE).filter(([, it]) => it.cat === denShop).map(([id, it]) => {
      const owned = state.furniture[id] || 0;
      const locked = state.level < it.level;
      return `<div class="card item"><div class="item-art den-art">${furniturePreviewSVG(id)}</div><div class="item-name">${it.name}</div>
        <small class="muted">✨ +${it.cozy}${owned ? ` · own ${owned}` : ''}</small>
        ${locked ? `<button class="btn small" disabled>🔒 Lv ${it.level}</button>`
    : `<button class="btn small primary" data-action="den-buy" data-id="${id}" ${state.pearls < it.price ? 'disabled' : ''}><span class="pearl-icon"></span> ${it.price}</button>`}</div>`;
    }).join('')}</div>`;
  }

  return `
    <h2 class="section-title">${esc(state.name || 'Your otter')}'s Den</h2>
    <div class="den-stage ${denEdit ? 'editing' : ''}" id="den-stage">${denStageHTML()}</div>
    ${toolbar}
    ${cozyLine()}
    ${storage.length ? `<h2 class="section-title">Storage <small>tap to put it back in the den</small></h2>
      <div class="storage">${storage.map((id) => `<button class="store-item" data-action="den-place" data-id="${id}" title="${FURNITURE[id].name}">
        <span class="den-art">${furniturePreviewSVG(id)}</span><b>×${core.inStorage(state, id)}</b></button>`).join('')}</div>` : ''}
    <h2 class="section-title">Furniture shop</h2>
    <div class="chips">${shopTabs.map((c) => `<button class="chip-btn" data-denshop="${c.id}" aria-pressed="${denShop === c.id}">${c.icon} ${c.name}</button>`).join('')}</div>
    ${shop}`;
}

// Drag-and-drop inside the den SVG.
let drag = null;
function svgPoint(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}
function redrawDen() {
  const stage = $('#den-stage');
  if (stage) stage.innerHTML = denStageHTML();
}
document.addEventListener('pointerdown', (e) => {
  const stage = e.target.closest('#den-stage');
  if (!stage) return;
  const g = e.target.closest('.den-item');
  if (!denEdit) {
    if (g?.dataset.uid === 'otter') act(core.cuddle(state));
    return;
  }
  if (!g || !g.classList.contains('editable')) { denSel = null; renderPanel(); return; }
  e.preventDefault();
  const uid = g.dataset.uid;
  const svg = stage.querySelector('svg');
  const p = svgPoint(svg, e);
  const cur = uid === 'otter' ? (state.den.otter || { x: 196, y: 286 }) : state.den.items.find((q) => q.uid === uid);
  drag = { uid, dx: cur.x - p.x, dy: cur.y - p.y, moved: false, raf: 0 };
  if (denSel !== uid) { denSel = uid; renderPanel(); }
  $('#den-stage').setPointerCapture?.(e.pointerId);
});
document.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const svg = $('#den-stage svg');
  if (!svg) return;
  const p = svgPoint(svg, e);
  core.moveItem(state, drag.uid, p.x + drag.dx, p.y + drag.dy);
  drag.moved = true;
  if (!drag.raf) drag.raf = requestAnimationFrame(() => { if (drag) drag.raf = 0; redrawDen(); });
});
document.addEventListener('pointerup', () => {
  if (!drag) return;
  const moved = drag.moved;
  drag = null;
  if (moved) commit();
});

const PANELS = { home: panelHome, den: panelDen, closet: panelCloset, missions: panelMissions, arcade: panelArcade, discord: panelDiscord };

function renderPanel() {
  $('#panel').innerHTML = PANELS[tab]();
  document.body.dataset.view = tab;
  document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'));
}

function renderAll() {
  renderHeader();
  renderStats();
  renderScene();
}

let pushTimer = 0;
function commit({ push = true } = {}) {
  saveLocal();
  renderAll();
  renderPanel();
  if (push && sync.linked) {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, 700);
  }
}

function updateLive() {
  if (!state.mission) return;
  const left = document.querySelector('[data-live="mission-left"]');
  const bar = document.querySelector('[data-live="mission-bar"]');
  if (left) left.textContent = fmtTime(state.mission.endsAt - Date.now());
  if (bar) bar.style.width = `${clamp(((Date.now() - state.mission.start) / (state.mission.endsAt - state.mission.start)) * 100)}%`;
}

// ---------- sync ----------
async function pushNow() {
  if (!sync.linked || !sync.online) return;
  try {
    const r = await sync.push(state);
    if (r.conflict) adoptRemote(r.state, r.version, 'Updated with changes from Discord 🔄');
  } catch { /* offline; will retry on next change */ }
}

async function pullNow(quiet = true) {
  if (!sync.linked || gameOpen) return;
  try {
    const r = await sync.pull();
    if (r?.discordName) linkedName = r.discordName;
    if (r && r.version > sync.version) adoptRemote(r.state, r.version, quiet ? '' : 'Synced!');
    else if (!quiet) toast('Already up to date ✓');
  } catch { /* offline */ }
}

function adoptRemote(remote, version, msg) {
  state = core.normalize(remote);
  sync.version = version;
  lastOtter = '';
  runTick();
  commit({ push: false });
  if (msg) toast(msg);
}

// ---------- effects ----------
function burst(icons, n) {
  const fx = $('#fx');
  for (let i = 0; i < n; i++) {
    const el = document.createElement('span');
    el.className = 'particle';
    el.textContent = icons[i % icons.length];
    el.style.left = `${40 + Math.random() * 20}%`;
    el.style.top = `${45 + Math.random() * 15}%`;
    el.style.setProperty('--dx', `${(Math.random() - 0.5) * 180}px`);
    el.style.setProperty('--dy', `${-80 - Math.random() * 120}px`);
    el.style.animationDelay = `${Math.random() * 0.15}s`;
    fx.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }
}

function bounce() {
  const w = $('#otter-wrap');
  w.classList.remove('bounce');
  void w.offsetWidth;
  w.classList.add('bounce');
}

let toastTimer = 0;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---------- modal ----------
function showModal(html, { wide = false, locked = false } = {}) {
  const m = $('#modal');
  $('#modal-card').innerHTML = html;
  m.classList.toggle('wide', wide);
  m.dataset.locked = locked ? '1' : '';
  m.hidden = false;
}

function closeModal() {
  if (gameCleanup) { gameCleanup(); gameCleanup = null; }
  gameOpen = false;
  $('#modal').hidden = true;
  $('#modal-card').innerHTML = '';
  setTimeout(showReports, 300);
}

function askName(first) {
  const idea = NAME_IDEAS[Math.floor(Math.random() * NAME_IDEAS.length)];
  const preview = { ...core.defaultState(), stats: { hunger: 90, happiness: 90, energy: 90, clean: 90 } };
  showModal(`
    <form class="adopt" data-form="name">
      ${first ? `<img class="adopt-logo" src="${art.logo || 'assets/web/logo.webp'}" alt="Otter &amp; Oyster">` : ''}
      <div class="adopt-otter"><svg viewBox="0 -20 200 250">${otterSVG(preview, { idPrefix: 'adopt-otter' })}</svg></div>
      <h2>${first ? 'A baby otter washed up with an oyster!' : 'Rename your otter'}</h2>
      ${first ? '<p>Give your new friend a name. Feed them, dress them up, send them on adventures and play games together.</p>' : ''}
      <input name="name" maxlength="16" required autocomplete="off" placeholder="${idea}" value="${first ? '' : esc(state.name)}" aria-label="Otter name">
      <button class="btn primary" type="submit">${first ? 'Adopt 🦦' : 'Save'}</button>
      ${first && sync.online ? '<button class="link" type="button" data-action="havediscord">Already have an otter on Discord?</button>' : ''}
    </form>`, { locked: first });
  setTimeout(() => $('#modal input')?.focus(), 50);
}

async function showLeaderboard(id) {
  const g = GAME_LIST.find((x) => x.id === id);
  showModal(`<div class="result"><div class="result-icon">${g.icon}</div><h2>${g.name}</h2><p>Loading top scores…</p></div>`);
  let top = null;
  try { top = await sync.leaderboard(id); } catch { /* offline */ }
  if ($('#modal').hidden) return;
  $('#modal-card').innerHTML = `<div class="result"><div class="result-icon">${g.icon}</div><h2>${g.name} leaderboard</h2>
    ${top && top.length ? `<ol class="board">${top.map((r) => `<li><span>${esc(r.name)}</span><b>${r.score} ${g.scoreLabel}</b></li>`).join('')}</ol>`
    : '<p>No scores yet. Link Discord and be the first!</p>'}
    <button class="btn primary" data-close>Close</button></div>`;
}

async function doLink(code, keep) {
  const r = await sync.link(code.trim().toUpperCase(), state.name ? state : null, keep);
  if (r.status === 409 && r.conflict) {
    showModal(`<div class="result"><div class="result-icon">🦦🦦</div><h2>Two otters!</h2>
      <p>Your Discord account already has <b>${esc(r.server.name)}</b> (level ${r.server.level}). This website has <b>${esc(state.name)}</b> (level ${state.level}). Which one do you want to keep?</p>
      <div class="row"><button class="btn" data-action="keep" data-keep="discord" data-code="${esc(code)}">Keep ${esc(r.server.name)}</button>
      <button class="btn primary" data-action="keep" data-keep="web" data-code="${esc(code)}">Keep ${esc(state.name)}</button></div>
      <p class="muted">The other otter will be released back to the sea.</p></div>`);
    return;
  }
  if (!r.token) { toast(r.error || 'That code did not work. Try /link again.'); return; }
  linkedName = r.discordName || '';
  closeModal();
  await sync.check();
  adoptRemote(r.state, r.version, `🔗 Linked! ${r.state.name} can now visit Discord.`);
}

// ---------- events ----------
document.addEventListener('click', async (e) => {
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) {
    tab = tabBtn.dataset.tab;
    renderPanel();
    if (tabBtn.closest('.tabs')) window.scrollTo({ top: 0 });
    return;
  }
  const shopBtn = e.target.closest('[data-denshop]');
  if (shopBtn) { denShop = shopBtn.dataset.denshop; return renderPanel(); }
  const closetBtn = e.target.closest('[data-closet]');
  if (closetBtn) { closetView = closetBtn.dataset.closet; tab = 'closet'; return renderPanel(); }
  if (e.target.closest('[data-close]')) return closeModal();
  if (e.target.closest('[data-quit]')) return quitGame();
  if (e.target.id === 'modal' && !$('#modal').dataset.locked && !gameOpen) return closeModal();

  const a = e.target.closest('[data-action]');
  if (!a) return;
  const id = a.dataset.id;
  switch (a.dataset.action) {
    case 'feed': return act(core.feed(state, id));
    case 'pet': return act(core.cuddle(state));
    case 'bath': return act(core.bath(state));
    case 'sleep': return act(core.toggleSleep(state));
    case 'daily': return act(core.claimDaily(state));
    case 'buy': return act(core.buy(state, id));
    case 'wear': bounce(); return act({ ...core.toggleWear(state, id), msg: '' });
    case 'den-edit': denEdit = !denEdit; denSel = null; return renderPanel();
    case 'den-buy': {
      const r = act(core.buyFurniture(state, id));
      if (r.ok) { denEdit = true; denSel = r.uid; renderPanel(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      return r;
    }
    case 'den-place': {
      const r = core.placeFurniture(state, id);
      if (!r.ok) return toast(r.msg);
      denEdit = true; denSel = r.uid; commit(); window.scrollTo({ top: 0, behavior: 'smooth' });
      return r;
    }
    case 'den-flip': core.flipItem(state, denSel); return commit();
    case 'den-store': { const r = core.storeItem(state, denSel); denSel = null; return act(r); }
    case 'den-wall': return act(core.setWallpaper(state, id));
    case 'den-floor': return act(core.setFloor(state, id));
    case 'undress': Object.keys(state.equipped).forEach((k) => { state.equipped[k] = null; }); return commit();
    case 'mission': return act(core.startMission(state, id));
    case 'recall': return act(core.recallMission(state));
    case 'game': closeModal(); return playGame(id);
    case 'board': return showLeaderboard(id);
    case 'rename': return askName(false);
    case 'recheck': await sync.check(); return renderAll() || renderPanel();
    case 'syncnow': return pullNow(false);
    case 'unlink':
      if (confirm('Unlink from Discord? Your otter stays on this device, but changes will stop syncing.')) {
        sync.unlink();
        commit({ push: false });
        toast('Unlinked from Discord.');
      }
      return;
    case 'keep': return doLink(a.dataset.code, a.dataset.keep);
    case 'havediscord':
      closeModal();
      tab = 'discord';
      renderPanel();
      toast('Run /link in Discord, then enter the code below.');
      return;
    case 'reset':
      if (confirm('Start over with a new otter? This erases all progress on this device.')) {
        sync.unlink();
        state = core.defaultState();
        lastOtter = '';
        commit({ push: false });
        askName(true);
      }
      return;
    default:
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target;
  e.preventDefault();
  if (form.dataset.form === 'name') {
    const first = !state.name;
    const name = form.name.value.trim().slice(0, 16) || form.name.placeholder;
    state.name = name;
    if (first) core.log(state, `You adopted ${name}! 🦦`);
    closeModal();
    commit();
    if (first) burst(['💖', '🦦', '✨'], 10);
  } else if (form.dataset.form === 'link') {
    doLink(form.code.value);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#modal').hidden && !$('#modal').dataset.locked) {
    if (gameOpen) quitGame();
    else closeModal();
  }
});

$('#otter-wrap').addEventListener('click', () => act(core.cuddle(state)));

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { saveLocal(); return; }
  runTick();
  commit({ push: false });
  pullNow();
});

// ---------- boot ----------
detectArt();
if (PANELS[location.hash.slice(1)]) tab = location.hash.slice(1);
runTick();
commit({ push: false });
if (!state.name && !sync.linked) askName(true);

sync.check().then(async (online) => {
  if (!online) return renderAll();
  if (sync.linked) await pullNow();
  renderAll();
  renderPanel();
});

let ticks = 0;
setInterval(() => {
  const hadMission = !!state.mission;
  runTick();
  renderAll();
  updateLive();
  if (hadMission && !state.mission) renderPanel();
  ticks += 1;
  if (ticks % 5 === 0) saveLocal();
  if (sync.linked && ticks % 20 === 0) pullNow();
  if (sync.linked && ticks % 60 === 0) pushNow();
}, 1000);

// Small hook for automated tests and the curious.
window.otteroyster = { get state() { return state; }, core, sync, rand };
