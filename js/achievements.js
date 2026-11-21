// Achievements: badges with pearl rewards. `progress(s)` returns [have, need].
// Shared by the website and the Discord bot, so they unlock wherever you play.
import { GAME_LIST } from './data.js';
import { LOCATIONS, FINDS } from './world.js';
import { EVENT_FINDS } from './events.js';
import { FURNITURE } from './den-data.js';

const allFinds = { ...FINDS, ...EVENT_FINDS };
const totalFound = (s) => Object.entries(s.collection || {}).reduce((a, [id, n]) => a + (allFinds[id] ? n : 0), 0);
const uniqueFound = (s) => Object.keys(s.collection || {}).filter((id) => allFinds[id]).length;
const hasRarity = (s, r) => Object.keys(s.collection || {}).some((id) => allFinds[id]?.rarity === r);
const c = (s, k) => s.counters?.[k] || 0;

export const ACHIEVEMENTS = [
  { id: 'beachcomber', name: 'Beachcomber', icon: '🏖️', desc: 'Find 25 treasures', reward: 25, progress: (s) => [totalFound(s), 25] },
  { id: 'shellcollector', name: 'Shell Collector', icon: '🐚', desc: 'Discover 30 different things', reward: 60, progress: (s) => [uniqueFound(s), 30] },
  { id: 'curious', name: 'Curious Otter', icon: '🔍', desc: 'Explore 5 different places', reward: 25, progress: (s) => [Object.keys(s.explored || {}).length, 5] },
  { id: 'tidaltourist', name: 'Tidal Tourist', icon: '🗺️', desc: 'Explore every place on the map', reward: 50, progress: (s) => [LOCATIONS.filter((l) => s.explored?.[l.id]).length, LOCATIONS.length] },
  { id: 'socialbutterfly', name: 'Social Butterfly', icon: '🦋', desc: 'Make 10 friends', reward: 50, progress: (s) => [c(s, 'friends'), 10] },
  { id: 'nightowl', name: 'Night Owl', icon: '🦉', desc: 'Visit your otter at night', reward: 15, progress: (s) => [Math.min(1, c(s, 'night')), 1] },
  { id: 'oceanographer', name: 'Oceanographer', icon: '🐋', desc: 'Make 50 discoveries', reward: 50, progress: (s) => [totalFound(s), 50] },
  { id: 'treasurehunter', name: 'Treasure Hunter', icon: '💎', desc: 'Find a legendary treasure', reward: 50, progress: (s) => [hasRarity(s, 'legendary') ? 1 : 0, 1] },
  { id: 'gameenthusiast', name: 'Game Enthusiast', icon: '🎮', desc: 'Play every arcade game', reward: 40, progress: (s) => [GAME_LIST.filter((g) => s.plays?.[g.id]).length, GAME_LIST.length] },
  { id: 'goodneighbor', name: 'Good Neighbor', icon: '🏡', desc: 'Visit 20 different dens', reward: 50, progress: (s) => [(s.counters?.visited || []).length, 20] },
  { id: 'pearldiver', name: 'Pearl Diver', icon: '🦪', desc: 'Find your first rare discovery', reward: 25, progress: (s) => [hasRarity(s, 'rare') || hasRarity(s, 'legendary') ? 1 : 0, 1] },
  { id: 'creaturecomforts', name: 'Creature Comforts', icon: '🤗', desc: 'Care for your otter 100 times', reward: 40, progress: (s) => [c(s, 'care'), 100] },
  { id: 'decorator', name: 'Interior Designer', icon: '🛋️', desc: 'Have 12 things in your den', reward: 30, progress: (s) => [(s.den?.items || []).filter((p) => FURNITURE[p.id]).length, 12] },
  { id: 'fashionista', name: 'Fashionista', icon: '👗', desc: 'Own 8 outfits', reward: 30, progress: (s) => [(s.owned || []).length, 8] },
  { id: 'completionist', name: 'Completionist', icon: '🏅', desc: "Complete a place's collection", reward: 40, progress: (s) => [(s.sets || []).length ? 1 : 0, 1] },
  { id: 'grownotter', name: 'Grown Otter', icon: '⭐', desc: 'Reach level 10', reward: 50, progress: (s) => [Math.min(s.level, 10), 10] },
  { id: 'seasonalstar', name: 'Seasonal Star', icon: '🎉', desc: 'Get a limited event item', reward: 25, progress: (s) => [Object.values(s.events || {}).some((e) => e.bought?.length) ? 1 : 0, 1] },
  { id: 'cozycorner', name: 'Cozy Corner', icon: '✨', desc: 'Make your den 20 coziness', reward: 30, progress: null }, // filled in by core (needs coziness)
];

export const ACH = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
