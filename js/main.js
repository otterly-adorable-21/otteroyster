import { load, save, clear, defaultState } from './state.js';
import { ITEMS, SLOTS, SNACKS, MISSIONS, GAMES, NAME_IDEAS } from './data.js';
import { otterSVG, mood, itemPreviewSVG } from './otter.js';
import { startDive } from './games/dive.js';
import { startMemory } from './games/memory.js';

// ---------- helpers ----------
const $ = (s) => document.querySelector(s);
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const xpNeed = (lvl) => 40 + lvl * 30;
const today = () => new Date().toISOString().slice(0, 10);

function fmtTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
const fmtMinutes = (m) => (m >= 60 ? `${m / 60}h` : `${m} min`);

// Stat decay per real-time minute.
const RATES = { hunger: -0.15, happiness: -0.1, energy: -0.08, clean: -0.06 };
const STATS = [
  { id: 'hunger', label: 'Full', icon: '🐟' },
  { id: 'happiness', label: 'Happy', icon: '💛' },
  { id: 'energy', label: 'Energy', icon: '⚡' },
  { id: 'clean', label: 'Clean', icon: '🫧' },
];
const NEEDS = { hunger: '🐟', energy: '💤', clean: '🛁', happiness: '🎾' };

let state = load() || defaultState();
let tab = 'home';
let lastOtter = '';
let gameCleanup = null;

// ---------- state changes ----------
function stat(k, d) { state.stats[k] = clamp(state.stats[k] + d); }

function log(msg) {
  state.log.unshift({ t: Date.now(), msg });
  state.log = state.log.slice(0, 25);
}

function addXP(n) {
  state.xp += n;
  while (state.xp >= xpNeed(state.level)) {
    state.xp -= xpNeed(state.level);
    state.level += 1;
    log(`${state.name} reached level ${state.level}!`);
    toast(`⭐ Level up! ${state.name} is now level ${state.level}`);
    burst(['⭐', '✨', '🎉'], 10);
  }
}

function busyReason() {
  if (state.mission) return `${state.name} is away on a mission.`;
  if (state.sleeping) return `${state.name} is sleeping. Shh!`;
  return '';
}

function tick() {
  const now = Date.now();
  let mins = (now - state.lastTick) / 60000;
  state.lastTick = now;
  if (mins <= 0) return;
  mins = Math.min(mins, 60 * 24 * 3);

  if (state.mission) {
    stat('hunger', RATES.hunger * 0.5 * mins);
  } else if (state.sleeping) {
    stat('energy', 2.5 * mins);
    stat('hunger', RATES.hunger * 0.5 * mins);
    stat('clean', RATES.clean * 0.5 * mins);
    if (state.stats.energy >= 100) {
      state.sleeping = false;
      log(`${state.name} woke up refreshed.`);
      toast(`☀️ ${state.name} woke up!`);
    }
  } else {
    const lonely = state.stats.hunger < 25 || state.stats.clean < 25 ? 2 : 1;
    stat('hunger', RATES.hunger * mins);
    stat('energy', RATES.energy * mins);
    stat('clean', RATES.clean * mins);
    stat('happiness', RATES.happiness * lonely * mins);
  }

  if (state.mission && now >= state.mission.endsAt) finishMission();
}

// ---------- actions ----------
function feed(id) {
  const b = busyReason();
  if (b) return toast(b);
  const s = SNACKS.find((x) => x.id === id);
  if (state.stats.hunger >= 98) return toast(`${state.name} is too full to eat!`);
  if (state.pearls < s.price) return toast('Not enough pearls.');
  state.pearls -= s.price;
  stat('hunger', s.hunger);
  stat('happiness', s.happiness);
  addXP(2);
  burst([s.icon, '😋'], 5);
  bounce();
  log(`${state.name} ate ${s.name.toLowerCase()}.`);
  commit();
}

function pet() {
  const b = busyReason();
  if (b) return toast(b);
  if (state.stats.energy < 5) return toast(`${state.name} is too tired to play.`);
  stat('happiness', 8);
  stat('energy', -3);
  addXP(2);
  burst(['💖', '💕', '✨'], 6);
  bounce();
  commit();
}

function bath() {
  const b = busyReason();
  if (b) return toast(b);
  if (state.stats.clean >= 98) return toast(`${state.name} is already squeaky clean!`);
  stat('clean', 45);
  stat('happiness', 4);
  addXP(2);
  burst(['🫧', '🫧', '💧', '🫧'], 12);
  bounce();
  log(`${state.name} had a bubble bath.`);
  commit();
}

