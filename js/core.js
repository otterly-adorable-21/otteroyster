// Shared game rules. Pure logic with no DOM access, so both the website and
// the Discord bot (server/) use exactly the same rules on the same save data.
import { ITEMS, SNACKS, MISSIONS, GAME_LIST } from './data.js';
import { FURNITURE, WALLPAPERS, FLOORS, STARTER_DEN, ZONES, zoneOf, clampPos, itemSize, isSmall, isSurface, surfaceTopY } from './den-data.js';
import { LOC, FINDS, RARITY, MISSION_LOC, EXPLORE_ENERGY, EXPLORE_COOLDOWN_MIN, SET_REWARD } from './world.js';
import { activeEvent, questsFor, EVENT, EVENT_FIND_CHANCE, TOKENS_PER_ACTIVITY } from './events.js';
import { TRAITS, TRAIT_IDS, blankPersona, favoritesFor, traitOf, hasTrait } from './personality.js';
import { dailyMood, exploreLuck, weatherAt } from './ambience.js';
import { COMPANIONS, BOND_PERK, BOND_MAX, PLAY_COOLDOWN, TREAT_PRICE, TREAT_COOLDOWN, BOND_DECAY_PER_DAY, bondLevel, COMP_COLORS, COMP_PATTERNS, COMP_ACCS, COMP_TRAIT_IDS } from './companions.js';
import { CROPS, PLOT_LEVELS, FRIEND_WATER_BONUS, plotStage } from './garden.js';
import { DOOR_ITEMS, DOOR_COZY, defaultDoor } from './door.js';
import { NPCS, NPC_PAGE_AT, NPC_MAX, MYSTERIES, MYSTERY } from './lore.js';
import { happeningsAt, happeningLuck, npcWhere, merchantStock, MERCHANT_DISCOUNT, awayStories } from './worldsim.js';
import { MASTERIES, MASTERY, TIERS, LEGACY_LEVEL, legacyStars, rankOf } from './legacy.js';
import { timeOfDay, tideAt } from './ambience.js';
import { SET } from './sets.js';
import { TRINKETS, TRINKET_CHANCE, trinketFor, BOOKS, BOOK_IDS, BOOK_CHANCE, FISH, fishFor, FISHING_COOLDOWN } from './treasures.js';
import { ACHIEVEMENTS, ACH } from './achievements.js';
import { STAGES, stageOf, stageAtLeast, TRICKS, STORIES, WISDOM, mdOf, isBirthday } from './growth.js';

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
    equipped: { hat: null, eyes: null, neck: null, back: null, body: null, feet: null, acc: null },
    sleeping: false,
    mission: null,
    reports: [],
    lastDaily: null,
    den: starterDen(),
    furniture: Object.fromEntries(STARTER_DEN.map((p) => [p.id, 1])),
    wallpapers: ['moss'],
    floors: ['earth'],
    collection: {},
    birthday: mdOf(now),
    birthdaySet: false,
    birthdaysClaimed: [],
    tricks: [],
    growthItems: [],
    memories: [],
    achievements: {},
    counters: { care: 0, night: 0, friends: 0, visited: [] },
    newAch: [],
    events: {},
    persona: blankPersona(now),
    companions: { owned: {}, active: null, accs: [] },
    garden: { plots: PLOT_LEVELS.map(() => null) },
    rooms: [],
    room: 0,
    pantry: {},
    door: defaultDoor(),
    doorItems: ['paint-moss'],
    species: 'sea',
    speciesSet: false,
    lore: { npc: {}, mysteries: {}, solved: [], pages: [] },
    legacy: { claimed: {}, title: null },
    titles: [],
    lastSeen: now,
    setsClaimed: [],
    trinkets: {},
    books: [],
    aquarium: { fish: {}, lastFish: 0 },
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
  s.rooms = (Array.isArray(saved.rooms) ? saved.rooms : []).slice(0, ROOM_COSTS.length).map((r, k) => ({
    id: r.id || `room${k}`, name: String(r.name || ROOM_NAMES[k]).slice(0, 18), wallpaper: r.wallpaper || 'moss', floor: r.floor || 'earth',
    items: Array.isArray(r.items) ? r.items.filter((p) => FURNITURE[p.id]) : [], otter: r.otter || { x: 200, y: 286 },
  }));
  s.room = Number.isInteger(saved.room) && saved.room >= 0 && saved.room <= s.rooms.length ? saved.room : 0;
  s.collection = { ...(saved.collection || {}) };
  s.persona = {
    pts: { ...blankPersona(s.created).pts, ...(saved.persona?.pts || {}) },
    fav: favoritesFor(s.created), // always derived from birth time, so every device agrees
  };
  s.events = { ...(saved.events || {}) };
  s.achievements = { ...(saved.achievements || {}) };
  s.birthday = /^\d\d-\d\d$/.test(saved.birthday || '') ? saved.birthday : mdOf(s.created);
  s.birthdaysClaimed = Array.isArray(saved.birthdaysClaimed) ? saved.birthdaysClaimed : [];
  s.tricks = Array.isArray(saved.tricks) ? saved.tricks : [];
  s.growthItems = Array.isArray(saved.growthItems) ? saved.growthItems : [];
  s.memories = Array.isArray(saved.memories) ? saved.memories : [];
  s.counters = { care: 0, night: 0, friends: 0, visited: [], ...(saved.counters || {}) };
  if (!Array.isArray(s.counters.visited)) s.counters.visited = [];
  s.newAch = Array.isArray(saved.newAch) ? saved.newAch : [];
  s.explored = { ...(saved.explored || {}) };
  s.sets = Array.isArray(saved.sets) ? saved.sets : [];
  s.floors = Array.isArray(saved.floors) ? saved.floors : ['earth'];
  const co = saved.companions || {};
  s.companions = { owned: Object.fromEntries(Object.entries(co.owned || {}).filter(([id]) => COMPANIONS[id])), active: COMPANIONS[co.active] ? co.active : null, accs: Array.isArray(co.accs) ? co.accs.filter((a) => COMP_ACCS[a]) : [] };
  for (const [id, c] of Object.entries(s.companions.owned)) {
    if (!c.trait) c.trait = COMP_TRAIT_IDS[[...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % COMP_TRAIT_IDS.length];
    if (!COMP_COLORS[c.color]) c.color = 'natural';
    if (!COMP_PATTERNS[c.pattern]) c.pattern = 'none';
    if (c.acc && !COMP_ACCS[c.acc]) c.acc = null;
  }
  if (s.companions.active && !s.companions.owned[s.companions.active]) s.companions.active = null;
  const plots = Array.isArray(saved.garden?.plots) ? saved.garden.plots : [];
  s.garden = { plots: PLOT_LEVELS.map((_, k) => (plots[k] && CROPS[plots[k].crop] ? plots[k] : null)) };
  s.pantry = Object.fromEntries(Object.entries(saved.pantry || {}).filter(([id, n]) => SNACKS.some((x) => x.id === id) && n > 0));
  s.door = { ...defaultDoor(), ...(saved.door || {}) };
  for (const k of Object.keys(s.door)) if (s.door[k] && !DOOR_ITEMS[s.door[k]]) s.door[k] = k === 'paint' ? 'paint-moss' : null;
  s.doorItems = [...new Set(['paint-moss', ...(Array.isArray(saved.doorItems) ? saved.doorItems.filter((id) => DOOR_ITEMS[id]) : [])])];
  s.species = saved.species === 'river' ? 'river' : 'sea';
  s.speciesSet = !!saved.speciesSet;
  const lo = saved.lore || {};
  s.lore = {
    npc: Object.fromEntries(Object.entries(lo.npc || {}).filter(([id]) => NPCS[id])),
    mysteries: Object.fromEntries(Object.entries(lo.mysteries || {}).filter(([id]) => MYSTERY[id])),
    solved: Array.isArray(lo.solved) ? lo.solved.filter((id) => MYSTERY[id]) : [],
    pages: Array.isArray(lo.pages) ? [...new Set(lo.pages)] : [],
  };
  s.legacy = { claimed: Object.fromEntries(Object.entries(saved.legacy?.claimed || {}).filter(([id]) => MASTERY[id])), title: saved.legacy?.title || null };
  s.titles = Array.isArray(saved.titles) ? saved.titles : [];
  s.lastSeen = saved.lastSeen || s.lastTick || Date.now();
  s.setsClaimed = Array.isArray(saved.setsClaimed) ? saved.setsClaimed.filter((id) => SET[id]) : [];
  s.trinkets = Object.fromEntries(Object.entries(saved.trinkets || {}).filter(([id, n]) => TRINKETS[id] && n > 0));
  s.books = Array.isArray(saved.books) ? saved.books.filter((id) => BOOKS[id]) : [];
  s.aquarium = { fish: Object.fromEntries(Object.entries(saved.aquarium?.fish || {}).filter(([id]) => FISH[id])), lastFish: saved.aquarium?.lastFish || 0 };
  for (const k of ['body', 'feet', 'acc']) if (s.equipped[k] === undefined) s.equipped[k] = null;
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
export const RATES = { hunger: -0.22, happiness: -0.15, energy: -0.08, clean: -0.09 };

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
      stat(s, 'energy', 3 * (1 + coziness(s) / 60) * (hasTrait(s, 'sleepy') ? 1.3 : 1) * (dailyMood(s, now) === 'dreamy' ? 1.25 : 1) * (perk(s, 'octopus') ? 1.2 : 1) * mins);
      stat(s, 'hunger', RATES.hunger * 0.5 * mins);
      stat(s, 'clean', RATES.clean * 0.5 * mins);
      if (s.stats.energy >= 100) {
        s.sleeping = false;
        log(s, `${s.name} woke up refreshed.`, now);
        events.push({ type: 'woke' });
      }
    } else {
      const grumpy = s.stats.hunger < 25 || s.stats.clean < 25 ? 2 : 1;
      stat(s, 'hunger', RATES.hunger * (perk(s, 'axolotl') ? 0.85 : 1) * mins);
      stat(s, 'energy', RATES.energy * mins);
      stat(s, 'clean', RATES.clean * (hasTrait(s, 'tidy') ? 0.7 : 1) * mins);
      stat(s, 'happiness', RATES.happiness * grumpy * (1 - coziness(s) / 60) * (dailyMood(s, now) === 'cheerful' ? 0.75 : 1) * (perk(s, 'duckling') ? 0.8 : 1) * mins);
    }
    // Companions slowly miss you after a day without play.
    for (const c of Object.values(s.companions?.owned || {})) {
      if (now - (c.lastPlay || 0) > 86400000) c.bond = Math.max(10, c.bond - (BOND_DECAY_PER_DAY * mins) / 1440);
    }
    // Rain waters the garden.
    if (s.garden?.plots.some((p) => p && !p.wateredAt) && weatherAt(now) === 'rainy') {
      for (const p of s.garden.plots) if (p && !p.wateredAt) waterPlot(s, p, now);
      events.push({ type: 'rain-watered' });
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
  const fromPantry = (s.pantry?.[id] || 0) > 0;
  if (!fromPantry && s.pearls < snack.price) return no('Not enough pearls.');
  if (fromPantry) { s.pantry[id] -= 1; if (!s.pantry[id]) delete s.pantry[id]; } else s.pearls -= snack.price;
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
  stat(s, 'happiness', (8 + (dailyMood(s) === 'cuddly' ? 6 : 0)) * (perk(s, 'butterfly') ? 2 : 1));
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
  stat(s, 'clean', perk(s, 'seal') ? 56 : 45);
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
  const p = rand(15, 30) + (perk(s, 'snail') ? 10 : 0);
  s.pearls += p;
  log(s, `Collected a daily gift of ${p} pearls.`, now);
  return ok(`🎁 Daily gift: +${p} pearls!`, { pearls: p, fx: ['🎁', '✨'] });
}

