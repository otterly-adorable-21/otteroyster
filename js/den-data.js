import { BATCH2_FURNITURE } from './catalog-more.js';
import { MORE_FURNITURE, MORE_DEN_CATS, MORE_WALLPAPERS, MORE_FLOORS } from './catalog-den.js';
// Otter's Den catalog: furniture, decor, plushies, rugs, wall hangings, wallpapers, floors.
// Each item's `svg` is drawn in its own viewBox `vb` and shown `w` den-units wide
// (the den is 400 x 300). `cozy` points make the den comfier for your otter.

export const DEN_CATS = [
  { id: 'furniture', name: 'Furniture', icon: '🛋️' },
  { id: 'decor', name: 'Decor', icon: '🪴' },
  { id: 'plush', name: 'Plushies', icon: '🧸' },
  { id: 'rug', name: 'Rugs', icon: '🟫' },
  { id: 'wall', name: 'Wall', icon: '🖼️' },
  ...MORE_DEN_CATS,
];

export const DEN_W = 400;
export const DEN_H = 300;
export const OTTER_W = 74;

// Where each kind of item may sit (y = the item's bottom edge, in den units).
export const ZONES = {
  wall: { minY: 40, maxY: 182 },
  rug: { minY: 214, maxY: 292 },
  floor: { minY: 206, maxY: 298 },
};