function toggleSleep() {
  if (state.mission) return toast(busyReason());
  state.sleeping = !state.sleeping;
  if (state.sleeping) log(`${state.name} curled up for a nap.`);
  else toast(`${state.name} woke up.`);
  commit();
}

function daily() {
  if (state.lastDaily === today()) return toast('Come back tomorrow for another gift!');
  state.lastDaily = today();
  const p = rand(15, 30);
  state.pearls += p;
  log(`Collected a daily gift of ${p} pearls.`);
  toast(`🎁 Daily gift: +${p} pearls!`);
  burst(['🎁', '⚪', '✨'], 8);
  commit();
}

function buy(id) {
  const it = ITEMS[id];
  if (state.owned.includes(id)) return;
  if (state.level < it.level) return toast(`Reach level ${it.level} to buy this.`);
  if (state.pearls < it.price) return toast('Not enough pearls.');
  state.pearls -= it.price;
  state.owned.push(id);
  state.equipped[it.slot] = id;
  addXP(5);
  log(`Bought the ${it.name}.`);
  toast(`🛍️ Bought ${it.name}! It's on now.`);
  burst([it.icon, '✨'], 6);
  commit();
}

function toggleWear(id) {
  const it = ITEMS[id];
  state.equipped[it.slot] = state.equipped[it.slot] === id ? null : id;
  bounce();
  commit();
}

function startMission(id) {
  const m = MISSIONS.find((x) => x.id === id);
  const b = busyReason();
  if (b) return toast(b);
  if (state.level < m.level) return toast(`Reach level ${m.level} to unlock this mission.`);
  if (state.stats.energy < m.energy) return toast(`${state.name} needs ${m.energy} energy for this.`);
  stat('energy', -m.energy);
  stat('hunger', -m.energy / 3);
  const now = Date.now();
  state.mission = { id, start: now, endsAt: now + m.minutes * 60000 };
  log(`${state.name} set off on ${m.name}.`);
  toast(`${m.icon} ${state.name} is off on an adventure!`);
  commit();
}

function finishMission() {
  const m = MISSIONS.find((x) => x.id === state.mission.id);
  state.mission = null;
  const pearls = rand(m.pearls[0], m.pearls[1]);
  state.pearls += pearls;
  stat('happiness', 10);
  let found = null;
  for (const [id, chance] of m.loot) {
    if (!state.owned.includes(id) && Math.random() < chance) { found = id; break; }
  }
  if (found) state.owned.push(found);
  const story = m.stories[rand(0, m.stories.length - 1)];
  log(`${state.name} returned from ${m.name} with ${pearls} pearls${found ? ` and a ${ITEMS[found].name}` : ''}.`);
  addXP(m.xp);
  save(state);
  renderPanel();
  showModal(`
    <div class="result">
      <div class="result-icon">${m.icon}</div>
      <h2>${esc(state.name)} is back!</h2>
      <p>${esc(state.name)} ${story}</p>
      <div class="rewards">
        <span class="chip"><span class="pearl-icon"></span> +${pearls}</span>
        <span class="chip">⭐ +${m.xp} XP</span>
      </div>
      ${found ? `<div class="loot"><div class="loot-art">${itemPreviewSVG(found)}</div><p>Found a rare item: <b>${ITEMS[found].name}</b>! Check the wardrobe.</p></div>` : ''}
      <button class="btn primary" data-close>Yay!</button>
    </div>`);
}

function recallMission() {
  if (!state.mission) return;
  const m = MISSIONS.find((x) => x.id === state.mission.id);
  state.mission = null;
  log(`${state.name} came home early from ${m.name}.`);
  toast(`${state.name} swam home early.`);
  commit();
}

// ---------- minigames ----------
function playGame(id) {
  const g = GAMES.find((x) => x.id === id);
  const b = busyReason();
  if (b) return toast(b);
  if (state.stats.energy < g.energy) return toast(`${state.name} is too tired. Try a nap first!`);
  stat('energy', -g.energy);
  commit();

  showModal(`<div class="game-wrap"><div class="game-top"><h2>${g.icon} ${g.name}</h2>
    <button class="icon-btn" data-quit aria-label="Quit game">✕</button></div><div class="game-root"></div></div>`, { wide: true });
  const root = $('#modal .game-root');
  const start = id === 'dive' ? startDive : startMemory;
  gameCleanup = start(root, (res) => endGame(g, res));
}