// ---------- wardrobe ----------
export function buy(s, id) {
  const it = ITEMS[id];
  if (!it || it.price == null) return no('That item is not for sale.');
  if (s.owned.includes(id)) return no(`You already own the ${it.name}.`);
  if (it.birthday && !isBirthday(s)) return no(`The ${it.name} is only sold on ${s.name || 'your otter'}'s birthday. 🎂`);
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
  s.mission = { id, start: now, endsAt: now + m.minutes * 60000 * (perk(s, 'turtle') ? 0.85 : 1) };
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
  count(s, 'missions');
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
  memory(s, m.icon, `${s.name} ${story}`, now);
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
  if (!g) return no('That game doesn\'t exist.');
  if (s.stats.energy < g.energy) return no(`${s.name} is too tired. Try a nap first!`);
  return ok('');
}

export function payForGame(s, gameId) {
  const r = canPlay(s, gameId);
  if (!r.ok) return r;
  stat(s, 'energy', -GAME_LIST.find((x) => x.id === gameId).energy);
  return r;
}

// `best` is a score; `lowerIsBetter` for games scored by moves/time.
export function rewardGame(s, gameId, pearls, best, lowerIsBetter = false) {
  const g = GAME_LIST.find((x) => x.id === gameId);
  const cap = g?.maxPearls ?? 60;
  const favGame = s.persona.fav.game === gameId;
  const boost = (hasTrait(s, 'competitive') ? 1.15 : 1) * (favGame ? 1.1 : 1) * (perk(s, 'starfish') ? 1.1 : 1);
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
  for (const p of allRoomItems(s)) {
    const it = FURNITURE[p.id];
    if (!it) continue;
    seen[p.id] = (seen[p.id] || 0) + 1;
    if (seen[p.id] <= 2) total += it.cozy;
  }
  total += Object.entries(s.door || {}).filter(([k, v]) => k !== 'paint' && v).length * DOOR_COZY;
  if (perk(s, 'firefly')) total += 4;
  return Math.min(COZY_MAX, total);
}

