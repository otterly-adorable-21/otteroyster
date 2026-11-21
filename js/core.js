// Shared game rules. Pure logic with no DOM access, so both the website and
// the Discord bot (server/) use exactly the same rules on the same save data.
import { ITEMS, SNACKS, MISSIONS, GAME_LIST } from './data.js';
import { FURNITURE, WALLPAPERS, FLOORS, STARTER_DEN, ZONES, zoneOf, clampPos } from './den-data.js';
import { LOC, FINDS, RARITY, MISSION_LOC, EXPLORE_ENERGY, EXPLORE_COOLDOWN_MIN, SET_REWARD } from './world.js';
import { activeEvent, questsFor, EVENT, EVENT_FIND_CHANCE, TOKENS_PER_ACTIVITY } from './events.js';
import { TRAITS, TRAIT_IDS, blankPersona, favoritesFor, traitOf, hasTrait } from './personality.js';
import { dailyMood, exploreLuck } from './ambience.js';
import { ACHIEVEMENTS, ACH } from './achievements.js';

export const SAVE_VERSION = 2;

export function defaultState(now = Date.now()) {
  return {
    version: SAVE_VERSION,
    name: '',
    created: now,
    lastTick: now,
    stats: { hunger: 80, happiness: 80, energy: 80, clean: 80 },
    pearls: 25,
    xp: 0,
    level: 1,
    owned: [],
    equipped: { hat: null, eyes: null, neck: null, back: null },
    sleeping: false,
    mission: null,
    reports: [],
    lastDaily: null,
    den: starterDen(),
    furniture: Object.fromEntries(STARTER_DEN.map((p) => [p.id, 1])),
    wallpapers: ['moss'],
    floors: ['earth'],
    collection: {},
    achievements: {},
    counters: { care: 0, night: 0, friends: 0, visited: [] },
    newAch: [],
    events: {},
    persona: blankPersona(now),
    explored: {},
    sets: [],
    best: {},
    plays: {},
    log: [],
  };
}

