// Legacy: long-term goals for elder otters. Progress counts from day one, and
// once your otter is a Wise Otter (level 20) you can claim tiers for pearls,
// Legacy stars, Legend ranks and titles. Shared by the website and Discord.
import { FINDS } from './world.js';
import { EVENT_FINDS } from './events.js';
import { TOTAL_PAGES } from './lore.js';
import { COMPANION_IDS } from './companions.js';

export const LEGACY_LEVEL = 20;
export const TIERS = [
  { name: 'Bronze', icon: '🥉', pearls: 50 },
  { name: 'Silver', icon: '🥈', pearls: 120 },
  { name: 'Gold', icon: '🥇', pearls: 250 },
  { name: 'Pearl', icon: '🦪', pearls: 500 },
];

const allFinds = { ...FINDS, ...EVENT_FINDS };
const c = (s, k) => s.counters?.[k] || 0;

export const MASTERIES = [
  { id: 'explorer', name: 'Explorer', icon: '🧭', title: 'the Explorer', desc: 'Different discoveries found', goals: [20, 30, 40, Object.keys(allFinds).length], value: (s) => Object.keys(s.collection || {}).filter((id) => allFinds[id]).length },
  { id: 'voyager', name: 'Voyager', icon: '🗺️', title: 'the Voyager', desc: 'Trips: explores and missions', goals: [50, 200, 500, 1200], value: (s) => c(s, 'explores') + c(s, 'missions') },
  { id: 'gardener', name: 'Gardener', icon: '🌻', title: 'the Green-Pawed', desc: 'Garden harvests', goals: [10, 50, 150, 400], value: (s) => c(s, 'harvests') },
  { id: 'caretaker', name: 'Caretaker', icon: '🤗', title: 'the Kind', desc: 'Times you cared for your otter', goals: [200, 600, 1500, 4000], value: (s) => c(s, 'care') },
  { id: 'companion', name: 'Beast Friend', icon: '🐾', title: 'Friend of Creatures', desc: 'Companions who are your best friends (bond 90+)', goals: [1, 3, 5, COMPANION_IDS.length], value: (s) => Object.values(s.companions?.owned || {}).filter((x) => x.bond >= 90).length },
  { id: 'socialite', name: 'Socialite', icon: '💞', title: 'the Beloved', desc: 'Friends made', goals: [3, 10, 20, 40], value: (s) => c(s, 'friends') },
  { id: 'gamer', name: 'Arcade Ace', icon: '🎮', title: 'the Arcade Ace', desc: 'Games played', goals: [50, 200, 600, 1500], value: (s) => Object.values(s.plays || {}).reduce((a, b) => a + b, 0) },
  { id: 'scholar', name: 'Scholar', icon: '📜', title: 'the Lorekeeper', desc: 'Lore Book pages', goals: [8, 20, 32, TOTAL_PAGES], value: (s) => (s.lore?.pages || []).length },
  { id: 'decorator', name: 'Homemaker', icon: '🛋️', title: 'the Cozy', desc: 'Furniture and decorations owned', goals: [15, 30, 50, 80], value: (s) => Object.values(s.furniture || {}).reduce((a, b) => a + b, 0) + (s.doorItems || []).length },
];
export const MASTERY = Object.fromEntries(MASTERIES.map((m) => [m.id, m]));

// Legend ranks from total Legacy stars (one per claimed tier, 36 in all).
export const RANKS = [
  { stars: 0, name: 'Wise Otter', icon: '🦉' },
  { stars: 3, name: 'Pond Elder', icon: '🌿' },
  { stars: 7, name: 'Keeper of Tides', icon: '🌊' },
  { stars: 12, name: 'Willow Sage', icon: '🍃' },
  { stars: 17, name: 'Guardian of the Reef', icon: '🐚' },
  { stars: 22, name: 'Moonlit Elder', icon: '🌙' },
  { stars: 28, name: 'Living Legend', icon: '🌟' },
  { stars: 34, name: 'Spirit of the Pond', icon: '✨' },
];

export const tierReached = (m, s) => m.goals.filter((g) => m.value(s) >= g).length;
export const legacyStars = (s) => Object.values(s.legacy?.claimed || {}).reduce((a, b) => a + b, 0);
export const rankOf = (stars) => [...RANKS].reverse().find((r) => stars >= r.stars);
export const nextRank = (stars) => RANKS.find((r) => r.stars > stars) || null;