// ---------- rooms ----------
// s.den is the main den (what visitors and Discord see); s.rooms holds extra
// rooms; s.room is the one being viewed (0 = main den).
export const ROOM_COSTS = [{ pearls: 250, level: 3 }, { pearls: 500, level: 6 }, { pearls: 900, level: 10 }];
export const ROOM_NAMES = ['Bedroom', 'Playroom', 'Library'];
export const room = (s, k = s.room || 0) => (k && s.rooms?.[k - 1]) || s.den;
export const allRoomItems = (s) => [...(s.den?.items || []), ...(s.rooms || []).flatMap((r) => r.items || [])];

export function addRoom(s) {
  const n = (s.rooms || []).length;
  const c = ROOM_COSTS[n];
  if (!c) return no('Your house is as big as it gets! 🏡');
  if (s.level < c.level) return no(`Reach level ${c.level} to add another room.`);
  if (s.pearls < c.pearls) return no('Not enough pearls.');
  s.pearls -= c.pearls;
  s.rooms.push({ id: newUid(), name: ROOM_NAMES[n], wallpaper: 'moss', floor: 'earth', items: [], otter: { x: 200, y: 286 } });
  s.room = s.rooms.length;
  log(s, `Dug out a new room: the ${ROOM_NAMES[n]}!`);
  memory(s, '🏡', `${s.name}'s den grew a new room: the ${ROOM_NAMES[n]}.`);
  return ok(`🏡 A brand new ${ROOM_NAMES[n]}! Move furniture in from storage, or buy something new.`, { fx: ['🏡', '✨'] });
}
export function setRoom(s, k) {
  if (k < 0 || k > (s.rooms || []).length) return no('No such room.');
  s.room = k;
  return ok('');
}
export function renameRoom(s, k, name) {
  const r = k ? s.rooms[k - 1] : null;
  if (!r) return no('The main den keeps its name.');
  const n = String(name || '').replace(/[<>]/g, '').trim().slice(0, 18);
  if (!n) return no('Pick a name.');
  r.name = n;
  return ok(`🏷️ Renamed to ${n}.`);
}

export function inStorage(s, id) {
  const placed = allRoomItems(s).filter((p) => p.id === id).length;
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
  const den = room(s);
  if (den.items.length >= 40) return no('This room is full! Put something away first.');
  const z = ZONES[zoneOf(id)];
  const jitter = (den.items.length % 5) * 14 - 28;
  const pos = clampPos(id, 200 + jitter, zoneOf(id) === 'wall' ? 120 : (z.minY + z.maxY) / 2 + jitter / 2);
  const uid = newUid();
  den.items.push({ uid, id, ...pos, flip: false });
  return ok('', { uid });
}

export function moveItem(s, uid, x, y) {
  if (uid === 'otter') {
    room(s).otter = clampPos('otter', x, y);
    return ok('');
  }
  const p = room(s).items.find((q) => q.uid === uid);
  if (!p) return no('That item is gone.');
  if (isSmall(p.id)) {
    // Small things can be lifted anywhere while dragging; dropItem decides
    // whether they land on a tabletop or the floor.
    const { w } = itemSize(p.id);
    p.x = Math.round(Math.max(w / 2 - 10, Math.min(400 - w / 2 + 10, Number(x) || 0)));
    p.y = Math.round(Math.max(60, Math.min(ZONES.floor.maxY, Number(y) || 0)));
    p.on = null;
    return ok('');
  }
  const bx = p.x;
  const by = p.y;
  Object.assign(p, clampPos(p.id, x, y));
  // Whatever sits on a table moves with it.
  if (isSurface(p.id)) for (const q of room(s).items) if (q.on === uid) { q.x += p.x - bx; q.y += p.y - by; }
  return ok('');
}

// Drop a dragged item: small things snap onto a tabletop they're over, or
// settle on the floor.
export function dropItem(s, uid) {
  const den = room(s);
  const p = den.items.find((q) => q.uid === uid);
  if (!p || !isSmall(p.id)) return ok('');
  let best = null;
  for (const t of den.items) {
    if (t === p || !isSurface(t.id)) continue;
    const half = itemSize(t.id).w / 2;
    const top = surfaceTopY(t);
    const d = Math.abs(p.y - top);
    if (p.x >= t.x - half + 2 && p.x <= t.x + half - 2 && d < 26 && (!best || d < best.d)) best = { t, top, d };
  }
  if (best) { p.y = Math.round(best.top); p.on = best.t.uid; return ok('', { on: best.t.id }); }
  p.on = null;
  Object.assign(p, clampPos(p.id, p.x, p.y));
  return ok('');
}

export function flipItem(s, uid) {
  const p = room(s).items.find((q) => q.uid === uid);
  if (!p) return no('That item is gone.');
  p.flip = !p.flip;
  return ok('');
}

export function storeItem(s, uid) {
  const i = room(s).items.findIndex((q) => q.uid === uid);
  if (i < 0) return no('That item is gone.');
  const [p] = room(s).items.splice(i, 1);
  // Anything that was on it drops to the floor.
  for (const q of room(s).items) if (q.on === uid) { q.on = null; Object.assign(q, clampPos(q.id, q.x, q.y + 30)); }
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
  room(s).wallpaper = id;
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
  room(s).floor = id;
  return ok(`🪵 ${f.name} floor!`);
}

// The adoption day itself isn't a birthday: celebrate from the first anniversary,
// or from a birthday the player picked.
export function celebratesBirthday(s, now = Date.now()) {
  return isBirthday(s, now) && (s.birthdaySet || now - (s.created || now) > 300 * 86400000);
}

// ---------- exploring + collection ----------
export const locUnlocked = (s, locId) => s.level >= (LOC[locId]?.level ?? 99);

export function exploreReadyAt(s, locId) {
  return (s.explored[locId] || 0) + EXPLORE_COOLDOWN_MIN * 60000 * (perk(s, 'puffin') ? 0.8 : 1);
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
    if (find.rarity === 'rare' || find.rarity === 'legendary') memory(s, find.icon, `${s.name} discovered a ${find.rarity} ${find.name} at ${LOC[locId].name}!`);
    const all = LOC[locId].finds.every((f) => s.collection[f.id]);
    if (all && !s.sets.includes(locId)) {
      s.sets.push(locId);
      s.pearls += SET_REWARD.pearls;
      ups += addXP(s, SET_REWARD.xp);
      setDone = true;
      log(s, `Completed the ${LOC[locId].name} collection! 🏅`);
      memory(s, '🏅', `${s.name} completed the ${LOC[locId].name} collection!`);
    }
  }
  return { find, isNew, setDone, ups };
}