let uidCounter = 0;
const newUid = () => `${Date.now().toString(36)}${(uidCounter++).toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

function starterDen() {
  return { wallpaper: 'moss', floor: 'earth', items: STARTER_DEN.map((p) => ({ uid: newUid(), id: p.id, x: p.x, y: p.y, flip: false })), otter: { x: 196, y: 286 } };
}

// Bring any older/partial save up to the current shape.
export function normalize(saved) {
  const base = defaultState();
  if (!saved || typeof saved !== 'object') return base;
  const s = {
    ...base,
    ...saved,
    stats: { ...base.stats, ...saved.stats },
    equipped: { ...base.equipped, ...saved.equipped },
    best: { ...saved.best },
    plays: { ...saved.plays },
    reports: Array.isArray(saved.reports) ? saved.reports : [],
    log: Array.isArray(saved.log) ? saved.log : [],
    owned: Array.isArray(saved.owned) ? saved.owned.filter((id) => ITEMS[id]) : [],
  };
  if (!saved.den || !Array.isArray(saved.den.items)) {
    s.den = starterDen();
    s.furniture = { ...Object.fromEntries(STARTER_DEN.map((p) => [p.id, 1])), ...(saved.furniture || {}) };
  } else {
    s.den = { wallpaper: 'moss', floor: 'earth', otter: { x: 196, y: 286 }, ...saved.den, items: saved.den.items.filter((p) => FURNITURE[p.id]) };
    s.furniture = { ...(saved.furniture || {}) };
  }
  s.wallpapers = Array.isArray(saved.wallpapers) ? saved.wallpapers : ['moss'];
  s.collection = { ...(saved.collection || {}) };
  s.persona = {
    pts: { ...blankPersona(s.created).pts, ...(saved.persona?.pts || {}) },
    fav: favoritesFor(s.created), // always derived from birth time, so every device agrees
  };
  s.events = { ...(saved.events || {}) };
  s.achievements = { ...(saved.achievements || {}) };
  s.counters = { care: 0, night: 0, friends: 0, visited: [], ...(saved.counters || {}) };
  if (!Array.isArray(s.counters.visited)) s.counters.visited = [];
  s.newAch = Array.isArray(saved.newAch) ? saved.newAch : [];
  s.explored = { ...(saved.explored || {}) };
  s.sets = Array.isArray(saved.sets) ? saved.sets : [];
  s.floors = Array.isArray(saved.floors) ? saved.floors : ['earth'];
  // v1 stored memory best as `null` when unplayed
  for (const k of Object.keys(s.best)) if (s.best[k] == null) delete s.best[k];
  s.version = SAVE_VERSION;
  return s;
}

export const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
export const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const xpNeed = (lvl) => 40 + lvl * 30;
export const dayKey = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

// Stat change per real-time minute while awake and home.
export const RATES = { hunger: -0.15, happiness: -0.1, energy: -0.08, clean: -0.06 };

export const STAT_INFO = [
  { id: 'hunger', label: 'Full', icon: '🐟' },
  { id: 'happiness', label: 'Happy', icon: '💛' },
  { id: 'energy', label: 'Energy', icon: '⚡' },
  { id: 'clean', label: 'Clean', icon: '🫧' },
];

const ok = (msg, extra = {}) => ({ ok: true, msg, ...extra });
const no = (msg) => ({ ok: false, msg });

function stat(s, k, d) { s.stats[k] = clamp(s.stats[k] + d); }

export function log(s, msg, now = Date.now()) {
  s.log.unshift({ t: now, msg });
  s.log = s.log.slice(0, 25);
}

// Returns how many levels were gained.
export function addXP(s, n) {
  let ups = 0;
  s.xp += n;
  while (s.xp >= xpNeed(s.level)) {
    s.xp -= xpNeed(s.level);
    s.level += 1;
    ups += 1;
    log(s, `${s.name} reached level ${s.level}!`);
  }
  return ups;
}

export function mood(s) {
  const v = [s.stats.hunger, s.stats.happiness, s.stats.energy, s.stats.clean];
  const avg = v.reduce((a, b) => a + b, 0) / v.length;
  if (Math.min(...v) < 15 || avg < 35) return 'sad';
  if (avg > 62 && s.stats.happiness > 55) return 'happy';
  return 'ok';
}

export function busy(s) {
  if (!s.name) return 'You need to adopt an otter first.';
  if (s.mission) return `${s.name} is away on a mission.`;
  if (s.sleeping) return `${s.name} is sleeping. Shh!`;
  return '';
}

// Advance time. Returns a list of events ({type:'woke'} | {type:'mission', report}).
export function tick(s, now = Date.now()) {
  const events = [];
  let mins = (now - s.lastTick) / 60000;
  s.lastTick = now;
  if (mins > 0) {
    mins = Math.min(mins, 60 * 24 * 3);
    if (s.mission) {
      stat(s, 'hunger', RATES.hunger * 0.5 * mins);
    } else if (s.sleeping) {
      stat(s, 'energy', 2.5 * (1 + coziness(s) / 60) * (hasTrait(s, 'sleepy') ? 1.3 : 1) * (dailyMood(s, now) === 'dreamy' ? 1.25 : 1) * mins);
      stat(s, 'hunger', RATES.hunger * 0.5 * mins);
      stat(s, 'clean', RATES.clean * 0.5 * mins);
      if (s.stats.energy >= 100) {
        s.sleeping = false;
        log(s, `${s.name} woke up refreshed.`, now);
        events.push({ type: 'woke' });
      }
    } else {
      const grumpy = s.stats.hunger < 25 || s.stats.clean < 25 ? 2 : 1;
      stat(s, 'hunger', RATES.hunger * mins);
      stat(s, 'energy', RATES.energy * mins);
      stat(s, 'clean', RATES.clean * (hasTrait(s, 'tidy') ? 0.7 : 1) * mins);
      stat(s, 'happiness', RATES.happiness * grumpy * (1 - coziness(s) / 60) * (dailyMood(s, now) === 'cheerful' ? 0.75 : 1) * mins);
    }
  }
  if (s.mission && now >= s.mission.endsAt) {
    const report = finishMission(s, now);
    events.push({ type: 'mission', report });
  }
  return events;
}

// ---------- care ----------
export function feed(s, id) {
  const b = busy(s);
  if (b) return no(b);
  const snack = SNACKS.find((x) => x.id === id);
  if (!snack) return no('Unknown snack.');
  if (s.stats.hunger >= 98) return no(`${s.name} is too full to eat!`);
  if (s.pearls < snack.price) return no('Not enough pearls.');
  s.pearls -= snack.price;
  const foodie = hasTrait(s, 'foodie');
  const fav = s.persona.fav.snack === id;
  stat(s, 'hunger', snack.hunger);
  stat(s, 'happiness', snack.happiness + (foodie ? 5 : 0) + (fav ? (foodie ? 20 : 10) : 0) + (dailyMood(s) === 'peckish' ? 5 : 0));
  grow(s, 'foodie');
  count(s, 'care');
  const ups = addXP(s, 2);
  log(s, `${s.name} ate ${snack.name.toLowerCase()}.`);
  trackQuest(s, 'feed');
  const msg = fav ? `${s.name} LOVES ${snack.name.toLowerCase()}! It's their favorite! 💕` : `${s.name} munched the ${snack.name.toLowerCase()}! 😋`;
  return ok(msg, { fx: fav ? [snack.icon, '💕', '😋'] : [snack.icon, '😋'], ups, fav });
}

