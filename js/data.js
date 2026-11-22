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

import { MORE_ITEMS, MORE_SLOTS } from './catalog-clothes.js';
import { BATCH2_ITEMS, BATCH2_FURNITURE, BATCH2_DOOR } from './catalog-more.js';
export { BATCH2_FURNITURE, BATCH2_DOOR };

export const SLOTS = [
  { id: 'hat', name: 'Hats' },
  { id: 'body', name: 'Clothing' },
  { id: 'eyes', name: 'Eyewear' },
  { id: 'neck', name: 'Neckwear' },
  { id: 'acc', name: 'Accessories' },
  { id: 'back', name: 'Extras' },
  { id: 'feet', name: 'Footwear' },
];
export { MORE_SLOTS };

// price: null => can only be found on missions.
export const ITEMS = {
  partyhat: {
    name: 'Party Hat', icon: '🎉', slot: 'hat', price: 30, level: 1, birthday: true,
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
  flowerlei: {
    name: 'Flower Lei', icon: '💐', slot: 'neck', price: 60, level: 1,
    view: '52 100 96 48',
    // Drawn stand-in; the real picture is assets/art/clothes/flowerlei.png.
    svg: [[60, 118, '#f4a6b8'], [68, 126, '#5c4dd6'], [76, 122, '#3cc7e0'], [84, 130, '#f0a030'], [92, 126, '#e9d83a'], [100, 132, '#f4a6b8'], [108, 126, '#3cc7e0'], [116, 130, '#f0a030'], [124, 126, '#e9d83a'], [132, 128, '#5c4dd6'], [140, 118, '#f0a030']]
      .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="6" fill="${c}"/><circle cx="${x}" cy="${y}" r="1.6" fill="#fff8" />`).join(''),
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
  // ----- seasonal event items (bought with event tokens; see js/events.js) -----
  acornhat: {
    name: 'Acorn Cap', icon: '🌰', slot: 'hat', price: null, level: 1, event: 'harvest',
    svg: `<path d="M56,58 Q56,14 100,12 Q144,14 144,58 Q100,46 56,58Z" fill="#8a5a3b" stroke="#5a3a24" stroke-width="2"/>
      <path d="M66,46 L82,20 M80,50 L96,16 M96,48 L110,16 M112,48 L124,20 M126,50 L136,32 M70,30 L134,46 M64,42 L140,40 M80,18 L124,30" stroke="#6b4329" stroke-width="2" opacity=".7"/>
      <path d="M100,12 Q98,2 106,-4" stroke="#5a3a24" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  },
  leafscarf: {
    name: 'Autumn Leaf Scarf', icon: '🍂', slot: 'neck', price: null, level: 1, event: 'harvest',
    svg: `<path d="M60,110 Q100,130 140,110 L140,124 Q100,144 60,124 Z" fill="#c2552d"/>
      <path d="M116,128 L124,166 L110,168 L104,132 Z" fill="#a8441f"/>
      ${[[72, 118, -20, '#f2a530'], [96, 126, 10, '#e8590c'], [122, 120, 30, '#f2c14e'], [117, 154, 0, '#f2a530']].map(([x, y, r, c]) => `<path transform="translate(${x} ${y}) rotate(${r})" d="M0,-7 L2,-2 L7,-3 L4,1 L6,6 L0,3 L-6,6 L-4,1 L-7,-3 L-2,-2Z" fill="${c}"/>`).join('')}`,
  },
  earmuffs: {
    name: 'Snowflake Earmuffs', icon: '❄️', slot: 'hat', price: null, level: 1, event: 'lantern',
    svg: `<path d="M60,54 Q60,18 100,16 Q140,18 140,54" stroke="#e03131" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle cx="60" cy="58" r="17" fill="#fffaf0" stroke="#e3d8c2" stroke-width="2"/><circle cx="140" cy="58" r="17" fill="#fffaf0" stroke="#e3d8c2" stroke-width="2"/>
      ${[60, 140].map((x) => `<path d="M${x},48 V68 M${x - 9},53 L${x + 9},63 M${x + 9},53 L${x - 9},63" stroke="#74c0fc" stroke-width="2" stroke-linecap="round"/>`).join('')}`,
  },
  woolscarf: {
    name: 'Candy-Stripe Scarf', icon: '🧣', slot: 'neck', price: null, level: 1, event: 'lantern',
    svg: `<path d="M60,110 Q100,130 140,110 L140,124 Q100,144 60,124 Z" fill="#fffaf0"/>
      <path d="M70,114 L74,130 M86,119 L88,136 M102,121 L102,138 M118,118 L116,135 M132,113 L129,129" stroke="#e03131" stroke-width="5"/>
      <path d="M116,128 L126,170 L112,172 L104,132 Z" fill="#fffaf0"/><path d="M110,140 L121,139 M112,152 L123,151 M114,164 L125,163" stroke="#e03131" stroke-width="4"/>`,
  },
  heartband: {
    name: 'Heart Headband', icon: '💗', slot: 'hat', price: null, level: 1, event: 'sweetheart',
    svg: `<path d="M58,56 Q60,20 100,18 Q140,20 142,56" stroke="#f06595" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M100,24 C86,10 74,22 86,34 L100,46 L114,34 C126,22 114,10 100,24Z" fill="#f06595" stroke="#c2255c" stroke-width="2"/>
      <path d="M90,22 q3,-4 7,-2" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>`,
  },
  rosebow: {
    name: 'Rosy Ribbon', icon: '🎀', slot: 'neck', price: null, level: 1, event: 'sweetheart',
    svg: `<path d="M100,122 Q80,104 74,116 Q70,132 100,122Z" fill="#faa2c1" stroke="#e64980" stroke-width="2"/>
      <path d="M100,122 Q120,104 126,116 Q130,132 100,122Z" fill="#faa2c1" stroke="#e64980" stroke-width="2"/>
      <path d="M96,124 L88,146 M104,124 L112,146" stroke="#e64980" stroke-width="5" stroke-linecap="round"/>
      <path d="M100,118 C96,114 92,118 96,122 L100,126 L104,122 C108,118 104,114 100,118Z" fill="#c2255c"/>`,
  },
  flowercrown: {
    name: 'Flower Crown', icon: '🌼', slot: 'hat', price: null, level: 1, event: 'spring',
    svg: `<path d="M58,50 Q100,30 142,50" stroke="#6f9a3a" stroke-width="5" fill="none"/>
      ${[[62, 48, '#ff8fab'], [80, 40, '#ffd43b'], [100, 37, '#b197fc'], [120, 40, '#ff8fab'], [138, 48, '#ffd43b']].map(([x, y, c]) => [0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + Math.cos(a * Math.PI / 180) * 5).toFixed(1)}" cy="${(y + Math.sin(a * Math.PI / 180) * 5).toFixed(1)}" r="4.4" fill="${c}"/>`).join('') + `<circle cx="${x}" cy="${y}" r="3" fill="#fff3bf"/>`).join('')}`,
  },
  butterflywings: {
    name: 'Butterfly Wings', icon: '🦋', slot: 'back', price: null, level: 1, event: 'spring', view: '0 60 200 140',
    svg: `<g opacity=".92"><path d="M98,130 Q40,70 20,100 Q8,130 60,138 Q30,160 50,180 Q74,190 98,140Z" fill="#b197fc" stroke="#7048e8" stroke-width="2"/>
      <path d="M102,130 Q160,70 180,100 Q192,130 140,138 Q170,160 150,180 Q126,190 102,140Z" fill="#b197fc" stroke="#7048e8" stroke-width="2"/>
      <circle cx="44" cy="106" r="8" fill="#fff3bf" opacity=".8"/><circle cx="156" cy="106" r="8" fill="#fff3bf" opacity=".8"/>
      <circle cx="62" cy="164" r="6" fill="#faa2c1"/><circle cx="138" cy="164" r="6" fill="#faa2c1"/></g>`,
  },
  sunhat: {
    name: 'Straw Sun Hat', icon: '👒', slot: 'hat', price: null, level: 1, event: 'summer', view: '20 -10 160 80',
    svg: `<ellipse cx="100" cy="48" rx="72" ry="14" fill="#f2d48a" stroke="#c9a44c" stroke-width="2"/>
      <path d="M66,46 Q66,10 100,8 Q134,10 134,46Z" fill="#f2d48a" stroke="#c9a44c" stroke-width="2"/>
      <path d="M66,38 Q100,46 134,38 L134,46 Q100,54 66,46Z" fill="#3cc7c0"/>
      <path d="M40,48 q10,-4 20,0 M140,48 q10,-4 20,0 M80,22 q10,-4 20,0" stroke="#c9a44c" stroke-width="1.5" fill="none" opacity=".7"/>`,
  },
  lei: {
    name: 'Island Flower Lei', icon: '🌺', slot: 'neck', price: null, level: 1, event: 'summer',
    svg: Array.from({ length: 9 }, (_, i) => {
      const t = i / 8;
      const x = (1 - t) ** 2 * 64 + 2 * (1 - t) * t * 100 + t ** 2 * 136;
      const y = (1 - t) ** 2 * 112 + 2 * (1 - t) * t * 140 + t ** 2 * 112;
      const c = ['#ff6b6b', '#ffd43b', '#f783ac'][i % 3];
      return [0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + Math.cos(a * Math.PI / 180) * 4.5).toFixed(1)}" cy="${(y + Math.sin(a * Math.PI / 180) * 4.5).toFixed(1)}" r="4" fill="${c}"/>`).join('') + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="#fff3bf"/>`;
    }).join(''),
  },
  witchhat: {
    name: 'Starry Witch Hat', icon: '🎃', slot: 'hat', price: null, level: 1, event: 'spooky', view: '30 -40 140 100',
    svg: `<ellipse cx="100" cy="46" rx="56" ry="11" fill="#3b2a5a" stroke="#241838" stroke-width="2"/>
      <path d="M72,44 Q84,10 98,-10 Q104,-26 122,-30 Q112,-14 116,4 L128,44Z" fill="#4c3a73" stroke="#241838" stroke-width="2"/>
      <path d="M74,36 Q100,44 126,36 L128,44 Q100,52 72,44Z" fill="#f2a530"/>
      <path d="M100,10 l2,4 l4,1 l-3,3 l1,4 l-4,-2 l-4,2 l1,-4 l-3,-3 l4,-1Z" fill="#f3d98c"/>`,
  },
  batwings: {
    name: 'Little Bat Wings', icon: '🦇', slot: 'back', price: null, level: 1, event: 'spooky', view: '0 60 200 120',
    svg: `<path d="M96,120 Q60,84 14,96 Q26,104 22,114 Q34,110 40,122 Q50,114 58,126 Q68,118 74,132 Q84,124 96,134Z" fill="#3b2a5a" stroke="#241838" stroke-width="2"/>
      <path d="M104,120 Q140,84 186,96 Q174,104 178,114 Q166,110 160,122 Q150,114 142,126 Q132,118 126,132 Q116,124 104,134Z" fill="#3b2a5a" stroke="#241838" stroke-width="2"/>`,
  },
  // ----- growing up (unlocked by life stage) and birthdays -----
  pupbib: {
    name: 'Pup Bib', icon: '🍼', slot: 'neck', price: null, level: 1, growth: 'pup',
    svg: `<path d="M72,116 Q100,128 128,116 Q130,150 100,156 Q70,150 72,116Z" fill="#fffaf0" stroke="#9be8de" stroke-width="3"/>
      <circle cx="100" cy="138" r="5" fill="#ffa8a8"/><circle cx="92" cy="130" r="2.6" fill="#ffa8a8"/><circle cx="100" cy="127" r="2.6" fill="#ffa8a8"/><circle cx="108" cy="130" r="2.6" fill="#ffa8a8"/>`,
  },
  backpack: {
    name: 'Explorer Backpack', icon: '🎒', slot: 'back', price: null, level: 1, growth: 'young', view: '100 90 90 110',
    svg: `<rect x="128" y="104" width="50" height="66" rx="16" fill="#5c940d" stroke="#2b8a3e" stroke-width="3"/>
      <rect x="136" y="132" width="34" height="26" rx="8" fill="#74b816" stroke="#2b8a3e" stroke-width="2"/><path d="M140,132 Q153,124 166,132" stroke="#2b8a3e" stroke-width="2" fill="none"/>
      <circle cx="153" cy="145" r="3" fill="#fcc419"/>`,
  },
  sailorcap: {
    name: 'Sailor Cap', icon: '⛵', slot: 'hat', price: null, level: 1, growth: 'grown',
    svg: `<path d="M62,48 Q64,18 100,16 Q136,18 138,48Z" fill="#fffaf0" stroke="#adb5bd" stroke-width="2"/>
      <rect x="60" y="40" width="80" height="12" rx="5" fill="#1c3f7a"/>
      <path d="M100,16 Q96,8 100,4 Q104,8 100,16" fill="#1c3f7a"/><circle cx="120" cy="46" r="3" fill="#fcc419"/>`,
  },
  wisespecs: {
    name: 'Wise Spectacles', icon: '👓', slot: 'eyes', price: null, level: 1, growth: 'wise',
    svg: `<circle cx="83" cy="76" r="12" fill="#e7f5ff" fill-opacity=".25" stroke="#c9a227" stroke-width="2.5"/>
      <circle cx="117" cy="76" r="12" fill="#e7f5ff" fill-opacity=".25" stroke="#c9a227" stroke-width="2.5"/>
      <path d="M95,74 Q100,70 105,74 M71,74 L58,70 M129,74 L142,70" stroke="#c9a227" stroke-width="2.5" fill="none"/>`,
  },
  birthdayhat: {
    name: 'Birthday Party Hat', icon: '🎂', slot: 'hat', price: null, level: 1, growth: 'birthday',
    svg: `<polygon points="78,46 122,46 100,-6" fill="#74c0fc" stroke="#1c7ed6" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="92" cy="30" r="3" fill="#ffd43b"/><circle cx="106" cy="16" r="3" fill="#ff8787"/><circle cx="104" cy="36" r="3" fill="#b197fc"/>
      <circle cx="100" cy="-8" r="7" fill="#ffd43b"/><path d="M78,46 Q100,54 122,46" stroke="#1c7ed6" stroke-width="4" fill="none"/>`,
  },
  ...MORE_ITEMS,
  ...BATCH2_ITEMS,
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

export const GAME_CATEGORIES = [
  { id: 'arcade', name: 'Arcade', desc: 'Quick, fast and frantic' },
  { id: 'skill', name: 'Skill & Reflex', desc: 'Timing and quick fingers' },
  { id: 'puzzle', name: 'Puzzle & Brain', desc: 'Think it through' },
  { id: 'pond', name: 'Pond Games', desc: 'Quizzes, words and luck. Also playable on Discord!' },
];

// Website arcade. maxPearls caps rewards per round; scoreLabel describes `best`.
export const GAME_LIST = [
  { id: 'dive', name: 'Oyster Dive', icon: '🦪', category: 'arcade', energy: 5, maxPearls: 80, scoreLabel: 'pts',
    desc: 'Catch falling oysters and pearls. Dodge the spiky urchins!' },
  { id: 'frenzy', name: 'Fish Frenzy', icon: '🐟', category: 'arcade', energy: 5, maxPearls: 80, scoreLabel: 'pts',
    desc: 'Swim anywhere to gobble fish. Big fish are worth more. Avoid the jellyfish!' },
  { id: 'hop', name: 'Bubble Hop', icon: '🫧', category: 'arcade', energy: 5, maxPearls: 80, scoreLabel: 'm',
    desc: 'Bounce up and up on bubbles. How high can you climb?' },
  { id: 'fishing', name: 'Tide Fishing', icon: '🎣', category: 'skill', energy: 4, maxPearls: 70, scoreLabel: 'pts',
    desc: 'Wait for a bite, then reel in when the marker hits the sweet spot.' },
  { id: 'bubbles', name: 'Bubble Burst', icon: '🔵', category: 'skill', energy: 4, maxPearls: 60, scoreLabel: 'pops',
    desc: 'Pop as many bubbles as you can in 30 seconds. Golden ones are worth triple.' },
  { id: 'crabs', name: 'Crab Catcher', icon: '🦀', category: 'skill', energy: 4, maxPearls: 60, scoreLabel: 'crabs',
    desc: 'Crabs pop out of the sand. Catch them before they scuttle away. Not the pufferfish!' },
  { id: 'memory', name: 'Shell Match', icon: '🐚', category: 'puzzle', energy: 2, maxPearls: 50, scoreLabel: 'moves', lowerIsBetter: true,
    desc: 'Flip shells to find matching pairs in as few moves as you can.' },
  { id: 'pop', name: 'Pearl Pop', icon: '💎', category: 'puzzle', energy: 3, maxPearls: 80, scoreLabel: 'pts',
    desc: 'Swap neighbouring gems to line up three or more. 20 moves to score big.' },
  { id: 'shuffle', name: 'Shell Shuffle', icon: '🥚', category: 'puzzle', energy: 2, maxPearls: 60, scoreLabel: 'rounds',
    desc: 'Watch the pearl go under a shell, then follow it as the shells get shuffled.' },
  { id: 'words', name: 'Word Tide', icon: '🔤', category: 'puzzle', energy: 2, maxPearls: 60, scoreLabel: 's', lowerIsBetter: true,
    desc: 'Find all the hidden ocean words in the grid. Drag across letters to select.' },
  // Pond Games: the Discord solo games. `board` = a leaderboard shared with Discord.
  { id: 'trivia', name: 'Trivia', icon: '🧠', category: 'pond', energy: 2, maxPearls: 40, scoreLabel: 'right', board: 'd-trivia',
    desc: '5 questions about the ocean, animals and the world.' },
  { id: 'emoji', name: 'Emoji Mystery', icon: '🔮', category: 'pond', energy: 2, maxPearls: 30, scoreLabel: 'right',
    desc: 'Decode the emoji clues. 5 mysteries.' },
  { id: 'scramble', name: 'Word Scramble', icon: '🔤', category: 'pond', energy: 2, maxPearls: 40, scoreLabel: 'pts',
    desc: 'Unscramble 5 ocean words. Hints cost half the points.' },
  { id: 'hangman', name: 'Raft Rescue', icon: '🛶', category: 'pond', energy: 2, maxPearls: 40, scoreLabel: 'splashes left',
    desc: 'Guess the word one letter at a time before the raft sinks!' },
  { id: 'numberhunt', name: 'Number Hunt', icon: '🌡️', category: 'pond', energy: 2, maxPearls: 40, scoreLabel: 'tries', lowerIsBetter: true,
    desc: 'Find the hidden number from 1 to 100 with hot and cold clues. 7 tries.' },
  { id: 'higherlower', name: 'Higher or Lower', icon: '🃏', category: 'pond', energy: 2, maxPearls: 60, scoreLabel: 'streak', board: 'd-higherlower',
    desc: 'Is the next card higher or lower? Cash out before your luck runs out!' },
  { id: 'rps', name: 'Rock Paper Scissors', icon: '✂️', category: 'pond', energy: 2, maxPearls: 12, scoreLabel: 'wins', noBoard: true,
    desc: 'Best of 3 against Otto the otter.' },
  { id: 'minesweeper', name: 'Urchin Sweeper', icon: '💣', category: 'pond', energy: 3, maxPearls: 30, scoreLabel: 's', lowerIsBetter: true,
    desc: 'Uncover the sand without touching the 6 sea urchins.' },
  { id: 'quickcast', name: 'Quick Cast', icon: '🪝', category: 'pond', energy: 3, maxPearls: 60, scoreLabel: 'pts', board: 'd-fishing',
    desc: 'Cast 3 times and reel in the moment something bites. Same as Fishing on Discord.' },
];

export const NAME_IDEAS = ['Pebble', 'Kelpie', 'Barnacle', 'Mochi', 'Clamsy', 'Biscuit', 'Waffles', 'Nori', 'Pippin', 'Marbles'];
