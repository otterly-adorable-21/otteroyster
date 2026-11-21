import { ITEMS, SLOTS, SNACKS, MISSIONS, GAME_LIST, GAME_CATEGORIES, NAME_IDEAS } from './data.js';
import * as core from './core.js';
import { otterSVG, itemPreviewSVG } from './otter.js';
import { LOADERS } from './games/index.js';
import { sync } from './sync.js';
import { detectArt, art } from './assets.js';
import { playCare, setSleeping } from './animations.js';
import { FURNITURE, WALLPAPERS, FLOORS, DEN_CATS } from './den-data.js';
import { denSVG, furniturePreviewSVG } from './den.js';
import { LOCATIONS, LOC, RARITY, FINDS, TOTAL_FINDS, EXPLORE_ENERGY, SET_REWARD } from './world.js';
import { mapSVG } from './map.js';
import { heartsText, friendLevel, GIFT_PEARL_OPTIONS, GIFT_PEARLS_PER_DAY } from './social.js';
import { EVENTS, EVENT, EVENT_FINDS, eventEndsAt, nextEvent, setEventPreview, isPreview } from './events.js';
import { PHASES, timeOfDay, WEATHER, weatherAt, forecast, tideAt, TIDE_NAMES, LOW_TIDE_PLACES, exploreLuck, MOODS, dailyMood, SLEEP_POSES, sleepPose, thoughtFor } from './ambience.js';

// Preview another seasonal event with ?event=spooky (website only).
try { const ev = new URLSearchParams(location.search).get('event'); if (ev) setEventPreview(ev); } catch { /* ignore */ }

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
// Save status shown in the header: local (this device) and cloud (online account).
const saveInfo = { localOk: true, localAt: 0, cloud: 'off', cloudAt: 0 }; // cloud: off | saving | ok | error | conflict

function saveLocal() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    saveInfo.localOk = true;
    saveInfo.localAt = Date.now();
  } catch {
    saveInfo.localOk = false;
  }
}

function saveStatus() {
  if (!state.name) return { icon: '💾', text: 'Save', cls: '' };
  if (!saveInfo.localOk && saveInfo.cloud !== 'ok') return { icon: '⚠️', text: 'Not saved', cls: 'bad' };
  if (sync.linked) {
    if (!sync.online) return { icon: '💾', text: 'Saved here', cls: 'warn' };
    if (saveInfo.cloud === 'saving' || pushTimer) return { icon: '☁️', text: 'Saving…', cls: 'busy' };
    if (saveInfo.cloud === 'error') return { icon: '☁️', text: 'Retrying…', cls: 'warn' };
    return { icon: '☁️', text: 'Saved', cls: 'good' };
  }
  return { icon: '💾', text: 'Saved here', cls: '' };
}

function renderSaveChip() {
  const chip = $('#save-chip');
  if (!chip) return;
  const st = saveStatus();
  chip.className = `save-chip ${st.cls}`;
  chip.querySelector('[data-save-icon]').textContent = st.icon;
  chip.querySelector('[data-save-text]').textContent = st.text;
}

const ago = (t) => {
  if (!t) return 'not yet';
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s} seconds ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return new Date(t).toLocaleString([], { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });
};

function savePanelHTML(extra = '') {
  const online = sync.online;
  const signedIn = sync.linked;
  const lastBackup = (() => { try { return Number(localStorage.getItem('otteroyster.lastBackup') || 0); } catch { return 0; } })();
  return `<div class="save-panel">
    <div class="game-top"><h2>💾 Save &amp; devices</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>
    <div class="save-rows">
      <div class="save-row"><span>📱</span><div><b>This device</b><div class="muted">${saveInfo.localOk ? `Saved automatically · ${ago(saveInfo.localAt)}` : 'This browser is blocking storage (private mode?). Use an online save or a backup!'}</div></div></div>
      <div class="save-row"><span>☁️</span><div><b>Online save</b><div class="muted">${signedIn ? (online ? `On · saved ${ago(saveInfo.cloudAt)}${linkedName ? ` · linked to Discord (${esc(linkedName)})` : ''}` : 'On, but the server is unreachable right now. Changes are kept here and sync when it is back.') : online ? 'Off. Save online to keep your otter safe and use it on other devices.' : "Unavailable: the server isn't reachable from this page."}</div></div></div>
      <div class="save-row"><span>🗂️</span><div><b>Backup file</b><div class="muted">${lastBackup ? `Last downloaded ${ago(lastBackup)}` : 'No backup yet'}</div></div></div>
    </div>
    ${extra}
    ${!signedIn || !linkedName ? discordButton(signedIn ? 'Link Discord sign-in' : 'Sign in with Discord') : ''}
    <div class="save-actions">
      <button class="btn primary" data-action="save-now">💾 Save now</button>
      ${online && !signedIn && !sync.discordLoginUrl ? '<button class="btn" data-action="register">☁️ Save my otter online</button>' : ''}
      ${online && signedIn ? '<button class="btn" data-action="device-code">📲 Use on another device</button>' : ''}
    </div>
    ${online ? `<form class="link-form" data-form="link"><input name="code" maxlength="6" autocomplete="off" placeholder="CODE" aria-label="Device or Discord code" required><button class="btn" type="submit">Load otter</button></form>
      <p class="muted small-note">Got a code from another device or from <code>/link</code> in Discord? Enter it to load that otter here.</p>` : ''}
    <h3 class="den-sub dark">Backups</h3>
    <div class="save-actions">
      <button class="btn" data-action="backup">⬇️ Download backup</button>
      <label class="btn">⬆️ Restore backup<input type="file" accept=".json,application/json" data-restore hidden></label>
    </div>
    <p class="muted small-note">Clearing your browser's cookies or site data erases the otter saved on this device. An online save or a backup file keeps it safe.</p>
    ${!online ? `<p class="muted small-note">Tried: ${sync.tried.map(esc).join(', ') || '—'}. <button class="link" data-action="recheck">Try again</button></p>` : ''}
  </div>`;
}

function showSavePanel(extra = '') { showModal(savePanelHTML(extra)); }

function discordButton(label = 'Sign in with Discord') {
  const url = sync.discordLoginUrl;
  return url ? `<a class="btn discord-btn" href="${esc(url)}"><svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path fill="currentColor" d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.4 18.4 0 0 0-5.5 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9 0 13.5.3 17.9A19.9 19.9 0 0 0 6.3 21l1.3-2a12.9 12.9 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12 0l.5.4a12.9 12.9 0 0 1-2 1l1.3 2a19.8 19.8 0 0 0 6-3.1c.5-5.1-.8-9.5-3.6-13.5ZM8.7 15.2c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.1 1.1 2.1 2.4-1 2.4-2.1 2.4Zm6.6 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.1 1.1 2.1 2.4-.9 2.4-2.1 2.4Z"/></svg>${label}</a>` : '';
}

// Coming back from Discord: #login=<token> or #login-error=<message>
async function finishDiscordLogin() {
  const h = location.hash;
  if (!h.startsWith('#login')) return;
  history.replaceState(null, '', location.pathname + location.search);
  const params = new URLSearchParams(h.slice(1));
  if (params.get('login-error')) { toast(`⚠️ ${params.get('login-error')}`); return; }
  const newTok = params.get('login');
  if (!newTok || !(await sync.check())) { toast('⚠️ Could not finish signing in. Please try again.'); return; }
  const acct = await sync.peek(newTok);
  if (!acct) { toast('⚠️ Could not finish signing in. Please try again.'); return; }

  const finish = (st, version, msg) => {
    sync.useToken(newTok, version);
    linkedName = acct.discordName || linkedName;
    friendsData = null;
    adoptRemote(st, version, msg);
    saveInfo.cloud = 'ok';
    saveInfo.cloudAt = Date.now();
    closeModal();
  };

  // Nothing on this device: just load the Discord account's otter (or adopt one).
  if (!state.name) {
    finish(acct.state, acct.version, acct.state.name ? `👋 Welcome back, ${acct.state.name}!` : '👋 Signed in! Now adopt your otter.');
    return;
  }
  // This device's otter needs an online account before it can be merged.
  let oldTok = sync.token;
  if (oldTok) {
    const mine = await sync.peek(oldTok);
    if (mine?.discordName && mine.discordName === acct.discordName) { finish(acct.state, acct.version, '👋 Signed in with Discord!'); return; }
  } else {
    const reg = await sync.register(state);
    if (!reg.token) { toast(reg.error || 'Could not save this otter online.'); return; }
    oldTok = reg.token;
  }
  const doMerge = async (keep) => {
    const r = await sync.merge(newTok, oldTok, keep);
    if (!r.ok) { toast(r.error || 'Could not finish signing in.'); return; }
    finish(r.state, r.version, `👋 Signed in with Discord! ${r.state.name} is saved to your account.`);
  };
  if (!acct.state.name) { await doMerge('other'); return; }
  showModal(`<div class="result"><div class="result-icon">🦦🦦</div><h2>Two otters!</h2>
    <p>Your Discord account has <b>${esc(acct.state.name)}</b> (level ${acct.state.level}). This device has <b>${esc(state.name)}</b> (level ${state.level}). Which otter do you want to keep?</p>
    <div class="row"><button class="btn primary" data-login-keep="this">Keep ${esc(acct.state.name)}<br><small>(Discord account)</small></button>
    <button class="btn" data-login-keep="other">Keep ${esc(state.name)}<br><small>(this device)</small></button></div>
    <p class="muted">The other otter will be released back to the sea. Your friends from both are kept.</p></div>`, { locked: true });
  document.querySelectorAll('[data-login-keep]').forEach((b) => b.addEventListener('click', () => doMerge(b.dataset.loginKeep), { once: true }));
}