export function cuddle(s) {
  const b = busy(s);
  if (b) return no(b);
  if (s.stats.energy < 5) return no(`${s.name} is too tired to play.`);
  stat(s, 'happiness', 8 + (dailyMood(s) === 'cuddly' ? 6 : 0));
  stat(s, 'energy', -3);
  const ups = addXP(s, 2);
  trackQuest(s, 'care');
  count(s, 'care');
  return ok(`${s.name} squeaks happily! 💖`, { fx: ['💖', '💕', '✨'], ups });
}

export function bath(s) {
  const b = busy(s);
  if (b) return no(b);
  if (s.stats.clean >= 98) return no(`${s.name} is already squeaky clean!`);
  stat(s, 'clean', 45);
  stat(s, 'happiness', 4);
  const ups = addXP(s, 2);
  log(s, `${s.name} had a bubble bath.`);
  grow(s, 'tidy');
  trackQuest(s, 'care');
  count(s, 'care');
  return ok(`${s.name} splashes around in the bubbles! 🫧`, { fx: ['🫧', '🫧', '💧'], ups });
}

export function toggleSleep(s) {
  if (!s.name) return no(busy(s));
  if (s.mission) return no(busy(s));
  s.sleeping = !s.sleeping;
  if (s.sleeping) { log(s, `${s.name} curled up for a nap.`); grow(s, 'sleepy'); }
  return ok(s.sleeping ? `${s.name} curled up for a nap. 💤` : `${s.name} woke up! ☀️`);
}

export function claimDaily(s, now = Date.now()) {
  if (!s.name) return no(busy(s));
  if (s.lastDaily === dayKey(now)) return no('Come back tomorrow for another gift!');
  s.lastDaily = dayKey(now);
  const p = rand(15, 30);
  s.pearls += p;
  log(s, `Collected a daily gift of ${p} pearls.`, now);
  return ok(`🎁 Daily gift: +${p} pearls!`, { pearls: p, fx: ['🎁', '✨'] });
}

// ---------- wardrobe ----------
export function buy(s, id) {
  const it = ITEMS[id];
  if (!it || it.price == null) return no('That item is not for sale.');
  if (s.owned.includes(id)) return no(`You already own the ${it.name}.`);
  if (s.level < it.level) return no(`Reach level ${it.level} to buy this.`);
  if (s.pearls < it.price) return no('Not enough pearls.');
  s.pearls -= it.price;
  s.owned.push(id);
  s.equipped[it.slot] = id;
  const ups = addXP(s, 5);
  log(s, `Bought the ${it.name}.`);
  return ok(`🛍️ Bought ${it.name}! It's on now.`, { fx: [it.icon, '✨'], ups });
}

