// Shared game rules. Pure logic with no DOM access, so both the website and
// the Discord bot (server/) use exactly the same rules on the same save data.
import { ITEMS, SNACKS, MISSIONS, GAME_LIST } from './data.js';

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
    best: {},
    plays: {},
    log: [],
  };
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
      stat(s, 'energy', 2.5 * mins);
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
      stat(s, 'clean', RATES.clean * mins);
      stat(s, 'happiness', RATES.happiness * grumpy * mins);
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
  stat(s, 'hunger', snack.hunger);
  stat(s, 'happiness', snack.happiness);
  const ups = addXP(s, 2);
  log(s, `${s.name} ate ${snack.name.toLowerCase()}.`);
  return ok(`${s.name} munched the ${snack.name.toLowerCase()}! 😋`, { fx: [snack.icon, '😋'], ups });
}

export function cuddle(s) {
  const b = busy(s);
  if (b) return no(b);
  if (s.stats.energy < 5) return no(`${s.name} is too tired to play.`);
  stat(s, 'happiness', 8);
  stat(s, 'energy', -3);
  const ups = addXP(s, 2);
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
  return ok(`${s.name} splashes around in the bubbles! 🫧`, { fx: ['🫧', '🫧', '💧'], ups });
}

export function toggleSleep(s) {
  if (!s.name) return no(busy(s));
  if (s.mission) return no(busy(s));
  s.sleeping = !s.sleeping;
  if (s.sleeping) log(s, `${s.name} curled up for a nap.`);
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
  const pearls = rand(m.pearls[0], m.pearls[1]);
  s.pearls += pearls;
  stat(s, 'happiness', 10);
  let found = null;
  for (const [id, chance] of m.loot) {
    if (!s.owned.includes(id) && Math.random() < chance) { found = id; break; }
  }
  if (found) s.owned.push(found);
  const story = m.stories[rand(0, m.stories.length - 1)];
  log(s, `${s.name} returned from ${m.name} with ${pearls} pearls${found ? ` and a ${ITEMS[found].name}` : ''}.`, now);
  const ups = addXP(s, m.xp);
  const report = { id: m.id, t: now, pearls, found, story, xp: m.xp, ups };
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
  const p = Math.max(0, Math.min(cap, Math.round(pearls)));
  s.pearls += p;
  stat(s, 'happiness', 10);
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
  return { pearls: p, record, ups };
}

// Simple pearl reward used by Discord quick games (no energy cost).
export function grantPearls(s, n, reason) {
  const p = Math.max(0, Math.round(n));
  s.pearls += p;
  if (reason) log(s, reason);
  return p;
}
