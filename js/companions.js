// Pet companions: little pond friends that tag along with your otter.
// Each has a perk that switches on once you've bonded (bond >= BOND_PERK).
// Shared by the website and the Discord bot.

export const BOND_PERK = 25;
export const BOND_MAX = 100;
export const PLAY_COOLDOWN = 2 * 3600000;
export const TREAT_PRICE = 5;
export const TREAT_COOLDOWN = 4 * 3600000; // one treat every 4 hours, so bonds grow over time
export const BOND_DECAY_PER_DAY = 6; // only after a day without play

export const COMPANIONS = {
  duckling: { name: 'Duckling', icon: '🐥', price: 80, level: 1, perk: 'Your otter gets lonely 20% slower', desc: 'Peeps happily and follows your otter everywhere.' },
  crab: { name: 'Hermit Crab', icon: '🦀', price: 120, level: 2, perk: '+25% pearls found while exploring', desc: 'Always shopping for a fancier shell.' },
  frog: { name: 'Lily Frog', icon: '🐸', price: 150, level: 3, perk: 'Rare discoveries are 15% more likely', desc: 'Has a nose for treasure. And flies.' },
  turtle: { name: 'Sea Turtle', icon: '🐢', price: 200, level: 4, perk: 'Missions finish 15% faster', desc: 'Slow and steady, but knows every shortcut.' },
  starfish: { name: 'Starfish', icon: '⭐', price: 220, level: 5, perk: '+10% pearls from arcade games', desc: 'Cheers loudly (for a starfish).' },
  seahorse: { name: 'Seahorse', icon: '🐴', price: 260, level: 6, perk: 'Garden plants grow 20% faster', desc: 'Loves tending the garden.' },
  firefly: { name: 'Firefly', icon: '✨', price: 300, level: 8, perk: '+4 den coziness', desc: 'A tiny night-light with wings.' },
  octopus: { name: 'Baby Octopus', icon: '🐙', price: 400, level: 10, perk: 'Naps restore energy 20% faster', desc: 'Gives the best eight-armed hugs.' },
  jellyfish: { name: 'Jellyfish', icon: '🪼', price: 180, level: 4, perk: 'Moonlit Trench explores are 20% luckier', desc: 'Glows softly and bobs along. No brain, all heart.' },
  seal: { name: 'Baby Seal', icon: '🦭', price: 240, level: 5, perk: 'Baths get your otter 25% cleaner', desc: 'Claps for absolutely everything you do.' },
  puffin: { name: 'Puffin', icon: '🐧', price: 230, level: 5, perk: 'You can explore a place again 20% sooner', desc: 'A stylish seabird with a very serious face.' },
  axolotl: { name: 'Axolotl', icon: '🦎', price: 320, level: 7, perk: 'Your otter gets hungry 15% slower', desc: 'Always smiling. Nobody knows why.' },
  minnow: { name: 'Little Fish', icon: '🐟', price: 90, level: 1, perk: 'Garden harvests give 15% more pearls', desc: 'Small, silver and endlessly enthusiastic.' },
  snail: { name: 'Snail', icon: '🐌', price: 60, level: 1, perk: '+10 pearls in your daily gift', desc: 'Takes it slow. Very, very slow.' },
  butterfly: { name: 'Butterfly', icon: '🦋', price: 140, level: 3, perk: 'Cuddles cheer your otter up twice as much', desc: 'Lands on your otter\'s nose at every chance.' },
  moth: { name: 'Moon Moth', icon: '🌙', price: 200, level: 6, perk: 'Night explores are 20% luckier', desc: 'Follows the lamplight and the moonlight.' },
  ghostcrab: { name: 'Ghost Crab', icon: '👻', price: 260, level: 6, perk: 'Find 50% more trinkets while exploring', desc: 'Pale as sand and quick as a wink. A born beachcomber.' },
};

