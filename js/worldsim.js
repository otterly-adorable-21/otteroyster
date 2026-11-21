// The living world: things that happen on the pond whether or not you're
// playing. Everything here is worked out from the clock, so every player (and
// Shelly on Discord) sees the same world at the same time.
import { timeOfDay, weatherAt, tideAt } from './ambience.js';
import { NPCS } from './lore.js';

const BLOCK = 12 * 3600000; // happenings change twice a day
const DAY = 86400000;

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ---------- happenings ----------
// luck: explore luck multiplier at `place`. pearls: bonus loose pearls there.
export const HAPPENINGS = {
  whales: { name: 'Whale migration', icon: '🐋', place: 'reef', luck: 1.3, text: 'A pod of whales is passing Pearl Reef. Rare finds are easier to spot!' },
  fireflies: { name: 'Firefly swarm', icon: '✨', place: 'willow', luck: 1.25, text: 'Thousands of fireflies are lighting up the Willow Grove.' },
  salmon: { name: 'Salmon run', icon: '🐟', place: 'lilypond', luck: 1.2, pearls: 4, text: 'Salmon are leaping up the stream into the Lily Pond. River otters love this!' },
  kingtide: { name: 'King tide', icon: '🌊', place: 'tidepools', luck: 1.35, text: 'An extra-big tide uncovered pools nobody has seen in years.' },
  storm: { name: 'Treasure on the beach', icon: '⛈️', place: 'shipwreck', luck: 1.3, pearls: 6, text: 'Last night\'s storm washed treasure up around the Saltwind.' },
  ducklings: { name: 'Duckling parade', icon: '🐥', place: 'lilypond', happy: 5, text: 'A line of ducklings is parading around the pond. Everyone is in a good mood.' },
  jellies: { name: 'Moon jelly bloom', icon: '🪼', place: 'trench', luck: 1.3, text: 'Glowing moon jellies are drifting up from the trench.' },
  fog: { name: 'Lighthouse fog', icon: '🌫️', place: 'lighthouse', luck: 1.2, text: 'Thick fog rolled in. Old Lumen has the lamp on full.' },
  dolphins: { name: 'Dolphin visit', icon: '🐬', place: 'reef', happy: 5, text: 'Dolphins are playing in the waves past the reef.' },
  geese: { name: 'Geese heading south', icon: '🪿', place: 'willow', pearls: 3, text: 'A noisy flock of geese stopped to rest in the Willow Grove.' },
};
const HAPPENING_IDS = Object.keys(HAPPENINGS);

// One or two happenings per 12-hour block.
export function happeningsAt(now = Date.now()) {
  const b = Math.floor(now / BLOCK);
  const first = HAPPENING_IDS[hash(`hap:${b}`) % HAPPENING_IDS.length];
  const ids = [first];
  if (hash(`hap2:${b}`) % 3 === 0) {
    const second = HAPPENING_IDS[hash(`hapb:${b}`) % HAPPENING_IDS.length];
    if (second !== first && HAPPENINGS[second].place !== HAPPENINGS[first].place) ids.push(second);
  }
  return ids.map((id) => ({ id, ...HAPPENINGS[id], endsAt: (b + 1) * BLOCK }));
}

export function happeningLuck(locId, now = Date.now()) {
  return happeningsAt(now).filter((h) => h.place === locId).reduce((k, h) => k * (h.luck || 1), 1);
}
export const happeningAt = (locId, now = Date.now()) => happeningsAt(now).find((h) => h.place === locId) || null;

// ---------- Captain Barnacle's boat ----------
// Docks at the Shipwreck two or three days a week, with a rotating stock.
export const MERCHANT_DISCOUNT = 0.7;
export function merchantDocked(now = Date.now()) {
  const d = Math.floor(now / DAY);
  return hash(`dock:${d}`) % 7 < 3;
}
// pool: ids prefixed by kind, e.g. 'item:crown', 'furn:chest', 'door:wreath-heart', 'seed:moonflower'
export function merchantStock(pool, now = Date.now()) {
  if (!merchantDocked(now)) return [];
  const d = Math.floor(now / DAY);
  const picks = [];
  const list = [...pool].sort((a, b) => hash(`${d}:${a}`) - hash(`${d}:${b}`));
  for (const id of list) {
    if (picks.length >= 5) break;
    if (!picks.some((p) => p.split(':')[0] === id.split(':')[0]) || picks.length >= 3) picks.push(id);
  }
  return picks;
}

// ---------- where everyone is ----------
// Returns a place id, 'museum', or null (asleep / away).
export function npcWhere(id, now = Date.now()) {
  const phase = timeOfDay(new Date(now));
  const tide = tideAt(now).state;
  const hour = new Date(now).getHours();
  switch (id) {
    case 'willow': return phase === 'night' ? null : phase === 'dusk' ? 'lilypond' : 'willow';
    case 'barnacle': return merchantDocked(now) || phase === 'night' ? 'shipwreck' : 'tidepools';
    case 'lumen': return 'lighthouse';
    case 'shellby': return phase === 'dawn' ? 'reef' : 'museum';
    case 'marina': return phase === 'night' ? null : tide === 'low' || tide === 'falling' ? 'tidepools' : 'reef';
    case 'pip': return phase === 'night' ? null : ['lilypond', 'willow', 'tidepools', 'lighthouse', 'lilypond', 'reef'][hour % 6];
    case 'whisper': return phase === 'night' ? 'trench' : null;
    default: return NPCS[id]?.home || null;
  }
}
export const npcsAt = (place, now = Date.now()) => Object.keys(NPCS).filter((id) => npcWhere(id, now) === place);

