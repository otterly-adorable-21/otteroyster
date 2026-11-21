// Static game content: clothes, snacks, missions, minigames.
// Clothing SVG is drawn in the otter's coordinate space (viewBox "0 -20 200 250").
// Head is centred at (100, 82) r44, eyes at (83, 76) and (117, 76), neck around y≈120.

function heart(cx, cy, fill) {
  return `<path d="M${cx},${cy + 9} C${cx - 18},${cy - 2} ${cx - 11},${cy - 15} ${cx},${cy - 6} C${cx + 11},${cy - 15} ${cx + 18},${cy - 2} ${cx},${cy + 9} Z" fill="${fill}" stroke="#c2255c" stroke-width="2"/>`;
}

function flower(cx, cy) {
  let petals = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    petals += `<circle cx="${(cx + Math.cos(a) * 9).toFixed(1)}" cy="${(cy + Math.sin(a) * 9).toFixed(1)}" r="7" fill="#ff8fab"/>`;
  }
  return `${petals}<circle cx="${cx}" cy="${cy}" r="5.5" fill="#ffd43b"/>`;
}

function pearlStrand() {
  let s = '';
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    // quadratic curve (66,114) -> (100,138) -> (134,114)
    const x = (1 - t) ** 2 * 66 + 2 * (1 - t) * t * 100 + t ** 2 * 134;
    const y = (1 - t) ** 2 * 114 + 2 * (1 - t) * t * 138 + t ** 2 * 114;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i === 6 ? 6 : 4}" fill="#fff9f0" stroke="#d8c8b8" stroke-width="1"/>`;
  }
  return s;
}

function stars() {
  const pts = [[48, 170], [150, 150], [60, 205], [156, 196], [44, 138], [160, 124]];
  return pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#fff3bf"/>`).join('');
}

export const SLOTS = [
  { id: 'hat', name: 'Hats' },
  { id: 'eyes', name: 'Eyewear' },
  { id: 'neck', name: 'Neckwear' },
  { id: 'back', name: 'Extras' },
];