function endGame(g, res) {
  gameCleanup = null;
  state.pearls += res.pearls;
  stat('happiness', 12);
  addXP(6);
  let record = false;
  if (g.id === 'dive' && res.best > state.best.dive) { state.best.dive = res.best; record = true; }
  if (g.id === 'memory' && (state.best.memory === null || res.best < state.best.memory)) { state.best.memory = res.best; record = true; }
  log(`${state.name} played ${g.name} and earned ${res.pearls} pearls.`);
  commit();
  $('#modal-card').innerHTML = `
    <div class="result">
      <div class="result-icon">${g.icon}</div>
      <h2>${record ? 'New record! 🏆' : 'Nice job!'}</h2>
      <p>${res.summary}</p>
      <div class="rewards"><span class="chip"><span class="pearl-icon"></span> +${res.pearls}</span><span class="chip">💛 +12</span></div>
      <div class="row">
        <button class="btn" data-action="game" data-id="${g.id}">Play again</button>
        <button class="btn primary" data-close>Done</button>
      </div>
    </div>`;
}

function quitGame() {
  if (gameCleanup) { gameCleanup(); gameCleanup = null; }
  closeModal();
}

// ---------- rendering ----------
function renderHeader() {
  $('#otter-name').textContent = state.name || 'Otter Oyster';
  $('#level').textContent = state.level;
  $('#xp-fill').style.width = `${(state.xp / xpNeed(state.level)) * 100}%`;
  $('#pearls').textContent = state.pearls;
}