function downloadBackup() {
  const data = { app: 'otteroyster', kind: 'backup', exported: new Date().toISOString(), state };
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(state.name || 'otter').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-backup-${core.dayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  try { localStorage.setItem('otteroyster.lastBackup', String(Date.now())); } catch { /* ignore */ }
  toast('🗂️ Backup downloaded! Keep it somewhere safe.');
}

async function restoreBackup(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { return toast("That file isn't an Otter & Oyster backup."); }
  const st = data?.state || data;
  if (!st || typeof st !== 'object' || !st.name || !st.stats) return toast("That file isn't an Otter & Oyster backup.");
  if (!confirm(`Restore ${st.name} (level ${st.level || 1}) from ${data.exported ? new Date(data.exported).toLocaleDateString() : 'this backup'}? This replaces ${state.name ? `${state.name} on this device` : 'the otter on this device'}${sync.linked ? ' and your online save' : ''}.`)) return;
  state = core.normalize(st);
  lastOtter = '';
  runTick();
  commit({ push: false });
  if (sync.linked && sync.online) {
    // Overwrite the online save with the restored otter.
    try { const r = await sync.pull(); if (r) sync.version = r.version; } catch { /* offline */ }
    await pushNow();
  }
  closeModal();
  toast(`🦦 ${state.name} is back!`);
  burst(['💖', '🦦', '✨'], 10);
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
      ${r.discovery && FINDS[r.discovery] ? `<div class="loot"><div class="loot-art big-find">${FINDS[r.discovery].icon}</div><p>Brought back a <b>${FINDS[r.discovery].name}</b> for your collection!</p></div>` : ''}
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
    console.error(`[arcade] ${id} failed to load`, err);
    // Give the energy back: the player never got to play.
    state.stats.energy = clamp(state.stats.energy + g.energy);
    commit();
    root.innerHTML = `<div class="result"><div class="result-icon">🫧</div><h2>This game didn't load</h2>
      <p>Your energy was refunded. This is usually a connection hiccup or an old copy of the site stuck in your browser.</p>
      <p class="err-detail">${esc(err?.message || String(err))}</p>
      <div class="row"><button class="btn" data-action="hardreload">Refresh site</button><button class="btn primary" data-action="game" data-id="${id}">Try again</button></div></div>`;
  }
}