// Exploring can also turn up a trinket or a storybook, on top of the main find.
export function explore(s, locId, now = Date.now()) {
  const r = exploreMain(s, locId, now);
  if (!r.ok) return r;
  const extra = [];
  if (Math.random() < TRINKET_CHANCE * (perk(s, 'ghostcrab') ? 1.5 : 1)) {
    const id = trinketFor(locId, Math.random());
    s.trinkets[id] = (s.trinkets[id] || 0) + 1;
    r.trinket = id;
    extra.push(`${TRINKETS[id].icon} Also found: ${TRINKETS[id].name}!`);
  }
  const unread = BOOK_IDS.filter((id) => !s.books.includes(id));
  if (unread.length && Math.random() < BOOK_CHANCE) {
    const id = unread[Math.floor(Math.random() * unread.length)];
    s.books.push(id);
    r.book = id;
    extra.push(`${BOOKS[id].icon} A soggy old book: “${BOOKS[id].title}”. It's on your bookshelf.`);
  }
  // Rare: the glowing Anglerfish Lamp, only ever found in the Moonlit Trench.
  if (locId === 'trench' && !s.furniture.anglerlamp && Math.random() < 0.04) {
    s.furniture.anglerlamp = 1;
    r.lamp = true;
    extra.push('🎣 Something glows in the dark… you found a rare Anglerfish Lamp! It\'s in your den storage.');
    memory(s, '🎣', `${s.name} found a glowing Anglerfish Lamp in the Moonlit Trench.`, now);
  }
  if (extra.length) r.msg = `${r.msg} ${extra.join(' ')}`;
  return r;
}

