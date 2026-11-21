import { ITEMS, SLOTS, SNACKS, MISSIONS, GAME_LIST, GAME_CATEGORIES, NAME_IDEAS } from './data.js';
import * as core from './core.js';
import { otterSVG, itemPreviewSVG } from './otter.js';
import { LOADERS } from './games/index.js';
import { sync } from './sync.js';
import { detectArt, art } from './assets.js';
import { playCare, setSleeping } from './animations.js';
import { ic, artUrl, loadArtManifest } from './art.js';
import { COMPANIONS, BOND_PERK, BOND_NAMES, bondLevel, TREAT_PRICE, PLAY_COOLDOWN, COMP_COLORS, COMP_PATTERNS, COMP_ACCS, COMP_TRAITS } from './companions.js';
import { TRINKETS, TRINKET_IDS, TRINKET_GROUPS, BOOKS, BOOK_IDS, FISH, FISH_IDS, FISHING_COOLDOWN } from './treasures.js';
import { CROPS, PLOT_LEVELS, plotStage, plotReadyAt } from './garden.js';
import { DOOR_ITEMS, DOOR_KINDS } from './door.js';
import { companionSVG, gardenSVG, houseFrontSVG } from './extras-draw.js';
import { SPECIES } from './otter.js';
import { NPCS, NPC_PAGE_AT, NPC_MAX, MYSTERIES, PLACE_LORE, TOTAL_PAGES } from './lore.js';
import { happeningsAt, npcWhere, npcsAt, npcLine, merchantDocked, crittersFor, CRITTERS, gazetteHeadline } from './worldsim.js';
import { MASTERIES, TIERS, RANKS, LEGACY_LEVEL, legacyStars, rankOf, nextRank } from './legacy.js';
import { STAGES, stageOf, nextStage, TRICKS, isBirthday, nextBirthday, birthdayLabel } from './growth.js';
import { FURNITURE, WALLPAPERS, FLOORS, DEN_CATS } from './den-data.js';
import { denSVG, furniturePreviewSVG } from './den.js';
import { LOCATIONS, LOC, RARITY, FINDS, TOTAL_FINDS, EXPLORE_ENERGY, SET_REWARD } from './world.js';
import { mapSVG } from './map.js';
import { heartsText, friendLevel, GIFT_PEARL_OPTIONS, GIFT_PEARLS_PER_DAY, POSTCARD_ART } from './social.js';
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
    sync.rememberDiscord(true);
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
  playCare('levelup');
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
  playCare('mission-return');
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
      ${r.discovery && FINDS[r.discovery] ? `<div class="loot"><div class="loot-art big-find">${ic(`finds/${r.discovery}`, FINDS[r.discovery].icon)}</div><p>Brought back a <b>${FINDS[r.discovery].name}</b> for your collection!</p></div>` : ''}
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
  showModal(`<div class="game-wrap"><div class="game-top"><h2>${ic(`games/${g.id}`, g.icon)} ${g.name}</h2>
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
      <div class="result-icon">${ic(`games/${g.id}`, g.icon)}</div>
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
    $('#away').innerHTML = `<div class="away-icon">${ic(`missions/${m.id}`, m.icon)}</div><p><b>${esc(state.name)}</b> is on <b>${m.name}</b></p><p class="countdown">${fmtTime(state.mission.endsAt - Date.now())}</p>`;
  } else {
    const svg = otterSVG(state);
    if (svg !== lastOtter) { $('#otter').innerHTML = svg; lastOtter = svg; }
  }
  const comp = core.activeCompanion(state);
  const compEl = $('#companion');
  compEl.parentElement.hidden = !comp || away;
  if (comp) compEl.parentElement.dataset.trait = COMP_TRAITS[comp.trait]?.anim || '';
  if (comp && !away) {
    const cs = companionSVG(comp.id, { sleeping: state.sleeping, look: core.companionLook(comp) });
    if (compEl.dataset.k !== cs) { compEl.innerHTML = cs; compEl.dataset.k = cs; }
    compEl.setAttribute('aria-label', `Play with ${comp.name}`);
  }

  const thought = $('#thought');
  const low = Object.entries(state.stats).filter(([, v]) => v < 35).sort((a, b) => a[1] - b[1])[0];
  thought.hidden = !(!away && !state.sleeping && low);
  if (!thought.hidden) thought.textContent = NEEDS[low[0]];
  renderAmbience(scene, away);
  setSleeping(state.sleeping && !away);
  $('#otter-wrap').style.setProperty('--grow', state.name ? stageOf(state.level).scale : 1);
  scene.classList.toggle('party', !!isPartyDay());
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
  const sceneArt = artUrl(`scene/${phase}`) || artUrl('scene/base');
  scene.classList.toggle('has-scene-art', !!sceneArt);
  scene.style.setProperty('--scene-art', sceneArt ? `url("${sceneArt}")` : 'none');
  const drops = { rainy: '', breezy: '🍃', misty: '', cloudy: '', sunny: '' }[weather];
  const wArt = artUrl(`weather/${weather}`);
  if (wArt) { fx.innerHTML = `<img class="weather-art" src="${wArt}" alt="">`; return; }
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
    case 'door': return { name: DOOR_ITEMS[id].name, price: DOOR_ITEMS[id].price, cur: 'pearls', have: state.pearls };
    case 'comp': return { name: COMPANIONS[id].name, price: COMPANIONS[id].price, cur: 'pearls', have: state.pearls };
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
    case 'door': return act(core.buyDoorItem(state, id));
    case 'comp': { const r = act(core.adoptCompanion(state, id)); if (r.ok) closeModal?.(); return r; }
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
  if (kind === 'door') {
    const it = DOOR_ITEMS[id];
    return `<div class="try-stage door-try"><svg viewBox="0 0 120 130" aria-label="Your front door with the ${esc(it.name)}">${houseFrontSVG({ ...state.door, [it.kind]: id })}</svg></div>`;
  }
  if (kind === 'comp') {
    return `<div class="try-stage comp-try"><svg viewBox="-10 -30 330 270" aria-label="${esc(state.name)} with a ${esc(COMPANIONS[id].name)}">${otterSVG({ ...state, sleeping: false }, { idPrefix: 'try' })}<g transform="translate(200 130)">${companionSVG(id)}</g></svg>
      <p class="muted center">${esc(COMPANIONS[id].desc)}<br><b>Perk once bonded:</b> ${esc(COMPANIONS[id].perk)}</p></div>`;
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
    <span class="event-icon">${ic(`events/${ev.id}`, ev.icon)}</span>
    <span class="event-text"><b>${ev.name}${isPreview() ? ' (preview)' : ''}</b>
      <small>${isPreview() ? 'Preview mode' : daysLeft(eventEndsAt(ev))} · ${ic(`events/${ev.id}-token`, ev.token.icon)} ${st.tokens} · quests ${done}/3${ready ? ` · <span class="ready">${ready} ready!</span>` : ''}</small></span>
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
      ${owned ? '<button class="btn small" disabled>Owned ✓</button>' : `<div class="buy-row">${tryBtn(isItem ? 'evitem' : 'evfurn', e.id)}<button class="btn small primary" data-action="ev-buy" data-id="${e.id}" ${st.tokens < e.tokens ? 'disabled' : ''}>${ic(`events/${ev.id}-token`, ev.token.icon)} ${e.tokens}</button></div>`}</div>`;
  };
  return `
    <div class="event-hero" style="--tint:${ev.tint}">
      <div class="event-hero-icon">${ic(`events/${ev.id}`, ev.icon)}</div>
      <h2>${ev.name}</h2>
      <p>${ev.desc}</p>
      <div class="event-meta"><span class="chip">${ic(`events/${ev.id}-token`, ev.token.icon)} <b>${st.tokens}</b> ${ev.token.name}</span><span class="chip">⏳ ${isPreview() ? 'preview' : daysLeft(eventEndsAt(ev))}</span></div>
    </div>
    <h2 class="section-title">Today's quests <small>new ones every day</small></h2>
    <div class="quests">${st.quests.map((q) => `<div class="card quest ${q.claimed ? 'done' : ''}">
      <div class="quest-info"><b>${q.text.replace('your otter', esc(state.name))}</b>
        <div class="bar"><div style="width:${(q.p / q.target) * 100}%"></div></div><small class="muted">${q.p}/${q.target}</small></div>
      ${q.claimed ? '<span class="quest-done">✅</span>' : `<button class="btn small ${q.p >= q.target ? 'primary' : ''}" data-action="ev-claim" data-id="${q.kind}" ${q.p >= q.target ? '' : 'disabled'}>${ic(`events/${ev.id}-token`, ev.token.icon)} ${q.reward}</button>`}
    </div>`).join('')}</div>
    <p class="note">Every arcade game and every explore also earns ${ic(`events/${ev.id}-token`, ev.token.icon)} 1.</p>
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
          <span class="badge-icon">${ic(`badges/${a.id}`, a.icon)}</span><b>${a.name}</b><small>${done ? `✓ +${a.reward}` : `${have}/${need}`}</small>
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
      <div class="persona-head"><span class="persona-icon">${pi.trait ? ic(`traits/${pi.trait.id}`, pi.trait.icon) : '🌱'}</span>
        <div><b>${pi.trait ? `${esc(state.name)} is ${pi.trait.name.toLowerCase()}` : `${esc(state.name)} is still discovering who they are`}</b>
        <div class="muted">${pi.trait ? `${pi.trait.desc}${pi.also ? ` Also a bit ${pi.also.name.toLowerCase()} ${pi.also.icon}.` : ''}` : 'Their personality grows from how you play together.'}</div>
        ${pi.trait ? `<div class="persona-perk">✨ ${pi.trait.perk}</div>` : ''}</div></div>
      <div class="persona-bars">${pi.ranked.map(([id, pts]) => `<div class="persona-bar" title="${core.TRAITS[id].name}: grows from ${core.TRAITS[id].from}">
        <span>${ic(`traits/${id}`, core.TRAITS[id].icon)}</span><div class="bar"><div style="width:${Math.min(100, (pts / Math.max(top, 6)) * 100)}%"></div></div></div>`).join('')}</div>
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

// ---------- sea or river ----------
function speciesBanner() {
  if (!state.name || state.speciesSet) return '';
  const st = { ...state, sleeping: false, equipped: {} };
  return `<div class="card species-banner"><b>Is ${esc(state.name)} a sea otter or a river otter?</b><small class="muted">You can choose once.</small>
    <div class="species-pick small">${['sea', 'river'].map((sp) => `<button class="species-card" data-action="species" data-id="${sp}">
      <svg viewBox="0 -24 200 254" aria-hidden="true">${otterSVG({ ...st, species: sp }, { idPrefix: `sb-${sp}` })}</svg>
      <b>${SPECIES[sp].icon} ${SPECIES[sp].name}</b><small>${SPECIES[sp].desc}</small></button>`).join('')}</div></div>`;
}

// ---------- legacy ----------
function openLegacy() { showModal(`<div class="legacy-modal"><div class="game-top"><h2>🦉 Legacy</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>${legacyCard()}</div>`, { wide: true }); }
function legacyCard() {
  if (!state.name) return '';
  const stars = legacyStars(state);
  const rank = rankOf(stars);
  const nx = nextRank(stars);
  if (state.level < LEGACY_LEVEL) {
    return `<div class="card legacy teaser"><div class="persona-head"><span class="persona-icon">🦉</span><div><b>Legacy</b>
      <div class="muted">When ${esc(state.name)} becomes a Wise Otter (level ${LEGACY_LEVEL}), lifelong goals open up: Legend ranks, titles and big rewards. Everything you do now already counts!</div></div></div></div>`;
  }
  const titles = core.allTitles(state);
  return `<div class="card legacy"><div class="persona-head"><span class="persona-icon">${rank.icon}</span><div><b>${rank.name}</b>
      <div class="muted">⭐ ${stars} Legacy star${stars === 1 ? '' : 's'}${nx ? ` · ${nx.stars - stars} more to become a ${nx.icon} ${nx.name}` : ' · the highest rank!'}</div></div></div>
    <div class="masteries">${MASTERIES.map((m) => {
    const v = m.value(state);
    const have = state.legacy.claimed[m.id] || 0;
    const goal = m.goals[Math.min(have, m.goals.length - 1)];
    const can = have < m.goals.length && v >= m.goals[have];
    return `<div class="mastery"><span class="m-icon">${m.icon}</span><div class="m-body"><b>${m.name}</b> <span class="m-tiers">${TIERS.map((t, k) => (k < have ? t.icon : '▫️')).join('')}</span>
        <div class="bar"><div style="width:${have >= m.goals.length ? 100 : Math.min(100, (v / goal) * 100)}%"></div></div>
        <small class="muted">${m.desc}: ${v}${have < m.goals.length ? ` / ${goal}` : ' · complete!'}</small></div>
        ${can ? `<button class="btn small primary" data-action="legacy-claim" data-id="${m.id}">${TIERS[have].icon} Claim</button>` : ''}</div>`;
  }).join('')}</div>
    ${titles.length ? `<label class="title-pick">🏷️ Title: <select data-title-pick><option value="">(none)</option>${titles.map((t) => `<option ${state.legacy.title === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>` : ''}
  </div>`;
}

// ---------- companions ----------
function companionCard() {
  if (!state.name) return '';
  const c = core.activeCompanion(state);
  const owned = Object.keys(state.companions.owned);
  if (!c) {
    return `<div class="card comp-card empty-comp"><div class="comp-art">🐾</div><div><b>${owned.length ? 'Your companions are resting.' : 'Find a companion!'}</b>
      <div class="muted">${owned.length ? 'Pick one to tag along.' : 'Little pond friends who follow ' + esc(state.name) + ' around and help out once you bond.'}</div>
      <div class="row left"><button class="btn small primary" data-action="comp-cove">🐾 Companion Cove</button></div></div></div>`;
  }
  const lvl = bondLevel(c.bond);
  const on = c.bond >= BOND_PERK;
  const wait = (c.lastPlay || 0) + PLAY_COOLDOWN - Date.now();
  return `<div class="card comp-card"><button class="comp-art trait-${COMP_TRAITS[c.trait]?.anim || ''}" data-action="comp-play" aria-label="Play with ${esc(c.name)}"><svg viewBox="0 0 100 100">${companionSVG(c.id, { look: core.companionLook(c) })}</svg></button>
    <div class="comp-info"><b>${esc(c.name)}</b> <small class="muted">${c.icon} ${COMPANIONS[c.id].name} · ${BOND_NAMES[lvl]}</small>
      <div class="bar"><div style="width:${c.bond}%"></div></div>
      <small class="${on ? 'perk-on' : 'muted'}">${on ? '✨ ' : '🔒 '}${esc(COMPANIONS[c.id].perk)}${on ? '' : ` (bond to ${BOND_PERK} to unlock)`}</small>
      ${COMP_TRAITS[c.trait] ? `<small class="muted">${COMP_TRAITS[c.trait].icon} ${COMP_TRAITS[c.trait].name}: ${esc(c.name)} ${COMP_TRAITS[c.trait].line}</small>` : ''}
      <div class="row left">
        <button class="btn small ${wait > 0 ? '' : 'primary'}" data-action="comp-play">${wait > 0 ? `🎾 Play in ${Math.ceil(wait / 60000)}m` : '🎾 Play'}</button>
        <button class="btn small" data-action="comp-treat">🍪 Treat · <span class="pearl-icon"></span> ${TREAT_PRICE}</button>
        <button class="btn small" data-action="comp-style" data-id="${c.id}">🎨 Style</button>
        <button class="btn small" data-action="comp-cove">🐾 ${owned.length > 1 ? 'Switch' : 'More'}</button>
      </div></div></div>`;
}

function openCompanionStyle(id) {
  const c = state.companions.owned[id];
  if (!c) return;
  const look = core.companionLook(c);
  showModal(`<div class="comp-style"><div class="game-top"><h2>🎨 Style ${esc(c.name)}</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>
    <div class="comp-style-art trait-${COMP_TRAITS[c.trait]?.anim || ''}"><svg viewBox="0 0 100 100">${companionSVG(id, { look })}</svg></div>
    <h3 class="den-sub dark">Color</h3><div class="chips">${Object.entries(COMP_COLORS).map(([k, v]) => `<button class="chip-btn" data-action="comp-look" data-id="${id}" data-k="color" data-v="${k}" aria-pressed="${look.color === k}">${v.name}</button>`).join('')}</div>
    <h3 class="den-sub dark">Pattern <small class="muted">unlocks as you bond</small></h3><div class="chips">${Object.entries(COMP_PATTERNS).map(([k, v]) => `<button class="chip-btn" data-action="comp-look" data-id="${id}" data-k="pattern" data-v="${k}" aria-pressed="${look.pattern === k}" ${c.bond < v.bond ? 'disabled' : ''}>${c.bond < v.bond ? `🔒 ${v.bond}` : ''} ${v.name}</button>`).join('')}</div>
    <h3 class="den-sub dark">Accessory <small class="muted">buy once, any companion can wear it</small></h3><div class="chips">
      <button class="chip-btn" data-action="comp-look" data-id="${id}" data-k="acc" data-v="" aria-pressed="${!look.acc}">None</button>
      ${Object.entries(COMP_ACCS).map(([k, v]) => (state.companions.accs.includes(k) ? `<button class="chip-btn" data-action="comp-look" data-id="${id}" data-k="acc" data-v="${k}" aria-pressed="${look.acc === k}">${v.icon} ${v.name}</button>`
    : `<button class="chip-btn" data-action="comp-acc-buy" data-id="${k}" data-comp="${id}" ${state.pearls < v.price ? 'disabled' : ''}>${v.icon} ${v.name} · <span class="pearl-icon"></span> ${v.price}</button>`)).join('')}</div>
    <p class="muted">${COMP_TRAITS[c.trait] ? `${COMP_TRAITS[c.trait].icon} ${esc(c.name)} is ${COMP_TRAITS[c.trait].name.toLowerCase()}.` : ''} 💕 Bond ${Math.round(c.bond)}/100</p>
  </div>`, { wide: true });
}

function openCove() {
  const owned = state.companions.owned;
  showModal(`<div class="cove">
    <div class="game-top"><h2>🐾 Companion Cove</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>
    <p class="muted">One companion tags along at a time. Play together every day to bond. Once you're bonded, their perk switches on.</p>
    <div class="cove-grid">${Object.entries(COMPANIONS).map(([id, c]) => {
    const mine = owned[id];
    const active = state.companions.active === id;
    const locked = state.level < c.level;
    return `<div class="card cove-card ${active ? 'active' : ''}"><svg viewBox="0 0 100 100">${companionSVG(id, { look: core.companionLook(mine) })}</svg>
      <b>${mine ? esc(mine.name) : c.name}</b><small class="muted">${esc(c.perk)}</small>
      ${mine ? `<small>💕 ${BOND_NAMES[bondLevel(mine.bond)]}${COMP_TRAITS[mine.trait] ? ` · ${COMP_TRAITS[mine.trait].icon} ${COMP_TRAITS[mine.trait].name}` : ''}</small>
        <div class="row">${active ? '<button class="btn small" data-action="comp-set" data-id="">Rest at home</button>' : `<button class="btn small primary" data-action="comp-set" data-id="${id}">Bring along</button>`}
        <button class="link small" data-action="comp-rename" data-id="${id}">Rename</button><button class="link small" data-action="comp-style" data-id="${id}">Style</button></div>`
    : locked ? `<button class="btn small" disabled>🔒 Lv ${c.level}</button>`
      : `<div class="buy-row">${tryBtn('comp', id)}<button class="btn small primary" data-action="comp-adopt" data-id="${id}" ${state.pearls < c.price ? 'disabled' : ''}><span class="pearl-icon"></span> ${c.price}</button></div>`}
    </div>`;
  }).join('')}</div></div>`, { wide: true });
}

function panelHome() {
  const claimed = state.lastDaily === core.dayKey();
  const asleep = state.sleeping;
  const nm = esc(state.name || 'your otter');
  return `
    ${sync.needsRelogin && sync.discordLoginUrl ? `<div class="card relogin"><b>🔑 Please sign in with Discord again</b><small class="muted">Your sign-in on this device expired. ${esc(state.name || 'Your otter')} is safe here and will be saved to your account when you sign back in.</small>
      <div class="row left">${discordButton('Sign in with Discord')}<button class="link small" data-action="relogin-dismiss">Not now</button></div></div>` : ''}
    ${speciesBanner()}
    <h2 class="section-title">Take care of ${nm}</h2>
    <div class="actions">
      <button class="action" data-action="pet"><span>🤗</span>Cuddle</button>
      <button class="action" data-action="bath"><span>🛁</span>Bath</button>
      <button class="action" data-action="sleep"><span>${asleep ? '☀️' : '🌙'}</span>${asleep ? 'Wake up' : 'Nap'}</button>
    </div>
    <div class="snacks">
      ${SNACKS.map((s) => `<button class="snack" data-action="feed" data-id="${s.id}" ${state.pearls < s.price && !state.pantry?.[s.id] ? 'disabled' : ''}>
        <span class="snack-icon">${ic(`snacks/${s.id}`, s.icon)}</span>${state.persona?.fav.snack === s.id ? '<span class="fav-heart" title="Favorite!">❤️</span>' : ''}<span class="snack-name">${s.name}</span>
        <span class="snack-price">${state.pantry?.[s.id] ? `🧺 ×${state.pantry[s.id]}` : s.price ? `<span class="pearl-icon"></span> ${s.price}` : 'Free'}</span></button>`).join('')}
    </div>
    ${companionCard()}
    <h2 class="section-title">Today</h2>
    <button class="daily-btn ${claimed ? 'done' : 'glow'}" data-action="daily" ${claimed ? 'disabled' : ''}><span>🎁</span>${claimed ? "Today's gift claimed. Come back tomorrow!" : 'Open your daily gift'}</button>
    ${isPartyDay() ? `<div class="card bday-banner">🎂 <b>Happy birthday, ${esc(state.name)}!</b> Party in the den, a party hat in the closet, and +100 pearls. 🎉</div>` : ''}
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

const isPartyDay = () => state.name && isBirthday(state) && state.birthdaysClaimed?.includes(new Date().getUTCFullYear());

function growthCard() {
  if (!state.name) return '';
  const st = stageOf(state.level);
  const nx = nextStage(state.level);
  const prevLvl = st.level;
  const pct = nx ? Math.min(100, ((state.level - prevLvl) / (nx.level - prevLvl)) * 100) : 100;
  const young = state.level >= 5;
  const grown = state.level >= 10;
  const wise = state.level >= 20;
  const bAt = nextBirthday(state);
  const bDays = bAt ? Math.round((bAt - Date.now()) / 86400000) : null;
  return `<div class="card growth">
    <div class="persona-head"><span class="persona-icon">${ic(`stages/${st.id}`, st.icon)}</span>
      <div><b>${esc(state.name)} is ${/^[AEIOU]/.test(st.name) ? 'an' : 'a'} ${st.name}</b>
      <div class="muted">${nx ? `Level ${state.level}. At level ${nx.level}, ${esc(state.name)} becomes ${/^[AEIOU]/.test(nx.name) ? 'an' : 'a'} ${nx.name}: ${nx.unlock.toLowerCase()}.` : 'Fully grown, and still loves to play!'}</div>
      ${nx ? `<div class="bar"><div style="width:${pct}%"></div></div>` : ''}</div></div>
    <div class="stages">${STAGES.map((x) => `<span class="stage ${state.level >= x.level ? 'on' : ''}" title="${x.name}: ${x.unlock} (level ${x.level})">${ic(`stages/${x.id}`, x.icon)}<small>${x.name}</small></span>`).join('')}</div>
    <div class="together">
      <button class="btn small" data-action="story" ${young ? '' : 'disabled'}>📖 Tell a story${young ? '' : ' · Lv 5'}</button>
      <button class="btn small" data-action="teach" ${grown ? '' : 'disabled'}>🎓 Teach a trick${grown ? '' : ' · Lv 10'}</button>
      <button class="btn small" data-action="wisdom" ${wise ? '' : 'disabled'}>🦉 Share wisdom${wise ? '' : ' · Lv 20'}</button>
    </div>
    ${state.tricks.length ? `<div class="tricks"><small class="muted">Tricks:</small>${state.tricks.map((id) => { const t = TRICKS.find((x) => x.id === id); return `<button class="btn small" data-action="trick" data-id="${id}">${t.icon} ${t.name}</button>`; }).join('')}</div>` : ''}
    <div class="bday-line">🎂 Birthday: <b>${birthdayLabel(state.birthday)}</b>${bDays === 0 || isBirthday(state) ? ' · <b>today!</b>' : bDays != null ? ` · in ${bDays} day${bDays === 1 ? '' : 's'}` : ''}
      ${state.birthdaySet ? '' : '<button class="link small" data-action="bday-set">change</button>'}</div>
    ${state.level >= LEGACY_LEVEL ? '<button class="link block-link" data-action="legacy">🦉 Legacy goals, ranks and titles</button>' : ''}
  </div>`;
}

function openAdventureBook() {
  const mem = [...(state.memories || [])].reverse();
  const groups = {};
  for (const m of mem) {
    const k = new Date(m.t).toLocaleDateString([], { month: 'long', year: 'numeric' });
    (groups[k] = groups[k] || []).push(m);
  }
  showModal(`<div class="book"><div class="game-top"><h2>📔 ${esc(state.name)}'s adventure book</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>
    ${mem.length ? Object.entries(groups).map(([month, list]) => `<h3 class="book-month">${month}</h3>${list.map((m) => `<div class="book-entry"><span class="book-icon">${m.icon}</span><div><div>${esc(m.text)}</div><small class="muted">${new Date(m.t).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</small></div></div>`).join('')}`).join('')
    : `<p class="muted center">The first pages are still blank. Go on an adventure, make a rare find or earn a badge, and it'll be written here forever.</p>`}
  </div>`, { wide: true });
}

let closetSlot = 'hat';
function panelCloset() {
  const toggle = `<div class="segmented">
    <button data-closet="wardrobe" aria-pressed="${closetView === 'wardrobe'}">👗 My clothes</button>
    <button data-closet="shop" aria-pressed="${closetView === 'shop'}">🛍️ Shop</button></div>`;
  if (closetView === 'shop') {
    const chips = `<div class="chips closet-slots">${SLOTS.map((sl) => `<button class="chip-btn" data-action="closet-slot" data-id="${sl.id}" aria-pressed="${closetSlot === sl.id}">${sl.name}</button>`).join('')}</div>`;
    return toggle + chips + SLOTS.filter((slot) => slot.id === closetSlot).map((slot) => {
      const ids = Object.keys(ITEMS).filter((id) => ITEMS[id].slot === slot.id && ITEMS[id].price !== null && !ITEMS[id].event);
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
let placeView = null; // null | 'museum' | 'lane'
let museumData = null;
let laneData = null;

async function loadMuseum() {
  if (!sync.online) return;
  try { const r = await sync.museum(); if (r.ok) museumData = r; } catch { /* offline */ }
  if (tab === 'missions' && placeView === 'museum') renderPanel();
}
async function loadLane() {
  if (!sync.online || !sync.linked) return;
  try { const r = await sync.lane(); if (r.ok) laneData = r; } catch { /* offline */ }
  if (tab === 'missions' && placeView === 'lane') renderPanel();
}

const ALL_EXHIBITS = () => [...LOCATIONS.map((l) => ({ name: l.name, icon: l.icon, finds: l.finds })), { name: 'Limited Exhibits', icon: '🎉', finds: EVENTS.flatMap((e) => e.finds) }];

function museumView() {
  const back = '<button class="btn small" data-action="place-back">🗺️ Back to map</button>';
  if (!sync.online) return `<div class="explore-head"><h2 class="section-title">Pond Museum</h2>${back}</div><div class="empty"><div class="empty-icon">🏛️</div><p>The museum is run by the whole community, so it needs the server. It isn't reachable right now.</p></div>`;
  if (!museumData) { loadMuseum(); return `<div class="explore-head"><h2 class="section-title">Pond Museum</h2>${back}</div><div class="empty"><div class="empty-icon">🫧</div><p>Opening the doors…</p></div>`; }
  const m = museumData;
  const spares = Object.entries(state.collection || {}).filter(([id, n]) => n >= 2 && (FINDS[id] || EVENT_FINDS[id]));
  const tile = (f) => {
    const ex = m.exhibits[f.id];
    return `<div class="find ${ex ? 'got' : ''}" style="--rar:${RARITY[f.rarity].color}" title="${ex ? `${f.name} · ${ex.count} donated` : 'Not in the museum yet'}">
      <span class="find-icon">${ex ? ic(`finds/${f.id}`, f.icon) : '❔'}</span><span class="find-name">${ex ? f.name : '???'}</span>
      <span class="find-rar">${ex ? `${ex.first?.mine ? '⭐ you!' : `1st: ${esc(ex.first?.by || '?')}`}` : 'needed'}</span></div>`;
  };
  return `<div class="explore-head"><h2 class="section-title">Pond Museum</h2>${back}</div>
    <div class="museum-hero"><div class="museum-icon">🏛️</div>
      <p>Donate your <b>spare</b> discoveries so everyone can enjoy them. The first donor of each one is credited forever!</p>
      <div class="bar big"><div style="width:${m.pct}%"></div></div>
      <small><b>${m.species}/${m.totalSpecies}</b> exhibits (${m.pct}%) · ${m.donations} donations from the community${m.you ? ` · you: ${m.you.donations} donated, ${m.you.firsts} firsts` : ''}</small>
    </div>
    <h2 class="section-title">Community milestones <small>everyone gets these</small></h2>
    <div class="milestones">${m.milestones.map((x) => `<div class="milestone ${x.reached ? 'on' : ''}"><b>${x.pct}%</b><small><span class="pearl-icon"></span> ${x.pearls}${x.item ? ' + display case' : ''}</small>
      ${x.reached && sync.linked && !x.claimed ? `<button class="btn small primary" data-action="museum-claim" data-id="${x.pct}">Claim</button>` : x.claimed ? '<small>✓ claimed</small>' : '<small>🔒</small>'}</div>`).join('')}</div>
    <h2 class="section-title">Your spares <small>+5 pearls each</small></h2>
    ${!sync.linked ? '<p class="note">Sign in on the Friends tab to donate.</p>' : spares.length ? `<div class="spares">${spares.map(([id, n]) => { const f = FINDS[id] || EVENT_FINDS[id]; return `<div class="card spare"><span class="find-icon">${ic(`finds/${id}`, f.icon)}</span><b>${f.name}</b><small class="muted">you have ${n}</small>${m.exhibits[id] ? '' : '<small class="new-tag">museum needs this!</small>'}<button class="btn small primary" data-action="museum-donate" data-id="${id}">Donate</button></div>`; }).join('')}</div>`
    : '<p class="note">No spares yet. When you find something twice, you can donate the extra copy here.</p>'}
    ${ALL_EXHIBITS().map((h) => `<div class="card journal-loc"><div class="journal-loc-head"><b>${h.icon} ${h.name}</b><span class="muted">${h.finds.filter((f) => m.exhibits[f.id]).length}/${h.finds.length}</span></div>
      <div class="finds">${h.finds.map(tile).join('')}</div></div>`).join('')}
    ${m.patrons.length ? `<h2 class="section-title">Top donors</h2><ol class="board card">${m.patrons.map((x) => `<li><span>${esc(x.name)}</span><b>${x.count}</b></li>`).join('')}</ol>` : ''}`;
}

function houseSVG(h, k, you = false) {
  const lvl = h.mood === 'sad' ? 20 : 80;
  const st = { ...core.defaultState(), species: you ? state.species : h.species, stats: { hunger: lvl, happiness: 90, energy: 90, clean: 90 }, equipped: h.equipped || {}, sleeping: h.sleeping };
  return `<button class="house ${you ? 'you' : ''} ${h.friend ? 'friend' : ''}" data-action="lane-house" data-code="${h.code}" data-you="${you ? 1 : ''}" data-x="${k}" aria-label="${esc(h.name)}'s den">
    <svg viewBox="0 0 120 130" aria-hidden="true">${houseFrontSVG(you ? state.door : h.door || { paint: null }, { cozyStar: h.cozy >= 15, balloon: h.birthday })}</svg>
    ${h.companion && COMPANIONS[h.companion] ? `<svg class="porch-comp" viewBox="0 0 100 100" aria-hidden="true">${companionSVG(h.companion, { sleeping: h.sleeping, look: h.companionLook || {} })}</svg>` : ''}
    ${h.home && !h.sleeping ? `<svg class="porch-otter" viewBox="0 -24 200 254" aria-hidden="true">${otterSVG(st, { idPrefix: `ln${k}` })}</svg>` : ''}
    ${h.sleeping ? '<span class="house-zzz">z z</span>' : !h.home ? '<span class="house-zzz">🧭 out</span>' : ''}
    <span class="house-sign">${you ? '🏠 ' : h.friend ? '💗 ' : ''}${esc(h.name)} <small>${h.stage || ''} Lv ${h.level}</small>${h.title ? `<small class="house-title">${esc(h.title)}</small>` : ''}</span>
  </button>`;
}

function laneView() {
  const back = '<button class="btn small" data-action="place-back">🗺️ Back to map</button>';
  if (!sync.online || !sync.linked) return `<div class="explore-head"><h2 class="section-title">Otter Lane</h2>${back}</div><div class="empty"><div class="empty-icon">🏘️</div><p>Otter Lane is where everyone's dens are. Sign in on the Friends tab to take a stroll.</p></div>`;
  if (!laneData) { loadLane(); return `<div class="explore-head"><h2 class="section-title">Otter Lane</h2>${back}</div><div class="empty"><div class="empty-icon">🫧</div><p>Walking over…</p></div>`; }
  const houses = [laneData.you, ...laneData.friends, ...laneData.neighbors].filter(Boolean);
  const pub = state.publicDen !== false;
  return `<div class="explore-head"><h2 class="section-title">Otter Lane</h2>${back}</div>
    <p class="note lane-note">Stroll past everyone's dens. Tap a house to walk over and peek inside. 💗 = friend</p>
    <div class="lane-wrap"><div class="lane" style="--n:${houses.length}${artUrl('lane/street') ? `;background:url('${artUrl('lane/street')}') center bottom/cover` : ''}">
      <div class="lane-path"></div>
      ${houses.map((h, k) => houseSVG(h, k, k === 0)).join('')}
      <svg class="walker" id="walker" viewBox="0 -24 200 254" aria-hidden="true">${otterSVG({ ...state, sleeping: false }, { idPrefix: 'walker' })}</svg>
    </div></div>
    <div class="row lane-actions"><button class="btn small" data-action="lane-refresh">🔄 New neighbors</button>
      <label class="skip-check"><input type="checkbox" data-lane-public ${pub ? 'checked' : ''}> Show my den on Otter Lane</label></div>`;
}

async function peekHouse(code) {
  showModal('<div class="result"><div class="result-icon">🚪</div><p>Knock knock…</p></div>', { wide: true });
  const r = await sync.lanePeek(code);
  if ($('#modal').hidden) return;
  if (!r.ok) { $('#modal-card').innerHTML = `<div class="result"><p>${esc(r.error || 'Nobody answered.')}</p><button class="btn primary" data-close>OK</button></div>`; return; }
  const o = r.otter;
  const st = { ...core.defaultState(), ...o, mission: o.mission ? { ...o.mission, start: 0, endsAt: 0 } : null };
  const pi = core.personaInfo(st);
  $('#modal-card').innerHTML = `<div class="visit">
    <div class="game-top"><h2>🏡 ${esc(o.name)}'s Den</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>
    <div class="den-stage visit-den">${denSVG(st, { extraAttrs: 'class="den-svg" role="img"' }).replace(/den-otter-/g, 'peek-otter-')}</div>
    <div class="visit-info"><div class="visit-persona">${stageOf(o.level).icon} Lv ${o.level} · ${pi.trait ? `${pi.trait.icon} ${pi.trait.name}` : '🌱 Still discovering'} · ✨ coziness ${core.coziness(st)}</div></div>
    <div class="row">${r.friend ? `<button class="btn primary" data-action="fr-visit" data-code="${r.code}">Visit as a friend</button>` : `<button class="btn primary" data-action="lane-addfriend" data-code="${r.code}">💗 Add ${esc(o.name)} as a friend</button>`}</div>
  </div>`;
}
let journalOpen = false;
let subView = null; // null | 'lore' | 'treasures' (pages on the Explore tab)
function openSub(v) { closeModal(); journalOpen = false; placeView = null; subView = v; tab = 'missions'; renderPanel(); window.scrollTo({ top: 0 }); }

function missionCard(m) {
  const locked = state.level < m.level;
  const loot = m.loot.map(([id]) => ITEMS[id].icon).join(' ');
  const disabled = locked || !!state.mission || state.sleeping || state.stats.energy < m.energy;
  return `<div class="card mission ${locked ? 'locked' : ''}">
    <div class="mission-head"><span class="mission-icon">${ic(`missions/${m.id}`, m.icon)}</span>
      <div><b>${m.name}</b><div class="muted">⏱ ${fmtMinutes(m.minutes)} · ⚡ ${m.energy} energy</div>
      <div class="muted"><span class="pearl-icon"></span> ${m.pearls[0]}–${m.pearls[1]}${loot ? ` · rare: ${loot}` : ''} · 🔍 finds</div></div></div>
    <button class="btn small ${disabled ? '' : 'primary'}" data-action="mission" data-id="${m.id}" ${disabled ? 'disabled' : ''}>${locked ? `🔒 Lv ${m.level}` : 'Go!'}</button>
  </div>`;
}

function findTile(f) {
  const n = state.collection[f.id] || 0;
  const r = RARITY[f.rarity];
  return `<div class="find ${n ? 'got' : ''}" style="--rar:${r.color}" title="${n ? f.name : 'Not found yet'} · ${r.name}">
    <span class="find-icon">${n ? ic(`finds/${f.id}`, f.icon) : '❔'}</span><span class="find-name">${n ? f.name : '???'}</span>
    <span class="find-rar">${r.stars}${n > 1 ? ` ×${n}` : ''}</span></div>`;
}

function panelMissions() {
  let head = '';
  if (state.mission) {
    const m = MISSIONS.find((x) => x.id === state.mission.id);
    const pct = clamp(((Date.now() - state.mission.start) / (state.mission.endsAt - state.mission.start)) * 100);
    head = `<div class="card mission-active">
      <div class="mission-head"><span class="mission-icon">${ic(`missions/${m.id}`, m.icon)}</span><div><b>${m.name}</b><div class="muted">Returns in <span data-live="mission-left">${fmtTime(state.mission.endsAt - Date.now())}</span></div></div></div>
      <div class="bar big"><div data-live="mission-bar" style="width:${pct}%"></div></div>
      <button class="link" data-action="recall">Call ${esc(state.name)} home early (no rewards)</button></div>`;
  }
  const found = core.collectionCount(state);
  if (placeView === 'museum') return `${head}${museumView()}`;
  if (placeView === 'lane') return `${head}${laneView()}`;
  if (subView === 'lore') return `${head}${loreView()}`;
  if (subView === 'treasures') return `${head}${treasuresView()}`;
  if (journalOpen) {
    return `${head}<div class="explore-head"><h2 class="section-title">Collection journal</h2>
      <button class="btn small" data-action="journal">🗺️ Back to map</button></div>
      <p class="journal-total">📖 ${found} / ${TOTAL_FINDS} discovered · 🏅 ${state.sets.length} / ${LOCATIONS.length} sets</p>
      ${LOCATIONS.map((l) => `<div class="card journal-loc"><div class="journal-loc-head"><b>${ic(`places/${l.id}`, l.icon)} ${l.name}</b>
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
    ${gazetteCard()}
    <div class="explore-head"><h2 class="section-title">Explore</h2>
      <div class="row"><button class="btn small" data-action="treasures" aria-label="Treasures">🪨 <span class="lbl">Treasures </span>${Object.keys(state.trinkets || {}).length}/${TRINKET_IDS.length}</button><button class="btn small" data-action="lore-book" aria-label="Lore Book">📜 <span class="lbl">Lore </span>${state.lore.pages.length}/${TOTAL_PAGES}</button><button class="btn small" data-action="journal" aria-label="Journal">📖 <span class="lbl">Journal </span>${found}/${TOTAL_FINDS}</button></div></div>
    <div class="map-wrap">${mapSVG(state, loc.id)}</div>
    <div class="card loc-card ${locked ? 'locked' : ''}">
      <div class="loc-title"><span class="loc-icon">${ic(`places/${loc.id}`, loc.icon)}</span><div><h3>${loc.name}${state.sets.includes(loc.id) ? ' 🏅' : ''}${state.persona?.fav.place === loc.id ? ` <span class="fav-tag">❤️ ${esc(state.name)}'s favorite</span>` : ''}</h3><p class="muted">${loc.desc}</p></div></div>
      ${loc.id === 'lilypond' ? '<div class="row"><button class="btn small" data-tab="home">🦦 Visit your otter</button><button class="btn small" data-tab="den">🏡 Go to the den</button></div>' : ''}
      ${(() => { const l = exploreLuck(loc.id); return l > 1.01 && !locked ? `<p class="luck-note">✨ ${tideAt().state === 'low' && LOW_TIDE_PLACES.includes(loc.id) ? 'Low tide' : WEATHER[weatherAt()].name + ' weather'}: finds here are luckier right now!</p>` : ''; })()}
      ${happeningNote(loc.id)}
      ${exploreBtn}
      ${residentsHere(loc.id)}
      ${cluesHere(loc.id)}
      ${loc.id === 'shipwreck' && merchantDocked() ? '<button class="btn merchant-btn" data-action="merchant">⛵ Captain Barnacle\'s boat is docked! Browse the bargains</button>' : ''}
      ${busyMsg ? `<p class="muted small-note">${esc(state.name)} is ${busyMsg === 'away' ? 'out on a mission' : 'napping'} right now.</p>` : ''}
      <h4 class="loc-sub">Discoveries · ${loc.finds.filter((f) => state.collection[f.id]).length}/${loc.finds.length}</h4>
      <div class="finds">${loc.finds.map(findTile).join('')}</div>
      ${missions.length ? `<h4 class="loc-sub">Missions here</h4><div class="missions">${missions.map(missionCard).join('')}</div>` : ''}
      <h4 class="loc-sub">Games here</h4>
      <div class="loc-games">${games.map((g) => `<button class="loc-game" data-action="game" data-id="${g.id}"><span>${ic(`games/${g.id}`, g.icon)}</span><b>${g.name}</b><small>⚡${g.energy}</small></button>`).join('')}</div>
    </div>
    <p class="note">Missions run in real time, even when this page is closed. Explore from Discord with <code>/explore</code>.</p>`;
}

// ---------- the living world ----------
let worldData = null;
let worldLoading = false;
async function loadWorld() {
  if (worldLoading || !sync.online) return;
  worldLoading = true;
  const r = await sync.world().catch(() => null);
  worldLoading = false;
  if (r?.ok) { worldData = { ...r, at: Date.now() }; if (tab === 'missions' && !placeView && !journalOpen) renderPanel(); }
}
function gazetteCard() {
  if (!worldData || Date.now() - worldData.at > 5 * 60000) loadWorld();
  const now = Date.now();
  const haps = happeningsAt(now);
  const feed = (worldData?.feed || []).slice(0, 4);
  return `<div class="card gazette"><div class="gz-head"><b>🗞️ The Pond Gazette</b><small class="muted">${new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</small></div>
    ${haps.map((h) => `<div class="gz-item"><span class="gz-icon">${ic(`happenings/${h.id}`, h.icon)}</span><div><b>${h.name}</b> <small class="muted">at ${LOC[h.place].name} · until ${new Date(h.endsAt).toLocaleTimeString([], { hour: 'numeric' })}</small><div class="muted">${h.text}</div></div></div>`).join('')}
    ${merchantDocked(now) ? '<div class="gz-item"><span class="gz-icon">⛵</span><div><b>Captain Barnacle is in port</b><div class="muted">His boat is docked at Shipwreck Cove today, with bargains aboard.</div></div></div>' : ''}
    ${feed.length ? `<div class="gz-feed"><small class="muted">Around the pond${worldData?.activeToday ? ` · ${worldData.activeToday} otters out and about today` : ''}</small>${feed.map((f) => `<div>${f.icon || '📣'} ${esc(f.text)} <small class="muted">${timeAgo(f.at)}</small></div>`).join('')}</div>` : ''}
  </div>`;
}
function timeAgo(t) {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 60 ? `${Math.max(1, m)}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
}
function happeningNote(locId) {
  const h = happeningsAt().find((x) => x.place === locId);
  return h ? `<p class="luck-note">${h.icon} <b>${h.name}:</b> ${h.text}</p>` : '';
}

// Residents at a place right now, with Talk buttons.
function residentsHere(place) {
  const here = npcsAt(place);
  if (!here.length) return '';
  return `<h4 class="loc-sub">Who's here</h4><div class="residents">${here.map((id) => {
    const n = NPCS[id];
    const f = core.npcFriendship(state, id);
    return `<button class="resident" data-action="npc" data-id="${id}">${npcPortrait(id)}<b>${n.name}</b><small>${'💕'.repeat(Math.min(5, Math.ceil(f / 2))) || 'new'}</small></button>`;
  }).join('')}</div>`;
}
const npcPortrait = (id) => `<span class="npc-face">${ic(`npcs/${id}`, NPCS[id].icon)}</span>`;

function openNpc(id) {
  const n = NPCS[id];
  const where = npcWhere(id);
  const talk = core.talkTo(state, id);
  if (talk.ok && talk.msg) { commit(); }
  const f = core.npcFriendship(state, id);
  const favor = core.favorFor(state, id);
  const rec = state.lore.npc[id] || {};
  const helped = rec.favor === core.dayKey();
  const nextPage = NPC_PAGE_AT.find((at) => f < at);
  showModal(`<div class="npc-talk">
    <div class="game-top"><h2>${n.icon} ${n.name}</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>
    <div class="npc-row"><div class="npc-big">${ic(`npcs/${id}`, n.icon)}</div><div class="speech-bubble">“${esc(npcLine(id))}”</div></div>
    <p class="muted">${n.species}. ${n.about}</p>
    <p>${'💕'.repeat(Math.ceil(f / 2)) || '🤍'} Friendship ${f}/${NPC_MAX}${nextPage ? ` · next Lore Book page at ${nextPage}` : ' · all their stories shared'}</p>
    ${talk.ok && talk.msg ? `<p class="note">${esc(talk.msg)}</p>` : ''}
    ${favor ? `<div class="card favor"><b>Today's favor</b><p>“${esc(favor.text)}”</p>
      ${helped ? '<small class="muted">You already helped today. 💕</small>' : `<button class="btn small primary" data-action="favor" data-id="${id}" ${favor.done(state) ? '' : 'disabled'}>${favor.done(state) ? 'Help out · +20 pearls' : 'Not yet'}</button>`}</div>` : ''}
    ${!where ? '<p class="muted">They\'re resting now.</p>' : ''}
  </div>`, { wide: true });
}

// Mystery chapters you can work on at this place.
function cluesHere(place) {
  const act = core.activeChapters(state).filter((a) => a.chapter.need.place === place);
  if (!act.length) return '';
  return `<h4 class="loc-sub">🔍 Mysteries</h4>${act.map(({ mystery: m, k, chapter }) => {
    const miss = core.chapterMissing(state, chapter.need, place);
    return `<div class="card clue ${miss.length ? '' : 'ready'}"><b>${m.icon} ${m.name}</b> <small class="muted">chapter ${k + 1}/${m.chapters.length}</small>
      <p class="muted">${esc(chapter.hint)}</p>
      ${miss.length ? `<small>Still needed: ${miss.map(esc).join(' · ')}</small>` : `<button class="btn small primary" data-action="investigate" data-id="${m.id}" data-place="${place}">🔍 Investigate</button>`}</div>`;
  }).join('')}`;
}

function loreView() {
  const pages = new Set(state.lore.pages);
  const mys = MYSTERIES.map((m) => {
    const solved = state.lore.solved.includes(m.id);
    const k = state.lore.mysteries[m.id] || 0;
    const open = core.mysteryAvailable(state, m);
    return `<div class="card lore-mystery ${solved ? 'solved' : ''}"><b>${m.icon} ${m.name}</b> <small class="muted">${solved ? '✅ solved' : open ? `chapter ${k + 1}/${m.chapters.length}` : `🔒 ${m.level > state.level ? `level ${m.level}` : 'solve the earlier mysteries first'}`}</small>
      <p class="muted">${esc(m.intro)}</p>
      ${m.chapters.map((c, i) => (pages.has(`m:${m.id}:${i}`) ? `<p class="lore-page">📜 ${esc(c.text)}</p>` : '')).join('')}
      ${open && !solved ? `<p><b>Next clue:</b> ${esc(m.chapters[k].hint)}</p>` : ''}
      ${solved ? `<small>Reward: ${m.reward.pearls} pearls and the title “${m.reward.title}”</small>` : ''}</div>`;
  }).join('');
  const people = Object.entries(NPCS).map(([id, n]) => `<div class="card lore-npc"><b>${n.icon} ${n.name}</b> <small class="muted">${n.species} · 💕 ${core.npcFriendship(state, id)}/${NPC_MAX} · ${npcWhere(id) ? `now at ${LOC[npcWhere(id)]?.name || 'the museum'}` : 'resting'}</small>
    ${n.pages.map((pg, k) => (pages.has(`npc:${id}:${k}`) ? `<details class="lore-page"><summary>📜 ${esc(pg.title)}</summary><p>${esc(pg.text)}</p></details>` : `<p class="muted lore-locked">🔒 A story at friendship ${NPC_PAGE_AT[k]}</p>`)).join('')}</div>`).join('');
  const places = LOCATIONS.map((l) => (pages.has(`place:${l.id}`) ? `<details class="lore-page"><summary>${l.icon} ${l.name}</summary><p>${esc(PLACE_LORE[l.id])}</p></details>` : `<p class="muted lore-locked">🔒 ${l.icon} Explore ${l.name}</p>`)).join('');
  return `<div class="lore-book"><div class="explore-head"><h2 class="section-title">Lore Book</h2><button class="btn small" data-action="sub-back">🗺️ Back to map</button></div>
    <p class="note">${pages.size} of ${TOTAL_PAGES} pages. Solve mysteries, befriend the pond folk and explore to fill it in.</p>
    <h2 class="section-title">Mysteries</h2>${mys}
    <h2 class="section-title">The pond folk</h2>${people}
    <h2 class="section-title">Places</h2><div class="card">${places}</div></div>`;
}

function openMerchant() {
  const wares = core.merchantWares();
  if (!wares.length) return toast('⛵ The captain is out at sea today.');
  showModal(`<div class="merchant"><div class="game-top"><h2>⛵ Captain Barnacle's Boat</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>
    <div class="npc-row"><div class="npc-big">${ic('npcs/barnacle', '🦀')}</div><div class="speech-bubble">“Fresh from the far coast! Thirty percent off, today only.”</div></div>
    <div class="grid">${wares.map((w) => {
    const owned = (w.kind === 'item' && state.owned.includes(w.id)) || (w.kind === 'door' && state.doorItems.includes(w.id));
    const art = w.kind === 'item' ? itemPreviewSVG(w.id) : w.kind === 'furn' ? furniturePreviewSVG(w.id) : `<svg viewBox="0 0 120 130">${houseFrontSVG({ paint: DOOR_ITEMS[w.id].kind === 'paint' ? w.id : state.door.paint, [DOOR_ITEMS[w.id].kind]: w.id })}</svg>`;
    return `<div class="card item"><div class="item-art ${w.kind === 'furn' ? 'den-art' : w.kind === 'door' ? 'door-art' : ''}">${art}</div><div class="item-name">${esc(w.name)}</div>
      <small class="muted"><s>${w.full}</s></small>
      ${owned ? '<button class="btn small" disabled>Owned ✓</button>' : `<button class="btn small primary" data-action="merchant-buy" data-id="${w.key}" ${state.pearls < w.price ? 'disabled' : ''}><span class="pearl-icon"></span> ${w.price}</button>`}</div>`;
  }).join('')}</div></div>`, { wide: true });
}

// Wildlife wandering across the pond (just for fun).
let critterKey = '';
function renderCritters(scene, away) {
  const box = $('#critters');
  if (!box) return;
  const list = away ? [] : crittersFor();
  const key = list.join(',');
  if (key === critterKey) return;
  critterKey = key;
  box.innerHTML = list.map((id, k) => `<i class="critter c-${id}" style="--d:${14 + ((k * 7) % 11)}s;--delay:${-k * 3.3}s;--y:${12 + ((k * 23) % 60)}%">${ic(`critters/${id}`, CRITTERS[id])}</i>`).join('');
}

function showWelcomeBack(stories) {
  if (!stories.length || !state.name) return;
  showModal(`<div class="result welcome-back"><div class="result-icon">🦦</div><h2>Welcome back!</h2>
    <p class="muted">While you were away…</p>
    <ul class="away-list">${stories.map((x) => `<li>${esc(x.text)}${x.pearls ? ` <small>+${x.pearls} pearls</small>` : ''}</li>`).join('')}</ul>
    <button class="btn primary" data-close>Hi, ${esc(state.name)}!</button></div>`);
}

// ---------- trinkets, books, aquarium, photo booth ----------
const trinketIcon = (id) => ic(`trinkets/${id}`, TRINKETS[id].icon);
function treasuresView() {
  const have = state.trinkets || {};
  const n = Object.keys(have).length;
  return `<div class="treasures"><div class="explore-head"><h2 class="section-title">Treasures</h2><button class="btn small" data-action="sub-back">🗺️ Back to map</button></div>
    <p class="note">${n} of ${TRINKET_IDS.length} found. Trinkets turn up while exploring. Show them off in display cases in your den: ${Object.values(FURNITURE).filter((f) => f.shows).map((f) => f.name).join(', ')}.</p>
    ${Object.entries(TRINKET_GROUPS).map(([g, label]) => `<h2 class="section-title">${label}</h2><div class="card journal-loc"><div class="finds">${TRINKET_IDS.filter((id) => TRINKETS[id].group === g).map((id) => `<div class="find ${have[id] ? 'got' : ''}"><span class="find-icon">${have[id] ? trinketIcon(id) : '❔'}</span><span class="find-name">${have[id] ? TRINKETS[id].name : '???'}</span><span class="find-rar">${have[id] ? `×${have[id]}` : TRINKETS[id].rarity}</span></div>`).join('')}</div></div>`).join('')}
  </div>`;
}
function openLibrary() {
  showModal(`<div class="library"><div class="game-top"><h2>📚 Your Bookshelf</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>
    <p class="muted">${state.books.length} of ${BOOK_IDS.length} books. Old books sometimes wash up while exploring.</p>
    ${BOOK_IDS.map((id) => (state.books.includes(id) ? `<details class="card book"><summary>${ic(`books/${id}`, BOOKS[id].icon)} <b>${esc(BOOKS[id].title)}</b></summary><p class="lore-page">${esc(BOOKS[id].text)}</p></details>` : `<p class="muted lore-locked">📕 A book you haven't found yet</p>`)).join('')}
    ${sync.linked ? '<button class="btn" data-action="open-mailbox">✉️ Open your Shell Mail</button>' : ''}
    <button class="btn" data-action="lore-book">📜 Open the Lore Book</button></div>`, { wide: true });
}
function openAquarium() {
  const fish = state.aquarium.fish;
  const wait = (state.aquarium.lastFish || 0) + FISHING_COOLDOWN - Date.now();
  showModal(`<div class="aquarium-view"><div class="game-top"><h2>🐠 Aquarium</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>
    <div class="tank">${Object.keys(fish).map((f, k) => `<span class="tank-fish" style="--k:${k};top:${15 + (k * 23) % 60}%">${ic(`fish/${f}`, FISH[f].icon)}</span>`).join('') || '<p class="muted">Empty for now…</p>'}</div>
    <button class="btn primary" data-action="go-fishing" ${wait > 0 ? 'disabled' : ''}>${wait > 0 ? `🎣 Fish again in ${fmtTime(wait)}` : '🎣 Go fishing for a new fish'}</button>
    <div class="finds">${FISH_IDS.map((f) => `<div class="find ${fish[f] ? 'got' : ''}"><span class="find-icon">${fish[f] ? ic(`fish/${f}`, FISH[f].icon) : '❔'}</span><span class="find-name">${fish[f] ? FISH[f].name : '???'}</span><span class="find-rar">${fish[f] ? `×${fish[f]}` : FISH[f].rarity}</span></div>`).join('')}</div></div>`, { wide: true });
}

// Photo booth: a keepsake picture of your otter with up to three friends.
let boothPick = [];
function openPhotoBooth() {
  const friends = (friendsData?.friends || []).slice(0, 12);
  showModal(`<div class="booth"><div class="game-top"><h2>📸 Photo Booth</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>
    <p class="muted">${friends.length ? 'Pick up to three friends to squeeze into the picture.' : 'Make friends on the Friends tab to take pictures together! For now, a solo portrait.'}</p>
    ${friends.length ? `<div class="chips">${friends.map((f) => `<button class="chip-btn" data-action="booth-pick" data-id="${f.code}" aria-pressed="${boothPick.includes(f.code)}">${esc(f.name)}</button>`).join('')}</div>` : ''}
    <div class="booth-preview" id="booth-preview">${boothSVG()}</div>
    <div class="row"><button class="btn primary" data-action="booth-snap">📸 Take the picture</button></div>
    <div id="booth-result"></div></div>`, { wide: true });
}
function boothSVG() {
  const friends = (friendsData?.friends || []).filter((f) => boothPick.includes(f.code));
  const cast = [{ name: state.name, st: { ...state, sleeping: false } }, ...friends.map((f) => ({ name: f.name, st: { ...core.defaultState(), species: f.species, equipped: f.equipped || {}, stats: { hunger: 90, happiness: 95, energy: 90, clean: 90 } } }))];
  const W = 800; const H = 600; const step = W / (cast.length + 1);
  const comp = core.activeCompanion(state);
  const wp = WALLPAPERS[state.den.wallpaper];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs>${wp?.pattern || ''}<linearGradient id="booth-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9be8de"/><stop offset="1" stop-color="#1f8f95"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="${wp?.pattern ? `url(#wp-${state.den.wallpaper})` : 'url(#booth-bg)'}"/>
    <rect width="${W}" height="${H}" fill="#fff" opacity=".18"/>
    ${cast.map((c, k) => `<svg x="${step * (k + 1) - 120}" y="140" width="240" height="305" viewBox="0 -24 200 254">${otterSVG(c.st, { idPrefix: `booth${k}` })}</svg>
      <text x="${step * (k + 1)}" y="478" text-anchor="middle" font-size="26" font-weight="800" fill="#fffaf0" stroke="#0c3440" stroke-width="6" paint-order="stroke" font-family="Nunito, sans-serif">${esc(c.name || '')}</text>`).join('')}
    ${comp ? `<svg x="${step - 190}" y="360" width="90" height="90" viewBox="0 0 100 100">${companionSVG(comp.id, { look: core.companionLook(comp) })}</svg>` : ''}
    <rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="26" fill="none" stroke="#d9b45a" stroke-width="10"/>
    <rect x="${W / 2 - 220}" y="${H - 92}" width="440" height="56" rx="28" fill="#0c3440" opacity=".85"/>
    <text x="${W / 2}" y="${H - 55}" text-anchor="middle" font-size="26" fill="#f3d98c" font-family="Georgia, serif">Otter &amp; Oyster · ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</text>
  </svg>`;
}
// Pictures inside an SVG must be inlined before it can be drawn onto a canvas.
async function inlineImages(svg) {
  const urls = [...new Set([...svg.matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1]))];
  for (const u of urls) {
    try {
      const blob = await (await fetch(u)).blob();
      const data = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
      svg = svg.split(`href="${u}"`).join(`href="${data}"`);
    } catch { /* leave it */ }
  }
  return svg;
}
async function snapPhoto() {
  const out = $('#booth-result');
  if (!out) return;
  out.innerHTML = '<p class="muted">Say cheese… 🧀</p>';
  try {
    const svg = await inlineImages(boothSVG());
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const cv = document.createElement('canvas');
    cv.width = 800; cv.height = 600;
    cv.getContext('2d').drawImage(img, 0, 0, 800, 600);
    URL.revokeObjectURL(url);
    const png = cv.toDataURL('image/png');
    const file = `${(state.name || 'otter').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-photo.png`;
    out.innerHTML = `<img class="booth-photo" src="${png}" alt="Your photo"><div class="row"><a class="btn primary" href="${png}" download="${file}">💾 Save picture</a>${navigator.share ? '<button class="btn" data-action="booth-share">📤 Share</button>' : ''}</div>`;
    out.dataset.png = png;
    out.dataset.file = file;
    burst(['📸', '✨'], 6);
  } catch {
    out.innerHTML = '<p class="muted">The camera jammed. Try again!</p>';
  }
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
          <span class="arcade-icon">${ic(`games/${g.id}`, g.icon)}</span>
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
  const st = { ...core.defaultState(), species: f.species, stats: { hunger: lvl, happiness: lvl, energy: lvl, clean: lvl }, equipped: f.equipped || {}, sleeping: !!f.sleeping };
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
  const bg = artUrl(`postcards/${m.design || 'pond'}`);
  return `<div class="postcard pc-${m.design || 'pond'}"${bg ? ` style="background:url('${bg}') center/cover"` : ''}><div class="pc-stamp">${art.icon}</div><div class="pc-title">Greetings from ${art.name}!</div>
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
      <button class="btn small" data-action="sleep-invite" data-code="${code}">🌙 Sleepover</button>
      ${r.garden?.dry ? `<button class="btn small primary" data-action="fr-water" data-code="${code}">💧 Water their garden (${r.garden.dry})</button>` : ''}</div>
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
let denView = 'inside';
let doorKind = 'wreath';
let gardenTick = 0;

function denStageHTML() {
  const guests = (socialData?.sleepovers || []).filter((x) => x.hosting && x.status === 'accepted').map((x) => ({ name: x.name, equipped: x.equipped }));
  return denSVG(state, { editable: denEdit, selected: denEdit ? denSel : null, guests, party: !!isPartyDay(), extraAttrs: 'class="den-svg" role="img" aria-label="Your otter\'s den"' });
}

function cozyLine() {
  const c = core.coziness(state);
  const pct = Math.round((c / 60) * 100);
  return `<div class="cozy"><span>✨ Coziness <b>${c}</b>/${core.COZY_MAX}</span><div class="bar"><div style="width:${(c / core.COZY_MAX) * 100}%"></div></div>
    <small>${c ? `Happiness drops ${pct}% slower and naps are ${pct}% more restful.` : 'Add furniture to make your den cozier!'}</small></div>`;
}

const denHead = (title) => `<div class="explore-head den-head"><h2 class="section-title">${esc(state.name || 'Your otter')}'s ${title}</h2>
  <div class="row">${[['inside', '🏡', 'Inside'], ['garden', '🌱', 'Garden'], ['door', '🚪', 'Door']].map(([id, icon, name]) => `<button class="btn small ${denView === id ? 'on' : ''}" data-action="den-view" data-id="${id}" aria-pressed="${denView === id}" aria-label="${name}">${icon} <span class="lbl">${name}</span></button>`).join('')}</div></div>`;

function panelDen() {
  if (denView === 'garden') return panelGarden();
  if (denView === 'door') return panelDoor();
  return panelDenInside();
}

// ---------- garden ----------
const fmtLeft = (ms) => (ms <= 0 ? 'now' : ms >= 3600000 ? `${Math.floor(ms / 3600000)}h ${Math.round((ms % 3600000) / 60000)}m` : `${Math.max(1, Math.round(ms / 60000))}m`);
function gardenStageHTML() {
  return gardenSVG(state, { raining: weatherAt(Date.now()) === 'rainy', extraAttrs: 'class="garden-svg" role="img" aria-label="Your garden"' });
}
function panelGarden() {
  const now = Date.now();
  const plots = state.garden.plots;
  const ready = plots.filter((p) => p && plotStage(p, now) === 3).length;
  const dry = plots.filter((p) => p && !p.wateredAt).length;
  const pantry = Object.entries(state.pantry || {});
  const rows = plots.map((p, k) => {
    if (!p) return '';
    const c = CROPS[p.crop];
    const st = plotStage(p, now);
    return `<li>${ic(`crops/${p.crop}`, c.icon)} <b>${c.name}</b> <span class="muted">${st === 0 ? 'needs water 💧' : st === 3 ? 'ready to harvest! ✨' : `ready in ${fmtLeft(plotReadyAt(p) - now)}`}${p.friend ? ' · 💕 a friend watered it' : ''}</span></li>`;
  }).join('');
  return `${denHead('Garden')}
    <div class="garden-stage" id="garden-stage">${gardenStageHTML()}</div>
    <div class="den-toolbar"><span class="den-sel-name muted">Tap a plot to plant, water or harvest.${weatherAt(now) === 'rainy' ? ' 🌧️ The rain is watering everything!' : ''}</span>
      <button class="btn small ${dry ? 'primary' : ''}" data-action="water-all" ${dry ? '' : 'disabled'}>💧 Water all</button>
      <button class="btn small ${ready ? 'primary' : ''}" data-action="harvest-all" ${ready ? '' : 'disabled'}>🧺 Harvest${ready ? ` (${ready})` : ''}</button></div>
    ${rows ? `<ul class="garden-list card">${rows}</ul>` : ''}
    <h2 class="section-title">Pantry <small>snacks you grew are free to eat</small></h2>
    ${pantry.length ? `<div class="chips">${pantry.map(([id, n]) => { const sn = SNACKS.find((x) => x.id === id); return `<span class="chip">${ic(`snacks/${id}`, sn.icon)} ${sn.name} ×${n}</span>`; }).join('')}</div>` : '<p class="note">Empty for now. Grow sea grapes, berries or pumpkins to fill it.</p>'}
    <h2 class="section-title">Seeds</h2>
    <div class="grid">${Object.entries(CROPS).map(([id, c]) => seedCard(id, c)).join('')}</div>
    <p class="note">Friends can water your garden when they visit, and a friend-watered plant gives a bigger harvest. 💕</p>`;
}
function cropYield(c) {
  return [c.pearls ? `<span class="pearl-icon"></span> ${c.pearls}` : '', ...Object.entries(c.pantry || {}).map(([sid, n]) => `${SNACKS.find((x) => x.id === sid).icon}×${n}`)].filter(Boolean).join(' ');
}
function seedCard(id, c, plot = null) {
  const locked = state.level < c.level;
  return `<div class="card item seed"><div class="seed-icon">${ic(`crops/${id}`, c.icon)}</div><div class="item-name">${c.name}</div>
    <small class="muted">⏱ ${c.minutes >= 60 ? `${c.minutes / 60}h` : `${c.minutes}m`} · ${cropYield(c)}</small>
    ${locked ? `<button class="btn small" disabled>🔒 Lv ${c.level}</button>` : plot != null
    ? `<button class="btn small primary" data-action="plant" data-plot="${plot}" data-id="${id}" ${state.pearls < c.seed ? 'disabled' : ''}>Plant · <span class="pearl-icon"></span> ${c.seed}</button>`
    : `<small>Seed: <span class="pearl-icon"></span> ${c.seed}</small>`}</div>`;
}
function plotTap(k) {
  const now = Date.now();
  const p = state.garden.plots[k];
  if (k >= core.plotsUnlocked(state)) return toast(`🔒 This plot opens at level ${PLOT_LEVELS[k]}.`);
  if (!p) {
    return showModal(`<div class="seed-pick"><div class="game-top"><h2>🌱 Plant something</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>
      <div class="grid">${Object.entries(CROPS).map(([id, c]) => seedCard(id, c, k)).join('')}</div></div>`, { wide: true });
  }
  const st = plotStage(p, now);
  if (st === 0) { const r = act(core.water(state, k, now)); if (r.ok) playCare('water'); return r; }
  if (st === 3) { const r = act(core.harvest(state, k, now)); if (r.ok) playCare('harvest'); return r; }
  return toast(`${CROPS[p.crop].icon} ${CROPS[p.crop].name}: ready in ${fmtLeft(plotReadyAt(p) - now)}.`);
}

// ---------- front door ----------
function panelDoor() {
  const comp = core.activeCompanion(state);
  const items = Object.entries(DOOR_ITEMS).filter(([, it]) => it.kind === doorKind);
  return `${denHead('Front Door')}
    <div class="door-stage"><svg viewBox="-20 0 160 130" role="img" aria-label="Your front door">${houseFrontSVG(state.door)}
      ${!state.mission ? `<svg x="84" y="64" width="44" height="58" viewBox="0 -24 200 254" overflow="visible">${otterSVG({ ...state, sleeping: false }, { idPrefix: 'door-otter' })}</svg>` : ''}
      ${comp ? `<svg x="-8" y="96" width="26" height="26" viewBox="0 0 100 100">${companionSVG(comp.id, { look: core.companionLook(comp) })}</svg>` : ''}</svg></div>
    <p class="note center">This is how your house looks on Otter Lane. Each decoration adds ✨ +1 coziness.</p>
    <div class="chips">${DOOR_KINDS.map((k) => `<button class="chip-btn" data-action="door-kind" data-id="${k.id}" aria-pressed="${doorKind === k.id}">${k.icon} ${k.name}</button>`).join('')}</div>
    <div class="grid">${items.map(([id, it]) => {
    const owned = state.doorItems.includes(id);
    const using = state.door[it.kind] === id;
    return `<div class="card item ${using ? 'using' : ''}"><div class="item-art door-art">${it.kind === 'paint' ? `<span class="swatch-chip big" style="background:${it.color}"></span>` : `<svg viewBox="0 0 120 130">${houseFrontSVG({ paint: state.door.paint, [it.kind]: id })}</svg>`}</div>
      <div class="item-name">${it.name}</div>
      ${owned ? `<button class="btn small ${using ? 'primary' : ''}" data-action="door-set" data-id="${id}" ${using && it.kind === 'paint' ? 'disabled' : ''}>${using ? (it.kind === 'paint' ? 'In use ✓' : 'Take down') : 'Put up'}</button>`
    : `<div class="buy-row">${tryBtn('door', id)}<button class="btn small primary" data-action="door-buy" data-id="${id}" ${state.pearls < it.price ? 'disabled' : ''}><span class="pearl-icon"></span> ${it.price}</button></div>`}</div>`;
  }).join('')}</div>`;
}

function panelDenInside() {
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
        ${it.pattern ? `<svg class="swatch-chip" viewBox="0 0 40 40"><defs>${it.pattern.replace(/id="([^"]+)"/, 'id="sw-$1"')}</defs><rect width="40" height="40" fill="url(#sw-${kind === 'wall' ? 'wp' : 'fl'}-${id})"/></svg>` : `<span class="swatch-chip" style="background:${it.swatch}"></span>`}<b>${it.name}</b>
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
    ${denHead('Den')}
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
    const fu = item && FURNITURE[item.id];
    if (item?.id === 'bookshelf' || fu?.use === 'books') openLibrary();
    else if (fu?.use === 'aquarium') openAquarium();
    else if (fu?.use === 'arcade') { tab = 'arcade'; renderPanel(); window.scrollTo({ top: 0 }); }
    else if (fu?.use === 'photo') { if (sync.linked && !friendsData) loadFriends(); openPhotoBooth(); }
    else if (fu?.shows) openSub('treasures');
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

// Growing up and birthdays get their own animation moments.
let momentSnap = null;
function watchMoments() {
  const now = { stage: stageOf(state.level || 1).id, bdays: state.birthdaysClaimed?.length || 0, name: state.name };
  const was = momentSnap;
  momentSnap = now;
  if (!was || was.name !== now.name) return;
  if (now.bdays > was.bdays) playCare('birthday');
  else if (now.stage !== was.stage) playCare('grow');
}

function commit({ push = true } = {}) {
  if (!document.hidden) state.lastSeen = Date.now();
  celebrateAchievements();
  watchMoments();
  saveLocal();
  renderAll();
  renderPanel();
  if (push && sync.linked) {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, 700);
  }
}

function updateLive() {
  if ($('#garden-stage') && ++gardenTick % 15 === 0) { $('#garden-stage').innerHTML = gardenStageHTML(); }
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
  w.classList.remove('bathing', 'cuddling', ...TRICKS.map((t) => `trick-${t.id}`));
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
      ${first ? `<h2>A baby otter is waiting for you!</h2><p>Which kind of otter will they be?</p>
      <div class="species-pick">${['sea', 'river'].map((sp) => `<label class="species-card"><input type="radio" name="species" value="${sp}" ${sp === 'sea' ? 'checked' : ''}>
        <svg viewBox="0 -24 200 254" aria-hidden="true">${otterSVG({ ...preview, species: sp }, { idPrefix: `adopt-${sp}` })}</svg>
        <b>${SPECIES[sp].icon} ${SPECIES[sp].name}</b><small>${SPECIES[sp].desc}</small></label>`).join('')}</div>
      <p>Now give your new friend a name. Feed them, dress them up, send them on adventures and play games together.</p>`
    : `<div class="adopt-otter"><svg viewBox="0 -24 200 254">${otterSVG({ ...state, sleeping: false }, { idPrefix: 'adopt-otter' })}</svg></div><h2>Rename your otter</h2>`}
      <input name="name" maxlength="16" required autocomplete="off" placeholder="${idea}" value="${first ? '' : esc(state.name)}" aria-label="Otter name">
      <button class="btn primary" type="submit">${first ? 'Adopt 🦦' : 'Save'}</button>
      ${first ? '<button class="link" type="button" data-action="havediscord">Already have an otter? Load it from another device, Discord or a backup</button>' : ''}
    </form>`, { locked: first });
  setTimeout(() => $('#modal input')?.focus(), 50);
}

async function showLeaderboard(id) {
  const g = GAME_LIST.find((x) => x.id === id);
  showModal(`<div class="result"><div class="result-icon">${ic(`games/${g.id}`, g.icon)}</div><h2>${g.name}</h2><p>Loading top scores…</p></div>`);
  let top = null;
  try { top = await sync.leaderboard(id); } catch { /* offline */ }
  if ($('#modal').hidden) return;
  $('#modal-card').innerHTML = `<div class="result"><div class="result-icon">${ic(`games/${g.id}`, g.icon)}</div><h2>${g.name} leaderboard</h2>
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
    if (tab === 'missions' && tabBtn.closest('.tabs')) { subView = null; journalOpen = false; placeView = null; }
    if (tab === 'friends') loadFriends();
    renderPanel();
    if (tabBtn.closest('.tabs')) window.scrollTo({ top: 0 });
    return;
  }
  const place = e.target.closest('[data-place]');
  const plotEl = e.target.closest('[data-plot]');
  if (plotEl && plotEl.closest('#garden-stage')) { plotTap(Number(plotEl.dataset.plot)); return; }
  if (place) { placeView = place.dataset.place; if (placeView === 'museum') loadMuseum(); else loadLane(); renderPanel(); window.scrollTo({ top: 0 }); return; }
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
    case 'wear': { const was = state.equipped[ITEMS[id]?.slot] === id; const r = act({ ...core.toggleWear(state, id), msg: '' }); if (!was && r?.ok !== false) playCare('outfit').then((p) => { if (!p) bounce(); }); else bounce(); return r; }
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
    case 'place-back': placeView = null; return renderPanel();
    case 'museum-donate': {
      await pushNow();
      const r = await sync.museumDonate(id);
      if (!r.ok) return toast(r.error || 'Could not donate right now.');
      adoptRemote(r.state, r.version, r.first ? '🏛️ A first for the museum! Your name is on the exhibit. +5 pearls' : '🏛️ Donated! +5 pearls');
      if (!(await playCare('donate'))) burst(['🏛️', '✨'], 6);
      return loadMuseum();
    }
    case 'museum-claim': {
      await pushNow();
      const r = await sync.museumClaim(Number(id));
      if (!r.ok) return toast(r.error || 'Could not claim right now.');
      adoptRemote(r.state, r.version, '🏛️ Milestone reward claimed! Thank you, community!');
      return loadMuseum();
    }
    case 'lane-refresh': laneData = null; return loadLane();
    case 'lane-house': {
      if (a.dataset.you) { tab = 'den'; renderPanel(); window.scrollTo({ top: 0 }); return null; }
      const walker = $('#walker');
      if (walker) walker.style.left = `${a.offsetLeft + a.offsetWidth / 2 - 22}px`;
      a.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      setTimeout(() => peekHouse(a.dataset.code), 700);
      return null;
    }
    case 'lane-addfriend': {
      const r = await sync.addFriend(a.dataset.code);
      toast(r.ok ? (r.accepted ? `🤝 You're friends with ${r.friend.name}!` : `📨 Friend request sent to ${r.friend.name}!`) : r.error || 'Could not add them right now.');
      if (r.ok) { a.disabled = true; loadFriends(); }
      return null;
    }
    case 'adventure-book': return openAdventureBook();
    case 'story': { const r = act(core.tellStory(state)); if (r.ok) speak(r.msg.replace(/^📖 /, ''), 8000); return r; }
    case 'teach': { const r = act(core.teachTrick(state)); if (r.ok) playTrick(r.trick); return r; }
    case 'trick': { const r = core.performTrick(state, id); if (!r.ok) return toast(r.msg); commit(); if (tab !== 'home') { tab = 'home'; renderPanel(); } window.scrollTo({ top: 0, behavior: 'smooth' }); return playTrick(id); }
    case 'wisdom': { const r = act(core.shareWisdom(state)); if (r.ok) speak(r.msg.replace(/^🦉 [^:]+: /, ''), 9000); return r; }
    case 'bday-set':
      showModal(`<form class="pc-form" data-form="bday"><h2>🎂 When is ${esc(state.name)}'s birthday?</h2>
        <p class="muted center">You can change it once. On the day: a party, a hat and presents!</p>
        <input type="date" name="d" required class="note-input" aria-label="Birthday">
        <div class="row"><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Save</button></div></form>`);
      return null;
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
      if (r.ok) { a.disabled = true; a.textContent = '🤗 Hugged today'; a.classList.remove('primary'); if (!(await playCare('hug'))) burst(['🤗', '💕'], 6); }
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
        playCare('discover');
        const rar = RARITY[r.find.rarity];
        showModal(`<div class="result"><div class="result-icon big-find">${ic(`finds/${r.find.id}`, r.find.icon)}</div>
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
    case 'closet-slot': closetSlot = id; return renderPanel();
    case 'comp-style': return openCompanionStyle(id);
    case 'comp-look': { const r = act(core.styleCompanion(state, id, { [a.dataset.k]: a.dataset.v })); if (r.ok) openCompanionStyle(id); return r; }
    case 'comp-acc-buy': { const r = act(core.buyCompanionAcc(state, id)); if (r.ok && a.dataset.comp) { core.styleCompanion(state, a.dataset.comp, { acc: id }); commit(); openCompanionStyle(a.dataset.comp); } return r; }
    case 'treasures': return openSub('treasures');
    case 'sub-back': subView = null; renderPanel(); window.scrollTo({ top: 0 }); return null;
    case 'library': return openLibrary();
    case 'open-mailbox': return openMailbox();
    case 'aquarium': return openAquarium();
    case 'go-fishing': { const r = act(core.goFishing(state)); if (r.ok) openAquarium(); return r; }
    case 'photo-booth': if (sync.linked && !friendsData) loadFriends(); return openPhotoBooth();
    case 'booth-pick': {
      boothPick = boothPick.includes(id) ? boothPick.filter((x) => x !== id) : [...boothPick, id].slice(-3);
      document.querySelectorAll('[data-action=booth-pick]').forEach((b) => b.setAttribute('aria-pressed', boothPick.includes(b.dataset.id)));
      $('#booth-preview').innerHTML = boothSVG();
      return null;
    }
    case 'booth-snap': return snapPhoto();
    case 'booth-share': {
      const out = $('#booth-result');
      try { const blob = await (await fetch(out.dataset.png)).blob(); await navigator.share({ files: [new File([blob], out.dataset.file, { type: 'image/png' })], title: 'Otter & Oyster' }); } catch { /* cancelled */ }
      return null;
    }
    case 'relogin-dismiss': sync.dismissRelogin(); return renderPanel();
    case 'legacy': return openLegacy();
    case 'species': { const r = act(core.setSpecies(state, id)); lastOtter = ''; return r; }
    case 'legacy-claim': { const r = act(core.claimLegacy(state, id)); if (!$('#modal').hidden) openLegacy(); return r; }
    case 'lore-book': return openSub('lore');
    case 'npc': return openNpc(id);
    case 'favor': { const r = act(core.doFavor(state, id)); if (r.ok) openNpc(id); return r; }
    case 'investigate': {
      const r = core.investigate(state, id, a.dataset.place);
      if (!r.ok) return toast(r.msg);
      commit();
      if (r.ups) levelUp();
      playCare(r.solved ? 'mystery-solved' : 'investigate');
      const m = MYSTERIES.find((x) => x.id === id);
      return showModal(`<div class="result"><div class="result-icon">${r.solved ? m.icon : '🔍'}</div><h2>${r.solved ? 'Mystery solved!' : `Chapter ${r.chapter + 1} of ${m.chapters.length}`}</h2>
        <p class="lore-page">${esc(r.msg.replace(/^🔍 /, ''))}</p>
        ${r.solved ? `<div class="rewards"><span class="chip"><span class="pearl-icon"></span> +${m.reward.pearls}</span><span class="chip">🏷️ “${m.reward.title}”</span></div>` : `<p class="muted"><b>Next:</b> ${esc(m.chapters[r.chapter + 1].hint)}</p>`}
        <button class="btn primary" data-close>${r.solved ? 'Wonderful!' : 'Onward'}</button></div>`);
    }
    case 'merchant': return openMerchant();
    case 'merchant-buy': { const r = act(core.buyMerchant(state, id)); if (r.ok) openMerchant(); return r; }
    case 'den-view': denView = id; denEdit = false; denSel = null; return renderPanel();
    case 'door-kind': doorKind = id; return renderPanel();
    case 'door-buy': return requestPurchase('door', id);
    case 'door-set': return act(core.setDoor(state, id));
    case 'plant': { closeModal(); const r = act(core.plant(state, Number(a.dataset.plot), id)); if (r.ok) playCare('plant'); return r; }
    case 'water-all': { const r = act(core.waterAll(state)); if (r.ok) playCare('water'); return r; }
    case 'harvest-all': { const r = act(core.harvestAll(state)); if (r.ok) playCare('harvest'); return r; }
    case 'comp-cove': return openCove();
    case 'comp-adopt': return requestPurchase('comp', id);
    case 'comp-set': { const r = act(core.setCompanion(state, id || null)); if (r.ok && !$('#modal').hidden) openCove(); return r; }
    case 'comp-play': {
      const r = act(core.playCompanion(state));
      if (r.ok) { $('#companion')?.classList.remove('hop'); void $('#companion')?.offsetWidth; $('#companion')?.classList.add('hop'); playCare('companion-play'); }
      return r;
    }
    case 'comp-treat': return act(core.treatCompanion(state));
    case 'comp-rename': {
      const c = state.companions.owned[id];
      return showModal(`<form class="gift-form" data-form="comp-rename" data-id="${id}"><h2>Name your ${COMPANIONS[id].name}</h2>
        <input name="name" maxlength="16" value="${esc(c.name)}" required aria-label="Companion name"><div class="row"><button class="btn" type="button" data-close>Cancel</button><button class="btn primary">Save</button></div></form>`);
    }
    case 'fr-water': {
      await pushNow();
      const r = await sync.waterFriend(a.dataset.code);
      if (!r.ok) return toast(r.error || 'Could not water right now.');
      adoptRemote(r.state, r.version, r.msg);
      a.disabled = true; a.textContent = '💧 Watered';
      playCare('water');
      return r;
    }
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
    if (first && form.species) core.setSpecies(state, form.species.value);
    if (first) core.log(state, `You adopted ${name}, a ${state.species} otter! 🦦`);
    closeModal();
    commit();
    if (first) burst(['💖', '🦦', '✨'], 10);
  } else if (form.dataset.form === 'link') {
    doLink(form.code.value);
  } else if (form.dataset.form === 'bday') {
    const v = form.d.value; // YYYY-MM-DD
    const r = core.setBirthday(state, v.slice(5));
    closeModal();
    if (r.ok) { act(r); } else toast(r.msg);
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
  } else if (form.dataset.form === 'comp-rename') {
    const r = act(core.renameCompanion(state, form.dataset.id, new FormData(form).get('name')));
    if (r.ok) closeModal();
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
  if (e.target.matches('[data-title-pick]')) { act(core.setTitle(state, e.target.value)); return; }
  if (e.target.matches('[data-lane-public]')) {
    const on = e.target.checked;
    pushNow().then(() => sync.lanePublic(on)).then((r) => {
      if (!r.ok) { e.target.checked = !on; return toast(r.error || 'Could not change that right now.'); }
      adoptRemote(r.state, r.version, on ? '🏘️ Your den is on Otter Lane.' : '🔒 Your den is hidden from Otter Lane (friends can still visit).');
    });
    return;
  }
  if (e.target.matches('[data-restore]') && e.target.files?.[0]) restoreBackup(e.target.files[0]);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#modal').hidden && !$('#modal').dataset.locked) {
    if (gameOpen) quitGame();
    else closeModal();
  }
});

async function playTrick(id) {
  if (!(await playCare(`trick-${id}`))) animateOtter(`trick-${id}`, 1800);
  burst([TRICKS.find((t) => t.id === id)?.icon || '⭐', '✨'], 6);
}

async function careCuddle() {
  const r = act(core.cuddle(state));
  if (r.ok && !(await playCare('cuddle'))) animateOtter('cuddling', 1200);
  return r;
}
$('#otter-wrap').addEventListener('click', () => careCuddle());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { saveLocal(); if (sync.linked && sync.online) pushNow({ keepalive: true }); return; }
  const away = state.name ? core.welcomeBack(state) : [];
  runTick();
  commit({ push: false });
  if (away.length && $('#modal').hidden) showWelcomeBack(away);
  pullNow();
});

// Uploaded interface art: tab icons, the pearl, the pond scene.
function applyArtChrome() {
  document.querySelectorAll('.tabs button[data-tab]').forEach((b) => {
    const url = artUrl(`icons/tab-${b.dataset.tab}`);
    if (url) b.querySelector('span').innerHTML = ic(`icons/tab-${b.dataset.tab}`, '');
  });
  const pearl = artUrl('icons/pearl');
  document.documentElement.classList.toggle('has-pearl-art', !!pearl);
  if (pearl) document.documentElement.style.setProperty('--pearl-art', `url("${pearl}")`);
}

// ---------- boot ----------
detectArt();
await loadArtManifest();
applyArtChrome();
const awayOnBoot = state.name ? core.welcomeBack(state) : [];
if (PANELS[location.hash.slice(1)]) tab = location.hash.slice(1);
runTick();
commit({ push: false });
if (!state.name && !sync.linked) askName(true);
else if (awayOnBoot.length) showWelcomeBack(awayOnBoot);

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