// ---------- personalising your companion ----------
// Colors are free; accessories are bought once and
// can go on any of your companions.
export const COMP_COLORS = { natural: { name: 'Natural', hue: 0 }, sunset: { name: 'Sunset', hue: 330, tint: '#ff8787' }, ocean: { name: 'Ocean', hue: 180, tint: '#4dabf7' }, mint: { name: 'Mint', hue: 110, tint: '#38d9a9' }, lilac: { name: 'Lilac', hue: 250, tint: '#b197fc' }, golden: { name: 'Golden', hue: 40, tint: '#fcc419' } };
// Painted color skins: assets/art/companions/<id><skin>.png (e.g. axolotlnavy.png).
// Any such picture is picked up automatically (see registerSkinArt); SKIN_NAMES gives
// each a proper name, otherwise one is made from the file name ("purpleblue" -> "Purple & Blue").
// Companions without any skins get the tinted COMP_COLORS instead.
export const SKIN_NAMES = {
  axolotl: { black: 'Midnight', blackblue: 'Glowtail', brown: 'Cocoa', green: 'Lime Glow', mauve: 'Dusty Rose', navy: 'Deep Sea' },
  crab: { coral: 'Coral Reef', orange: 'Tropical', peach: 'Peach Sorbet', red: 'Ruby', teal: 'Lagoon' },
  frog: { brown: 'Mudpuddle', green: 'Mossy', purple: 'Galaxy', red: 'Ember', teal: 'Aquamarine' },
  ghostcrab: { coral: 'Pink Sand', golden: 'Golden Hour', ocean: 'Tidepool', red: 'Rust', sunset: 'Dusk' },
  firefly: { blue: 'Bonfire', green: 'Limelight', purple: 'Twilight', purpleblue: 'Moonbeam', red: 'Rosehip' },
  puffin: { blue: 'Seafoam', neon: 'Rainbow', plum: 'Plum', purple: 'Lavender', red: 'Cranberry' },
};
const COLOR_WORDS = ['black', 'white', 'grey', 'gray', 'silver', 'gold', 'golden', 'yellow', 'orange', 'red', 'pink', 'rose', 'coral', 'peach', 'brown', 'tan', 'cream', 'green', 'mint', 'lime', 'teal', 'blue', 'navy', 'ocean', 'sky', 'purple', 'violet', 'lilac', 'plum', 'mauve', 'neon', 'sunset', 'rainbow', 'dark', 'light'];
export function skinName(skin) {
  const words = [];
  let rest = skin;
  while (rest) {
    const w = COLOR_WORDS.filter((c) => rest.startsWith(c)).sort((a, b) => b.length - a.length)[0] || rest;
    words.push(w[0].toUpperCase() + w.slice(1));
    rest = rest.slice(w.length);
  }
  const isColor = (w) => COLOR_WORDS.includes(w.toLowerCase());
  return words.length === 2 && words.every(isColor) ? `${words[0]} & ${words[1]}` : words.join(' ');
}
// Skins found among the uploaded pictures: { companionId: [skin, ...] }.
const FOUND = {};
export function registerSkinArt(keys) {
  for (const k of Object.keys(FOUND)) delete FOUND[k];
  const ids = Object.keys(COMPANIONS).sort((a, b) => b.length - a.length); // ghostcrab before crab
  for (const key of keys) {
    const m = /^companions\/([a-z]+)$/.exec(key);
    if (!m) continue;
    const id = ids.find((c) => m[1].startsWith(c) && m[1] !== c);
    if (!id || COMPANIONS[m[1]]) continue;
    (FOUND[id] ||= []).push(m[1].slice(id.length));
  }
}
export const COMP_SKINS = new Proxy({}, {
  get: (_, id) => {
    const skins = [...new Set([...Object.keys(SKIN_NAMES[id] || {}), ...(FOUND[id] || [])])];
    return skins.length ? Object.fromEntries(skins.map((k) => [k, SKIN_NAMES[id]?.[k] || skinName(k)])) : undefined;
  },
});
// The colors one companion can wear: { id: name }.
export const colorsFor = (id) => (COMP_SKINS[id] ? { natural: 'Natural', ...COMP_SKINS[id] } : Object.fromEntries(Object.entries(COMP_COLORS).map(([k, v]) => [k, v.name])));
export const skinArtKey = (id, color) => (color && color !== 'natural' && COMP_SKINS[id]?.[color] ? `companions/${id}${color}` : null);
export const COMP_ACCS = {
  bow: { name: 'Little Bow', icon: '🎀', price: 30 },
  tophat: { name: 'Teeny Top Hat', icon: '🎩', price: 50 },
  flowers: { name: 'Flower Crown', icon: '🌸', price: 40 },
  bandana: { name: 'Bandana', icon: '🧣', price: 35 },
  specs: { name: 'Round Specs', icon: '👓', price: 40 },
  crown: { name: 'Tiny Crown', icon: '👑', price: 80 },
};
export const COMP_TRAITS = {
  playful: { name: 'Playful', icon: '🎾', anim: 'hop', line: 'wants to play right now!' },
  shy: { name: 'Shy', icon: '🙈', anim: 'peek', line: 'is peeking at you from behind your otter.' },
  brave: { name: 'Brave', icon: '🛡️', anim: 'march', line: 'is guarding the den very seriously.' },
  sleepy: { name: 'Sleepy', icon: '💤', anim: 'snooze', line: 'is taking another little nap.' },
  curious: { name: 'Curious', icon: '🔎', anim: 'look', line: 'is sniffing at something interesting.' },
  sassy: { name: 'Sassy', icon: '💅', anim: 'wiggle', line: 'is doing a little dance.' },
};
export const COMP_TRAIT_IDS = Object.keys(COMP_TRAITS);

export const COMPANION_IDS = Object.keys(COMPANIONS);

export const bondLevel = (bond) => (bond >= 90 ? 5 : bond >= 65 ? 4 : bond >= 40 ? 3 : bond >= BOND_PERK ? 2 : 1);
export const BOND_NAMES = ['', 'New friends', 'Buddies', 'Close pals', 'Best friends', 'Inseparable'];