export function toggleWear(s, id) {
  const it = ITEMS[id];
  if (!it || !s.owned.includes(id)) return no("You don't own that.");
  const on = s.equipped[it.slot] !== id;
  s.equipped[it.slot] = on ? id : null;
  return ok(on ? `${s.name} is wearing the ${it.name}.` : `Took off the ${it.name}.`);
}

// ---------- missions ----------
export function startMission(s, id, now = Date.now()) {
  const m = MISSIONS.find((x) => x.id === id);
  if (!m) return no('Unknown mission.');
  const b = busy(s);
  if (b) return no(b);
  if (s.level < m.level) return no(`Reach level ${m.level} to unlock this mission.`);
  if (s.stats.energy < m.energy) return no(`${s.name} needs ${m.energy} energy for this.`);
  stat(s, 'energy', -m.energy);
  stat(s, 'hunger', -m.energy / 3);
  s.mission = { id, start: now, endsAt: now + m.minutes * 60000 };
  log(s, `${s.name} set off on ${m.name}.`, now);
  return ok(`${m.icon} ${s.name} set off on ${m.name}!`);
}

export function recallMission(s) {
  if (!s.mission) return no('No mission in progress.');
  const m = MISSIONS.find((x) => x.id === s.mission.id);
  s.mission = null;
  log(s, `${s.name} came home early from ${m.name}.`);
  return ok(`${s.name} swam home early.`);
}

function finishMission(s, now) {
  const m = MISSIONS.find((x) => x.id === s.mission.id);
  s.mission = null;
  const pearls = Math.round(rand(m.pearls[0], m.pearls[1]) * (hasTrait(s, 'adventurous') ? 1.2 : 1));
  s.pearls += pearls;
  grow(s, 'adventurous', 2);
  stat(s, 'happiness', 10);
  let found = null;
  for (const [id, chance] of m.loot) {
    if (!s.owned.includes(id) && Math.random() < chance) { found = id; break; }
  }
  if (found) s.owned.push(found);
  const story = m.stories[rand(0, m.stories.length - 1)];
  log(s, `${s.name} returned from ${m.name} with ${pearls} pearls${found ? ` and a ${ITEMS[found].name}` : ''}.`, now);
  let ups = addXP(s, m.xp);
  // Missions usually bring back a discovery from where they went.
  let discovery = null;
  const locId = MISSION_LOC[m.id];
  if (locId && Math.random() < 0.7) {
    const d = discover(s, locId, hasTrait(s, 'adventurous') ? 1.9 : 1.5);
    discovery = d.find.id;
    ups += d.ups;
  }
  trackQuest(s, 'mission', 1, now);
  const report = { id: m.id, t: now, pearls, found, story, xp: m.xp, ups, discovery };
  s.reports.push(report);
  s.reports = s.reports.slice(-5);
  return report;
}

// Take unseen mission reports (shown once, on whichever platform looks first).
export function takeReports(s) {
  const r = s.reports;
  s.reports = [];
  return r;
}

// ---------- minigames ----------
export function canPlay(s, gameId) {
  const g = GAME_LIST.find((x) => x.id === gameId);
  const b = busy(s);
  if (b) return no(b);
  const cost = g ? g.energy : 5;
  if (s.stats.energy < cost) return no(`${s.name} is too tired. Try a nap first!`);
  return ok('');
}

export function payForGame(s, gameId) {
  const r = canPlay(s, gameId);
  if (!r.ok) return r;
  const g = GAME_LIST.find((x) => x.id === gameId);
  stat(s, 'energy', -(g ? g.energy : 5));
  return r;
}

