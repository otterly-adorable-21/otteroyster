// The living pond: time of day, weather, tides, daily moods, sleeping positions
// and little thoughts. Weather and tides are the same for every player (shared
// world); time of day uses the player's own clock. Shared with the Discord bot.
import { SNACKS, GAME_LIST } from './data.js';
import { LOC } from './world.js';

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const dayKey = (now) => new Date(now).toISOString().slice(0, 10);

// ---------- time of day (player's local clock) ----------
export const PHASES = {
  dawn: { name: 'Dawn', icon: '🌅' },
  day: { name: 'Day', icon: '☀️' },
  dusk: { name: 'Dusk', icon: '🌇' },
  night: { name: 'Night', icon: '🌙' },
};
export function timeOfDay(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 18) return 'day';
  if (h >= 18 && h < 21) return 'dusk';
  return 'night';
}

// ---------- weather (same for everyone, changes every 6 hours) ----------
export const WEATHER = {
  sunny: { name: 'Sunny', icon: '☀️', nightIcon: '🌙', weight: 34, hint: 'Perfect for exploring!' },
  cloudy: { name: 'Cloudy', icon: '⛅', weight: 24, hint: 'A cozy day for games.' },
  rainy: { name: 'Rainy', icon: '🌧️', weight: 18, hint: 'Frogs and snails love the rain. Lily Pond finds are luckier!' },
  misty: { name: 'Misty', icon: '🌫️', weight: 12, hint: 'Mysterious things wash up in the mist. Rare finds are a little luckier.' },
  breezy: { name: 'Breezy', icon: '🍃', weight: 12, hint: 'Leaves and feathers drift by. Willow Grove and Lighthouse Point finds are luckier!' },
};
export function weatherAt(now = Date.now()) {
  const block = Math.floor(new Date(now).getUTCHours() / 6);
  const roll = hash(`${dayKey(now)}:${block}`) % 100;
  let acc = 0;
  for (const [id, w] of Object.entries(WEATHER)) { acc += w.weight; if (roll < acc) return id; }
  return 'sunny';
}
// Today's four 6-hour blocks (UTC), for a forecast.
export function forecast(now = Date.now()) {
  const d = new Date(now);
  const base = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return [0, 1, 2, 3].map((b) => ({ at: base + b * 6 * 3600000, weather: weatherAt(base + b * 6 * 3600000 + 1) }));
}

// ---------- tides (12.42-hour cycle, same for everyone) ----------
const TIDE_PERIOD = 12.42 * 3600000;
export function tideAt(now = Date.now()) {
  const level = Math.cos((2 * Math.PI * now) / TIDE_PERIOD); // 1 = high, -1 = low
  const rising = Math.sin((2 * Math.PI * now) / TIDE_PERIOD) < 0;
  const state = level > 0.5 ? 'high' : level < -0.5 ? 'low' : rising ? 'rising' : 'falling';
  // time until the next low tide
  const phase = ((now % TIDE_PERIOD) + TIDE_PERIOD) % TIDE_PERIOD;
  const nextLow = now + ((TIDE_PERIOD / 2 - phase + TIDE_PERIOD) % TIDE_PERIOD);
  return { level, state, nextLow };
}
export const TIDE_NAMES = { high: '🌊 High tide', low: '🏖️ Low tide', rising: '↗️ Tide coming in', falling: '↘️ Tide going out' };
export const LOW_TIDE_PLACES = ['tidepools', 'shipwreck'];

// Luck bonus for exploring a place right now (weather + tide).
export function exploreLuck(locId, now = Date.now()) {
  let luck = 1;
  const w = weatherAt(now);
  if (w === 'rainy' && locId === 'lilypond') luck *= 1.4;
  if (w === 'breezy' && (locId === 'willow' || locId === 'lighthouse')) luck *= 1.4;
  if (w === 'misty') luck *= 1.15;
  if (tideAt(now).state === 'low' && LOW_TIDE_PLACES.includes(locId)) luck *= 1.5;
  return luck;
}

// ---------- daily mood (unique per otter, new every day) ----------
export const MOODS = {
  cheerful: { name: 'Cheerful', icon: '😊', effect: 'Happiness drops slower today' },
  playful: { name: 'Playful', icon: '🤸', effect: '+3 pearls from every arcade game' },
  curious: { name: 'Curious', icon: '🔍', effect: 'Luckier discoveries today' },
  cuddly: { name: 'Cuddly', icon: '🤗', effect: 'Cuddles are extra sweet today' },
  dreamy: { name: 'Dreamy', icon: '💭', effect: 'Naps are extra restful today' },
  peckish: { name: 'Peckish', icon: '🍪', effect: 'Snacks are extra yummy today' },
};
export function dailyMood(s, now = Date.now()) {
  const ids = Object.keys(MOODS);
  return ids[hash(`${s.created}:${dayKey(now)}`) % ids.length];
}

// ---------- favorite sleeping position (per otter, for life) ----------
export const SLEEP_POSES = {
  float: 'floats on their back',
  curl: 'curls up in a ball',
  hug: 'hugs their oyster tight',
  sprawl: 'sprawls out like a starfish',
};
export function sleepPose(s) {
  const ids = Object.keys(SLEEP_POSES);
  return ids[hash(`pose:${s.created}`) % ids.length];
}

// ---------- little thoughts ----------
export function thoughtFor(s, { now = Date.now(), date = new Date(now), seed = 0 } = {}) {
  const n = s.name;
  const fav = s.persona?.fav || {};
  const snack = SNACKS.find((x) => x.id === fav.snack);
  const place = LOC[fav.place];
  const game = GAME_LIST.find((x) => x.id === fav.game);
  const phase = timeOfDay(date);
  const w = WEATHER[weatherAt(now)];
  const tide = tideAt(now);
  const mood = MOODS[dailyMood(s, now)];
  const pool = [
    snack && `${snack.icon} Mmm… ${snack.name.toLowerCase()}…`,
    place && `${place.icon} I wonder what's at ${place.name} today…`,
    game && `${game.icon} One more round of ${game.name}?`,
    `${mood.icon} I feel ${mood.name.toLowerCase()} today!`,
    `${w.icon} ${w.name} weather! ${w.hint}`,
    tide.state === 'low' ? '🏖️ Low tide! The tide pools are full of surprises.' : tide.state === 'high' ? '🌊 The water is so high today!' : null,
    phase === 'night' ? '🌙 The stars are pretty tonight…' : phase === 'dawn' ? '🌅 Good morning, pond!' : phase === 'dusk' ? '🌇 What a pretty sunset.' : '🦪 Is that a pearl I see?',
    s.stats.energy < 40 ? '🥱 I could use a little nap…' : '💪 I have so much energy!',
    `🫧 ${n} is blowing bubbles…`,
    '🐚 This shell is my favorite shell.',
  ].filter(Boolean);
  return pool[(hash(`${dayKey(now)}:${Math.floor(now / 60000)}:${seed}`) % pool.length)];
}
