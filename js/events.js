// Seasonal events: a yearly calendar, event tokens, daily quests, a limited shop
// and limited discoveries. Shared by the website and the Discord bot.
// Dates are month/day in UTC and repeat every year.

export const EVENTS = [
  {
    id: 'lantern', name: 'Winter Lantern Festival', icon: '🏮', start: [12, 1], end: [1, 6],
    token: { name: 'Lantern Lights', icon: '🏮' },
    desc: 'Snow on the lily pads and paper lanterns floating on the pond. Bundle up!',
    fx: ['❄️', '✨', '❄️'], tint: '#9bd1ff',
    shop: [{ kind: 'item', id: 'earmuffs', tokens: 30 }, { kind: 'item', id: 'woolscarf', tokens: 25 }, { kind: 'furniture', id: 'lanterntree', tokens: 35 }],
    finds: [{ id: 'snowflake', name: 'Perfect Snowflake', icon: '❄️', rarity: 'uncommon' }, { id: 'snowotter', name: 'Snow Otter Sculpture', icon: '⛄', rarity: 'rare' }],
  },
  {
    id: 'sweetheart', name: 'Sweetheart Shoals', icon: '💗', start: [2, 1], end: [2, 21],
    token: { name: 'Heart Shells', icon: '💗' },
    desc: 'Otters hold paws so they never drift apart. Share the love with your friends!',
    fx: ['💗', '💕', '💗'], tint: '#ffc9de',
    shop: [{ kind: 'item', id: 'heartband', tokens: 30 }, { kind: 'item', id: 'rosebow', tokens: 25 }, { kind: 'furniture', id: 'heartpillow', tokens: 30 }],
    finds: [{ id: 'pondrose', name: 'Pond Rose', icon: '🌹', rarity: 'uncommon' }, { id: 'loveletter', name: 'Message in a Bottle', icon: '💌', rarity: 'rare' }],
  },
  {
    id: 'spring', name: 'Spring Bloom', icon: '🌸', start: [3, 15], end: [4, 30],
    token: { name: 'Petals', icon: '🌸' },
    desc: 'Everything is blooming! Petals drift across the water and the bees are busy.',
    fx: ['🌸', '🌼', '🌸'], tint: '#ffd6e7',
    shop: [{ kind: 'item', id: 'flowercrown', tokens: 30 }, { kind: 'item', id: 'butterflywings', tokens: 40 }, { kind: 'furniture', id: 'flowerpot', tokens: 30 }],
    finds: [{ id: 'bumblebee', name: 'Fuzzy Bumblebee', icon: '🐝', rarity: 'uncommon' }, { id: 'tulip', name: 'Rainbow Tulip', icon: '🌷', rarity: 'rare' }],
  },
  {
    id: 'summer', name: 'Summer Splash', icon: '☀️', start: [6, 15], end: [8, 31],
    token: { name: 'Sunbeams', icon: '☀️' },
    desc: 'Long sunny days, warm water and sandcastles. Perfect floating weather.',
    fx: ['☀️', '🫧', '✨'], tint: '#fff3bf',
    shop: [{ kind: 'item', id: 'sunhat', tokens: 30 }, { kind: 'item', id: 'lei', tokens: 25 }, { kind: 'furniture', id: 'beachchair', tokens: 35 }],
    finds: [{ id: 'sandcastle', name: 'Tiny Sandcastle', icon: '🏰', rarity: 'uncommon' }, { id: 'dolphin', name: 'Playful Dolphin', icon: '🐬', rarity: 'rare' }],
  },
  {
    id: 'spooky', name: 'Spooky Seas', icon: '🎃', start: [10, 1], end: [11, 7],
    token: { name: 'Ghost Pearls', icon: '👻' },
    desc: 'Fog rolls over the pond and something glows in the shipwreck… boo!',
    fx: ['🦇', '🍂', '👻'], tint: '#d0bfff',
    shop: [{ kind: 'item', id: 'witchhat', tokens: 35 }, { kind: 'item', id: 'batwings', tokens: 35 }, { kind: 'furniture', id: 'jackolantern', tokens: 30 }],
    finds: [{ id: 'littlebat', name: 'Little Bat', icon: '🦇', rarity: 'uncommon' }, { id: 'ghostfish', name: 'Ghost Fish', icon: '👻', rarity: 'rare' }],
  },
  {
    id: 'harvest', name: 'Harvest Moon', icon: '🍁', start: [11, 8], end: [11, 30],
    token: { name: 'Golden Leaves', icon: '🍁' },
    desc: 'Crisp leaves, a big orange moon and cocoa by the den fire. Time to get cozy.',
    fx: ['🍁', '🍂', '🍁'], tint: '#ffd8a8',
    shop: [{ kind: 'item', id: 'acornhat', tokens: 30 }, { kind: 'item', id: 'leafscarf', tokens: 25 }, { kind: 'furniture', id: 'pumpkinlamp', tokens: 30 }],
    finds: [{ id: 'mapleleaf', name: 'Crimson Maple Leaf', icon: '🍁', rarity: 'uncommon' }, { id: 'harvestmouse', name: 'Harvest Mouse', icon: '🐭', rarity: 'rare' }],
  },
];