// `best` is a score; `lowerIsBetter` for games scored by moves/time.
export function rewardGame(s, gameId, pearls, best, lowerIsBetter = false) {
  const g = GAME_LIST.find((x) => x.id === gameId);
  const cap = g?.maxPearls ?? 60;
  const favGame = s.persona.fav.game === gameId;
  const boost = (hasTrait(s, 'competitive') ? 1.15 : 1) * (favGame ? 1.1 : 1);
  const p = Math.max(0, Math.min(Math.round(cap * boost), Math.round(pearls * boost))) + (dailyMood(s) === 'playful' ? 3 : 0);
  s.pearls += p;
  stat(s, 'happiness', 10 + (favGame ? 5 : 0));
  grow(s, 'competitive');
  s.plays[gameId] = (s.plays[gameId] || 0) + 1;
  let record = false;
  if (best != null) {
    const prev = s.best[gameId];
    if (prev == null || (lowerIsBetter ? best < prev : best > prev)) {
      s.best[gameId] = best;
      record = prev != null || best > 0;
    }
  }
  const ups = addXP(s, 6);
  log(s, `${s.name} played ${g ? g.name : gameId} and earned ${p} pearls.`);
  trackQuest(s, 'game');
  eventTokens(s, TOKENS_PER_ACTIVITY.game);
  return { pearls: p, record, ups, favGame };
}

// Simple pearl reward used by Discord quick games (no energy cost).
export function grantPearls(s, n, reason) {
  const p = Math.max(0, Math.round(n * (hasTrait(s, 'competitive') ? 1.15 : 1)));
  if (n > 0) grow(s, 'competitive');
  s.pearls += p;
  if (reason) log(s, reason);
  return p;
}

// ---------- the den ----------
export const COZY_MAX = 30;

// Sum of cozy points of placed items (each kind counts at most twice), capped.
export function coziness(s) {
  const seen = {};
  let total = 0;
  for (const p of s.den?.items || []) {
    const it = FURNITURE[p.id];
    if (!it) continue;
    seen[p.id] = (seen[p.id] || 0) + 1;
    if (seen[p.id] <= 2) total += it.cozy;
  }
  return Math.min(COZY_MAX, total);
}

export function inStorage(s, id) {
  const placed = s.den.items.filter((p) => p.id === id).length;
  return Math.max(0, (s.furniture[id] || 0) - placed);
}

export function buyFurniture(s, id) {
  const it = FURNITURE[id];
  if (!it) return no('Unknown item.');
  if (!s.name) return no(busy(s));
  if (s.level < it.level) return no(`Reach level ${it.level} to buy this.`);
  if (s.pearls < it.price) return no('Not enough pearls.');
  s.pearls -= it.price;
  s.furniture[id] = (s.furniture[id] || 0) + 1;
  const placed = placeFurniture(s, id);
  const ups = addXP(s, 4);
  log(s, `Bought a ${it.name} for the den.`);
  trackQuest(s, 'decorate');
  return ok(`🛋️ ${it.name} is in your den! Drag it wherever you like.`, { ups, uid: placed.uid });
}

export function placeFurniture(s, id) {
  if (inStorage(s, id) <= 0) return no('None left in storage.');
  if (s.den.items.length >= 40) return no('Your den is full! Put something away first.');
  const z = ZONES[zoneOf(id)];
  const jitter = (s.den.items.length % 5) * 14 - 28;
  const pos = clampPos(id, 200 + jitter, zoneOf(id) === 'wall' ? 120 : (z.minY + z.maxY) / 2 + jitter / 2);
  const uid = newUid();
  s.den.items.push({ uid, id, ...pos, flip: false });
  return ok('', { uid });
}

export function moveItem(s, uid, x, y) {
  if (uid === 'otter') {
    s.den.otter = clampPos('otter', x, y);
    return ok('');
  }
  const p = s.den.items.find((q) => q.uid === uid);
  if (!p) return no('That item is gone.');
  Object.assign(p, clampPos(p.id, x, y));
  return ok('');
}