// price: null => can only be found on missions.
export const ITEMS = {
  partyhat: {
    name: 'Party Hat', icon: '🎉', slot: 'hat', price: 30, level: 1,
    svg: `<polygon points="80,44 120,44 100,-2" fill="#ff6fa8" stroke="#c2185b" stroke-width="2" stroke-linejoin="round"/>
      <path d="M86,30 L114,30 M93,15 L107,15" stroke="#ffe066" stroke-width="4" stroke-linecap="round"/>
      <circle cx="100" cy="-4" r="7" fill="#ffe066"/>`,
  },
  flower: {
    name: 'Sea Blossom', icon: '🌸', slot: 'hat', price: 25, level: 1,
    view: '108 20 52 52',
    svg: flower(134, 44),
  },
  beanie: {
    name: 'Cozy Beanie', icon: '🧢', slot: 'hat', price: 45, level: 1,
    svg: `<path d="M58,54 Q58,8 100,6 Q142,8 142,54 Z" fill="#4dabf7"/>
      <path d="M72,20 L72,50 M86,10 L86,50 M100,7 L100,50 M114,10 L114,50 M128,20 L128,50" stroke="#339af0" stroke-width="3"/>
      <rect x="54" y="44" width="92" height="15" rx="7.5" fill="#1c7ed6"/>
      <circle cx="100" cy="4" r="10" fill="#e7f5ff"/>`,
  },
  captain: {
    name: "Captain's Cap", icon: '⚓', slot: 'hat', price: null, level: 1,
    svg: `<path d="M60,46 Q62,12 100,10 Q138,12 140,46 Z" fill="#f8f9fa" stroke="#343a40" stroke-width="2"/>
      <rect x="56" y="40" width="88" height="11" rx="3" fill="#212529"/>
      <path d="M66,50 Q100,66 134,50 Z" fill="#212529"/>
      <circle cx="100" cy="27" r="8" fill="#fcc419" stroke="#e67700" stroke-width="2"/>
      <path d="M100,21 L100,33 M95,30 Q100,35 105,30" stroke="#e67700" stroke-width="1.6" fill="none"/>`,
  },
  crown: {
    name: 'Tide Crown', icon: '👑', slot: 'hat', price: null, level: 1,
    svg: `<polygon points="70,44 70,14 83,28 92,6 100,24 108,6 117,28 130,14 130,44" fill="#ffd43b" stroke="#e67700" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="100" cy="36" r="5" fill="#e03131"/>
      <circle cx="83" cy="37" r="3.5" fill="#4dabf7"/><circle cx="117" cy="37" r="3.5" fill="#4dabf7"/>`,
  },
  sunglasses: {
    name: 'Cool Shades', icon: '🕶️', slot: 'eyes', price: 40, level: 1,
    svg: `<rect x="67" y="66" width="32" height="21" rx="9" fill="#212529"/>
      <rect x="101" y="66" width="32" height="21" rx="9" fill="#212529"/>
      <path d="M97,72 L103,72" stroke="#212529" stroke-width="3"/>
      <path d="M72,71 L81,71 M106,71 L115,71" stroke="#fff" stroke-opacity=".55" stroke-width="2.5" stroke-linecap="round"/>`,
  },
  hearts: {
    name: 'Heart Specs', icon: '💖', slot: 'eyes', price: 55, level: 2,
    svg: `${heart(83, 78, '#ff8fab')}${heart(117, 78, '#ff8fab')}<path d="M95,74 L105,74" stroke="#c2255c" stroke-width="2.5"/>`,
  },
  monocle: {
    name: 'Fancy Monocle', icon: '🧐', slot: 'eyes', price: null, level: 1,
    view: '98 58 46 80',
    svg: `<circle cx="117" cy="76" r="12" fill="#e7f5ff" fill-opacity=".35" stroke="#e67700" stroke-width="3"/>
      <path d="M127,84 Q140,110 128,132" stroke="#e67700" stroke-width="1.6" fill="none"/>`,
  },
  goggles: {
    name: 'Dive Goggles', icon: '🤿', slot: 'eyes', price: null, level: 1,
    svg: `<path d="M56,74 L144,74" stroke="#0b7285" stroke-width="6"/>
      <circle cx="83" cy="76" r="14" fill="#99e9f2" fill-opacity=".55" stroke="#1098ad" stroke-width="4"/>
      <circle cx="117" cy="76" r="14" fill="#99e9f2" fill-opacity=".55" stroke="#1098ad" stroke-width="4"/>
      <path d="M76,70 L80,67 M110,70 L114,67" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
  },
  bowtie: {
    name: 'Bow Tie', icon: '🎀', slot: 'neck', price: 20, level: 1,
    view: '72 104 56 36',
    svg: `<polygon points="100,122 78,110 78,134" fill="#e03131" stroke="#a61e1e" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="100,122 122,110 122,134" fill="#e03131" stroke="#a61e1e" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="100" cy="122" r="5.5" fill="#c92a2a"/>`,
  },
  scarf: {
    name: 'Knit Scarf', icon: '🧣', slot: 'neck', price: 35, level: 1,
    svg: `<path d="M60,110 Q100,130 140,110 L140,124 Q100,144 60,124 Z" fill="#f76707"/>
      <path d="M116,128 L126,170 L112,172 L104,132 Z" fill="#e8590c"/>
      <path d="M115,150 L124,149 M117,160 L125,159" stroke="#ffd8a8" stroke-width="3"/>`,
  },
  pearls: {
    name: 'Pearl Necklace', icon: '📿', slot: 'neck', price: 120, level: 3,
    view: '58 104 84 42',
    svg: pearlStrand(),
  },
  balloon: {
    name: 'Bubble Balloon', icon: '🎈', slot: 'back', price: 30, level: 1,
    view: '132 -6 60 150',
    svg: `<path d="M150,150 Q176,100 166,44" stroke="#868e96" stroke-width="1.6" fill="none"/>
      <ellipse cx="166" cy="20" rx="19" ry="23" fill="#ff8787"/>
      <polygon points="166,42 161,49 171,49" fill="#fa5252"/>
      <ellipse cx="159" cy="12" rx="5" ry="8" fill="#fff" fill-opacity=".5"/>`,
  },
  cape: {
    name: 'Hero Cape', icon: '🦸', slot: 'back', price: 80, level: 2,
    view: '24 100 152 130',
    svg: `<path d="M64,110 Q28,170 32,226 L168,226 Q172,170 136,110 Z" fill="#7048e8"/>
      <path d="M64,110 Q100,122 136,110" stroke="#5f3dc4" stroke-width="5" fill="none"/>`,
  },
  starcape: {
    name: 'Starlight Cape', icon: '🌌', slot: 'back', price: null, level: 1,
    view: '24 100 152 130',
    svg: `<path d="M64,110 Q26,170 30,226 L170,226 Q174,170 136,110 Z" fill="#1b2a6b"/>${stars()}
      <path d="M64,110 Q100,122 136,110" stroke="#ffd43b" stroke-width="4" fill="none"/>`,
  },
};

export const SNACKS = [
  { id: 'kelp', name: 'Kelp Chips', icon: '🥬', price: 0, hunger: 12, happiness: 0 },
  { id: 'clam', name: 'Clam', icon: '🐚', price: 5, hunger: 25, happiness: 5 },
  { id: 'fish', name: 'Fresh Fish', icon: '🐟', price: 12, hunger: 40, happiness: 10 },
  { id: 'cake', name: 'Oyster Cake', icon: '🍰', price: 25, hunger: 50, happiness: 25 },
];

export const MISSIONS = [
  {
    id: 'kelp', name: 'Kelp Forest Patrol', icon: '🌿', minutes: 1, energy: 10, level: 1,
    pearls: [5, 10], xp: 8, loot: [],
    stories: [
      'swam loops around the kelp and found a few shiny bits.',
      'chased a very slow snail and called it a win.',
      'counted kelp stalks and lost track at "lots".',
    ],
  },
  {
    id: 'tide', name: 'Tide Pool Survey', icon: '🦀', minutes: 5, energy: 20, level: 1,
    pearls: [15, 30], xp: 15, loot: [['flower', 0.3]],
    stories: [
      'made friends with a hermit crab who traded a pearl for a pebble.',
      'poked every anemone (gently) and catalogued them all.',
      'found a secret pool full of starfish.',
    ],
  },
  {
    id: 'wreck', name: 'Shipwreck Salvage', icon: '⚓', minutes: 20, energy: 35, level: 2,
    pearls: [40, 75], xp: 30, loot: [['captain', 0.35], ['monocle', 0.2]],
    stories: [
      "explored the captain's quarters of an old sunken ship.",
      'dodged a grumpy eel and found a treasure chest.',
      'sorted through barnacle-covered crates for valuables.',
    ],
  },
  {
    id: 'reef', name: 'Pearl Reef Expedition', icon: '🐠', minutes: 60, energy: 50, level: 3,
    pearls: [100, 160], xp: 60, loot: [['goggles', 0.4], ['crown', 0.12]],
    stories: [
      'dove deep into the glittering reef and cracked open dozens of oysters.',
      'followed a school of fish to a hidden pearl bed.',
      'helped a sea turtle and was rewarded handsomely.',
    ],
  },
  {
    id: 'trench', name: 'Moonlit Trench Dive', icon: '🌙', minutes: 180, energy: 70, level: 5,
    pearls: [250, 400], xp: 120, loot: [['starcape', 0.35], ['crown', 0.35]],
    stories: [
      'dove into the glowing trench under the full moon and returned starry-eyed.',
      'met a wise old anglerfish who shared ancient treasure.',
      'surfed a moonbeam all the way back home.',
    ],
  },
];

export const GAMES = [
  { id: 'dive', name: 'Oyster Dive', icon: '🦪', energy: 10, desc: 'Catch falling oysters and pearls. Dodge the spiky urchins!' },
  { id: 'memory', name: 'Shell Match', icon: '🐚', energy: 10, desc: 'Flip shells to find matching pairs in as few moves as you can.' },
];

export const NAME_IDEAS = ['Pebble', 'Kelpie', 'Barnacle', 'Mochi', 'Clamsy', 'Biscuit', 'Waffles', 'Nori', 'Pippin', 'Marbles'];
