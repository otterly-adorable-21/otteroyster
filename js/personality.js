// Pet personalities: traits grow from how you play, and every otter is born with
// a favorite snack, place and game. Shared by the website and the Discord bot.
import { SNACKS, GAME_LIST } from './data.js';
import { LOCATIONS } from './world.js';

export const TRAITS = {
  adventurous: { name: 'Adventurous', icon: '🧭', desc: 'Always looking for the next horizon.', perk: '+20% mission pearls and luckier discoveries', from: 'missions and exploring' },
  sleepy: { name: 'Sleepy', icon: '😴', desc: 'A champion napper. Five more minutes, please.', perk: 'Naps restore energy 30% faster', from: 'naps' },
  foodie: { name: 'Foodie', icon: '🍰', desc: 'Lives for the next snack.', perk: 'Snacks cheer them up more; favorite snacks twice as much', from: 'snacks' },
  social: { name: 'Social', icon: '💞', desc: 'Happiest with friends nearby.', perk: 'Hugs from friends cheer them up 50% more', from: 'hugs, gifts and visits' },
  competitive: { name: 'Competitive', icon: '🏆', desc: 'Plays every game to win.', perk: '+15% pearls from games', from: 'arcade and Discord games' },
  tidy: { name: 'Tidy', icon: '✨', desc: 'Fur always fluffy and spotless.', perk: 'Stays clean 30% longer', from: 'baths' },
};
export const TRAIT_IDS = Object.keys(TRAITS);

// A trait shows once its points reach this, and it's the highest.
export const TRAIT_MIN = 6;

// Favorites only come from the "always available" options, so every otter can enjoy them.
const FAV_SNACKS = SNACKS.map((s) => s.id);
const FAV_PLACES = LOCATIONS.filter((l) => l.level <= 2).map((l) => l.id);
const FAV_GAMES = GAME_LIST.map((g) => g.id);

function hash(n) {
  let h = 2166136261 ^ (n >>> 0) ^ Math.floor(n / 4294967296);
  for (let i = 0; i < 4; i++) { h ^= h >>> 13; h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Same otter (same birth time) -> same favorites, on any device.
export function favoritesFor(created) {
  const h = hash(Number(created) || 0);
  return {
    snack: FAV_SNACKS[h % FAV_SNACKS.length],
    place: FAV_PLACES[(h >>> 8) % FAV_PLACES.length],
    game: FAV_GAMES[(h >>> 16) % FAV_GAMES.length],
  };
}

export function blankPersona(created) {
  return { pts: Object.fromEntries(TRAIT_IDS.map((t) => [t, 0])), fav: favoritesFor(created) };
}

// The otter's main trait (or null while still discovering), plus a runner-up.
export function traitOf(s) {
  const pts = s.persona?.pts || {};
  const ranked = TRAIT_IDS.map((t) => [t, pts[t] || 0]).sort((a, b) => b[1] - a[1]);
  const [top, second] = ranked;
  if (top[1] < TRAIT_MIN) return { trait: null, also: null, ranked };
  return { trait: top[0], also: second[1] >= Math.max(TRAIT_MIN, top[1] * 0.6) ? second[0] : null, ranked };
}

export const hasTrait = (s, t) => traitOf(s).trait === t;
