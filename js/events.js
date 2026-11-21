// Seasonal events: a yearly calendar, event tokens, daily quests, a limited shop
// and limited discoveries. Shared by the website and the Discord bot.
// Dates are month/day in UTC and repeat every year.

export const EVENTS = [
  {
    id: 'lantern', name: 'Winterfest Lanterns', icon: '🏮', start: [12, 1], end: [12, 19],
    token: { name: 'Lantern Lights', icon: '🏮' },
    desc: 'Snow on the lily pads and paper lanterns floating on the pond. Bundle up!',
    fx: ['❄️', '✨', '❄️'], tint: '#9bd1ff',
    shop: [{ kind: 'item', id: 'earmuffs', tokens: 30 }, { kind: 'item', id: 'woolscarf', tokens: 25 }, { kind: 'item', id: 'snowhat', tokens: 25 }, { kind: 'furniture', id: 'lanterntree', tokens: 35 }, { kind: 'furniture', id: 'snowglobe', tokens: 25 }, { kind: 'furniture', id: 'icechair', tokens: 35 }],
    finds: [{ id: 'snowflake', name: 'Perfect Snowflake', icon: '❄️', rarity: 'uncommon' }, { id: 'snowotter', name: 'Snow Otter Sculpture', icon: '⛄', rarity: 'rare' }],
  },
  {
    id: 'sweetheart', name: 'Sweetheart Shoals', icon: '💗', start: [2, 1], end: [2, 21],
    token: { name: 'Heart Shells', icon: '💗' },
    desc: 'Otters hold paws so they never drift apart. Share the love with your friends!',
    fx: ['💗', '💕', '💗'], tint: '#ffc9de',
    shop: [{ kind: 'item', id: 'heartband', tokens: 30 }, { kind: 'item', id: 'rosebow', tokens: 25 }, { kind: 'item', id: 'loveglasses', tokens: 30 }, { kind: 'furniture', id: 'heartpillow', tokens: 30 }, { kind: 'furniture', id: 'loveletters', tokens: 20 }, { kind: 'furniture', id: 'rosebouquet', tokens: 25 }],
    finds: [{ id: 'pondrose', name: 'Pond Rose', icon: '🌹', rarity: 'uncommon' }, { id: 'loveletter', name: 'Message in a Bottle', icon: '💌', rarity: 'rare' }],
  },
  {
    id: 'spring', name: 'Spring Bloom', icon: '🌸', start: [4, 15], end: [5, 20],
    token: { name: 'Petals', icon: '🌸' },
    desc: 'Everything is blooming! Petals drift across the water and the bees are busy.',
    fx: ['🌸', '🌼', '🌸'], tint: '#ffd6e7',
    shop: [{ kind: 'item', id: 'flowercrown', tokens: 30 }, { kind: 'item', id: 'butterflywings', tokens: 40 }, { kind: 'furniture', id: 'flowerpot', tokens: 30 }, { kind: 'furniture', id: 'flowerbed', tokens: 30 }, { kind: 'furniture', id: 'butterflylamp', tokens: 35 }],
    finds: [{ id: 'bumblebee', name: 'Fuzzy Bumblebee', icon: '🐝', rarity: 'uncommon' }, { id: 'tulip', name: 'Rainbow Tulip', icon: '🌷', rarity: 'rare' }],
  },
  {
    id: 'summer', name: 'Summer Splash', icon: '☀️', start: [6, 15], end: [8, 31],
    token: { name: 'Sunbeams', icon: '☀️' },
    desc: 'Long sunny days, warm water and sandcastles. Perfect floating weather.',
    fx: ['☀️', '🫧', '✨'], tint: '#fff3bf',
    shop: [{ kind: 'item', id: 'sunhat', tokens: 30 }, { kind: 'item', id: 'lei', tokens: 25 }, { kind: 'item', id: 'swimsuit', tokens: 30 }, { kind: 'furniture', id: 'beachchair', tokens: 35 }, { kind: 'furniture', id: 'beachumbrella', tokens: 30 }, { kind: 'furniture', id: 'sandcastledecor', tokens: 25 }],
    finds: [{ id: 'sandcastle', name: 'Tiny Sandcastle', icon: '🏰', rarity: 'uncommon' }, { id: 'dolphin', name: 'Playful Dolphin', icon: '🐬', rarity: 'rare' }],
  },
  {
    id: 'spooky', name: 'Spooky Seas', icon: '🎃', start: [10, 1], end: [11, 7],
    token: { name: 'Ghost Pearls', icon: '👻' },
    desc: 'Fog rolls over the pond and something glows in the shipwreck… boo!',
    fx: ['🦇', '🍂', '👻'], tint: '#d0bfff',
    shop: [{ kind: 'item', id: 'witchhat', tokens: 35 }, { kind: 'item', id: 'batwings', tokens: 35 }, { kind: 'item', id: 'ghostsheet', tokens: 30 }, { kind: 'furniture', id: 'jackolantern', tokens: 30 }, { kind: 'furniture', id: 'hauntedlighthouse', tokens: 40 }],
    finds: [{ id: 'littlebat', name: 'Little Bat', icon: '🦇', rarity: 'uncommon' }, { id: 'ghostfish', name: 'Ghost Fish', icon: '👻', rarity: 'rare' }],
  },
  {
    id: 'harvest', name: 'Harvest Moon', icon: '🍁', start: [11, 8], end: [11, 30],
    token: { name: 'Golden Leaves', icon: '🍁' },
    desc: 'Crisp leaves, a big orange moon and cocoa by the den fire. Time to get cozy.',
    fx: ['🍁', '🍂', '🍁'], tint: '#ffd8a8',
    shop: [{ kind: 'item', id: 'acornhat', tokens: 30 }, { kind: 'item', id: 'leafscarf', tokens: 25 }, { kind: 'item', id: 'leafsweater', tokens: 35 }, { kind: 'furniture', id: 'pumpkinlamp', tokens: 30 }, { kind: 'furniture', id: 'pumpkinchair', tokens: 35 }, { kind: 'furniture', id: 'leafrug', tokens: 25 }],
    finds: [{ id: 'mapleleaf', name: 'Crimson Maple Leaf', icon: '🍁', rarity: 'uncommon' }, { id: 'harvestmouse', name: 'Harvest Mouse', icon: '🐭', rarity: 'rare' }],
  },
  {
    id: 'christmas', name: 'Starlight Christmas', icon: '🎄', start: [12, 20], end: [12, 30],
    token: { name: 'Jingle Bells', icon: '🔔' },
    desc: 'Stockings by the den fire and a twinkling tree on the lily pads. Give a gift to a friend!',
    fx: ['🎄', '❄️', '🎁'], tint: '#b2f2bb',
    shop: [{ kind: 'item', id: 'santahat', tokens: 30 }, { kind: 'item', id: 'elfhat', tokens: 25 }, { kind: 'item', id: 'elfsuit', tokens: 35 }, { kind: 'furniture', id: 'xmastree', tokens: 40 }, { kind: 'furniture', id: 'stockings', tokens: 25 }],
    finds: [{ id: 'jinglebell', name: 'Jingle Bell', icon: '🔔', rarity: 'uncommon' }, { id: 'startopper', name: 'Tree-Topper Star', icon: '🌟', rarity: 'rare' }],
  },
  {
    id: 'newyear', name: "New Year's Splash", icon: '🎆', start: [12, 31], end: [1, 10],
    token: { name: 'Sparklers', icon: '✨' },
    desc: 'Fireworks over the lighthouse and a toast to the year ahead. Make a wish on the first sunrise!',
    fx: ['🎆', '✨', '🎉'], tint: '#ffe8a3',
    shop: [{ kind: 'item', id: 'newyearcrown', tokens: 30 }, { kind: 'item', id: 'partybowtie', tokens: 25 }, { kind: 'furniture', id: 'fireworks', tokens: 30 }, { kind: 'furniture', id: 'goldgarland', tokens: 25 }],
    finds: [{ id: 'confetti', name: 'Confetti Shell', icon: '🎊', rarity: 'uncommon' }, { id: 'luckycoin', name: 'First-Sunrise Coin', icon: '🪙', rarity: 'rare' }],
  },
  {
    id: 'easter', name: 'Egg Hunt', icon: '🥚', start: [3, 20], end: [4, 14],
    token: { name: 'Painted Eggs', icon: '🥚' },
    desc: 'Somebody hid painted eggs all around the pond. Can you find them all?',
    fx: ['🥚', '🐣', '🌷'], tint: '#e5dbff',
    shop: [{ kind: 'item', id: 'bunnyears', tokens: 30 }, { kind: 'item', id: 'pastelhoodie', tokens: 30 }, { kind: 'furniture', id: 'eggbasket', tokens: 25 }, { kind: 'furniture', id: 'paintedeggs', tokens: 20 }],
    finds: [{ id: 'paintedegg', name: 'Painted Egg', icon: '🥚', rarity: 'uncommon' }, { id: 'goldenegg', name: 'Golden Egg', icon: '🪺', rarity: 'rare' }],
  },
  {
    id: 'ocean', name: 'Ocean Care Week', icon: '🌊', start: [6, 1], end: [6, 14],
    token: { name: 'Clean Waves', icon: '♻️' },
    desc: 'Marina is leading a beach clean-up and Shellby is teaching everyone about the reef. Every bit helps!',
    fx: ['🌊', '🐢', '💙'], tint: '#a5d8ff',
    shop: [{ kind: 'item', id: 'explorerhat', tokens: 30 }, { kind: 'item', id: 'explorervest', tokens: 30 }, { kind: 'furniture', id: 'coralgarden', tokens: 35 }, { kind: 'furniture', id: 'reefposter', tokens: 20 }],
    finds: [{ id: 'babyturtle', name: 'Hatchling Turtle', icon: '🐢', rarity: 'uncommon' }, { id: 'healthycoral', name: 'Healthy Coral', icon: '🪸', rarity: 'rare' }],
  },
  {
    id: 'pirate', name: 'Pirate Week', icon: '🏴‍☠️', start: [9, 12], end: [9, 26],
    token: { name: 'Doubloons', icon: '🪙' },
    desc: "Arr! Captain Barnacle has buried treasure somewhere on the map. Talk like a pirate, matey.",
    fx: ['🏴‍☠️', '🪙', '⚓'], tint: '#ffd8a8',
    shop: [{ kind: 'item', id: 'eyepatch', tokens: 25 }, { kind: 'furniture', id: 'treasurepile', tokens: 35 }, { kind: 'furniture', id: 'shipwheel', tokens: 30 }],
    finds: [{ id: 'doubloon', name: 'Gold Doubloon', icon: '🪙', rarity: 'uncommon' }, { id: 'jollyflag', name: 'Tattered Jolly Roger', icon: '🏴‍☠️', rarity: 'rare' }],
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