export function flipItem(s, uid) {
  const p = s.den.items.find((q) => q.uid === uid);
  if (!p) return no('That item is gone.');
  p.flip = !p.flip;
  return ok('');
}

export function storeItem(s, uid) {
  const i = s.den.items.findIndex((q) => q.uid === uid);
  if (i < 0) return no('That item is gone.');
  const [p] = s.den.items.splice(i, 1);
  return ok(`Put the ${FURNITURE[p.id].name} in storage.`);
}

export function setWallpaper(s, id) {
  const w = WALLPAPERS[id];
  if (!w) return no('Unknown wallpaper.');
  if (!s.wallpapers.includes(id)) {
    if (s.pearls < w.price) return no('Not enough pearls.');
    s.pearls -= w.price;
    s.wallpapers.push(id);
    log(s, `Put up ${w.name} wallpaper.`);
  }
  s.den.wallpaper = id;
  return ok(`🖌️ ${w.name} wallpaper!`);
}

export function setFloor(s, id) {
  const f = FLOORS[id];
  if (!f) return no('Unknown floor.');
  if (!s.floors.includes(id)) {
    if (s.pearls < f.price) return no('Not enough pearls.');
    s.pearls -= f.price;
    s.floors.push(id);
    log(s, `Laid down a ${f.name} floor.`);
  }
  s.den.floor = id;
  return ok(`🪵 ${f.name} floor!`);
}

// ---------- exploring + collection ----------
export const locUnlocked = (s, locId) => s.level >= (LOC[locId]?.level ?? 99);

export function exploreReadyAt(s, locId) {
  return (s.explored[locId] || 0) + EXPLORE_COOLDOWN_MIN * 60000;
}

// Roll a discovery at a place. `luck` > 1 favors rarer finds.
function discover(s, locId, luck = 1) {
  const pool = LOC[locId].finds.map((f) => {
    let w = RARITY[f.rarity].weight;
    if (f.rarity !== 'common') w *= luck;
    if (!s.collection[f.id]) w *= 1.4; // new things are a little easier to stumble on
    return { f, w };
  });
  let r = Math.random() * pool.reduce((a, x) => a + x.w, 0);
  const find = (pool.find((x) => (r -= x.w) < 0) || pool[0]).f;
  const isNew = !s.collection[find.id];
  s.collection[find.id] = (s.collection[find.id] || 0) + 1;
  let ups = 0;
  let setDone = false;
  if (isNew) {
    ups += addXP(s, find.rarity === 'legendary' ? 20 : find.rarity === 'rare' ? 10 : 4);
    log(s, `Discovered a ${find.name} at ${LOC[locId].name}!`);
    const all = LOC[locId].finds.every((f) => s.collection[f.id]);
    if (all && !s.sets.includes(locId)) {
      s.sets.push(locId);
      s.pearls += SET_REWARD.pearls;
      ups += addXP(s, SET_REWARD.xp);
      setDone = true;
      log(s, `Completed the ${LOC[locId].name} collection! 🏅`);
    }
  }
  return { find, isNew, setDone, ups };
}

