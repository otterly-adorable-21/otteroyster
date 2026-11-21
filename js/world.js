// The world around the pond: places to explore, what lives there, and what you can do.
// Shared by the website (Explore tab) and the Discord bot (/explore, /collection).

export const RARITY = {
  common: { name: 'Common', weight: 60, color: '#9be8de', stars: '★' },
  uncommon: { name: 'Uncommon', weight: 28, color: '#a7c86a', stars: '★★' },
  rare: { name: 'Rare', weight: 10, color: '#c9a6e8', stars: '★★★' },
  legendary: { name: 'Legendary', weight: 2, color: '#f3d98c', stars: '★★★★' },
};

export const EXPLORE_ENERGY = 5;
export const EXPLORE_COOLDOWN_MIN = 20;
export const SET_REWARD = { pearls: 60, xp: 25 };

// x/y are positions on the map (viewBox 0 0 400 460).
export const LOCATIONS = [
  {
    id: 'lilypond', name: 'Lily Pond', icon: '🪷', level: 1, x: 196, y: 150,
    desc: "Home sweet home. Lily pads, dragonflies and your otter's cozy den under the bank.",
    missions: [], games: ['memory', 'bubbles'],
    finds: [
      { id: 'frog', name: 'Pond Frog', icon: '🐸', rarity: 'common' },
      { id: 'snail', name: 'Lily Snail', icon: '🐌', rarity: 'common' },
      { id: 'ladybug', name: 'Ladybug', icon: '🐞', rarity: 'uncommon' },
      { id: 'duckling', name: 'Lost Duckling', icon: '🦆', rarity: 'rare' },
      { id: 'lotus', name: 'Moon Lotus', icon: '🪷', rarity: 'legendary' },
    ],
  },
  {
    id: 'willow', name: 'Willow Grove', icon: '🌿', level: 1, x: 78, y: 78,
    desc: 'Curtains of willow leaves and glowing fireflies. Something rustles in the roots…',
    missions: ['kelp'], games: ['hop', 'words'],
    finds: [
      { id: 'acorn', name: 'Shiny Acorn', icon: '🌰', rarity: 'common' },
      { id: 'mushroom', name: 'Glow Mushroom', icon: '🍄', rarity: 'common' },
      { id: 'butterfly', name: 'Willow Butterfly', icon: '🦋', rarity: 'uncommon' },
      { id: 'owl', name: 'Sleepy Owl', icon: '🦉', rarity: 'rare' },
      { id: 'firefly', name: 'Firefly Queen', icon: '✨', rarity: 'legendary' },
    ],
  },
  {
    id: 'tidepools', name: 'Tide Pools', icon: '🦀', level: 1, x: 86, y: 286,
    desc: 'Rocky pools left behind by the tide, full of tiny surprises.',
    missions: ['tide'], games: ['crabs', 'shuffle'],
    finds: [
      { id: 'crab', name: 'Hermit Crab', icon: '🦀', rarity: 'common' },
      { id: 'spiral', name: 'Spiral Shell', icon: '🐚', rarity: 'common' },
      { id: 'seastar', name: 'Sea Star', icon: '⭐', rarity: 'uncommon' },
      { id: 'shrimp', name: 'Candy Shrimp', icon: '🦐', rarity: 'rare' },
      { id: 'seaglass', name: 'Mermaid Sea Glass', icon: '💠', rarity: 'legendary' },
    ],
  },
  {
    id: 'lighthouse', name: 'Lighthouse Point', icon: '🗼', level: 2, x: 322, y: 112,
    desc: 'A windy cliff with an old lighthouse. Gulls circle, and the fishing is excellent.',
    missions: [], games: ['fishing', 'dive'],
    finds: [
      { id: 'feather', name: 'Gull Feather', icon: '🪶', rarity: 'common' },
      { id: 'gull', name: 'Cheeky Seagull', icon: '🐦', rarity: 'common' },
      { id: 'compass', name: 'Brass Compass', icon: '🧭', rarity: 'uncommon' },
      { id: 'seal', name: 'Harbor Seal', icon: '🦭', rarity: 'rare' },
      { id: 'lens', name: 'Lighthouse Lens', icon: '🔆', rarity: 'legendary' },
    ],
  },
  {
    id: 'shipwreck', name: 'Shipwreck Cove', icon: '⚓', level: 2, x: 306, y: 300,
    desc: 'The bones of an old ship rest in the shallows. Treasure hunters welcome.',
    missions: ['wreck'], games: ['dive', 'pop'],
    finds: [
      { id: 'coin', name: 'Old Coin', icon: '🪙', rarity: 'common' },
      { id: 'anchor', name: 'Tiny Anchor', icon: '⚓', rarity: 'common' },
      { id: 'key', name: 'Brass Key', icon: '🗝️', rarity: 'uncommon' },
      { id: 'map', name: 'Treasure Map', icon: '🗺️', rarity: 'rare' },
      { id: 'parrot', name: "Captain's Parrot", icon: '🦜', rarity: 'legendary' },
    ],
  },
  {
    id: 'reef', name: 'Pearl Reef', icon: '🐠', level: 3, x: 186, y: 372,
    desc: 'Warm, bright water and coral in every color. Oysters here grow the finest pearls.',
    missions: ['reef'], games: ['frenzy', 'pop'],
    finds: [
      { id: 'clownfish', name: 'Clownfish', icon: '🐠', rarity: 'common' },
      { id: 'puffer', name: 'Pufferfish', icon: '🐡', rarity: 'common' },
      { id: 'turtle', name: 'Sea Turtle', icon: '🐢', rarity: 'uncommon' },
      { id: 'squid', name: 'Shy Squid', icon: '🦑', rarity: 'rare' },
      { id: 'rainbowpearl', name: 'Rainbow Pearl', icon: '🌈', rarity: 'legendary' },
    ],
  },
  {
    id: 'trench', name: 'Moonlit Trench', icon: '🌙', level: 5, x: 324, y: 420,
    desc: 'Deep, dark and glowing. Only brave, well-rested otters dive this far.',
    missions: ['trench'], games: ['frenzy', 'fishing'],
    finds: [
      { id: 'lobster', name: 'Deep Lobster', icon: '🦞', rarity: 'common' },
      { id: 'octopus', name: 'Night Octopus', icon: '🐙', rarity: 'uncommon' },
      { id: 'orb', name: 'Glow Orb', icon: '🔮', rarity: 'uncommon' },
      { id: 'whale', name: 'Singing Whale', icon: '🐋', rarity: 'rare' },
      { id: 'moonshard', name: 'Moon Shard', icon: '🌙', rarity: 'legendary' },
    ],
  },
];

export const LOC = Object.fromEntries(LOCATIONS.map((l) => [l.id, l]));
export const FINDS = Object.fromEntries(LOCATIONS.flatMap((l) => l.finds.map((f) => [f.id, { ...f, loc: l.id }])));
export const TOTAL_FINDS = Object.keys(FINDS).length;

// Which place a mission belongs to.
export const MISSION_LOC = Object.fromEntries(LOCATIONS.flatMap((l) => l.missions.map((m) => [m, l.id])));

// Paths drawn between places on the map.
export const ROUTES = [
  ['lilypond', 'willow'], ['lilypond', 'tidepools'], ['lilypond', 'lighthouse'],
  ['lilypond', 'shipwreck'], ['tidepools', 'reef'], ['shipwreck', 'reef'], ['shipwreck', 'trench'],
];