const glow = (cx, cy, r, color) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity=".25"/><circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="${color}" opacity=".35"/>`;

export const FURNITURE = {
  // ---------------- furniture
  shellbed: {
    name: 'Scallop Shell Bed', cat: 'furniture', price: 60, level: 1, cozy: 4, vb: '0 0 120 74', w: 112,
    svg: `<path d="M8,40 Q8,2 60,2 Q112,2 112,40Z" fill="#f4e6f0" stroke="#c9b3c8" stroke-width="2"/>
      <path d="M60,40 L22,10 M60,40 L40,4 M60,40 L60,2 M60,40 L80,4 M60,40 L98,10" stroke="#d8c3d6" stroke-width="2.5"/>
      <rect x="6" y="38" width="108" height="24" rx="8" fill="#8a6644"/>
      <rect x="10" y="32" width="100" height="16" rx="7" fill="#fffaf0"/>
      <ellipse cx="28" cy="34" rx="16" ry="7" fill="#fff" stroke="#e6dcc6"/>
      <path d="M44,34 Q76,28 110,36 L110,52 Q76,58 44,52Z" fill="#3cc7c0"/>
      <path d="M50,40 L106,40 M50,47 L106,47" stroke="#9be8de" stroke-width="2" stroke-dasharray="4 4"/>
      <rect x="10" y="60" width="8" height="12" rx="2" fill="#6b4d34"/><rect x="102" y="60" width="8" height="12" rx="2" fill="#6b4d34"/>`,
  },
  hammock: {
    name: 'Kelp Hammock', cat: 'furniture', price: 90, level: 2, cozy: 4, vb: '0 0 140 84', w: 122,
    svg: `<rect x="4" y="6" width="8" height="78" rx="3" fill="#7a593a"/><rect x="128" y="6" width="8" height="78" rx="3" fill="#7a593a"/>
      <path d="M12,18 Q70,82 128,18" fill="none" stroke="#3f6a2a" stroke-width="3"/>
      <path d="M12,18 Q70,70 128,18 Q70,58 12,18Z" fill="#6f9a3a"/>
      <path d="M24,28 Q70,64 116,28 M36,34 Q70,58 104,34" stroke="#a7c86a" stroke-width="2" fill="none"/>
      <ellipse cx="44" cy="34" rx="12" ry="5" fill="#fffaf0" transform="rotate(20 44 34)"/>`,
  },
  table: {
    name: 'Driftwood Table', cat: 'furniture', price: 35, level: 1, cozy: 1, vb: '0 0 100 62', w: 70,
    svg: `<path d="M4,14 Q50,4 96,14 L96,22 Q50,14 4,22Z" fill="#a8865f" stroke="#7a593a" stroke-width="2"/>
      <path d="M10,18 Q30,15 50,16" stroke="#c9ab80" stroke-width="2" fill="none"/>
      <path d="M18,22 Q14,42 20,62 M82,22 Q86,42 80,62" stroke="#7a593a" stroke-width="7" stroke-linecap="round" fill="none"/>
      <rect x="40" y="2" width="16" height="12" rx="3" fill="#e9f6f4" stroke="#9be8de"/><path d="M48,2 q-6,-8 0,-12" stroke="#6f9a3a" stroke-width="2" fill="none"/>`,
  },
  stool: {
    name: 'Mushroom Stool', cat: 'furniture', price: 20, level: 1, cozy: 1, vb: '0 0 50 56', w: 34,
    svg: `<rect x="17" y="22" width="16" height="34" rx="6" fill="#f3e6cf" stroke="#d8c3a3"/>
      <path d="M2,26 Q2,2 25,2 Q48,2 48,26Z" fill="#b5653f"/>
      <circle cx="14" cy="14" r="4" fill="#fbe9d0"/><circle cx="30" cy="9" r="3" fill="#fbe9d0"/><circle cx="38" cy="19" r="3.5" fill="#fbe9d0"/>`,
  },
  clamchair: {
    name: 'Clam Armchair', cat: 'furniture', price: 45, level: 1, cozy: 2, vb: '0 0 80 80', w: 56,
    svg: `<path d="M4,52 Q4,4 40,4 Q76,4 76,52Z" fill="#e7def0" stroke="#b7a6c9" stroke-width="2"/>
      <path d="M40,50 L16,16 M40,50 L30,8 M40,50 L50,8 M40,50 L64,16" stroke="#cbbcdc" stroke-width="3"/>
      <path d="M6,50 Q40,40 74,50 L74,66 Q40,74 6,66Z" fill="#d9635b"/>
      <path d="M10,52 Q40,44 70,52" stroke="#ec8a7f" stroke-width="3" fill="none"/>
      <rect x="12" y="66" width="7" height="12" rx="2" fill="#7a593a"/><rect x="61" y="66" width="7" height="12" rx="2" fill="#7a593a"/>`,
  },
  bookshelf: {
    name: 'Driftwood Shelf', cat: 'furniture', price: 55, level: 1, cozy: 1, vb: '0 0 70 102', w: 54,
    svg: `<rect x="4" y="2" width="62" height="98" rx="4" fill="#8a6644" stroke="#6b4d34" stroke-width="2"/>
      <rect x="9" y="8" width="52" height="26" fill="#5a3f2a"/><rect x="9" y="38" width="52" height="26" fill="#5a3f2a"/><rect x="9" y="68" width="52" height="26" fill="#5a3f2a"/>
      <rect x="12" y="12" width="6" height="22" fill="#3cc7c0"/><rect x="19" y="14" width="6" height="20" fill="#d9b45a"/><rect x="26" y="11" width="5" height="23" fill="#d9635b"/><rect x="32" y="15" width="7" height="19" fill="#6f9a3a"/>
      <circle cx="50" cy="26" r="7" fill="#e9f6f4" stroke="#9be8de"/><circle cx="50" cy="26" r="3" fill="#fff"/>
      <rect x="12" y="44" width="6" height="20" fill="#b7a6c9"/><rect x="19" y="42" width="6" height="22" fill="#3cc7c0"/>
      <path d="M40,64 Q46,48 52,64Z" fill="#f4e6f0" stroke="#c9b3c8"/>
      <path d="M14,94 Q24,78 34,94Z" fill="#6f9a3a"/><rect x="40" y="80" width="16" height="14" rx="3" fill="#d9b45a"/>`,
  },
  lilylamp: {
    name: 'Lily Lamp', cat: 'furniture', price: 40, level: 1, cozy: 2, vb: '0 0 50 104', w: 32,
    svg: `${glow(25, 22, 24, '#fff3bf')}
      <path d="M25,30 Q22,70 25,96" stroke="#3f6a2a" stroke-width="4" fill="none"/>
      <ellipse cx="25" cy="98" rx="14" ry="5" fill="#6f9a3a"/>
      <path d="M8,26 Q12,6 25,4 Q38,6 42,26 Q25,34 8,26Z" fill="#fffaf0" stroke="#e3d8c2"/>
      <path d="M16,24 Q20,10 25,8 M34,24 Q30,10 25,8" stroke="#e9e0f0" stroke-width="1.5" fill="none"/>
      <circle cx="25" cy="24" r="5" fill="#ffe27a"/>`,
  },
  // ---------------- decor

  pottedlily: {
    name: 'Potted Water Lily', cat: 'decor', price: 15, level: 1, cozy: 1, vb: '0 0 60 72', w: 36,
    svg: `<path d="M10,40 L50,40 L44,70 L16,70Z" fill="#b5653f"/><rect x="7" y="36" width="46" height="8" rx="3" fill="#c97b52"/>
      <ellipse cx="18" cy="34" rx="14" ry="6" fill="#6f9a3a"/><ellipse cx="42" cy="32" rx="14" ry="6" fill="#7fb046"/>
      <g fill="#fffaf0" stroke="#e3d8c2" stroke-width=".8"><path d="M30,30 C22,24 22,12 30,6 C38,12 38,24 30,30Z"/><path d="M30,30 C18,28 12,20 14,14 C22,16 28,22 30,30Z"/><path d="M30,30 C42,28 48,20 46,14 C38,16 32,22 30,30Z"/></g>
      <circle cx="30" cy="24" r="4" fill="#f2b632"/>`,
  },
  fern: {
    name: 'Riverbank Fern', cat: 'decor', price: 18, level: 1, cozy: 1, vb: '0 0 70 82', w: 42,
    svg: `<path d="M18,60 L52,60 L48,80 L22,80Z" fill="#8a6644"/>
      <g fill="none" stroke-linecap="round"><path d="M35,60 Q20,30 4,22" stroke="#6f9a3a" stroke-width="5" stroke-dasharray="3 3"/><path d="M35,60 Q50,30 66,22" stroke="#6f9a3a" stroke-width="5" stroke-dasharray="3 3"/>
      <path d="M35,60 Q32,26 36,4" stroke="#8fbf4a" stroke-width="5" stroke-dasharray="3 3"/><path d="M35,60 Q22,40 10,44" stroke="#a7c86a" stroke-width="4" stroke-dasharray="3 3"/><path d="M35,60 Q48,40 60,44" stroke="#a7c86a" stroke-width="4" stroke-dasharray="3 3"/></g>`,
  },
  chest: {
    name: 'Treasure Chest', cat: 'decor', price: 70, level: 2, cozy: 1, vb: '0 0 80 62', w: 50,
    svg: `<path d="M6,24 Q6,4 40,4 Q74,4 74,24Z" fill="#8a5a3b" stroke="#5a3a24" stroke-width="2"/>
      <rect x="6" y="24" width="68" height="36" rx="3" fill="#7a4e33" stroke="#5a3a24" stroke-width="2"/>
      <path d="M6,24 L74,24 M20,6 L20,60 M60,6 L60,60" stroke="#d9b45a" stroke-width="4"/>
      <rect x="33" y="20" width="14" height="14" rx="2" fill="#d9b45a"/><circle cx="40" cy="27" r="2.5" fill="#5a3a24"/>
      <circle cx="30" cy="4" r="4" fill="url(#den-pearl)"/><circle cx="50" cy="3" r="3" fill="#ffd43b"/>`,
  },
  fishbowl: {
    name: 'Little Fishbowl', cat: 'decor', price: 35, level: 1, cozy: 2, vb: '0 0 60 62', w: 36,
    svg: `<rect x="14" y="54" width="32" height="8" rx="2" fill="#8a6644"/>
      <path d="M14,8 Q2,28 10,46 Q18,58 30,58 Q42,58 50,46 Q58,28 46,8Z" fill="#9be8de" fill-opacity=".55" stroke="#fff" stroke-width="2"/>
      <path d="M8,24 Q30,30 52,24 L50,46 Q42,58 30,58 Q18,58 10,46Z" fill="#3cc7c0" opacity=".55"/>
      <path d="M26,38 q8,-8 14,0 q-6,8 -14,0Z M26,38 l-6,-5 l0,10Z" fill="#ff922b"/><circle cx="36" cy="37" r="1.2" fill="#2b1c14"/>
      <path d="M14,8 L46,8" stroke="#fff" stroke-width="3"/><circle cx="22" cy="30" r="2" fill="#fff" opacity=".8"/>`,
  },
  // ---------------- plushies
  duckplush: {
    name: 'Duckling Plush', cat: 'plush', price: 25, level: 1, cozy: 2, vb: '0 0 60 56', w: 32,
    svg: `<ellipse cx="30" cy="40" rx="24" ry="15" fill="#fffaf0" stroke="#e3d8c2"/>
      <circle cx="38" cy="20" r="13" fill="#fffaf0" stroke="#e3d8c2"/>
      <path d="M48,20 Q58,22 48,26Z" fill="#f2a530"/><circle cx="42" cy="17" r="2" fill="#2b1c14"/>
      <path d="M10,36 Q20,30 28,38" stroke="#e3d8c2" stroke-width="2" fill="none"/><ellipse cx="44" cy="24" rx="3" ry="2" fill="#f2a5a0" opacity=".6"/>`,
  },
  turtleplush: {
    name: 'Turtle Plush', cat: 'plush', price: 30, level: 1, cozy: 2, vb: '0 0 72 50', w: 38,
    svg: `<ellipse cx="14" cy="44" rx="7" ry="4" fill="#8fbf4a"/><ellipse cx="54" cy="44" rx="7" ry="4" fill="#8fbf4a"/>
      <circle cx="62" cy="28" r="9" fill="#a7c86a"/><circle cx="65" cy="26" r="1.6" fill="#2b1c14"/>
      <path d="M6,40 Q6,8 36,8 Q62,8 62,40Z" fill="#4d8a3a"/>
      <path d="M18,40 L24,20 L36,14 L48,20 L54,40 M24,20 L36,30 L48,20 M36,30 L36,40" stroke="#a7c86a" stroke-width="2" fill="none"/>`,
  },
  starplush: {
    name: 'Starfish Plush', cat: 'plush', price: 20, level: 1, cozy: 2, vb: '0 0 60 58', w: 30,
    svg: `<path d="M30,2 L37,22 L58,22 L41,35 L48,56 L30,43 L12,56 L19,35 L2,22 L23,22Z" fill="#ff9e7a" stroke="#e8735a" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="25" cy="27" r="2" fill="#2b1c14"/><circle cx="35" cy="27" r="2" fill="#2b1c14"/><path d="M26,33 Q30,36 34,33" stroke="#2b1c14" stroke-width="1.5" fill="none"/>`,
  },
  octoplush: {
    name: 'Octopus Plush', cat: 'plush', price: 35, level: 2, cozy: 2, vb: '0 0 60 60', w: 32,
    svg: `<g fill="#b48ad8"><path d="M10,38 q-6,14 4,20 q4,-8 4,-18Z"/><path d="M22,40 q-2,14 6,18 q2,-10 0,-18Z"/><path d="M38,40 q2,14 -6,18 q-2,-10 0,-18Z"/><path d="M50,38 q6,14 -4,20 q-4,-8 -4,-18Z"/></g>
      <ellipse cx="30" cy="26" rx="22" ry="20" fill="#c9a6e8"/>
      <circle cx="22" cy="26" r="3" fill="#2b1c14"/><circle cx="38" cy="26" r="3" fill="#2b1c14"/><path d="M26,34 Q30,37 34,34" stroke="#2b1c14" stroke-width="1.5" fill="none"/>
      <ellipse cx="17" cy="32" rx="3" ry="2" fill="#f2a5a0" opacity=".7"/><ellipse cx="43" cy="32" rx="3" ry="2" fill="#f2a5a0" opacity=".7"/>`,
  },
  // ---------------- rugs (lie flat on the floor)
  padrug: {
    name: 'Lily Pad Rug', cat: 'rug', price: 30, level: 1, cozy: 2, vb: '0 0 160 50', w: 140,
    svg: `<path d="M80,25 L86,1 A79,24 0 1,1 74,1Z" fill="#6f9a3a" stroke="#3f6a2a" stroke-width="2"/>
      <path d="M80,25 L20,12 M80,25 L4,28 M80,25 L40,46 M80,25 L120,46 M80,25 L156,28 M80,25 L140,12" stroke="#a7c86a" stroke-width="1.5" opacity=".6"/>`,
  },
  wovenrug: {
    name: 'Woven Reed Rug', cat: 'rug', price: 40, level: 1, cozy: 2, vb: '0 0 160 50', w: 130,
    svg: `<ellipse cx="80" cy="25" rx="78" ry="23" fill="#d8c39c" stroke="#a8865f" stroke-width="2"/>
      <ellipse cx="80" cy="25" rx="62" ry="17" fill="none" stroke="#3cc7c0" stroke-width="3"/>
      <ellipse cx="80" cy="25" rx="44" ry="11" fill="none" stroke="#d9635b" stroke-width="3"/>
      <ellipse cx="80" cy="25" rx="24" ry="5" fill="#a8865f"/>`,
  },
  // ---------------- wall hangings
  painting: {
    name: 'Moonlit Pond Painting', cat: 'wall', price: 60, level: 1, cozy: 2, vb: '0 0 90 70', w: 60,
    svg: `<rect x="2" y="2" width="86" height="66" rx="4" fill="#d9b45a"/><rect x="8" y="8" width="74" height="54" fill="#0c3440"/>
      <circle cx="64" cy="22" r="8" fill="#fff3bf"/><path d="M8,46 Q45,38 82,46 L82,62 L8,62Z" fill="#1f8f95"/>
      <ellipse cx="30" cy="50" rx="10" ry="3" fill="#6f9a3a"/><path d="M30,48 l-4,-5 l4,2 l4,-2Z" fill="#fffaf0"/>`,
  },
  garland: {
    name: 'Seashell Garland', cat: 'wall', price: 30, level: 1, cozy: 1, vb: '0 0 160 40', w: 120,
    svg: `<path d="M4,6 Q80,40 156,6" stroke="#a8865f" stroke-width="2" fill="none"/>
      ${[20, 48, 80, 112, 140].map((x, k) => `<path transform="translate(${x} ${k === 2 ? 26 : k % 2 ? 20 : 12})" d="M-8,0 Q-8,-10 0,-10 Q8,-10 8,0 L0,8Z" fill="${['#f4e6f0', '#fff3bf', '#e9f6f4', '#fff3bf', '#f4e6f0'][k]}" stroke="#c9b3c8"/>`).join('')}`,
  },
  starlights: {
    name: 'Star Fairy Lights', cat: 'wall', price: 45, level: 1, cozy: 2, vb: '0 0 160 40', w: 130,
    svg: `<path d="M4,6 Q80,36 156,6" stroke="#3f6a2a" stroke-width="1.5" fill="none"/>
      ${[14, 34, 56, 80, 104, 126, 146].map((x) => { const y = 6 + 30 * (1 - ((x - 80) / 76) ** 2) * 0.8; return `${glow(x, y + 4, 7, '#fff3bf')}<path transform="translate(${x} ${y + 4})" d="M0,-6 C1,-1 1,-1 6,0 C1,1 1,1 0,6 C-1,1 -1,1 -6,0 C-1,-1 -1,-1 0,-6Z" fill="#f3d98c"/>`; }).join('')}`,
  },
  mirror: {
    name: 'Pearl Mirror', cat: 'wall', price: 40, level: 2, cozy: 1, vb: '0 0 60 80', w: 38,
    svg: `<ellipse cx="30" cy="40" rx="27" ry="37" fill="#d9b45a"/>
      ${Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * Math.PI * 2; return `<circle cx="${(30 + Math.cos(a) * 27).toFixed(1)}" cy="${(40 + Math.sin(a) * 37).toFixed(1)}" r="3" fill="url(#den-pearl)"/>`; }).join('')}
      <ellipse cx="30" cy="40" rx="21" ry="31" fill="#cfeee9"/><path d="M18,24 Q22,16 30,14" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>`,
  },
  // ----- seasonal event furniture (bought with event tokens; see js/events.js) -----
  pumpkinlamp: {
    name: 'Harvest Pumpkin Lamp', cat: 'decor', price: null, level: 1, cozy: 3, event: 'harvest', vb: '0 0 70 64', w: 44,
    svg: `${glow(35, 38, 30, '#ffd8a8')}<ellipse cx="35" cy="40" rx="32" ry="22" fill="#f08c00"/><path d="M20,22 Q16,40 20,60 M35,18 V62 M50,22 Q54,40 50,60" stroke="#d9480f" stroke-width="2" fill="none"/>
      <path d="M35,18 Q34,8 40,4" stroke="#5a7a2a" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M40,8 Q52,2 54,12 Q46,14 40,8Z" fill="#6f9a3a"/>`,
  },
  lanterntree: {
    name: 'Lantern Pine', cat: 'decor', price: null, level: 1, cozy: 3, event: 'lantern', vb: '0 0 70 100', w: 50,
    svg: `<rect x="30" y="80" width="10" height="16" fill="#6b4d34"/><path d="M35,4 L60,40 H48 L66,66 H52 L68,86 H2 L18,66 H4 L22,40 H10Z" fill="#2f6b3a"/>
      ${[[24, 50, '#ff6b6b'], [46, 36, '#ffd43b'], [44, 70, '#74c0fc'], [22, 76, '#ffd43b'], [35, 58, '#ff6b6b']].map(([x, y, c]) => `${glow(x, y, 7, c)}<rect x="${x - 3}" y="${y - 4}" width="6" height="8" rx="2" fill="${c}"/>`).join('')}
      <path d="M35,0 l2.5,5 l5,.6 l-3.8,3.5 l1,5 l-4.7,-2.5 l-4.7,2.5 l1,-5 l-3.8,-3.5 l5,-.6Z" fill="#f3d98c"/>`,
  },
  heartpillow: {
    name: 'Heart Cushion', cat: 'furniture', price: null, level: 1, cozy: 3, event: 'sweetheart', vb: '0 0 70 56', w: 40,
    svg: `<path d="M35,16 C24,0 2,6 6,26 C9,40 26,48 35,54 C44,48 61,40 64,26 C68,6 46,0 35,16Z" fill="#f783ac" stroke="#d6336c" stroke-width="2"/>
      <path d="M18,16 q6,-6 12,0" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/><path d="M35,22 V48" stroke="#d6336c" stroke-width="1.5" stroke-dasharray="3 3"/>`,
  },
  flowerpot: {
    name: 'Tulip Planter', cat: 'decor', price: null, level: 1, cozy: 3, event: 'spring', vb: '0 0 80 72', w: 50,
    svg: `<rect x="6" y="44" width="68" height="26" rx="4" fill="#b5653f"/><rect x="2" y="40" width="76" height="8" rx="3" fill="#c97b52"/>
      ${[[18, '#ff6b6b'], [32, '#ffd43b'], [46, '#f783ac'], [60, '#b197fc']].map(([x, c], k) => `<path d="M${x},40 Q${x - 2},${26 - k % 2 * 4} ${x},${18 - k % 2 * 4}" stroke="#6f9a3a" stroke-width="3" fill="none"/><path d="M${x - 6},${18 - k % 2 * 4} Q${x - 6},${6 - k % 2 * 4} ${x},${8 - k % 2 * 4} Q${x + 6},${6 - k % 2 * 4} ${x + 6},${18 - k % 2 * 4} Q${x},${24 - k % 2 * 4} ${x - 6},${18 - k % 2 * 4}Z" fill="${c}"/>`).join('')}`,
  },
  beachchair: {
    name: 'Striped Beach Chair', cat: 'furniture', price: null, level: 1, cozy: 3, event: 'summer', vb: '0 0 80 76', w: 54,
    svg: `<path d="M14,74 L30,40 M66,74 L50,40 M20,60 H60" stroke="#a8865f" stroke-width="4" stroke-linecap="round"/>
      <path d="M18,8 L62,8 L56,52 L24,52Z" fill="#fffaf0" stroke="#a8865f" stroke-width="2"/>
      <path d="M26,8 L28,52 M40,8 V52 M54,8 L52,52" stroke="#3cc7c0" stroke-width="7"/>`,
  },
  jackolantern: {
    name: "Jack-o'-Lantern", cat: 'decor', price: null, level: 1, cozy: 3, event: 'spooky', vb: '0 0 70 64', w: 42,
    svg: `${glow(35, 40, 30, '#ffd8a8')}<ellipse cx="35" cy="40" rx="32" ry="22" fill="#e8590c"/><path d="M20,22 Q16,40 20,60 M50,22 Q54,40 50,60" stroke="#c2410c" stroke-width="2" fill="none"/>
      <path d="M35,18 Q34,8 40,4" stroke="#5a7a2a" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M18,34 L26,28 L28,38Z M52,34 L44,28 L42,38Z" fill="#ffe066"/><path d="M18,46 Q35,58 52,46 L46,48 L42,44 L38,49 L32,44 L28,49 L24,45Z" fill="#ffe066"/>`,
  },
  museumcase: {
    name: 'Museum Display Case', cat: 'decor', price: null, level: 1, cozy: 3, event: 'museum', vb: '0 0 60 80', w: 40,
    svg: `<rect x="6" y="56" width="48" height="22" rx="3" fill="#8a6644"/><rect x="2" y="52" width="56" height="7" rx="2" fill="#a8865f"/>
      <rect x="8" y="10" width="44" height="42" rx="4" fill="#d0ebff" fill-opacity=".45" stroke="#d9b45a" stroke-width="3"/>
      <circle cx="30" cy="38" r="9" fill="url(#den-pearl)"/><rect x="22" y="47" width="16" height="5" rx="2" fill="#d9b45a"/>
      <path d="M14,16 L22,16" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
  },
  ...MORE_FURNITURE,
  ...BATCH2_FURNITURE,
};

export const WALLPAPERS = {
  moss: { name: 'Mossy Stone', price: 0, swatch: '#4f6b4a' },
  willow: { name: 'Willow Stripes', price: 40, swatch: '#476b45' },
  stars: { name: 'Starry Night', price: 70, swatch: '#1b2c4a' },
  coral: { name: 'Coral Blush', price: 50, swatch: '#d98c7a' },
  sand: { name: 'Sandy Plaster', price: 40, swatch: '#d8c39c' },
  ...MORE_WALLPAPERS,
};

export const FLOORS = {
  earth: { name: 'Packed Earth', price: 0, swatch: '#6b4d34' },
  planks: { name: 'Driftwood Planks', price: 45, swatch: '#8a6644' },
  pebbles: { name: 'Pebble Mosaic', price: 55, swatch: '#8c8070' },
  moss: { name: 'Moss Carpet', price: 50, swatch: '#5d7a3a' },
  ...MORE_FLOORS,
};



// Every new otter starts with a little furnished den.
export const STARTER_DEN = [
  { id: 'padrug', x: 200, y: 268 },
  { id: 'shellbed', x: 300, y: 262 },
  { id: 'pottedlily', x: 92, y: 240 },
];

export const zoneOf = (id) => {
  const c = FURNITURE[id]?.cat;
  return c === 'wall' || FURNITURE[id]?.wall ? 'wall' : c === 'rug' ? 'rug' : 'floor';
};

export function itemSize(id) {
  const it = FURNITURE[id];
  const [, , vw, vh] = it.vb.split(' ').map(Number);
  return { w: it.w, h: (it.w * vh) / vw };
}

// Keep an item (or 'otter') inside the den and in its zone (wall / rug / floor).
export function clampPos(id, x, y) {
  const z = id === 'otter' ? ZONES.floor : ZONES[zoneOf(id)];
  const w = id === 'otter' ? OTTER_W : itemSize(id).w;
  return {
    x: Math.round(Math.max(w / 2 - 10, Math.min(DEN_W - w / 2 + 10, Number(x) || 0))),
    y: Math.round(Math.max(z.minY, Math.min(z.maxY, Number(y) || 0))),
  };
}

// ---------- tabletops ----------
// Furniture with a flat top that small decor and plushies can sit on. The
// number is where the top is, as a fraction of the item's height from its top.
export const SURFACES = {
  table: 14 / 62, coffeetable: 12 / 50, oystertable: 14 / 70, chestdresser: 16 / 90, mushroomstand: 6 / 70,
  fishbowltable: 40 / 90, vanity: 66 / 120, stool: 5 / 56, chest: 8 / 62, bookshelf: 3 / 102, coralshelf: 6 / 120,
  bottlecabinet: 5 / 120, trophycabinet: 5 / 120, shellcabinet: 5 / 110,
};
export const isSurface = (id) => SURFACES[id] != null;
// Small enough to go on a table: decor and plushies up to 56 den-units wide.
export const isSmall = (id) => !isSurface(id) && ['decor', 'plush'].includes(FURNITURE[id]?.cat) && FURNITURE[id].w <= 56;
// The y (den units) of a surface's top, given where it stands.
export const surfaceTopY = (p) => p.y - itemSize(p.id).h * (1 - SURFACES[p.id]);