function endGame(g, r) {
  gameCleanup = null;
  gameOpen = false;
  const res = core.rewardGame(state, g.id, r.pearls, r.best, !!g.lowerIsBetter);
  if (res.ups) levelUp();
  commit();
  sync.score(g.id, r.best);
  if (sync.linked && sync.online && socialData?.challenges?.some((c) => c.game === g.id)) {
    sync.challengeAnswer(g.id, r.best).then((ans) => {
      for (const x of ans.results || []) toast(x.won ? `🏆 You beat ${x.from}'s ${x.target}! They'll hear about it.` : `So close! ${x.from}'s ${x.target} still stands.`);
      refreshInbox();
    });
  }
  $('#modal-card').innerHTML = `
    <div class="result">
      <div class="result-icon">${g.icon}</div>
      <h2>${res.record ? 'New record! 🏆' : 'Nice job!'}</h2>
      ${res.favGame ? `<p>${esc(state.name)} loves this game! 💕 (+10% pearls)</p>` : ''}
      <p>${r.summary}</p>
      <div class="rewards"><span class="chip"><span class="pearl-icon"></span> +${res.pearls}</span><span class="chip">💛 +10</span></div>
      <div class="row">
        <button class="btn" data-action="game" data-id="${g.id}">Play again</button>
        ${sync.linked && sync.online && friendsData?.friends?.length ? `<button class="btn" data-action="challenge-friend" data-game="${g.id}" data-score="${r.best}">🏆 Dare a friend</button>` : ''}
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
  renderSaveChip();
  const fb = document.querySelector('.tabs [data-tab=friends]');
  if (fb) {
    const n = (socialData?.mailUnread || 0) + (socialData?.challenges?.length || 0) + (socialData?.sleepovers || []).filter((x) => !x.hosting && x.status === 'invited').length + (friendsData?.incoming?.length || 0) + (giftsData?.length || 0);
    fb.dataset.badge = n > 0 ? String(n) : '';
  }
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

let fxEvent = null;
function renderEventFx() {
  const ev = state.name ? core.eventStatus(state)?.event : null;
  const id = ev?.id || null;
  if (id === fxEvent) return;
  fxEvent = id;
  const box = $('#event-fx');
  if (!box) return;
  box.innerHTML = ev ? Array.from({ length: 12 }, (_, k) => `<i style="left:${(k * 83) % 100}%;animation-delay:${-(k * 1.7).toFixed(1)}s;animation-duration:${9 + (k % 4) * 2}s;font-size:${14 + (k % 3) * 5}px">${ev.fx[k % ev.fx.length]}</i>`).join('') : '';
}

function renderScene() {
  renderEventFx();
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
  renderAmbience(scene, away);
  setSleeping(state.sleeping && !away);
}

// ---------- the living pond ----------
let lastAmbience = '';
function renderAmbience(scene, away) {
  const now = Date.now();
  const phase = timeOfDay(new Date(now));
  const weather = weatherAt(now);
  const tide = tideAt(now);
  scene.dataset.phase = phase;
  scene.dataset.weather = weather;
  scene.dataset.tide = tide.state;
  $('#otter-wrap').dataset.pose = state.sleeping ? sleepPose(state) : '';
  const key = `${phase}|${weather}|${tide.state}|${state.name ? dailyMood(state) : ''}`;
  if (key === lastAmbience) return;
  lastAmbience = key;
  const w = WEATHER[weather];
  const wIcon = phase === 'night' && w.nightIcon ? w.nightIcon : w.icon;
  $('#pond-status').innerHTML = `<span>${PHASES[phase].icon} ${PHASES[phase].name}</span><span>${wIcon} ${w.name}</span><span>${TIDE_NAMES[tide.state]}</span>`;
  const fx = $('#weather-fx');
  const drops = { rainy: '', breezy: '🍃', misty: '', cloudy: '', sunny: '' }[weather];
  fx.innerHTML = weather === 'rainy' ? '<i class="rain"></i>' : weather === 'misty' ? '<i class="mist"></i>' : weather === 'cloudy' ? '<i class="cloud c1"></i><i class="cloud c2"></i>'
    : weather === 'breezy' ? Array.from({ length: 6 }, (_, k) => `<i class="leaf" style="top:${10 + k * 14}%;animation-delay:${-k * 1.3}s">${drops}</i>`).join('') : '';
}

// Little thoughts: a speech bubble now and then when nothing is urgent.
let speechTimer = 0;
function speak(text, ms = 6000) {
  const el = $('#speech');
  if (!el) return;
  el.textContent = text;
  el.hidden = false;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
  clearTimeout(speechTimer);
  speechTimer = setTimeout(() => { el.hidden = true; }, ms);
}
let thoughtSeed = 0;
setInterval(() => {
  if (!state.name || state.mission || state.sleeping || gameOpen || document.hidden || tab !== 'home') return;
  if (!$('#thought').hidden) return;
  speak(thoughtFor(state, { seed: thoughtSeed++ }));
}, 22000);

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
    action = `<div class="buy-row">${tryBtn('item', id)}<button class="btn small primary" data-action="buy" data-id="${id}" ${state.pearls < it.price ? 'disabled' : ''}><span class="pearl-icon"></span> ${it.price}</button></div>`;
  }
  return `<div class="card item ${worn ? 'worn' : ''}"><div class="item-art">${itemPreviewSVG(id)}</div><div class="item-name">${it.name}</div>${action}</div>`;
}

// ---------- try on + purchase confirmation ----------
const SKIP_KEY = 'otteroyster.skipConfirm';
const skipConfirm = () => { try { return localStorage.getItem(SKIP_KEY) === '1'; } catch { return false; } };
const setSkipConfirm = (on) => { try { if (on) localStorage.setItem(SKIP_KEY, '1'); else localStorage.removeItem(SKIP_KEY); } catch { /* ignore */ } };

// kind: item | furn | wall | floor | evitem | evfurn
function shopEntry(kind, id) {
  const ev = core.eventStatus(state);
  const evPrice = (x) => ev?.event.shop.find((e) => e.id === x)?.tokens;
  switch (kind) {
    case 'item': return { name: ITEMS[id].name, price: ITEMS[id].price, cur: 'pearls', have: state.pearls };
    case 'furn': return { name: FURNITURE[id].name, price: FURNITURE[id].price, cur: 'pearls', have: state.pearls };
    case 'wall': return { name: `${WALLPAPERS[id].name} wallpaper`, price: WALLPAPERS[id].price, cur: 'pearls', have: state.pearls };
    case 'floor': return { name: `${FLOORS[id].name} floor`, price: FLOORS[id].price, cur: 'pearls', have: state.pearls };
    case 'evitem': return { name: ITEMS[id].name, price: evPrice(id), cur: 'tokens', have: ev?.tokens || 0, token: ev?.event.token };
    case 'evfurn': return { name: FURNITURE[id].name, price: evPrice(id), cur: 'tokens', have: ev?.tokens || 0, token: ev?.event.token };
    default: return null;
  }
}

function doPurchase(kind, id) {
  switch (kind) {
    case 'item': return act(core.buy(state, id));
    case 'furn': {
      const r = act(core.buyFurniture(state, id));
      if (r.ok) { denEdit = true; denSel = r.uid; renderPanel(); }
      return r;
    }
    case 'wall': return act(core.setWallpaper(state, id));
    case 'floor': return act(core.setFloor(state, id));
    case 'evitem': case 'evfurn': return act(core.buyEventItem(state, id));
    default: return null;
  }
}

// A picture of what you'd get: your otter wearing it, or your den with it.
function previewArt(kind, id) {
  if (kind === 'item' || kind === 'evitem') {
    const it = ITEMS[id];
    const trial = { ...state, sleeping: false, equipped: { ...state.equipped, [it.slot]: id } };
    return `<div class="try-stage"><svg viewBox="-10 -30 220 270" aria-label="${esc(state.name)} wearing the ${esc(it.name)}">${otterSVG(trial, { idPrefix: 'try' })}</svg></div>`;
  }
  const trial = JSON.parse(JSON.stringify(state));
  trial.sleeping = false;
  let sel = null;
  if (kind === 'wall') trial.den.wallpaper = id;
  else if (kind === 'floor') trial.den.floor = id;
  else {
    trial.furniture[id] = (trial.furniture[id] || 0) + 1;
    sel = core.placeFurniture(trial, id).uid || null;
  }
  return `<div class="den-stage try-den">${denSVG(trial, { selected: sel, extraAttrs: 'class="den-svg" role="img" aria-label="Your den with it"' }).replace(/den-otter-/g, 'try-otter-')}</div>`;
}

function shopPreview(kind, id, { confirming = false } = {}) {
  const e = shopEntry(kind, id);
  if (!e || e.price == null) return;
  const icon = e.cur === 'tokens' ? e.token?.icon || '🪙' : '<span class="pearl-icon"></span>';
  const short = e.have < e.price;
  showModal(`<div class="try-panel">
    <div class="game-top"><h2>${confirming ? 'Buy this?' : '👀 Try it on'}</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>
    ${previewArt(kind, id)}
    <p class="try-name"><b>${esc(e.name)}</b> · ${icon} ${e.price}${e.cur === 'tokens' ? ` ${esc(e.token?.name || 'tokens')}` : ''}</p>
    ${short ? `<p class="muted center">You need ${e.price - e.have} more ${e.cur === 'tokens' ? esc(e.token?.name || 'tokens') : 'pearls'}.</p>` : ''}
    <div class="row"><button class="btn" data-close>${confirming ? 'Cancel' : 'Maybe later'}</button>
      <button class="btn primary" data-action="confirm-buy" data-kind="${kind}" data-id="${id}" ${short ? 'disabled' : ''}>Buy · ${icon} ${e.price}</button></div>
    ${confirming ? '<label class="skip-check"><input type="checkbox" data-skip-confirm> Don\'t ask me again</label>' : ''}
  </div>`);
}

// All "Buy" buttons go through here: confirm first unless the player turned that off.
function requestPurchase(kind, id) {
  if (skipConfirm()) return doPurchase(kind, id);
  return shopPreview(kind, id, { confirming: true });
}

const tryBtn = (kind, id) => `<button class="btn small try-btn" data-action="try" data-kind="${kind}" data-id="${id}" aria-label="Try it on">👀</button>`;

function daysLeft(ms) {
  const d = Math.ceil((ms - Date.now()) / 86400000);
  return d <= 1 ? 'ends today' : `${d} days left`;
}

function eventBanner() {
  const st = core.eventStatus(state);
  if (!st || !state.name) return '';
  const ev = st.event;
  const done = st.quests.filter((q) => q.claimed).length;
  const ready = st.quests.filter((q) => !q.claimed && q.p >= q.target).length;
  return `<button class="event-banner" data-tab="event" style="--tint:${ev.tint}">
    <span class="event-icon">${ev.icon}</span>
    <span class="event-text"><b>${ev.name}${isPreview() ? ' (preview)' : ''}</b>
      <small>${isPreview() ? 'Preview mode' : daysLeft(eventEndsAt(ev))} · ${ev.token.icon} ${st.tokens} · quests ${done}/3${ready ? ` · <span class="ready">${ready} ready!</span>` : ''}</small></span>
    <span class="event-go">›</span></button>`;
}

function panelEvent() {
  const st = core.eventStatus(state);
  if (!st) {
    const nx = nextEvent();
    return `<div class="empty"><div class="empty-icon">${nx ? nx.event.icon : '📅'}</div><p>No event right now.${nx ? ` Next up: <b>${nx.event.name}</b> in ${Math.ceil((nx.at - Date.now()) / 86400000)} days!` : ''}</p>
      <button class="btn" data-tab="home">Back</button></div>`;
  }
  const ev = st.event;
  const item = (e) => {
    const isItem = e.kind === 'item';
    const it = isItem ? ITEMS[e.id] : FURNITURE[e.id];
    const owned = isItem ? state.owned.includes(e.id) : false;
    return `<div class="card item"><div class="item-art ${isItem ? '' : 'den-art'}">${isItem ? itemPreviewSVG(e.id) : furniturePreviewSVG(e.id)}</div>
      <div class="item-name">${it.name}</div><small class="muted">${isItem ? 'Outfit' : `Den · ✨ +${it.cozy}`}</small>
      ${owned ? '<button class="btn small" disabled>Owned ✓</button>' : `<div class="buy-row">${tryBtn(isItem ? 'evitem' : 'evfurn', e.id)}<button class="btn small primary" data-action="ev-buy" data-id="${e.id}" ${st.tokens < e.tokens ? 'disabled' : ''}>${ev.token.icon} ${e.tokens}</button></div>`}</div>`;
  };
  return `
    <div class="event-hero" style="--tint:${ev.tint}">
      <div class="event-hero-icon">${ev.icon}</div>
      <h2>${ev.name}</h2>
      <p>${ev.desc}</p>
      <div class="event-meta"><span class="chip">${ev.token.icon} <b>${st.tokens}</b> ${ev.token.name}</span><span class="chip">⏳ ${isPreview() ? 'preview' : daysLeft(eventEndsAt(ev))}</span></div>
    </div>
    <h2 class="section-title">Today's quests <small>new ones every day</small></h2>
    <div class="quests">${st.quests.map((q) => `<div class="card quest ${q.claimed ? 'done' : ''}">
      <div class="quest-info"><b>${q.text.replace('your otter', esc(state.name))}</b>
        <div class="bar"><div style="width:${(q.p / q.target) * 100}%"></div></div><small class="muted">${q.p}/${q.target}</small></div>
      ${q.claimed ? '<span class="quest-done">✅</span>' : `<button class="btn small ${q.p >= q.target ? 'primary' : ''}" data-action="ev-claim" data-id="${q.kind}" ${q.p >= q.target ? '' : 'disabled'}>${ev.token.icon} ${q.reward}</button>`}
    </div>`).join('')}</div>
    <p class="note">Every arcade game and every explore also earns ${ev.token.icon} 1.</p>
    <h2 class="section-title">Limited shop <small>yours forever</small></h2>
    <div class="grid">${ev.shop.map(item).join('')}</div>
    <h2 class="section-title">Limited discoveries <small>explore anywhere to find them</small></h2>
    <div class="finds two">${ev.finds.map((f) => findTile(f)).join('')}</div>
    <div class="settings"><button class="link" data-tab="home">← Back to ${esc(state.name)}</button></div>`;
}

let achOpen = false;
function achievementsCard() {
  if (!state.name) return '';
  const got = core.ACHIEVEMENTS.filter((a) => state.achievements[a.id]);
  const list = achOpen ? core.ACHIEVEMENTS : [...got.slice(-5), ...core.ACHIEVEMENTS.filter((a) => !state.achievements[a.id]).slice(0, Math.max(0, 6 - Math.min(5, got.length)))];
  return `<h2 class="section-title">Achievements <small>${got.length}/${core.ACHIEVEMENTS.length}</small></h2>
    <div class="card ach">
      <div class="ach-grid">${list.map((a) => {
        const done = !!state.achievements[a.id];
        const [have, need] = core.achProgress(state, a);
        return `<div class="badge ${done ? 'got' : ''}" title="${a.name}: ${a.desc}${done ? ' ✓' : ` (${have}/${need})`}">
          <span class="badge-icon">${a.icon}</span><b>${a.name}</b><small>${done ? `✓ +${a.reward}` : `${have}/${need}`}</small>
          ${done ? '' : `<div class="bar"><div style="width:${(have / need) * 100}%"></div></div>`}</div>`;
      }).join('')}</div>
      <button class="link center-link" data-action="ach-toggle">${achOpen ? 'Show less' : `See all ${core.ACHIEVEMENTS.length}`}</button>
    </div>`;
}

function personaCard() {
  if (!state.name) return '';
  const pi = core.personaInfo(state);
  const top = pi.ranked[0][1] || 1;
  return `<h2 class="section-title">Personality</h2>
    <div class="card persona">
      <div class="persona-head"><span class="persona-icon">${pi.trait ? pi.trait.icon : '🌱'}</span>
        <div><b>${pi.trait ? `${esc(state.name)} is ${pi.trait.name.toLowerCase()}` : `${esc(state.name)} is still discovering who they are`}</b>
        <div class="muted">${pi.trait ? `${pi.trait.desc}${pi.also ? ` Also a bit ${pi.also.name.toLowerCase()} ${pi.also.icon}.` : ''}` : 'Their personality grows from how you play together.'}</div>
        ${pi.trait ? `<div class="persona-perk">✨ ${pi.trait.perk}</div>` : ''}</div></div>
      <div class="persona-bars">${pi.ranked.map(([id, pts]) => `<div class="persona-bar" title="${core.TRAITS[id].name}: grows from ${core.TRAITS[id].from}">
        <span>${core.TRAITS[id].icon}</span><div class="bar"><div style="width:${Math.min(100, (pts / Math.max(top, 6)) * 100)}%"></div></div></div>`).join('')}</div>
      <div class="persona-favs">
        <span>❤️ Favorites:</span>
        <span class="fav-chip">${pi.fav.snack.icon} ${pi.fav.snack.name}</span>
        <span class="fav-chip">${pi.fav.place.icon} ${pi.fav.place.name}</span>
        <span class="fav-chip">${pi.fav.game.icon} ${pi.fav.game.name}</span>
        <span class="fav-chip">😴 ${SLEEP_POSES[sleepPose(state)]}</span>
      </div>
    </div>`;
}

function todayCard() {
  if (!state.name) return '';
  const now = Date.now();
  const phase = timeOfDay(new Date(now));
  const w = WEATHER[weatherAt(now)];
  const tide = tideAt(now);
  const mood = MOODS[dailyMood(state, now)];
  const lowIn = Math.max(0, tide.nextLow - now);
  const fc = forecast(now);
  return `<div class="card today">
    <div class="today-row"><span class="today-icon">${mood.icon}</span><div><b>${esc(state.name)} feels ${mood.name.toLowerCase()} today</b><div class="muted">${mood.effect}</div></div></div>
    <div class="today-row"><span class="today-icon">${phase === 'night' && w.nightIcon ? w.nightIcon : w.icon}</span><div><b>${w.name}</b> · ${PHASES[phase].name.toLowerCase()}<div class="muted">${w.hint}</div></div></div>
    <div class="today-row"><span class="today-icon">${tide.state === 'low' ? '🏖️' : '🌊'}</span><div><b>${TIDE_NAMES[tide.state].replace(/^\S+ /, '')}</b><div class="muted">${tide.state === 'low' ? 'Tide Pools and Shipwreck Cove finds are 50% luckier right now!' : `Next low tide in ${fmtTime(lowIn)}. Tide Pools and Shipwreck Cove get luckier.`}</div></div></div>
    <div class="forecast">${fc.map((f) => `<span title="${new Date(f.at).toLocaleTimeString([], { hour: 'numeric' })}"><small>${new Date(f.at).toLocaleTimeString([], { hour: 'numeric' })}</small>${WEATHER[f.weather].icon}</span>`).join('')}</div>
  </div>`;
}

function panelHome() {
  const claimed = state.lastDaily === core.dayKey();
  const asleep = state.sleeping;
  const nm = esc(state.name || 'your otter');
  return `
    <h2 class="section-title">Take care of ${nm}</h2>
    <div class="actions">
      <button class="action" data-action="pet"><span>🤗</span>Cuddle</button>
      <button class="action" data-action="bath"><span>🛁</span>Bath</button>
      <button class="action" data-action="sleep"><span>${asleep ? '☀️' : '🌙'}</span>${asleep ? 'Wake up' : 'Nap'}</button>
    </div>
    <div class="snacks">
      ${SNACKS.map((s) => `<button class="snack" data-action="feed" data-id="${s.id}" ${state.pearls < s.price ? 'disabled' : ''}>
        <span class="snack-icon">${s.icon}</span>${state.persona?.fav.snack === s.id ? '<span class="fav-heart" title="Favorite!">❤️</span>' : ''}<span class="snack-name">${s.name}</span>
        <span class="snack-price">${s.price ? `<span class="pearl-icon"></span> ${s.price}` : 'Free'}</span></button>`).join('')}
    </div>
    <h2 class="section-title">Today</h2>
    <button class="daily-btn ${claimed ? 'done' : 'glow'}" data-action="daily" ${claimed ? 'disabled' : ''}><span>🎁</span>${claimed ? "Today's gift claimed. Come back tomorrow!" : 'Open your daily gift'}</button>
    ${eventBanner()}
    ${todayCard()}
    <h2 class="section-title">About ${nm}</h2>
    ${growthCard()}
    ${personaCard().replace('<h2 class="section-title">Personality</h2>', '')}
    ${achievementsCard()}
    <h2 class="section-title">Journal</h2>
    <ul class="journal">
      ${state.log.slice(0, 6).map((l) => `<li><time>${new Date(l.t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>${esc(l.msg)}</li>`).join('') || '<li>Nothing yet. Say hi to your otter!</li>'}
    </ul>
    ${state.name ? '<button class="link center-link block-link" data-action="adventure-book">📔 Open the adventure book</button>' : ''}
    <div class="settings">
      <button class="link" data-action="rename">Rename</button>·<button class="link" data-action="reset">Start over</button>
    </div>`;
}

function growthCard() { return ''; }

function panelCloset() {
  const toggle = `<div class="segmented">
    <button data-closet="wardrobe" aria-pressed="${closetView === 'wardrobe'}">👗 My clothes</button>
    <button data-closet="shop" aria-pressed="${closetView === 'shop'}">🛍️ Shop</button></div>`;
  if (closetView === 'shop') {
    return toggle + SLOTS.map((slot) => {
      const ids = Object.keys(ITEMS).filter((id) => ITEMS[id].slot === slot.id && ITEMS[id].price !== null);
      return `<h2 class="section-title">${slot.name}</h2><div class="grid">${ids.map((id) => itemCard(id, 'shop')).join('')}</div>`;
    }).join('') + `<p class="note">✨ Some rare items can only be found on missions. Tap 👀 to try something on.${skipConfirm() ? ' <button class="link" data-action="confirm-on">Ask before buying again</button>' : ''}</p>`;
  }
  if (!state.owned.length) {
    return `${toggle}<div class="empty"><div class="empty-icon">👗</div><p>No clothes yet! Buy some in the <button class="link" data-closet="shop">shop</button> or find rare items on <button class="link" data-tab="missions">expeditions</button>.</p></div>`;
  }
  return toggle + SLOTS.map((slot) => {
    const ids = state.owned.filter((id) => ITEMS[id].slot === slot.id);
    if (!ids.length) return '';
    return `<h2 class="section-title">${slot.name}</h2><div class="grid">${ids.map((id) => itemCard(id, 'wardrobe')).join('')}</div>`;
  }).join('') + '<div class="settings"><button class="link" data-action="undress">Take everything off</button></div>';
}

let mapSel = 'lilypond';
let journalOpen = false;

function missionCard(m) {
  const locked = state.level < m.level;
  const loot = m.loot.map(([id]) => ITEMS[id].icon).join(' ');
  const disabled = locked || !!state.mission || state.sleeping || state.stats.energy < m.energy;
  return `<div class="card mission ${locked ? 'locked' : ''}">
    <div class="mission-head"><span class="mission-icon">${m.icon}</span>
      <div><b>${m.name}</b><div class="muted">⏱ ${fmtMinutes(m.minutes)} · ⚡ ${m.energy} energy</div>
      <div class="muted"><span class="pearl-icon"></span> ${m.pearls[0]}–${m.pearls[1]}${loot ? ` · rare: ${loot}` : ''} · 🔍 finds</div></div></div>
    <button class="btn small ${disabled ? '' : 'primary'}" data-action="mission" data-id="${m.id}" ${disabled ? 'disabled' : ''}>${locked ? `🔒 Lv ${m.level}` : 'Go!'}</button>
  </div>`;
}

function findTile(f) {
  const n = state.collection[f.id] || 0;
  const r = RARITY[f.rarity];
  return `<div class="find ${n ? 'got' : ''}" style="--rar:${r.color}" title="${n ? f.name : 'Not found yet'} · ${r.name}">
    <span class="find-icon">${n ? f.icon : '❔'}</span><span class="find-name">${n ? f.name : '???'}</span>
    <span class="find-rar">${r.stars}${n > 1 ? ` ×${n}` : ''}</span></div>`;
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
  const found = core.collectionCount(state);
  if (journalOpen) {
    return `${head}<div class="explore-head"><h2 class="section-title">Collection journal</h2>
      <button class="btn small" data-action="journal">🗺️ Back to map</button></div>
      <p class="journal-total">📖 ${found} / ${TOTAL_FINDS} discovered · 🏅 ${state.sets.length} / ${LOCATIONS.length} sets</p>
      ${LOCATIONS.map((l) => `<div class="card journal-loc"><div class="journal-loc-head"><b>${l.icon} ${l.name}</b>
        <span class="muted">${l.finds.filter((f) => state.collection[f.id]).length}/${l.finds.length}${state.sets.includes(l.id) ? ' 🏅' : ''}</span></div>
        <div class="finds">${l.finds.map(findTile).join('')}</div></div>`).join('')}
      ${(() => {
        const cur = core.eventStatus(state)?.event;
        const evs = EVENTS.filter((e) => e === cur || e.finds.some((f) => state.collection[f.id]));
        return evs.length ? `<h2 class="section-title">Limited discoveries <small>only during events</small></h2>${evs.map((e) => `<div class="card journal-loc"><div class="journal-loc-head"><b>${e.icon} ${e.name}</b>
          <span class="muted">${e.finds.filter((f) => state.collection[f.id]).length}/${e.finds.length}</span></div><div class="finds two">${e.finds.map(findTile).join('')}</div></div>`).join('')}` : '';
      })()}
      <p class="note">Complete a place's set for a 🏅 badge and ${SET_REWARD.pearls} pearls.</p>`;
  }
  const loc = LOC[mapSel] || LOCATIONS[0];
  const locked = !core.locUnlocked(state, loc.id);
  const ready = core.exploreReadyAt(state, loc.id);
  const wait = ready - Date.now();
  const busyMsg = state.mission ? 'away' : state.sleeping ? 'asleep' : '';
  const exploreBtn = locked ? `<button class="btn" disabled>🔒 Unlocks at level ${loc.level}</button>`
    : wait > 0 ? `<button class="btn" disabled>🔍 Explore again in <span data-live="explore-wait" data-ready="${ready}">${fmtTime(wait)}</span></button>`
      : `<button class="btn primary" data-action="explore" data-id="${loc.id}" ${busyMsg || state.stats.energy < EXPLORE_ENERGY ? 'disabled' : ''}>🔍 Explore here · ⚡${EXPLORE_ENERGY}</button>`;
  const missions = loc.missions.map((id) => MISSIONS.find((m) => m.id === id));
  const games = loc.games.map((id) => GAME_LIST.find((g) => g.id === id));
  return `${head}
    <div class="explore-head"><h2 class="section-title">Explore</h2>
      <button class="btn small" data-action="journal">📖 Journal ${found}/${TOTAL_FINDS}</button></div>
    <div class="map-wrap">${mapSVG(state, loc.id)}</div>
    <div class="card loc-card ${locked ? 'locked' : ''}">
      <div class="loc-title"><span class="loc-icon">${loc.icon}</span><div><h3>${loc.name}${state.sets.includes(loc.id) ? ' 🏅' : ''}${state.persona?.fav.place === loc.id ? ` <span class="fav-tag">❤️ ${esc(state.name)}'s favorite</span>` : ''}</h3><p class="muted">${loc.desc}</p></div></div>
      ${loc.id === 'lilypond' ? '<div class="row"><button class="btn small" data-tab="home">🦦 Visit your otter</button><button class="btn small" data-tab="den">🏡 Go to the den</button></div>' : ''}
      ${(() => { const l = exploreLuck(loc.id); return l > 1.01 && !locked ? `<p class="luck-note">✨ ${tideAt().state === 'low' && LOW_TIDE_PLACES.includes(loc.id) ? 'Low tide' : WEATHER[weatherAt()].name + ' weather'}: finds here are luckier right now!</p>` : ''; })()}
      ${exploreBtn}
      ${busyMsg ? `<p class="muted small-note">${esc(state.name)} is ${busyMsg === 'away' ? 'out on a mission' : 'napping'} right now.</p>` : ''}
      <h4 class="loc-sub">Discoveries · ${loc.finds.filter((f) => state.collection[f.id]).length}/${loc.finds.length}</h4>
      <div class="finds">${loc.finds.map(findTile).join('')}</div>
      ${missions.length ? `<h4 class="loc-sub">Missions here</h4><div class="missions">${missions.map(missionCard).join('')}</div>` : ''}
      <h4 class="loc-sub">Games here</h4>
      <div class="loc-games">${games.map((g) => `<button class="loc-game" data-action="game" data-id="${g.id}"><span>${g.icon}</span><b>${g.name}</b><small>⚡${g.energy}</small></button>`).join('')}</div>
    </div>
    <p class="note">Missions run in real time, even when this page is closed. Explore from Discord with <code>/explore</code>.</p>`;
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
          <b>${g.name}${state.persona?.fav.game === g.id ? ' <span class="fav-tag">❤️ favorite</span>' : ''}</b>
          <span class="muted">${g.desc}</span>
        </button>
        <div class="arcade-foot"><span class="muted">⚡ ${g.energy}${bestLabel(g) ? ` · ${bestLabel(g)}` : ''}</span>
        ${sync.online ? `<button class="link small" data-action="board" data-id="${g.id}">Leaderboard</button>` : ''}</div>
      </div>`).join('')}
    </div>`).join('') + `<p class="note">Games cost a little energy, earn pearls and make ${esc(state.name || 'your otter')} happy.</p>`;
}

// ---------- friends ----------
let friendsData = null; // last /api/friends response
let giftsData = [];
let friendsLoading = false;

let socialData = null; // /api/inbox: notices, mail, guestbook, sleepovers, pen pals, challenges
let recentNotices = [];

async function loadFriends() {
  if (!sync.online || !sync.linked || friendsLoading) return;
  friendsLoading = true;
  try {
    const [f, g, ib] = await Promise.all([sync.friends(), sync.gifts(), sync.inbox()]);
    if (f.ok) friendsData = f;
    if (g.ok) giftsData = g.gifts;
    if (ib.ok) applyInbox(ib);
  } catch { /* offline */ }
  friendsLoading = false;
  if (tab === 'friends') renderPanel();
  if (tab === 'den') redrawDen();
  renderHeader();
}

function applyInbox(ib) {
  socialData = ib;
  if (ib.notices?.length) {
    recentNotices = [...ib.notices, ...recentNotices].slice(0, 8);
    ib.notices.slice(0, 3).reverse().forEach((n, k) => setTimeout(() => toast(n.text), 600 + k * 2800));
  }
}

async function refreshInbox() {
  if (!sync.online || !sync.linked) return;
  try { const ib = await sync.inbox(); if (ib.ok) { applyInbox(ib); if (tab === 'friends') renderPanel(); renderHeader(); } } catch { /* offline */ }
}

// A small otter portrait from a friend's public info.
function miniOtter(f, prefix) {
  const lvl = f.mood === 'happy' ? 90 : f.mood === 'sad' ? 20 : 60;
  const st = { ...core.defaultState(), stats: { hunger: lvl, happiness: lvl, energy: lvl, clean: lvl }, equipped: f.equipped || {}, sleeping: !!f.sleeping };
  return `<svg viewBox="0 -24 200 254" aria-hidden="true">${otterSVG(st, { idPrefix: prefix })}</svg>`;
}

function friendCard(f, k) {
  return `<div class="card friend">
    <div class="friend-art">${miniOtter(f, `fr${k}`)}</div>
    <div class="friend-info"><b>${esc(f.name)}</b>${f.owner ? `<span class="muted"> · ${esc(f.owner)}</span>` : ''}
      <div class="muted">${f.trait && core.TRAITS[f.trait] ? `${core.TRAITS[f.trait].icon} ${core.TRAITS[f.trait].name} · ` : ''}Lv ${f.level} · ${f.away ? '🧭 exploring' : f.sleeping ? '💤 napping' : f.mood === 'happy' ? '😊 happy' : f.mood === 'sad' ? '🥺 needs love' : '🙂 okay'}</div>
      <div class="hearts" title="${f.points} friendship points">${heartsText(f.points)} <small>${f.friendship}</small></div></div>
    <div class="friend-actions">
      <button class="btn small primary" data-action="fr-visit" data-code="${f.code}">Visit</button>
      <div class="friend-mini"><button class="btn small" data-action="fr-gift" data-code="${f.code}" data-name="${esc(f.name)}" aria-label="Send a gift">🎁</button><button class="btn small" data-action="mail-write" data-code="${f.code}" data-name="${esc(f.name)}" aria-label="Send a postcard">✉️</button></div>
    </div></div>`;
}

function discordSection() {
  const invite = sync.info?.invite;
  const cmds = `<details class="card cmd-list"><summary><b>Discord bot commands</b></summary>
      <div><code>/pet</code> See your otter and feed, cuddle, bathe or nap</div>
      <div><code>/friend</code> Add and list friends · <code>/hug @friend</code> · <code>/gift @friend</code></div>
      <div><code>/den</code> Show off your den · <code>/visit @friend</code> Peek inside a friend's den</div>
      <div><code>/mission</code> Adventures · <code>/explore</code> Discoveries · <code>/collection</code> Journal</div>
      <div><code>/daily</code> Daily treasure chest · <code>/leaderboard</code> Top scores · <code>/profile</code></div>
      <div><code>/play</code> Solo games: trivia, fishing, hangman, minesweeper and more</div>
      <div><code>/challenge</code> Connect Four, Tic-Tac-Toe, Rock Paper Scissors with a friend</div>
      <div><code>/party</code> Voice-chat games: Impostor, Trivia Battle, Hot Potato and more</div></details>`;
  if (linkedName) {
    return `<h2 class="section-title">Discord</h2><div class="card linked"><div class="linked-head"><span class="big-emoji">🔗</span><div><b>Linked to Discord</b>
      <div class="muted">Discord: <b>${esc(linkedName)}</b>. ${esc(state.name || 'Your otter')} follows you into Discord.</div></div></div>
      ${invite ? `<a class="btn small" href="${esc(invite)}" target="_blank" rel="noopener">Add the bot to a server</a>` : ''}</div>${cmds}`;
  }
  return `<h2 class="section-title">Discord</h2><div class="card">
    <p class="flush-p">Bring ${esc(state.name || 'your otter')} into Discord to play games with friends in chats and voice calls.</p>
    <ol class="steps">
      <li>${invite ? `<a href="${esc(invite)}" target="_blank" rel="noopener">Add the Otter &amp; Oyster bot</a>` : 'Add the Otter &amp; Oyster bot'} to your Discord account or a server.</li>
      <li>Type <code>/link</code> anywhere the bot is. It privately sends you a 6-letter code.</li>
      <li>Enter the code here:</li>
    </ol>
    <form class="link-form" data-form="link">
      <input name="code" maxlength="6" autocomplete="off" placeholder="ABC123" aria-label="Link code" required>
      <button class="btn primary" type="submit">Link</button>
    </form></div>${cmds}`;
}

function panelFriends() {
  if (!sync.online) {
    return `<div class="empty"><div class="empty-icon">📡</div><p>The Otter &amp; Oyster server isn't reachable from this page, so friends and Discord are unavailable. Your otter is still saved on this device.</p>
      <p class="muted small-note">Looked for it at: ${sync.tried.map(esc).join(', ') || location.origin}</p>
      <button class="btn" data-action="recheck">Try again</button></div>`;
  }
  if (!sync.linked) {
    return `<div class="card signup">
      <img class="hero-art" src="${art.float || 'assets/web/otter-float.webp'}" alt="">
      <h2 class="section-title flush">Make otter friends 🦦💕</h2>
      <p class="flush-p">Save ${esc(state.name || 'your otter')} online to add friends, visit their dens, give hugs and send gifts. Your otter then also works on other devices and in Discord.</p>
      ${discordButton()}
      <button class="btn ${sync.discordLoginUrl ? '' : 'primary'} wide" data-action="register">${sync.discordLoginUrl ? 'Or save online without Discord' : 'Save my otter online'}</button>
      <p class="muted center">Already use the Discord bot? Link it below instead.</p></div>
      ${discordSection()}`;
  }
  if (!friendsData) {
    loadFriends();
    return '<div class="empty"><div class="empty-icon">🫧</div><p>Finding your friends…</p></div>';
  }
  const d = friendsData;
  return `
    <div class="card code-card"><div><small class="muted">Your friend code</small><div class="friend-code">${d.code}</div></div>
      <button class="btn small" data-action="fr-copy" data-code="${d.code}">📋 Copy</button></div>
    <form class="link-form add-friend" data-form="addfriend">
      <input name="code" maxlength="9" autocomplete="off" placeholder="OTR-XXXXX" aria-label="Friend code" required>
      <button class="btn primary" type="submit">Add friend</button>
    </form>
    ${giftsData.length ? `<h2 class="section-title">Gifts for you</h2><div class="card gifts">
      ${giftsData.map((g) => `<div class="gift-row"><span class="gift-icon">${g.kind === 'pearls' ? '<span class="pearl-icon"></span>' : '🎁'}</span>
        <div><b>${g.kind === 'pearls' ? `${g.amount} pearls` : esc(FURNITURE[g.item]?.name || 'A gift')}</b> <span class="muted">from ${esc(g.from)}</span>${g.note ? `<div class="gift-note">“${esc(g.note)}”</div>` : ''}</div></div>`).join('')}
      <button class="btn primary wide" data-action="gifts-open">Open ${giftsData.length > 1 ? `all ${giftsData.length} gifts` : 'gift'}</button></div>` : ''}
    ${socialSections()}
    ${d.incoming.length ? `<h2 class="section-title">Friend requests</h2>${d.incoming.map((f, k) => `<div class="card friend">
      <div class="friend-art">${miniOtter(f, `in${k}`)}</div>
      <div class="friend-info"><b>${esc(f.name)}</b>${f.owner ? `<span class="muted"> · ${esc(f.owner)}</span>` : ''}<div class="muted">Lv ${f.level} wants to be friends!</div></div>
      <div class="friend-actions"><button class="btn small primary" data-action="fr-accept" data-code="${f.code}">Accept</button>
      <button class="btn small" data-action="fr-decline" data-code="${f.code}">No thanks</button></div></div>`).join('')}` : ''}
    <h2 class="section-title">Friends <small>${d.friends.length}</small></h2>
    ${d.friends.length ? d.friends.map(friendCard).join('') : `<div class="empty"><div class="empty-icon">🦦</div><p>No friends yet! Share your code <b>${d.code}</b> or add a friend's code above.</p></div>`}
    ${d.outgoing.length ? `<p class="note">⏳ Waiting for ${d.outgoing.map((f) => esc(f.name)).join(', ')} to accept.</p>` : ''}
    <p class="note">💗 Visit, hug, gift and play together to grow your friendship.</p>
    ${discordSection()}
    <div class="settings"><button class="link" data-action="unlink">Sign out on this device</button></div>`;
}

const POSTCARD_ART = {
  pond: { name: 'Lily Pond', icon: '🪷' },
  lighthouse: { name: 'Lighthouse', icon: '🗼' },
  reef: { name: 'Pearl Reef', icon: '🐠' },
  moon: { name: 'Moonlit Night', icon: '🌙' },
};

function socialSections() {
  const sd = socialData;
  if (!sd) return '';
  const invites = sd.sleepovers.filter((x) => !x.hosting && x.status === 'invited');
  const tonight = sd.sleepovers.filter((x) => x.status === 'accepted');
  return `
    ${recentNotices.length ? `<h2 class="section-title">What's new</h2><div class="card notices">${recentNotices.slice(0, 5).map((n) => `<div class="notice">${esc(n.text)}</div>`).join('')}</div>` : ''}
    ${invites.map((x) => `<div class="card sleep-invite"><span class="big-emoji">🌙</span><div><b>${esc(x.name)} invited you to a sleepover tonight!</b><div class="muted">Both otters wake up happier and more rested.</div></div>
      <div class="friend-actions"><button class="btn small primary" data-action="sleep-yes" data-code="${x.code}">Yes!</button><button class="btn small" data-action="sleep-no" data-code="${x.code}">Not tonight</button></div></div>`).join('')}
    ${tonight.map((x) => `<div class="card sleep-invite"><span class="big-emoji">🛌</span><div><b>${x.hosting ? `${esc(x.name)} is sleeping over in your den tonight!` : `You're sleeping over at ${esc(x.name)}'s den tonight!`}</b>${x.hosting ? '<div class="muted"><button class="link" data-tab="den">Peek in the den</button></div>' : ''}</div></div>`).join('')}
    ${sd.challenges.length ? `<h2 class="section-title">Challenges for you</h2>${sd.challenges.map((c) => `<div class="card challenge"><span class="big-emoji">${c.icon || '🏆'}</span>
      <div><b>${esc(c.from)} dares you!</b><div class="muted">Beat ${c.score} ${esc(c.label || '')} in ${esc(c.gameName || c.game)}</div></div>
      <button class="btn small primary" data-action="game" data-id="${c.game}">Play</button></div>`).join('')}` : ''}
    <h2 class="section-title">Shell Mail <small>${sd.mailUnread ? `${sd.mailUnread} new` : ''}${sd.mailInFlight ? ` · ${sd.mailInFlight} on the way 🕊️` : ''}</small></h2>
    <div class="card mail-card"><span class="big-emoji">📬</span><div><b>${sd.mail.length ? `${sd.mail.length} postcard${sd.mail.length > 1 ? 's' : ''} in your letter book` : 'No postcards yet'}</b>
      <div class="muted">Send postcards with ✉️ on a friend. A seagull delivers them in about 30 minutes.</div></div>
      <button class="btn small ${sd.mailUnread ? 'primary' : ''}" data-action="mailbox">Open</button></div>
    <h2 class="section-title">Pen pals</h2>
    <div class="card penpals">
      ${sd.penpals.pals.length ? sd.penpals.pals.map((p) => `<div class="pal-row"><span>✉️</span><b>${esc(p.name)}</b><span class="muted">Lv ${p.level}${p.trait && core.TRAITS[p.trait] ? ` · ${core.TRAITS[p.trait].icon}` : ''}</span>
        <button class="btn small" data-action="mail-write" data-code="${p.code}" data-name="${esc(p.name)}">Write</button></div>`).join('') : '<p class="muted flush-p">Get matched with another otter keeper to swap postcards. No friend code needed!</p>'}
      ${sd.penpals.waiting ? '<p class="muted flush-p">🕊️ Looking for a pen pal for you… check back soon!</p>' : sd.penpals.pals.length < 3 ? `<button class="btn small" data-action="penpal-join">${sd.penpals.pals.length ? 'Find another pen pal' : 'Find me a pen pal'}</button>` : ''}
    </div>
    ${sd.guestbook.length ? `<h2 class="section-title">Your guestbook</h2><div class="card guestbook">${sd.guestbook.map((g) => `<div class="gb-entry"><b>${esc(g.author)}</b> <span class="muted">${new Date(g.created).toLocaleDateString()}</span>
      <button class="link small" data-action="gb-delete" data-id="${g.id}" aria-label="Delete note">✕</button><div>${esc(g.text)}</div></div>`).join('')}</div>` : ''}`;
}

function postcardHTML(m) {
  const art = POSTCARD_ART[m.design] || POSTCARD_ART.pond;
  return `<div class="postcard pc-${m.design || 'pond'}"><div class="pc-stamp">${art.icon}</div><div class="pc-title">Greetings from ${art.name}!</div>
    <div class="pc-text">${esc(m.text)}</div><div class="pc-from">— ${esc(m.from)}</div></div>`;
}

function openMailbox() {
  const mail = socialData?.mail || [];
  showModal(`<div class="mailbox"><div class="game-top"><h2>📖 Letter book</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>
    ${mail.length ? mail.map((m) => `<button class="mail-row ${m.read ? '' : 'unread'}" data-action="mail-open" data-id="${m.id}"><span>${(POSTCARD_ART[m.design] || POSTCARD_ART.pond).icon}</span>
      <b>${esc(m.from)}</b><span class="muted">${esc(m.text.slice(0, 40))}${m.text.length > 40 ? '…' : ''}</span>${m.read ? '' : '<span class="new-dot">new</span>'}</button>`).join('')
    : '<p class="muted center">No postcards yet. Make some friends or find a pen pal!</p>'}
    ${socialData?.mailInFlight ? `<p class="muted center">🕊️ ${socialData.mailInFlight} postcard${socialData.mailInFlight > 1 ? 's are' : ' is'} on the way…</p>` : ''}</div>`, { wide: true });
}

function writePostcard(code, name) {
  showModal(`<form class="pc-form" data-form="postcard" data-code="${code}">
    <h2>✉️ A postcard for ${esc(name)}</h2>
    <div class="gift-options">${Object.entries(POSTCARD_ART).map(([id, a], k) => `<label class="gift-opt"><input type="radio" name="design" value="${id}" ${k === 0 ? 'checked' : ''}><span>${a.icon} ${a.name}</span></label>`).join('')}</div>
    <textarea name="text" maxlength="280" rows="4" required placeholder="Dear ${esc(name)}, today ${esc(state.name)} found…" class="note-input"></textarea>
    <p class="muted small-note">A seagull will deliver it in about 30 minutes. Be kind! 🦦</p>
    <div class="row"><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Send 🕊️</button></div>
  </form>`);
}

async function visitFriend(code) {
  showModal('<div class="result"><div class="result-icon">🫧</div><p>Swimming over…</p></div>', { wide: true });
  const r = await sync.visit(code);
  if ($('#modal').hidden) return;
  if (!r.ok) { $('#modal-card').innerHTML = `<div class="result"><p>${esc(r.error || 'Could not visit right now.')}</p><button class="btn primary" data-close>OK</button></div>`; return; }
  const o = r.otter;
  const st = { ...core.defaultState(), ...o, mission: o.mission ? { ...o.mission, start: 0, endsAt: 0 } : null, den: o.den };
  const found = Object.keys(o.collection || {}).filter((id) => FINDS[id]).length;
  $('#modal-card').innerHTML = `<div class="visit">
    <div class="game-top"><h2>🏡 ${esc(o.name)}'s Den</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>
    <div class="den-stage visit-den">${denSVG(st, { extraAttrs: `class="den-svg" role="img" aria-label="${esc(o.name)}'s den"` }).replace(/den-otter-/g, 'visit-otter-')}</div>
    <div class="visit-info">
      <div class="hearts">${heartsText(r.friend.points)} <small>${r.friend.friendship}${friendLevel(r.friend.points).next ? ` · ${friendLevel(r.friend.points).next - r.friend.points} to next` : ''}</small></div>
      ${(() => { const pi = core.personaInfo(st); return `<div class="visit-persona">${pi.trait ? `${pi.trait.icon} <b>${pi.trait.name}</b>` : '🌱 Still discovering'} · ❤️ ${pi.fav.snack.icon} ${pi.fav.place.icon} ${pi.fav.game.icon}</div>`; })()}
      <div class="muted">Lv ${o.level} · 📖 ${found}/${TOTAL_FINDS} discoveries · 🏅 ${(o.sets || []).length} sets · ✨ coziness ${core.coziness(st)}</div>
    </div>
    <div class="row">
      <button class="btn ${r.huggedToday ? '' : 'primary'}" data-action="fr-hug" data-code="${code}" ${r.huggedToday ? 'disabled' : ''}>${r.huggedToday ? '🤗 Hugged today' : `🤗 Hug ${esc(o.name)}`}</button>
      <button class="btn" data-action="fr-gift" data-code="${code}" data-name="${esc(o.name)}">🎁 Gift</button>
      <button class="btn" data-action="mail-write" data-code="${code}" data-name="${esc(o.name)}">✉️ Postcard</button>
    </div>
    <h3 class="den-sub dark">Pet-sit ${esc(o.name)}</h3>
    <div class="emote-row"><button class="btn small" data-action="sit" data-code="${code}" data-id="feed">🐟 Snack</button><button class="btn small" data-action="sit" data-code="${code}" data-id="cuddle">🤗 Cuddle</button><button class="btn small" data-action="sit" data-code="${code}" data-id="bath">🛁 Bath</button>
      <button class="btn small" data-action="sleep-invite" data-code="${code}">🌙 Sleepover</button></div>
    <h3 class="den-sub dark">Guestbook</h3>
    <div class="guestbook small">${(r.guestbook || []).length ? r.guestbook.slice(0, 6).map((g) => `<div class="gb-entry"><b>${esc(g.author)}</b> <span class="muted">${new Date(g.created).toLocaleDateString()}</span>${g.mine ? ` <button class="link small" data-action="gb-delete" data-id="${g.id}" aria-label="Delete my note">✕</button>` : ''}<div>${esc(g.text)}</div></div>`).join('') : `<p class="muted flush-p">Be the first to sign ${esc(o.name)}'s guestbook!</p>`}</div>
    <form class="link-form gb-form" data-form="guestbook" data-code="${code}"><input name="text" maxlength="140" placeholder="Leave a kind note…" required aria-label="Guestbook note"><button class="btn primary" type="submit">Sign</button></form>
    </div>`;
}

function giftDialog(code, name) {
  const storage = Object.keys(FURNITURE).filter((id) => core.inStorage(state, id) > 0);
  showModal(`<form class="gift-form" data-form="gift" data-code="${code}">
    <h2>🎁 A gift for ${esc(name)}</h2>
    <p class="muted">Pearls (up to ${GIFT_PEARLS_PER_DAY} a day)</p>
    <div class="gift-options">${GIFT_PEARL_OPTIONS.map((n, k) => `<label class="gift-opt"><input type="radio" name="gift" value="pearls:${n}" ${k === 0 ? 'checked' : ''} ${state.pearls < n ? 'disabled' : ''}><span><span class="pearl-icon"></span> ${n}</span></label>`).join('')}</div>
    <p class="muted">…or something from your den storage</p>
    ${storage.length ? `<div class="gift-options">${storage.map((id) => `<label class="gift-opt"><input type="radio" name="gift" value="furniture:${id}"><span class="gift-furn"><span class="den-art">${furniturePreviewSVG(id)}</span>${FURNITURE[id].name}</span></label>`).join('')}</div>`
    : '<p class="muted small-note">(Nothing in storage. Put something away in your den to gift it.)</p>'}
    <input name="note" maxlength="80" placeholder="Add a little note (optional)" class="note-input">
    <div class="row"><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Send gift</button></div>
  </form>`);
}

// ---------- the den ----------
let denEdit = false;
let denSel = null;
let denShop = 'furniture';

function denStageHTML() {
  const guests = (socialData?.sleepovers || []).filter((x) => x.hosting && x.status === 'accepted').map((x) => ({ name: x.name, equipped: x.equipped }));
  return denSVG(state, { editable: denEdit, selected: denEdit ? denSel : null, guests, extraAttrs: 'class="den-svg" role="img" aria-label="Your otter\'s den"' });
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
    const sw = (kind, id, it, owned, active) => `<div class="swatch-wrap"><button class="swatch ${active ? 'on' : ''}" data-action="den-${kind}" data-id="${id}" ${!owned && state.pearls < it.price ? 'disabled' : ''}>
        <span class="swatch-chip" style="background:${it.swatch}"></span><b>${it.name}</b>
        <small>${active ? 'In use ✓' : owned ? 'Owned' : `<span class="pearl-icon"></span> ${it.price}`}</small></button>
        ${owned ? '' : `<button class="link small" data-action="try" data-kind="${kind === 'wall' ? 'wall' : 'floor'}" data-id="${id}">👀 Preview</button>`}</div>`;
    shop = `<h3 class="den-sub">Wallpaper</h3><div class="swatches">${Object.entries(WALLPAPERS).map(([id, it]) => sw('wall', id, it, state.wallpapers.includes(id), state.den.wallpaper === id)).join('')}</div>
      <h3 class="den-sub">Floors</h3><div class="swatches">${Object.entries(FLOORS).map(([id, it]) => sw('floor', id, it, state.floors.includes(id), state.den.floor === id)).join('')}</div>`;
  } else {
    shop = `<div class="grid">${Object.entries(FURNITURE).filter(([, it]) => it.cat === denShop && !it.event).map(([id, it]) => {
      const owned = state.furniture[id] || 0;
      const locked = state.level < it.level;
      return `<div class="card item"><div class="item-art den-art">${furniturePreviewSVG(id)}</div><div class="item-name">${it.name}</div>
        <small class="muted">✨ +${it.cozy}${owned ? ` · own ${owned}` : ''}</small>
        ${locked ? `<button class="btn small" disabled>🔒 Lv ${it.level}</button>`
    : `<div class="buy-row">${tryBtn('furn', id)}<button class="btn small primary" data-action="den-buy" data-id="${id}" ${state.pearls < it.price ? 'disabled' : ''}><span class="pearl-icon"></span> ${it.price}</button></div>`}</div>`;
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
    const item = g && state.den.items.find((q) => q.uid === g.dataset.uid);
    if (item?.id === 'bookshelf') { if (sync.linked && socialData) openMailbox(); else toast('📖 Your letter book. Sign in on the Friends tab to get Shell Mail!'); }
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

const PANELS = { event: panelEvent, home: panelHome, den: panelDen, closet: panelCloset, missions: panelMissions, arcade: panelArcade, friends: panelFriends };

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
function celebrateAchievements() {
  if (!state.name) return;
  if (timeOfDay() === 'night' && !state.counters.night) core.count(state, 'night');
  core.checkAchievements(state);
  const fresh = core.takeNewAchievements(state);
  if (!fresh.length) return;
  const a = core.ACH[fresh[fresh.length - 1]];
  setTimeout(() => {
    toast(`🏅 Achievement unlocked: ${a.name}! +${a.reward} pearls${fresh.length > 1 ? ` (and ${fresh.length - 1} more)` : ''}`);
    burst([a.icon, '🏅', '✨'], 10);
  }, 400);
}

function commit({ push = true } = {}) {
  celebrateAchievements();
  saveLocal();
  renderAll();
  renderPanel();
  if (push && sync.linked) {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, 700);
  }
}

function updateLive() {
  const ew = document.querySelector('[data-live="explore-wait"]');
  if (ew) { const left = Number(ew.dataset.ready) - Date.now(); if (left <= 0) renderPanel(); else ew.textContent = fmtTime(left); }
  if (!state.mission) return;
  const left = document.querySelector('[data-live="mission-left"]');
  const bar = document.querySelector('[data-live="mission-bar"]');
  if (left) left.textContent = fmtTime(state.mission.endsAt - Date.now());
  if (bar) bar.style.width = `${clamp(((Date.now() - state.mission.start) / (state.mission.endsAt - state.mission.start)) * 100)}%`;
}

// ---------- sync ----------
async function pushNow({ keepalive = false } = {}) {
  clearTimeout(pushTimer);
  pushTimer = 0;
  if (!sync.linked || !sync.online) { renderSaveChip(); return; }
  saveInfo.cloud = 'saving';
  renderSaveChip();
  try {
    const r = await sync.push(state, { keepalive });
    if (r.conflict) adoptRemote(r.state, r.version, 'Updated with changes from Discord 🔄');
    saveInfo.cloud = r.ok || r.conflict ? 'ok' : 'error';
    if (r.ok || r.conflict) saveInfo.cloudAt = Date.now();
  } catch {
    saveInfo.cloud = 'error'; // offline; retried on the next change and every minute
  }
  renderSaveChip();
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

function animateOtter(cls, ms) {
  const w = $('#otter-wrap');
  w.classList.remove('bathing', 'cuddling');
  void w.offsetWidth;
  w.classList.add(cls);
  setTimeout(() => w.classList.remove(cls), ms);
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
  // No otter yet (e.g. closed the load screen without loading one): ask again.
  setTimeout(() => { if (!state.name && $('#modal').hidden) askName(true); }, 50);
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
      ${first ? '<button class="link" type="button" data-action="havediscord">Already have an otter? Load it from another device, Discord or a backup</button>' : ''}
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
      <p>That code belongs to <b>${esc(r.server.name)}</b> (level ${r.server.level}). This device has <b>${esc(state.name)}</b> (level ${state.level}). Which otter do you want to keep?</p>
      <div class="row"><button class="btn primary" data-action="keep" data-keep="discord" data-code="${esc(code)}">Keep ${esc(r.server.name)}<br><small>(from the code)</small></button>
      <button class="btn" data-action="keep" data-keep="web" data-code="${esc(code)}">Keep ${esc(state.name)}<br><small>(this device)</small></button></div>
      <p class="muted">The other otter will be released back to the sea. Tip: download a backup first if you're not sure (💾 Save).</p></div>`);
    return;
  }
  if (!r.token) { toast(r.error || 'That code did not work. Try /link again.'); return; }
  linkedName = r.discordName || '';
  friendsData = null;
  closeModal();
  await sync.check();
  adoptRemote(r.state, r.version, `🔗 Linked! ${r.state.name} can now visit Discord.`);
}

// ---------- events ----------
document.addEventListener('click', async (e) => {
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) {
    tab = tabBtn.dataset.tab;
    if (tab === 'friends') loadFriends();
    renderPanel();
    if (tabBtn.closest('.tabs')) window.scrollTo({ top: 0 });
    return;
  }
  const pin = e.target.closest('[data-loc]');
  if (pin) { mapSel = pin.dataset.loc; renderPanel(); document.querySelector('.loc-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }
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
    case 'feed': { const r = act(core.feed(state, id)); if (r.ok) playCare('feed', { snack: id }); return r; }
    case 'pet': return careCuddle();
    case 'bath': {
      const r = act(core.bath(state));
      if (r.ok && !(await playCare('bath'))) { animateOtter('bathing', 2600); burst(['🫧', '🫧', '🫧', '💧', '🧼'], 14); }
      return r;
    }
    case 'sleep': {
      const r = act(core.toggleSleep(state));
      if (r.ok) { if (state.sleeping) playCare('nap').then(() => setSleeping(true)); else { setSleeping(false); playCare('wake'); } }
      return r;
    }
    case 'daily': { const r = act(core.claimDaily(state)); if (r.ok) playCare('gift'); return r; }
    case 'buy': return requestPurchase('item', id);
    case 'try': return shopPreview(a.dataset.kind, id);
    case 'confirm-buy': {
      if (document.querySelector('[data-skip-confirm]')?.checked) setSkipConfirm(true);
      closeModal();
      const r = doPurchase(a.dataset.kind, id);
      if (r?.ok && skipConfirm() && document.querySelector('[data-skip-confirm]') === null) toast(r.msg);
      return r;
    }
    case 'confirm-on': setSkipConfirm(false); toast('Purchase confirmations are back on.'); return renderPanel();
    case 'wear': bounce(); return act({ ...core.toggleWear(state, id), msg: '' });
    case 'hardreload': {
      try {
        const regs = await navigator.serviceWorker?.getRegistrations?.() || [];
        await Promise.all(regs.map((r) => r.unregister()));
        if (window.caches) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
      } catch { /* ignore */ }
      location.reload();
      return null;
    }
    case 'save-panel': return showSavePanel();
    case 'mailbox': return openMailbox();
    case 'mail-open': {
      const m = socialData?.mail.find((x) => String(x.id) === String(id));
      if (!m) return null;
      showModal(`${postcardHTML(m)}<div class="row pc-actions"><button class="btn" data-action="mailbox">← Letter book</button><button class="btn primary" data-action="mail-write" data-code="${m.fromCode}" data-name="${esc(m.from)}">Reply ✉️</button></div>`, { wide: true });
      if (!m.read) { m.read = true; socialData.mailUnread = Math.max(0, socialData.mailUnread - 1); sync.readMail(m.id); renderHeader(); }
      return null;
    }
    case 'mail-write': return writePostcard(a.dataset.code, a.dataset.name || 'your friend');
    case 'sit': {
      const r = await sync.sit(a.dataset.code, id);
      toast(r.ok ? r.msg : r.error || 'Could not do that right now.');
      if (r.ok) { a.disabled = true; burst(['💕'], 5); }
      return null;
    }
    case 'sleep-invite': {
      const r = await sync.sleepInvite(a.dataset.code);
      toast(r.ok ? '🌙 Sleepover invitation sent!' : r.error || 'Could not invite right now.');
      if (r.ok) a.disabled = true;
      return null;
    }
    case 'sleep-yes': case 'sleep-no': {
      const r = await sync.sleepRespond(a.dataset.code, a.dataset.action === 'sleep-yes');
      toast(r.ok ? (a.dataset.action === 'sleep-yes' ? '🌙 Pillow fort time! Both otters feel great.' : 'Maybe next time!') : r.error || 'Something went wrong.');
      await pullNow();
      return loadFriends();
    }
    case 'penpal-join': {
      const r = await sync.penpalJoin();
      toast(r.ok ? (r.matched ? `✉️ Your new pen pal is ${r.pal}!` : '🕊️ Looking for a pen pal… we will match you soon!') : r.error || 'Could not join right now.');
      return loadFriends();
    }
    case 'gb-delete': {
      if (!confirm('Delete this note?')) return null;
      await sync.deleteGuestbook(id);
      a.closest('.gb-entry')?.remove();
      return loadFriends();
    }
    case 'challenge-pick': {
      const r = await sync.challengeSend(a.dataset.code, a.dataset.game, Number(a.dataset.score));
      toast(r.ok ? `🏆 Challenge sent to ${a.dataset.name}!` : r.error || 'Could not send the challenge.');
      if (r.ok) closeModal();
      return null;
    }
    case 'challenge-friend': {
      const fr = friendsData?.friends || [];
      if (!fr.length) return toast('Add some friends first, then challenge them!');
      showModal(`<div class="result"><div class="result-icon">🏆</div><h2>Who should beat ${esc(a.dataset.score)}?</h2>
        <div class="pick-list">${fr.map((f) => `<button class="btn" data-action="challenge-pick" data-code="${f.code}" data-name="${esc(f.name)}" data-game="${a.dataset.game}" data-score="${a.dataset.score}">${esc(f.name)}</button>`).join('')}</div>
        <button class="btn" data-close>Cancel</button></div>`);
      return null;
    }
    case 'ach-toggle': achOpen = !achOpen; return renderPanel();
    case 'save-now':
      saveLocal();
      await pushNow();
      toast(sync.linked && sync.online ? (saveInfo.cloud === 'ok' ? '☁️ Saved online and on this device!' : '💾 Saved on this device. Online save will retry.') : '💾 Saved on this device!');
      if (!$('#modal').hidden && $('.save-panel')) $('#modal-card').innerHTML = savePanelHTML();
      return null;
    case 'backup': return downloadBackup();
    case 'device-code': {
      const r = await sync.deviceCode();
      if (!r.ok) return toast(r.error || 'Could not make a code right now.');
      await pushNow();
      return showSavePanel(`<div class="device-code"><small class="muted">On your other device, open <b>${esc(location.host)}</b> → 💾 Save → enter:</small>
        <div class="friend-code big">${r.code}</div><small class="muted">Works once, for 10 minutes.</small></div>`);
    }
    case 'register': {
      a.disabled = true;
      const r = await sync.register(state);
      if (!r.token) { a.disabled = false; return toast(r.error || 'Could not save online right now.'); }
      adoptRemote(r.state, r.version, `☁️ ${state.name} is saved online!`);
      saveInfo.cloud = 'ok';
      saveInfo.cloudAt = Date.now();
      if (!$('#modal').hidden && $('.save-panel')) $('#modal-card').innerHTML = savePanelHTML();
      friendsData = null;
      return loadFriends();
    }
    case 'fr-copy':
      try { await navigator.clipboard.writeText(a.dataset.code); toast('Friend code copied! 📋'); } catch { toast(a.dataset.code); }
      return null;
    case 'fr-accept':
    case 'fr-decline': {
      const r = await sync.respond(a.dataset.code, a.dataset.action === 'fr-accept');
      toast(r.ok ? (r.accepted ? '🤝 New friend!' : 'Request declined.') : r.error || 'Something went wrong.');
      return loadFriends();
    }
    case 'fr-visit': return visitFriend(a.dataset.code);
    case 'fr-hug': {
      const r = await sync.hug(a.dataset.code);
      toast(r.ok ? r.msg : r.error || 'Could not hug right now.');
      if (r.ok) { a.disabled = true; a.textContent = '🤗 Hugged today'; a.classList.remove('primary'); burst(['🤗', '💕'], 6); }
      return loadFriends();
    }
    case 'fr-gift': return giftDialog(a.dataset.code, a.dataset.name || 'your friend');
    case 'gifts-open': {
      await pushNow();
      const r = await sync.claim('all');
      if (!r.ok) return toast(r.error || 'Could not open gifts right now.');
      adoptRemote(r.state, r.version, `🎁 You got ${r.opened.join(', ')}!`);
      burst(['🎁', '✨', '💕'], 10);
      giftsData = [];
      return loadFriends();
    }
    case 'ev-claim': return act(core.claimQuest(state, id));
    case 'ev-buy': return requestPurchase(ITEMS[id] ? 'evitem' : 'evfurn', id);
    case 'explore': {
      const r = core.explore(state, id);
      if (!r.ok) return toast(r.msg);
      act(r);
      if (r.find && (r.isNew || r.setDone)) {
        const rar = RARITY[r.find.rarity];
        showModal(`<div class="result"><div class="result-icon big-find">${r.find.icon}</div>
          <h2>${r.setDone ? 'Collection complete! 🏅' : 'New discovery!'}</h2>
          <p><b>${r.find.name}</b> · <span style="color:${rar.color === '#9be8de' ? '#1f8f95' : rar.color}">${rar.stars} ${rar.name}</span></p>
          <p>Found at ${LOC[id].name}. It's in your collection journal.</p>
          ${r.setDone ? `<div class="rewards"><span class="chip"><span class="pearl-icon"></span> +${SET_REWARD.pearls}</span><span class="chip">⭐ +${SET_REWARD.xp} XP</span></div>` : ''}
          <button class="btn primary" data-close>Wonderful!</button></div>`);
      }
      return r;
    }
    case 'journal': journalOpen = !journalOpen; renderPanel(); window.scrollTo({ top: 0 }); return null;
    case 'den-edit': denEdit = !denEdit; denSel = null; return renderPanel();
    case 'den-buy': return requestPurchase('furn', id);
    case 'den-place': {
      const r = core.placeFurniture(state, id);
      if (!r.ok) return toast(r.msg);
      denEdit = true; denSel = r.uid; commit(); window.scrollTo({ top: 0, behavior: 'smooth' });
      return r;
    }
    case 'den-flip': core.flipItem(state, denSel); return commit();
    case 'den-store': { const r = core.storeItem(state, denSel); denSel = null; return act(r); }
    case 'den-wall': return state.wallpapers.includes(id) ? act(core.setWallpaper(state, id)) : requestPurchase('wall', id);
    case 'den-floor': return state.floors.includes(id) ? act(core.setFloor(state, id)) : requestPurchase('floor', id);
    case 'undress': Object.keys(state.equipped).forEach((k) => { state.equipped[k] = null; }); return commit();
    case 'mission': return act(core.startMission(state, id));
    case 'recall': return act(core.recallMission(state));
    case 'game': closeModal(); return playGame(id);
    case 'board': return showLeaderboard(id);
    case 'rename': return askName(false);
    case 'recheck':
      await sync.check();
      if (!$('#modal').hidden && $('.save-panel')) $('#modal-card').innerHTML = savePanelHTML();
      return renderAll() || renderPanel();
    case 'syncnow': return pullNow(false);
    case 'unlink':
      if (confirm('Sign out on this device? Your otter stays here, but it stops syncing with your online account, friends and Discord.')) {
        friendsData = null;
        linkedName = '';
        sync.unlink();
        commit({ push: false });
        toast('Unlinked from Discord.');
      }
      return;
    case 'keep': return doLink(a.dataset.code, a.dataset.keep);
    case 'havediscord':
      if (!sync.online) await sync.check();
      showSavePanel('<p class="muted small-note">Get a code from 💾 Save → 📲 <b>Use on another device</b> on your other device, or type <code>/link</code> in Discord. Or restore a backup file below.</p>');
      return null;
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
  } else if (form.dataset.form === 'postcard') {
    const btnEl = form.querySelector('[type=submit]');
    btnEl.disabled = true;
    sync.sendMail(form.dataset.code, new FormData(form).get('design'), form.text.value).then((r) => {
      if (!r.ok) { btnEl.disabled = false; return toast(r.error || 'Could not send the postcard.'); }
      closeModal();
      toast('🕊️ A seagull is carrying your postcard. It arrives in about 30 minutes!');
      burst(['✉️', '🕊️'], 6);
      return loadFriends();
    });
  } else if (form.dataset.form === 'guestbook') {
    sync.signGuestbook(form.dataset.code, form.text.value).then((r) => {
      if (!r.ok) return toast(r.error || 'Could not sign the guestbook.');
      toast('📖 Signed!');
      return visitFriend(form.dataset.code);
    });
  } else if (form.dataset.form === 'addfriend') {
    sync.addFriend(form.code.value.trim().toUpperCase()).then((r) => {
      toast(r.ok ? (r.accepted ? `🤝 You and ${r.friend.name} are now friends!` : `📨 Friend request sent to ${r.friend.name}!`) : r.error || 'Could not add that friend.');
      if (r.ok) form.reset();
      loadFriends();
    });
  } else if (form.dataset.form === 'gift') {
    const [kind, val] = (new FormData(form).get('gift') || '').split(':');
    if (!kind) return toast('Pick a gift first.');
    const btnEl = form.querySelector('[type=submit]');
    btnEl.disabled = true;
    (async () => {
      await pushNow();
      const r = await sync.gift(form.dataset.code, kind === 'pearls' ? { kind, amount: Number(val), note: form.note.value } : { kind, item: val, note: form.note.value });
      if (!r.ok) { btnEl.disabled = false; return toast(r.error || 'Could not send the gift.'); }
      closeModal();
      adoptRemote(r.state, r.version, '🎁 Gift sent! They will find it in their gift inbox.');
      burst(['🎁', '💕'], 8);
      loadFriends();
    })();
  }
});

document.addEventListener('change', (e) => {
  if (e.target.matches('[data-restore]') && e.target.files?.[0]) restoreBackup(e.target.files[0]);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#modal').hidden && !$('#modal').dataset.locked) {
    if (gameOpen) quitGame();
    else closeModal();
  }
});

async function careCuddle() {
  const r = act(core.cuddle(state));
  if (r.ok && !(await playCare('cuddle'))) animateOtter('cuddling', 1200);
  return r;
}
$('#otter-wrap').addEventListener('click', () => careCuddle());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { saveLocal(); if (sync.linked && sync.online) pushNow({ keepalive: true }); return; }
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

finishDiscordLogin();
window.addEventListener('hashchange', () => { if (location.hash.startsWith('#login')) finishDiscordLogin(); });
sync.check().then(async (online) => {
  if (!online) return renderAll();
  if (sync.linked) { await pullNow(); loadFriends(); }
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
  if (sync.linked && ticks % 120 === 0) refreshInbox();
}, 1000);

// Small hook for automated tests and the curious.
window.otteroyster = { get state() { return state; }, core, sync, rand };