// A line for an NPC right now (changes every few hours, matches the weather).
export function npcLine(id, now = Date.now(), salt = '') {
  const n = NPCS[id];
  const phase = timeOfDay(new Date(now));
  const weather = weatherAt(now);
  const pool = [...(n.lines[weather] || []), ...(n.lines[phase] || []), ...n.lines.any];
  return pool[hash(`${id}:${Math.floor(now / (3 * 3600000))}:${salt}`) % pool.length];
}

// ---------- pond wildlife (purely for show) ----------
export function crittersFor(now = Date.now()) {
  const phase = timeOfDay(new Date(now));
  const weather = weatherAt(now);
  const list = [];
  if (phase === 'night') list.push('firefly', 'firefly', 'moth');
  else if (phase === 'dusk') list.push('frog', 'bat');
  else list.push('dragonfly', 'butterfly', 'duck');
  if (weather === 'rainy') list.push('frog', 'snail');
  if (weather === 'breezy') list.push('leaf');
  if (happeningsAt(now).some((h) => h.id === 'ducklings')) list.push('duckling', 'duckling');
  if (happeningsAt(now).some((h) => h.id === 'fireflies') && phase !== 'day') list.push('firefly', 'firefly');
  return list;
}
export const CRITTERS = { firefly: '✨', moth: '🦋', frog: '🐸', bat: '🦇', dragonfly: '🪰', butterfly: '🦋', duck: '🦆', snail: '🐌', leaf: '🍃', duckling: '🐥' };

// ---------- while you were away ----------
// Little things your otter got up to on their own. Pure function of the save,
// the time away and a seed, so the same gap tells the same story.
export function awayStories(s, from, to) {
  const hours = (to - from) / 3600000;
  if (hours < 2 || !s.name) return [];
  const n = hours > 20 ? 3 : hours > 8 ? 2 : 1;
  const comp = s.companions?.active;
  const compName = comp ? s.companions.owned[comp]?.name : null;
  const mid = from + (to - from) / 2;
  const weather = weatherAt(mid);
  const hap = happeningsAt(mid)[0];
  const pool = [
    { text: `${s.name} chased a dragonfly all around the pond and almost caught it.`, happy: 4 },
    { text: `${s.name} found some pearls tangled in the reeds.`, pearls: 6 },
    { text: `${s.name} practiced floating on their back and only sank twice.`, happy: 3 },
    { text: `${s.name} reorganized their pebble collection by size. Then by color. Then by size again.`, happy: 3 },
    { text: `${s.name} had a long chat with Grandma Willow about the old days.`, npc: 'willow' },
    { text: `Pip dropped by with gossip and a slightly soggy snack.`, npc: 'pip', pearls: 2 },
    { text: `${s.name} watched the ships go by with Old Lumen.`, npc: 'lumen' },
    { text: `Captain Barnacle told ${s.name} a story about a cheese the size of a boat.`, npc: 'barnacle' },
    weather === 'rainy' ? { text: `${s.name} splashed in every single puddle while it rained.`, happy: 6 } : { text: `${s.name} took a sunny nap on a warm rock.`, happy: 4 },
    hap ? { text: `${s.name} went to see the ${hap.name.toLowerCase()} ${hap.icon} and came back very excited.`, happy: 5 } : null,
    compName ? { text: `${s.name} and ${compName} played hide-and-seek in the lilies.`, bond: 4 } : null,
    compName ? { text: `${compName} brought ${s.name} a shiny pebble as a present.`, bond: 3, pearls: 3 } : null,
    s.garden?.plots?.some(Boolean) ? { text: `${s.name} kept the birds away from the garden.`, happy: 2 } : null,
  ].filter(Boolean);
  const out = [];
  let k = hash(`away:${s.created}:${Math.floor(from / 60000)}`);
  const used = new Set();
  while (out.length < n && used.size < pool.length) {
    const i = k % pool.length;
    k = hash(`${k}`);
    if (used.has(i)) continue;
    used.add(i);
    out.push(pool[i]);
  }
  return out;
}

// ---------- the Pond Gazette ----------
export function gazetteHeadline(now = Date.now()) {
  const h = happeningsAt(now)[0];
  const w = weatherAt(now);
  const heads = [
    `${h.icon} ${h.name.toUpperCase()}! ${h.text}`,
    merchantDocked(now) ? '⛵ Captain Barnacle\'s boat is docked at Shipwreck Cove today. Bargains aboard!' : null,
    w === 'rainy' ? '🌧️ Rain across the pond: gardens are being watered for free.' : null,
  ].filter(Boolean);
  return heads;
}