function renderStats() {
  $('#stats').innerHTML = STATS.map((s) => {
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
  scene.classList.toggle('is-away', away);
  scene.dataset.mood = mood(state);
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
  if (!away && !state.sleeping && low) {
    thought.hidden = false;
    thought.textContent = NEEDS[low[0]];
  } else {
    thought.hidden = true;
  }
}

function itemCard(id, mode) {
  const it = ITEMS[id];
  const owned = state.owned.includes(id);
  const worn = state.equipped[it.slot] === id;
  let action;
  if (mode === 'wardrobe') {
    action = `<button class="btn small ${worn ? 'primary' : ''}" data-action="wear" data-id="${id}">${worn ? 'Wearing ✓' : 'Wear'}</button>`;
  } else if (owned) {
    action = `<button class="btn small" disabled>Owned</button>`;
  } else if (state.level < it.level) {
    action = `<button class="btn small" disabled>🔒 Lv ${it.level}</button>`;
  } else {
    action = `<button class="btn small primary" data-action="buy" data-id="${id}" ${state.pearls < it.price ? 'disabled' : ''}><span class="pearl-icon"></span> ${it.price}</button>`;
  }
  return `<div class="card item ${worn ? 'worn' : ''}"><div class="item-art">${itemPreviewSVG(id)}</div><div class="item-name">${it.name}</div>${action}</div>`;
}

function panelHome() {
  const claimed = state.lastDaily === today();
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

function panelWardrobe() {
  const owned = state.owned;
  if (!owned.length) {
    return `<div class="empty"><div class="empty-icon">👗</div><p>The wardrobe is empty! Buy clothes in the <button class="link" data-tab="shop">shop</button> or find rare items on <button class="link" data-tab="missions">missions</button>.</p></div>`;
  }
  return SLOTS.map((slot) => {
    const ids = owned.filter((id) => ITEMS[id].slot === slot.id);
    if (!ids.length) return '';
    return `<h2 class="section-title">${slot.name}</h2><div class="grid">${ids.map((id) => itemCard(id, 'wardrobe')).join('')}</div>`;
  }).join('') + `<div class="settings"><button class="link" data-action="undress">Take everything off</button></div>`;
}

function panelShop() {
  return SLOTS.map((slot) => {
    const ids = Object.keys(ITEMS).filter((id) => ITEMS[id].slot === slot.id && ITEMS[id].price !== null);
    return `<h2 class="section-title">${slot.name}</h2><div class="grid">${ids.map((id) => itemCard(id, 'shop')).join('')}</div>`;
  }).join('') + `<p class="note">✨ Some rare items can only be found on missions.</p>`;
}

function panelMissions() {
  let head = '';
  if (state.mission) {
    const m = MISSIONS.find((x) => x.id === state.mission.id);
    const total = state.mission.endsAt - state.mission.start;
    const pct = clamp(((Date.now() - state.mission.start) / total) * 100);
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
    <p class="note">Missions run in real time, even when this page is closed.</p>`;
}

function panelGames() {
  return `<h2 class="section-title">Minigames</h2><div class="games">${GAMES.map((g) => {
    const best = g.id === 'dive' ? (state.best.dive ? `Best: ${state.best.dive} pts` : '') : state.best.memory ? `Best: ${state.best.memory} moves` : '';
    return `<div class="card game">
      <div class="game-icon">${g.icon}</div>
      <div class="game-info"><b>${g.name}</b><p class="muted">${g.desc}</p><p class="muted">⚡ ${g.energy} energy ${best ? `· 🏆 ${best}` : ''}</p></div>
      <button class="btn primary" data-action="game" data-id="${g.id}">Play</button></div>`;
  }).join('')}</div><p class="note">Games earn pearls and make ${esc(state.name)} happy.</p>`;
}

const PANELS = { home: panelHome, wardrobe: panelWardrobe, shop: panelShop, missions: panelMissions, games: panelGames };

function renderPanel() {
  $('#panel').innerHTML = PANELS[tab]();
  document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'));
}

function renderAll() {
  renderHeader();
  renderStats();
  renderScene();
}

function commit() {
  save(state);
  renderAll();
  renderPanel();
}

function updateLive() {
  if (!state.mission) return;
  const left = document.querySelector('[data-live="mission-left"]');
  const bar = document.querySelector('[data-live="mission-bar"]');
  if (left) left.textContent = fmtTime(state.mission.endsAt - Date.now());
  if (bar) bar.style.width = `${clamp(((Date.now() - state.mission.start) / (state.mission.endsAt - state.mission.start)) * 100)}%`;
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
  $('#modal').hidden = true;
  $('#modal-card').innerHTML = '';
}

function askName(first) {
  const idea = NAME_IDEAS[rand(0, NAME_IDEAS.length - 1)];
  showModal(`
    <form class="adopt" data-form="name">
      <div class="adopt-otter"><svg viewBox="0 -20 200 250">${otterSVG({ ...defaultState(), stats: { hunger: 90, happiness: 90, energy: 90, clean: 90 } })}</svg></div>
      <h2>${first ? 'A baby otter washed up with an oyster!' : 'Rename your otter'}</h2>
      ${first ? '<p>Give your new friend a name. Feed them, dress them up, send them on adventures and play games together.</p>' : ''}
      <input name="name" maxlength="16" required autocomplete="off" placeholder="${idea}" value="${first ? '' : esc(state.name)}" aria-label="Otter name">
      <button class="btn primary" type="submit">${first ? 'Adopt 🦦' : 'Save'}</button>
    </form>`, { locked: first });
  setTimeout(() => $('#modal input')?.focus(), 50);
}

// ---------- events ----------
document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) {
    tab = tabBtn.dataset.tab;
    renderPanel();
    if (tabBtn.closest('.tabs')) $('#panel').scrollTop = 0;
    return;
  }
  if (e.target.closest('[data-close]')) return closeModal();
  if (e.target.closest('[data-quit]')) return quitGame();
  if (e.target.id === 'modal' && !$('#modal').dataset.locked && !gameCleanup) return closeModal();

  const a = e.target.closest('[data-action]');
  if (!a) return;
  const id = a.dataset.id;
  switch (a.dataset.action) {
    case 'feed': return feed(id);
    case 'pet': return pet();
    case 'bath': return bath();
    case 'sleep': return toggleSleep();
    case 'daily': return daily();
    case 'buy': return buy(id);
    case 'wear': return toggleWear(id);
    case 'undress': Object.keys(state.equipped).forEach((k) => { state.equipped[k] = null; }); return commit();
    case 'mission': return startMission(id);
    case 'recall': return recallMission();
    case 'game': closeModal(); return playGame(id);
    case 'rename': return askName(false);
    case 'reset':
      if (confirm('Start over with a new otter? This erases all progress.')) {
        clear();
        state = defaultState();
        lastOtter = '';
        commit();
        askName(true);
      }
      return;
    default:
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form="name"]');
  if (!form) return;
  e.preventDefault();
  const first = !state.name;
  const name = form.name.value.trim().slice(0, 16) || form.name.placeholder;
  state.name = name;
  if (first) log(`You adopted ${name}! 🦦`);
  closeModal();
  commit();
  if (first) burst(['💖', '🦦', '✨'], 10);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#modal').hidden && !$('#modal').dataset.locked) {
    if (gameCleanup) quitGame();
    else closeModal();
  }
});

$('#otter-wrap').addEventListener('click', pet);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) save(state);
  else { tick(); commit(); }
});

// ---------- boot ----------
tick();
commit();
if (!state.name) askName(true);

setInterval(() => {
  const hadMission = !!state.mission;
  tick();
  renderAll();
  updateLive();
  if (hadMission && !state.mission) renderPanel();
}, 1000);
setInterval(() => save(state), 5000);