function exploreMain(s, locId, now = Date.now()) {
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
  count(s, 'explores');
  addPage(s, `place:${locId}`);
  const hap = happeningsAt(now).find((h) => h.place === locId);
  if (hap?.happy) stat(s, 'happiness', hap.happy);
  if (hap?.pearls) s.pearls += hap.pearls;
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
    const p = Math.round(rand(4, 12) * (perk(s, 'crab') ? 1.25 : 1));
    s.pearls += p;
    const ups = addXP(s, 2);
    return ok(`${loves}${s.name} poked around ${loc.name} and found ${p} loose pearls.`, { pearls: p, ups, find: null });
  }
  const d = discover(s, locId, (hasTrait(s, 'adventurous') ? 1.3 : 1) * (favPlace ? 1.2 : 1) * exploreLuck(locId, now) * (dailyMood(s, now) === 'curious' ? 1.2 : 1) * (perk(s, 'frog') ? 1.15 : 1) * happeningLuck(locId, now) * (homeWaters(s, locId) ? 1.15 : 1)
    * (perk(s, 'jellyfish') && locId === 'trench' ? 1.2 : 1) * (perk(s, 'moth') && timeOfDay(new Date(now)) === 'night' ? 1.2 : 1));
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
  checkGrowth(s, now);
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (s.achievements[a.id]) continue;
    const [have, need] = achProgress(s, a);
    if (have >= need) {
      s.achievements[a.id] = now;
      s.pearls += a.reward;
      addXP(s, 10);
      log(s, `🏅 Achievement unlocked: ${a.name}! +${a.reward} pearls`, now);
      memory(s, a.icon, `Earned the “${a.name}” badge: ${a.desc.toLowerCase()}.`, now);
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

// ---------- growing up ----------
export { STAGES, stageOf, TRICKS, isBirthday };

// Moments worth keeping forever (the adventure book).
export function memory(s, icon, text, now = Date.now()) {
  if (!s.memories) s.memories = [];
  s.memories.push({ t: now, icon, text });
  if (s.memories.length > 300) s.memories = s.memories.slice(-300);
}

// Give stage items as the otter grows, and throw the birthday party.
export function checkGrowth(s, now = Date.now()) {
  if (!s.name) return;
  for (const st of STAGES) {
    if (s.level >= st.level && !s.growthItems.includes(st.id)) {
      s.growthItems.push(st.id);
      if (ITEMS[st.item] && !s.owned.includes(st.item)) s.owned.push(st.item);
      if (st.id !== 'pup') {
        log(s, `${st.icon} ${s.name} grew into a ${st.name}! New: ${st.unlock.toLowerCase()}.`, now);
        memory(s, st.icon, `${s.name} grew into a ${st.name}!`, now);
      }
    }
  }
  const year = new Date(now).getUTCFullYear();
  // The adoption day itself isn't a party: celebrate from the first anniversary,
  // or from a birthday the player picked.
  if (celebratesBirthday(s, now) && !s.birthdaysClaimed.includes(year)) {
    s.birthdaysClaimed.push(year);
    s.pearls += 100;
    stat(s, 'happiness', 30);
    if (!s.owned.includes('birthdayhat')) s.owned.push('birthdayhat');
    const age = s.birthdaysClaimed.length;
    log(s, `🎂 Happy birthday, ${s.name}! +100 pearls and a party hat.`, now);
    memory(s, '🎂', `${s.name}'s ${age === 1 ? 'first' : age === 2 ? 'second' : age === 3 ? 'third' : `${age}th`} birthday party! 🎉`, now);
  }
}

export function setBirthday(s, md) {
  const m = /^(\d\d)-(\d\d)$/.exec(md || '');
  const d = m && new Date(Date.UTC(2024, Number(m[1]) - 1, Number(m[2]))); // leap year, so Feb 29 is allowed
  if (!d || d.getUTCMonth() + 1 !== Number(m[1]) || d.getUTCDate() !== Number(m[2])) return no('Pick a real date.');
  if (s.birthdaySet) return no('The birthday can only be changed once.');
  s.birthday = md;
  s.birthdaySet = true;
  return ok(`🎂 Birthday saved!`);
}

export function tellStory(s, now = Date.now()) {
  const b = busy(s);
  if (b) return no(b);
  if (!stageAtLeast(s.level, 'young')) return no(`Story time unlocks when ${s.name} is a Young Otter (level 5).`);
  if (now - (s.lastStory || 0) < 2 * 3600000) return no(`${s.name} is still thinking about the last story. Try again later!`);
  s.lastStory = now;
  stat(s, 'happiness', 8);
  stat(s, 'energy', 4);
  const fav = s.persona?.fav || {};
  const story = STORIES[rand(0, STORIES.length - 1)](s.name, { place: LOC[fav.place]?.name || 'the pond', snack: SNACKS.find((x) => x.id === fav.snack)?.name.toLowerCase() || 'snacks' });
  const ups = addXP(s, 3);
  return ok(`📖 ${story}`, { ups, fx: ['📖', '💤', '✨'] });
}

export function teachTrick(s, now = Date.now()) {
  const b = busy(s);
  if (b) return no(b);
  if (!stageAtLeast(s.level, 'grown')) return no(`Tricks unlock when ${s.name} is a Grown Otter (level 10).`);
  const next = TRICKS.find((t) => !s.tricks.includes(t.id));
  if (!next) return no(`${s.name} knows every trick already. Show them off!`);
  if (s.lastLesson === dayKey(now)) return no(`${s.name} is practicing today's trick. One lesson a day!`);
  s.lastLesson = dayKey(now);
  s.tricks.push(next.id);
  stat(s, 'energy', -5);
  const ups = addXP(s, 8);
  log(s, `${next.icon} ${s.name} learned a new trick: ${next.name}!`, now);
  memory(s, next.icon, `${s.name} learned to ${next.name.toLowerCase()}!`, now);
  return ok(`${next.icon} ${s.name} learned to ${next.name.toLowerCase()}!`, { ups, trick: next.id, fx: [next.icon, '⭐'] });
}

export function performTrick(s, id, now = Date.now()) {
  const b = busy(s);
  if (b) return no(b);
  const t = TRICKS.find((x) => x.id === id);
  if (!t || !s.tricks.includes(id)) return no("They haven't learned that one yet.");
  if (now - (s.lastTrick || 0) > 10 * 60000) stat(s, 'happiness', 4);
  s.lastTrick = now;
  return ok(`${t.icon} Ta-da!`, { trick: id });
}

export function shareWisdom(s, now = Date.now()) {
  const b = busy(s);
  if (b) return no(b);
  if (!stageAtLeast(s.level, 'wise')) return no(`Wisdom comes with age: unlocks at level 20.`);
  if (s.lastWisdom === dayKey(now)) return no(`${s.name} already shared today's wisdom.`);
  s.lastWisdom = dayKey(now);
  stat(s, 'happiness', 10);
  return ok(`🦉 ${s.name} says: “${WISDOM[rand(0, WISDOM.length - 1)]}”`);
}

// ---------- companions ----------
export function perk(s, id) {
  const c = s.companions?.owned?.[id];
  return s.companions?.active === id && !!c && c.bond >= BOND_PERK;
}
export const activeCompanion = (s) => (s.companions?.active ? { id: s.companions.active, ...COMPANIONS[s.companions.active], ...s.companions.owned[s.companions.active] } : null);

export function adoptCompanion(s, id, now = Date.now()) {
  const c = COMPANIONS[id];
  if (!c) return no('Unknown companion.');
  if (s.companions.owned[id]) return no(`You already have a ${c.name}.`);
  if (s.level < c.level) return no(`Reach level ${c.level} to adopt a ${c.name}.`);
  if (s.pearls < c.price) return no('Not enough pearls.');
  s.pearls -= c.price;
  s.companions.owned[id] = { name: c.name, bond: 10, lastPlay: now, since: now, trait: COMP_TRAIT_IDS[Math.floor(Math.random() * COMP_TRAIT_IDS.length)], color: 'natural', pattern: 'none', acc: null };
  s.companions.active = id;
  log(s, `${s.name} made a new friend: a ${c.name}!`, now);
  memory(s, c.icon, `${s.name} adopted a ${c.name} companion.`, now);
  count(s, 'companions');
  return ok(`${c.icon} Welcome home, little ${c.name}! Play together to bond.`, { fx: [c.icon, '💕', '✨'] });
}

export function setCompanion(s, id) {
  if (id && !s.companions.owned[id]) return no('You don\'t have that companion.');
  s.companions.active = id || null;
  return ok(id ? `${COMPANIONS[id].icon} ${s.companions.owned[id].name} is tagging along.` : 'Your companion is resting at home.');
}

export function renameCompanion(s, id, name) {
  const c = s.companions.owned[id];
  if (!c) return no('You don\'t have that companion.');
  const n = String(name || '').replace(/[<>]/g, '').trim().slice(0, 16);
  if (!n) return no('Pick a name.');
  c.name = n;
  return ok(`${COMPANIONS[id].icon} Say hi to ${n}!`);
}

export function playCompanion(s, now = Date.now()) {
  const id = s.companions.active;
  const c = id && s.companions.owned[id];
  if (!c) return no('Pick a companion to play with first.');
  const wait = (c.lastPlay || 0) + PLAY_COOLDOWN - now;
  if (wait > 0 && c.bond > 10) return no(`${c.name} is still tired from playing. Try again in ${Math.ceil(wait / 60000)} min.`);
  const before = bondLevel(c.bond);
  c.bond = Math.min(BOND_MAX, c.bond + 10);
  c.lastPlay = now;
  stat(s, 'happiness', 6);
  grow(s, 'social');
  const ups = addXP(s, 3);
  const leveled = bondLevel(c.bond) > before;
  return ok(`${COMPANIONS[id].icon} ${s.name} and ${c.name} played together!${leveled && c.bond >= BOND_PERK && before < 2 ? ` You're bonded now: ${COMPANIONS[id].perk.toLowerCase()}!` : ''}`, { fx: [COMPANIONS[id].icon, '💕'], ups });
}

export function treatCompanion(s, now = Date.now()) {
  const id = s.companions.active;
  const c = id && s.companions.owned[id];
  if (!c) return no('Pick a companion first.');
  if (c.bond >= BOND_MAX) return no(`${c.name} couldn't be any happier!`);
  const wait = (c.lastTreat || 0) + TREAT_COOLDOWN - now;
  if (wait > 0) return no(`${c.name} is still full from the last treat. Try again in ${wait >= 3600000 ? `${Math.ceil(wait / 3600000)} h` : `${Math.ceil(wait / 60000)} min`}.`);
  c.lastTreat = now;
  if (s.pearls < TREAT_PRICE) return no('Not enough pearls.');
  s.pearls -= TREAT_PRICE;
  c.bond = Math.min(BOND_MAX, c.bond + 15);
  return ok(`${COMPANIONS[id].icon} ${c.name} gobbled the treat! 💕`, { fx: [COMPANIONS[id].icon, '🍪'] });
}

// ---------- garden ----------
export const plotsUnlocked = (s) => PLOT_LEVELS.filter((l) => s.level >= l).length;

function waterPlot(s, p, now, friend = false) {
  p.wateredAt = now;
  p.growMs = CROPS[p.crop].minutes * 60000 * (perk(s, 'seahorse') ? 0.8 : 1);
  if (friend) p.friend = true;
}

export function plant(s, idx, cropId, now = Date.now()) {
  const c = CROPS[cropId];
  if (!c) return no('Unknown seed.');
  if (idx < 0 || idx >= plotsUnlocked(s)) return no(`That plot opens at level ${PLOT_LEVELS[idx] ?? '?'}.`);
  if (s.garden.plots[idx]) return no('Something is already growing there.');
  if (s.level < c.level) return no(`Reach level ${c.level} to plant ${c.name}.`);
  if (s.pearls < c.seed) return no('Not enough pearls.');
  s.pearls -= c.seed;
  const p = { crop: cropId, plantedAt: now, wateredAt: null, growMs: 0 };
  s.garden.plots[idx] = p;
  const raining = weatherAt(now) === 'rainy';
  if (raining) waterPlot(s, p, now);
  return ok(`${c.icon} Planted ${c.name}!${raining ? ' The rain is watering it already. 🌧️' : ' Give it some water to start growing. 💧'}`);
}

export function water(s, idx, now = Date.now(), { friend = false } = {}) {
  const p = s.garden.plots[idx];
  if (!p) return no('Nothing is planted there.');
  if (p.wateredAt) return no('Already watered!');
  waterPlot(s, p, now, friend);
  return ok(`💧 Watered the ${CROPS[p.crop].name}. Ready ${fmtMins(p.growMs / 60000)} from now.`);
}

export function waterAll(s, now = Date.now()) {
  const dry = s.garden.plots.filter((p) => p && !p.wateredAt);
  if (!dry.length) return no('Everything is watered.');
  for (const p of dry) waterPlot(s, p, now);
  return ok(`💧 Watered ${dry.length} plant${dry.length === 1 ? '' : 's'}.`, { fx: ['💧', '🌱'] });
}

export function harvest(s, idx, now = Date.now()) {
  const p = s.garden.plots[idx];
  if (!p) return no('Nothing is planted there.');
  if (plotStage(p, now) < 3) return no('Not ready yet.');
  const c = CROPS[p.crop];
  const k = 1 + (p.friend ? FRIEND_WATER_BONUS : 0);
  const got = [];
  if (c.pearls) { const n = Math.round(c.pearls * k * (perk(s, 'minnow') ? 1.15 : 1)); s.pearls += n; got.push(`${n} pearls`); }
  for (const [snack, n0] of Object.entries(c.pantry || {})) {
    const n = Math.max(n0, Math.round(n0 * k));
    s.pantry[snack] = (s.pantry[snack] || 0) + n;
    got.push(`${n} ${SNACKS.find((x) => x.id === snack).name.toLowerCase()}`);
  }
  s.garden.plots[idx] = null;
  count(s, 'harvests');
  const ups = addXP(s, c.xp);
  log(s, `Harvested ${c.name}: ${got.join(', ')}.`, now);
  return ok(`${c.icon} Harvested ${c.name}! +${got.join(', +')}${p.friend ? ' (a friend helped water it 💕)' : ''}`, { fx: [c.icon, '✨'], ups, got });
}

export function harvestAll(s, now = Date.now()) {
  const ready = s.garden.plots.map((p, k) => (p && plotStage(p, now) === 3 ? k : -1)).filter((k) => k >= 0);
  if (!ready.length) return no('Nothing is ready yet.');
  const msgs = ready.map((k) => harvest(s, k, now));
  return ok(msgs.length === 1 ? msgs[0].msg : `🧺 Harvested ${msgs.length} plants! ${msgs.map((m) => (m.got || []).join(', ')).join(' · ')}`, { fx: ['🧺', '✨'], ups: msgs.reduce((a, m) => a + (m.ups || 0), 0) });
}

const fmtMins = (m) => (m >= 60 ? `${Math.round((m / 60) * 10) / 10} h` : `${Math.round(m)} min`);

// ---------- front door ----------
export function buyDoorItem(s, id) {
  const it = DOOR_ITEMS[id];
  if (!it) return no('Unknown decoration.');
  if (s.doorItems.includes(id)) return setDoor(s, id);
  if (it.retired) return no('That decoration isn\'t sold any more.');
  if (s.pearls < it.price) return no('Not enough pearls.');
  s.pearls -= it.price;
  s.doorItems.push(id);
  s.door[it.kind] = id;
  return ok(`🚪 ${it.name} is up on your door!`, { fx: [it.icon || '🎨', '✨'] });
}

export function setDoor(s, id) {
  const it = DOOR_ITEMS[id];
  if (!it || !s.doorItems.includes(id)) return no('You don\'t own that yet.');
  if (s.door[it.kind] === id && it.kind !== 'paint') { s.door[it.kind] = null; return ok(`Took down the ${it.name}.`); }
  s.door[it.kind] = id;
  return ok(`🚪 ${it.name} is up!`);
}

// ---------- sea or river ----------
const HOME = { sea: ['tidepools', 'reef'], river: ['lilypond', 'willow'] };
export const homeWaters = (s, locId) => (HOME[s.species] || []).includes(locId);
export function setSpecies(s, species) {
  if (!['sea', 'river'].includes(species)) return no('Pick sea or river.');
  if (s.speciesSet) return no('Your otter already knows who they are!');
  s.species = species;
  s.speciesSet = true;
  return ok(species === 'river' ? `🏞️ ${s.name || 'Your otter'} is a river otter!` : `🌊 ${s.name || 'Your otter'} is a sea otter!`);
}

// ---------- lore: residents, favors, mysteries, the Lore Book ----------
export function addPage(s, id) {
  if (!s.lore || s.lore.pages.includes(id)) return false;
  s.lore.pages.push(id);
  return true;
}
const npcRec = (s, id) => (s.lore.npc[id] ||= { f: 0, talked: null, favor: null });
export const npcFriendship = (s, id) => s.lore?.npc?.[id]?.f || 0;

function befriend(s, id, n) {
  const r = npcRec(s, id);
  const before = r.f;
  r.f = Math.min(NPC_MAX, r.f + n);
  return NPC_PAGE_AT.map((at, k) => (before < at && r.f >= at && addPage(s, `npc:${id}:${k}`) ? NPCS[id].pages[k].title : null)).filter(Boolean);
}

export function talkTo(s, id, now = Date.now()) {
  const n = NPCS[id];
  if (!n) return no('Nobody by that name.');
  if (!npcWhere(id, now)) return no(`${n.name} isn't around right now.`);
  const r = npcRec(s, id);
  const today = dayKey(now);
  if (r.talked === today) return ok('', { again: true });
  r.talked = today;
  s.pearls += 3;
  const pages = befriend(s, id, 1);
  grow(s, 'social');
  return ok(`${n.icon} You chatted with ${n.name}. +3 pearls${pages.length ? ` 📜 New Lore Book page: “${pages[0]}”` : ''}`, { pages });
}

const LOC_ORDER = ['lilypond', 'willow', 'tidepools', 'lighthouse', 'shipwreck', 'reef', 'trench'];
// One small favor per resident per day.
export function favorFor(s, id, now = Date.now()) {
  const n = NPCS[id];
  if (!n || id === 'whisper') return null;
  const d = dayKey(now);
  const h = [...`${id}:${d}`].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const home = LOC[n.home] ? n.home : 'reef';
  const kind = ['show', 'snack', 'visit'][h % 3];
  if (kind === 'show') {
    const f = LOC[home].finds[h % LOC[home].finds.length];
    return { kind, find: f.id, text: `Could you show me a ${f.name}? I've always wanted to see one up close.`, done: (st) => (st.collection[f.id] || 0) > 0 };
  }
  if (kind === 'snack') {
    const sn = SNACKS[1 + (h % (SNACKS.length - 1))];
    return { kind, snack: sn.id, text: `I'm a bit peckish. Could you spare a ${sn.name.toLowerCase()}? (${sn.price} pearls, or one from your pantry)`, done: (st) => (st.pantry?.[sn.id] || 0) > 0 || st.pearls >= sn.price };
  }
  const place = LOC_ORDER[h % LOC_ORDER.length];
  return { kind, place, text: `Have a look around ${LOC[place].name} today and tell me what you see.`, done: (st) => !!st.explored[place] && dayKey(st.explored[place]) === d };
}

export function doFavor(s, id, now = Date.now()) {
  const f = favorFor(s, id, now);
  if (!f) return no('Nothing needed today.');
  const r = npcRec(s, id);
  if (r.favor === dayKey(now)) return no(`You already helped ${NPCS[id].name} today. 💕`);
  if (!f.done(s)) return no(f.kind === 'show' ? `You haven't found a ${FINDS[f.find].name} yet.` : f.kind === 'visit' ? `Explore ${LOC[f.place].name} first.` : 'Not enough pearls.');
  if (f.kind === 'snack') {
    if ((s.pantry?.[f.snack] || 0) > 0) { s.pantry[f.snack] -= 1; if (!s.pantry[f.snack]) delete s.pantry[f.snack]; } else s.pearls -= SNACKS.find((x) => x.id === f.snack).price;
  }
  r.favor = dayKey(now);
  s.pearls += 20;
  const pages = befriend(s, id, 2);
  const ups = addXP(s, 6);
  return ok(`${NPCS[id].icon} ${NPCS[id].name} is delighted! +20 pearls, and you're better friends.${pages.length ? ` 📜 New Lore Book page: “${pages[0]}”` : ''}`, { fx: [NPCS[id].icon, '💕'], ups, pages });
}

export const mysteryAvailable = (s, m) => s.level >= m.level && (m.after || []).every((id) => s.lore.solved.includes(id));
// Active chapters: [{ mystery, k, chapter }]
export function activeChapters(s) {
  return MYSTERIES.filter((m) => mysteryAvailable(s, m) && !s.lore.solved.includes(m.id)).map((m) => {
    const k = s.lore.mysteries[m.id] || 0;
    return { mystery: m, k, chapter: m.chapters[k] };
  });
}

// What's still missing for a chapter, as short reasons ([] = ready).
export function chapterMissing(s, need, place, now = Date.now()) {
  const miss = [];
  if (need.place !== place) miss.push(`Go to ${LOC[need.place]?.name || 'the museum'}`);
  if (need.phase && timeOfDay(new Date(now)) !== need.phase) miss.push(`Come back at ${need.phase}`);
  if (need.weather && weatherAt(now) !== need.weather) miss.push(`Wait for ${need.weather} weather`);
  if (need.tide && tideAt(now).state !== need.tide) miss.push(`Wait for ${need.tide} tide`);
  if (need.find && !(s.collection[need.find] > 0)) miss.push(`Find a ${FINDS[need.find]?.name || need.find}`);
  if (need.npc && npcFriendship(s, need.npc[0]) < need.npc[1]) miss.push(`Be friends with ${NPCS[need.npc[0]].name} (${npcFriendship(s, need.npc[0])}/${need.npc[1]} 💕)`);
  if (need.harvest && (s.counters?.harvests || 0) < need.harvest) miss.push(`Harvest your garden ${need.harvest} times (${s.counters?.harvests || 0}/${need.harvest})`);
  return miss;
}

export function investigate(s, mysteryId, place, now = Date.now()) {
  const m = MYSTERY[mysteryId];
  if (!m || !mysteryAvailable(s, m)) return no("That mystery isn't open yet.");
  if (s.lore.solved.includes(m.id)) return no('Already solved!');
  const k = s.lore.mysteries[m.id] || 0;
  const ch = m.chapters[k];
  const miss = chapterMissing(s, ch.need, place, now);
  if (miss.length) return no(`🔍 Not yet: ${miss.join(' · ')}.`);
  s.lore.mysteries[m.id] = k + 1;
  addPage(s, `m:${m.id}:${k}`);
  count(s, 'clues');
  let ups = addXP(s, 10);
  if (k + 1 < m.chapters.length) return ok(`🔍 ${ch.text}`, { clue: true, ups, mystery: m.id, chapter: k });
  s.lore.solved.push(m.id);
  s.pearls += m.reward.pearls;
  ups += addXP(s, m.reward.xp);
  if (m.reward.title && !s.titles.includes(m.reward.title)) s.titles.push(m.reward.title);
  if (m.id === 'moon') s.collection.rainbowpearl = (s.collection.rainbowpearl || 0) + 1;
  memory(s, m.icon, `${s.name} solved “${m.name}”!`, now);
  log(s, `Solved the mystery “${m.name}”! +${m.reward.pearls} pearls`, now);
  return ok(`🔍 ${ch.text}`, { solved: true, ups, mystery: m.id, chapter: k, fx: [m.icon, '🔍', '✨'] });
}

// ---------- the living world ----------
const merchantPool = () => [
  ...Object.entries(ITEMS).filter(([, it]) => it.price > 0 && !it.event && !it.birthday).map(([id]) => `item:${id}`),
  ...Object.entries(FURNITURE).filter(([, it]) => it.price > 0 && !it.event).map(([id]) => `furn:${id}`),
  ...Object.entries(DOOR_ITEMS).filter(([, it]) => it.price > 0 && !it.retired).map(([id]) => `door:${id}`),
];
export function merchantWares(now = Date.now()) {
  return merchantStock(merchantPool(), now).map((key) => {
    const [kind, id] = key.split(':');
    const base = kind === 'item' ? ITEMS[id] : kind === 'furn' ? FURNITURE[id] : DOOR_ITEMS[id];
    return { key, kind, id, name: base.name, icon: base.icon || (kind === 'furn' ? '🛋️' : '🚪'), price: Math.max(1, Math.round(base.price * MERCHANT_DISCOUNT)), full: base.price };
  });
}
export function buyMerchant(s, key, now = Date.now()) {
  const w = merchantWares(now).find((x) => x.key === key);
  if (!w) return no("The captain doesn't have that today.");
  if (w.kind === 'item' && s.owned.includes(w.id)) return no('You already have that.');
  if (w.kind === 'door' && s.doorItems.includes(w.id)) return no('You already have that.');
  if (s.pearls < w.price) return no('Not enough pearls.');
  s.pearls -= w.price;
  if (w.kind === 'item') s.owned.push(w.id);
  else if (w.kind === 'furn') s.furniture[w.id] = (s.furniture[w.id] || 0) + 1;
  else s.doorItems.push(w.id);
  befriend(s, 'barnacle', 1);
  return ok(`⛵ "Pleasure doing business!" You bought the ${w.name} for ${w.price} pearls.${w.kind === 'furn' ? " It's in your den storage." : ''}`, { fx: ['⛵', '✨'] });
}

// What your otter got up to while you were gone, with small rewards.
export function welcomeBack(s, now = Date.now()) {
  const stories = awayStories(s, s.lastSeen || now, now);
  s.lastSeen = now;
  const c = s.companions?.active && s.companions.owned[s.companions.active];
  for (const st of stories) {
    if (st.pearls) s.pearls += st.pearls;
    if (st.happy) stat(s, 'happiness', st.happy);
    if (st.bond && c) c.bond = Math.min(BOND_MAX, c.bond + st.bond);
  }
  return stories;
}

// ---------- legacy (after Wise) ----------
export function claimLegacy(s, id) {
  const m = MASTERY[id];
  if (!m) return no('Unknown goal.');
  if (s.level < LEGACY_LEVEL) return no(`Legacy goals unlock when ${s.name} is a Wise Otter (level ${LEGACY_LEVEL}).`);
  const have = s.legacy.claimed[id] || 0;
  const reached = m.goals.filter((g) => m.value(s) >= g).length;
  if (have >= reached) return no(have >= m.goals.length ? 'All tiers done! 🦪' : `Keep going! Next: ${m.goals[have]} ${m.desc.toLowerCase()}.`);
  const before = rankOf(legacyStars(s));
  s.legacy.claimed[id] = have + 1;
  const tier = TIERS[have];
  s.pearls += tier.pearls;
  const ups = addXP(s, 20);
  const after = rankOf(legacyStars(s));
  if (have + 1 >= 3 && !s.titles.includes(m.title)) s.titles.push(m.title);
  const ranked = after.name !== before.name;
  if (ranked) memory(s, after.icon, `${s.name} became a ${after.name}!`);
  return ok(`${tier.icon} ${m.name} ${tier.name}! +${tier.pearls} pearls, +1 Legacy star${ranked ? `. ${after.icon} ${s.name} is now a ${after.name}!` : ''}`, { fx: [tier.icon, m.icon, '✨'], ups, ranked });
}

export const allTitles = (s) => [...new Set([...(s.titles || []), ...(s.level >= LEGACY_LEVEL ? [rankOf(legacyStars(s)).name] : [])])];
export function setTitle(s, title) {
  if (title && !allTitles(s).includes(title)) return no("You haven't earned that title yet.");
  s.legacy.title = title || null;
  return ok(title ? `🏷️ Now known as ${s.name} ${displayTitle(s)}!` : 'Title removed.');
}
export const displayTitle = (s) => (s.legacy?.title ? (/^(the |Friend )/.test(s.legacy.title) ? s.legacy.title : `the ${s.legacy.title}`) : '');

// ---------- aquarium ----------
export const hasFurniture = (s, id) => (s.furniture?.[id] || 0) > 0;
export function goFishing(s, now = Date.now()) {
  if (!hasFurniture(s, 'aquarium')) return no('Get an aquarium for your den first!');
  const wait = (s.aquarium.lastFish || 0) + FISHING_COOLDOWN - now;
  if (wait > 0) return no(`The fish are hiding. Try again in ${Math.ceil(wait / 60000)} min.`);
  s.aquarium.lastFish = now;
  const id = fishFor(Math.random());
  const isNew = !s.aquarium.fish[id];
  s.aquarium.fish[id] = (s.aquarium.fish[id] || 0) + 1;
  const ups = addXP(s, isNew ? 6 : 2);
  stat(s, 'happiness', 4);
  return ok(`${FISH[id].icon} ${isNew ? 'New fish!' : 'Another'} ${FISH[id].name} for the aquarium!`, { fish: id, isNew, ups, fx: [FISH[id].icon, '🫧'] });
}
export const readBook = (s, id) => (s.books.includes(id) ? ok('', { book: BOOKS[id] }) : no("You haven't found that book yet."));

// ---------- companion looks ----------
export const companionLook = (c) => (c ? { color: c.color, pattern: c.pattern, acc: c.acc } : {});
export function styleCompanion(s, id, { color, pattern, acc } = {}) {
  const c = s.companions.owned[id];
  if (!c) return no("You don't have that companion.");
  if (color !== undefined) { if (!COMP_COLORS[color]) return no('Unknown color.'); c.color = color; }
  if (pattern !== undefined) {
    const p = COMP_PATTERNS[pattern];
    if (!p) return no('Unknown pattern.');
    if (c.bond < p.bond) return no(`Bond to ${p.bond} with ${c.name} to unlock ${p.name.toLowerCase()}.`);
    c.pattern = pattern;
  }
  if (acc !== undefined) {
    if (acc && !s.companions.accs.includes(acc)) return no('Buy that accessory first.');
    c.acc = acc || null;
  }
  return ok(`${COMPANIONS[id].icon} ${c.name} looks great!`);
}
export function buyCompanionAcc(s, acc) {
  const a = COMP_ACCS[acc];
  if (!a) return no('Unknown accessory.');
  if (s.companions.accs.includes(acc)) return no('You already have that.');
  if (s.pearls < a.price) return no('Not enough pearls.');
  s.pearls -= a.price;
  s.companions.accs.push(acc);
  const id = s.companions.active;
  if (id) s.companions.owned[id].acc = acc;
  return ok(`${a.icon} Bought the ${a.name}!${id ? ` ${s.companions.owned[id].name} is wearing it.` : ''}`, { fx: [a.icon, '✨'] });
}

// ---------- themed collections ----------
export const ownsPiece = (s, [kind, id]) => (kind === 'furn' ? (s.furniture?.[id] || 0) > 0 : kind === 'door' ? (s.doorItems || []).includes(id) : (s.owned || []).includes(id));
export function claimSet(s, id) {
  const set = SET[id];
  if (!set) return no('Unknown collection.');
  if (s.setsClaimed.includes(id)) return no('Already claimed!');
  const missing = set.items.filter((p) => !ownsPiece(s, p)).length;
  if (missing) return no(`${missing} more piece${missing === 1 ? '' : 's'} to go!`);
  s.setsClaimed.push(id);
  s.pearls += set.reward;
  const ups = addXP(s, 25);
  memory(s, set.icon, `${s.name} completed the ${set.name} collection!`);
  return ok(`${set.icon} ${set.name} collection complete! +${set.reward} pearls`, { fx: [set.icon, '✨', '🎉'], ups });
}