export function explore(s, locId, now = Date.now()) {
  const loc = LOC[locId];
  if (!loc) return no('Unknown place.');
  const b = busy(s);
  if (b) return no(b);
  if (!locUnlocked(s, locId)) return no(`Reach level ${loc.level} to explore ${loc.name}.`);
  const ready = exploreReadyAt(s, locId);
  if (now < ready) return no(`You just explored here! Try again in ${Math.ceil((ready - now) / 60000)} min, or explore somewhere else.`);
  if (s.stats.energy < EXPLORE_ENERGY) return no(`${s.name} is too tired to explore. Try a nap!`);
  stat(s, 'energy', -EXPLORE_ENERGY);
  stat(s, 'happiness', 3);
  s.explored[locId] = now;
  trackQuest(s, 'explore', 1, now);
  grow(s, 'adventurous');
  const favPlace = s.persona.fav.place === locId;
  if (favPlace) stat(s, 'happiness', 3);
  const loves = favPlace ? `${s.name} loves ${loc.name}! 💕 ` : '';
  const tokens = eventTokens(s, TOKENS_PER_ACTIVITY.explore, now);
  const ev = activeEvent(now);
  if (ev && Math.random() < EVENT_FIND_CHANCE) {
    const f = Math.random() < 0.7 ? ev.finds[0] : ev.finds[1];
    const isNew = !s.collection[f.id];
    s.collection[f.id] = (s.collection[f.id] || 0) + 1;
    const ups = addXP(s, isNew ? 8 : 2);
    if (isNew) log(s, `Found a limited ${f.name} during ${ev.name}!`, now);
    return ok(`${f.icon} ${isNew ? 'Limited discovery!' : 'Found another'} ${s.name} found a ${f.name} (${ev.name} only)!`, { find: { ...f, event: ev.id }, isNew, ups, tokens, fx: [f.icon, ev.icon] });
  }
  if (Math.random() < 0.18) {
    const p = rand(4, 12);
    s.pearls += p;
    const ups = addXP(s, 2);
    return ok(`${loves}${s.name} poked around ${loc.name} and found ${p} loose pearls.`, { pearls: p, ups, find: null });
  }
  const d = discover(s, locId, (hasTrait(s, 'adventurous') ? 1.3 : 1) * (favPlace ? 1.2 : 1) * exploreLuck(locId, now) * (dailyMood(s, now) === 'curious' ? 1.2 : 1));
  const r = RARITY[d.find.rarity];
  const msg = loves + (d.isNew
    ? `${d.find.icon} New discovery! ${s.name} found a ${d.find.name} (${r.name})!`
    : `${d.find.icon} ${s.name} found another ${d.find.name}.`);
  return ok(msg + (d.setDone ? ` 🏅 ${loc.name} collection complete! +${SET_REWARD.pearls} pearls` : ''), { find: d.find, isNew: d.isNew, setDone: d.setDone, ups: d.ups, fx: [d.find.icon, '✨'] });
}

export function collectionCount(s) {
  return Object.keys(s.collection || {}).filter((id) => FINDS[id]).length;
}

// ---------- seasonal events ----------
// Per-event progress: s.events[id] = { tokens, day, quests: { kind: { p, claimed } }, bought: [] }
function eventState(s, ev, now = Date.now()) {
  const es = s.events[ev.id] || (s.events[ev.id] = { tokens: 0, day: null, quests: {}, bought: [] });
  const day = dayKey(now);
  if (es.day !== day) { es.day = day; es.quests = {}; }
  return es;
}

export function eventStatus(s, now = Date.now()) {
  const ev = activeEvent(now);
  if (!ev) return null;
  const es = eventState(s, ev, now);
  const quests = questsFor(ev.id, es.day).map((q) => ({ ...q, p: Math.min(q.target, es.quests[q.kind]?.p || 0), claimed: !!es.quests[q.kind]?.claimed }));
  return { event: ev, tokens: es.tokens, quests, bought: es.bought };
}

export function trackQuest(s, kind, n = 1, now = Date.now()) {
  const ev = activeEvent(now);
  if (!ev || !s.name) return;
  const es = eventState(s, ev, now);
  const q = questsFor(ev.id, es.day).find((x) => x.kind === kind);
  if (!q) return;
  const cur = es.quests[kind] || (es.quests[kind] = { p: 0, claimed: false });
  cur.p = Math.min(q.target, cur.p + n);
}

function eventTokens(s, n, now = Date.now()) {
  const ev = activeEvent(now);
  if (!ev || !s.name || !n) return 0;
  eventState(s, ev, now).tokens += n;
  return n;
}

export function claimQuest(s, kind, now = Date.now()) {
  const st = eventStatus(s, now);
  if (!st) return no('There is no event right now.');
  const q = st.quests.find((x) => x.kind === kind);
  if (!q) return no('That quest is not on today\'s list.');
  if (q.claimed) return no('Already claimed!');
  if (q.p < q.target) return no('Not finished yet!');
  const es = s.events[st.event.id];
  es.quests[kind].claimed = true;
  es.tokens += q.reward;
  const ups = addXP(s, 5);
  log(s, `Finished a ${st.event.name} quest: ${q.text}.`, now);
  return ok(`${st.event.token.icon} +${q.reward} ${st.event.token.name}!`, { ups, fx: [st.event.token.icon, '✨'] });
}

