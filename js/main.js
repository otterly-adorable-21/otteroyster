import { ITEMS, SLOTS, SNACKS, MISSIONS, GAME_LIST, GAME_CATEGORIES, NAME_IDEAS } from './data.js';
import * as core from './core.js';
import { otterSVG, itemPreviewSVG } from './otter.js';
import { LOADERS } from './games/index.js';
import { sync } from './sync.js';
import { detectArt, art } from './assets.js';
import { FURNITURE, WALLPAPERS, FLOORS, DEN_CATS } from './den-data.js';
import { denSVG, furniturePreviewSVG } from './den.js';
import { LOCATIONS, LOC, RARITY, FINDS, TOTAL_FINDS, EXPLORE_ENERGY, SET_REWARD } from './world.js';
import { mapSVG } from './map.js';
import { heartsText, friendLevel, GIFT_PEARL_OPTIONS, GIFT_PEARLS_PER_DAY } from './social.js';
import { EVENTS, EVENT, EVENT_FINDS, eventEndsAt, nextEvent, setEventPreview, isPreview } from './events.js';

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
  $('#modal-card').innerHTML = `
    <div class="result">
      <div class="result-icon">${g.icon}</div>
      <h2>${res.record ? 'New record! 🏆' : 'Nice job!'}</h2>
      ${res.favGame ? `<p>${esc(state.name)} loves this game! 💕 (+10% pearls)</p>` : ''}
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
      ${owned ? '<button class="btn small" disabled>Owned ✓</button>' : `<button class="btn small primary" data-action="ev-buy" data-id="${e.id}" ${st.tokens < e.tokens ? 'disabled' : ''}>${ev.token.icon} ${e.tokens}</button>`}</div>`;
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
      </div>
    </div>`;
}

function panelHome() {
  const claimed = state.lastDaily === core.dayKey();
  const asleep = state.sleeping;
  return `${eventBanner()}
    <h2 class="section-title">Snacks</h2>
    <div class="snacks">
      ${SNACKS.map((s) => `<button class="snack" data-action="feed" data-id="${s.id}" ${state.pearls < s.price ? 'disabled' : ''}>
        <span class="snack-icon">${s.icon}</span>${state.persona?.fav.snack === s.id ? '<span class="fav-heart" title="Favorite!">❤️</span>' : ''}<span class="snack-name">${s.name}</span>
        <span class="snack-price">${s.price ? `<span class="pearl-icon"></span> ${s.price}` : 'Free'}</span></button>`).join('')}
    </div>
    <h2 class="section-title">Care</h2>
    <div class="actions">
      <button class="action" data-action="pet"><span>🤗</span>Cuddle</button>
      <button class="action" data-action="bath"><span>🛁</span>Bath</button>
      <button class="action" data-action="sleep"><span>${asleep ? '☀️' : '🌙'}</span>${asleep ? 'Wake up' : 'Nap'}</button>
      <button class="action ${claimed ? '' : 'glow'}" data-action="daily"><span>🎁</span>${claimed ? 'Gift claimed' : 'Daily gift'}</button>
    </div>
    ${personaCard()}
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

async function loadFriends() {
  if (!sync.online || !sync.linked || friendsLoading) return;
  friendsLoading = true;
  try {
    const [f, g] = await Promise.all([sync.friends(), sync.gifts()]);
    if (f.ok) friendsData = f;
    if (g.ok) giftsData = g.gifts;
  } catch { /* offline */ }
  friendsLoading = false;
  if (tab === 'friends') renderPanel();
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
      <button class="btn small" data-action="fr-gift" data-code="${f.code}" data-name="${esc(f.name)}">🎁</button>
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
    return `<div class="empty"><div class="empty-icon">📡</div><p>The Otter &amp; Oyster server isn't reachable right now, so friends and Discord are unavailable. Your otter is still saved on this device.</p>
      <button class="btn" data-action="recheck">Try again</button></div>`;
  }
  if (!sync.linked) {
    return `<div class="card signup">
      <img class="hero-art" src="${art.float || 'assets/web/otter-float.webp'}" alt="">
      <h2 class="section-title flush">Make otter friends 🦦💕</h2>
      <p class="flush-p">Save ${esc(state.name || 'your otter')} online to add friends, visit their dens, give hugs and send gifts. Your otter then also works on other devices and in Discord.</p>
      <button class="btn primary wide" data-action="register">Save my otter online</button>
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
      <button class="btn" data-action="fr-gift" data-code="${code}" data-name="${esc(o.name)}">🎁 Send a gift</button>
    </div></div>`;
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
    shop = `<div class="grid">${Object.entries(FURNITURE).filter(([, it]) => it.cat === denShop && !it.event).map(([id, it]) => {
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
  const ew = document.querySelector('[data-live="explore-wait"]');
  if (ew) { const left = Number(ew.dataset.ready) - Date.now(); if (left <= 0) renderPanel(); else ew.textContent = fmtTime(left); }
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
    case 'feed': return act(core.feed(state, id));
    case 'pet': return act(core.cuddle(state));
    case 'bath': return act(core.bath(state));
    case 'sleep': return act(core.toggleSleep(state));
    case 'daily': return act(core.claimDaily(state));
    case 'buy': return act(core.buy(state, id));
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
    case 'register': {
      a.disabled = true;
      const r = await sync.register(state);
      if (!r.token) { a.disabled = false; return toast(r.error || 'Could not save online right now.'); }
      adoptRemote(r.state, r.version, `☁️ ${state.name} is saved online! Now add some friends.`);
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
    case 'ev-buy': return act(core.buyEventItem(state, id));
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
      closeModal();
      tab = 'friends';
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