export const EVENT = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
export const EVENT_FINDS = Object.fromEntries(EVENTS.flatMap((e) => e.finds.map((f) => [f.id, { ...f, event: e.id }])));

// Daily quests: 3 a day from this pool, the same for everyone on a given day.
export const QUESTS = [
  { kind: 'feed', text: 'Feed your otter 2 snacks', target: 2, reward: 3 },
  { kind: 'care', text: 'Give 3 cuddles or baths', target: 3, reward: 3 },
  { kind: 'game', text: 'Play 2 arcade games', target: 2, reward: 4 },
  { kind: 'explore', text: 'Explore 2 places on the map', target: 2, reward: 4 },
  { kind: 'mission', text: 'Finish a mission', target: 1, reward: 5 },
  { kind: 'hug', text: "Hug a friend's otter", target: 1, reward: 4 },
  { kind: 'decorate', text: 'Buy something for your den', target: 1, reward: 3 },
  { kind: 'dgame', text: 'Play a game on Discord', target: 1, reward: 3 },
];
export const TOKENS_PER_ACTIVITY = { game: 1, explore: 1 };
export const EVENT_FIND_CHANCE = 0.2;

const md = (d) => [d.getUTCMonth() + 1, d.getUTCDate()];
const before = ([m1, d1], [m2, d2]) => m1 < m2 || (m1 === m2 && d1 < d2);
const onOrBefore = (a, b) => !before(b, a);

function inWindow(e, now) {
  const t = md(new Date(now));
  if (before(e.end, e.start)) return onOrBefore(e.start, t) || onOrBefore(t, e.end); // wraps New Year
  return onOrBefore(e.start, t) && onOrBefore(t, e.end);
}

// When the current window ends (ms timestamp, end of the last day, UTC).
export function eventEndsAt(e, now = Date.now()) {
  const d = new Date(now);
  let y = d.getUTCFullYear();
  if (before(e.end, e.start) && d.getUTCMonth() + 1 >= e.start[0]) y += 1;
  return Date.UTC(y, e.end[0] - 1, e.end[1], 23, 59, 59);
}

export function nextEvent(now = Date.now()) {
  const d = new Date(now);
  let best = null;
  for (const e of EVENTS) {
    for (const yr of [d.getUTCFullYear(), d.getUTCFullYear() + 1]) {
      const at = Date.UTC(yr, e.start[0] - 1, e.start[1]);
      if (at > now && (!best || at < best.at)) best = { event: e, at };
    }
  }
  return best;
}

// Website-only preview of a different event (?event=spooky). Never used by the server.
let override = null;
export function setEventPreview(id) { override = EVENT[id] ? id : null; }
export const isPreview = () => !!override;

export function activeEvent(now = Date.now()) {
  if (override) return EVENT[override];
  return EVENTS.find((e) => inWindow(e, now)) || null;
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// The 3 quests for an event on a given day.
export function questsFor(eventId, day) {
  const pool = QUESTS.map((q, i) => ({ q, k: hash(`${eventId}:${day}:${i}`) })).sort((a, b) => a.k - b.k);
  // At most one quest that needs friends or Discord, so everyone can finish most of the day.
  const picked = [];
  let social = 0;
  for (const { q } of pool) {
    const isSocial = q.kind === 'hug' || q.kind === 'dgame';
    if (isSocial && social >= 1) continue;
    if (isSocial) social += 1;
    picked.push({ id: q.kind, ...q });
    if (picked.length === 3) break;
  }
  return picked;
}