export function buyEventItem(s, id, now = Date.now()) {
  const st = eventStatus(s, now);
  if (!st) return no('There is no event right now.');
  const entry = st.event.shop.find((x) => x.id === id);
  if (!entry) return no('That is not in the event shop.');
  const es = s.events[st.event.id];
  const name = entry.kind === 'item' ? ITEMS[id].name : FURNITURE[id].name;
  if (entry.kind === 'item' && s.owned.includes(id)) return no(`You already have the ${name}.`);
  if (es.tokens < entry.tokens) return no(`You need ${entry.tokens} ${st.event.token.name}.`);
  es.tokens -= entry.tokens;
  es.bought.push(id);
  if (entry.kind === 'item') {
    s.owned.push(id);
    s.equipped[ITEMS[id].slot] = id;
  } else {
    s.furniture[id] = (s.furniture[id] || 0) + 1;
    placeFurniture(s, id);
    trackQuest(s, 'decorate', 1, now);
  }
  log(s, `Got the limited ${name} from ${st.event.name}! ✨`, now);
  return ok(`✨ ${name} is yours to keep forever!`, { fx: [st.event.icon, '✨'] });
}

// ---------- personality ----------
export { TRAITS, traitOf, hasTrait };

// Add points toward a trait (each nudges your otter's personality).
export function grow(s, trait, n = 1) {
  if (!s.name || !s.persona || !TRAIT_IDS.includes(trait)) return;
  const before = traitOf(s).trait;
  s.persona.pts[trait] = (s.persona.pts[trait] || 0) + n;
  const after = traitOf(s).trait;
  if (after && after !== before) log(s, `${s.name} is becoming quite ${TRAITS[after].name.toLowerCase()}! ${TRAITS[after].icon}`);
}

// Everything the UI needs to describe an otter's personality.
export function personaInfo(s) {
  const t = traitOf(s);
  const fav = s.persona?.fav || favoritesFor(s.created);
  return {
    trait: t.trait ? { id: t.trait, ...TRAITS[t.trait] } : null,
    also: t.also ? { id: t.also, ...TRAITS[t.also] } : null,
    ranked: t.ranked,
    fav: {
      snack: SNACKS.find((x) => x.id === fav.snack),
      place: LOC[fav.place],
      game: GAME_LIST.find((x) => x.id === fav.game),
    },
  };
}

// ---------- achievements ----------
export { ACHIEVEMENTS, ACH };

export function count(s, key, n = 1) {
  if (!s.counters) s.counters = { care: 0, night: 0, friends: 0, visited: [] };
  s.counters[key] = (s.counters[key] || 0) + n;
}

export function achProgress(s, a) {
  if (a.id === 'cozycorner') return [Math.min(coziness(s), 20), 20];
  const [have, need] = a.progress(s);
  return [Math.min(have, need), need];
}

// Unlock anything newly earned. Returns the new achievements (also queued in s.newAch for display).
export function checkAchievements(s, now = Date.now()) {
  if (!s.name) return [];
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (s.achievements[a.id]) continue;
    const [have, need] = achProgress(s, a);
    if (have >= need) {
      s.achievements[a.id] = now;
      s.pearls += a.reward;
      addXP(s, 10);
      log(s, `🏅 Achievement unlocked: ${a.name}! +${a.reward} pearls`, now);
      fresh.push(a.id);
    }
  }
  if (fresh.length) s.newAch = [...(s.newAch || []), ...fresh].slice(-10);
  return fresh;
}

export function takeNewAchievements(s) {
  const r = (s.newAch || []).filter((id) => ACH[id]);
  s.newAch = [];
  return r;
}
