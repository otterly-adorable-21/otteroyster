import { BATCH2_DOOR } from './catalog-more.js';

// Front door decorations, shown on your house on Otter Lane and on the Den tab.
// One of each kind can be up at a time. Each piece adds a little coziness.
// Shared by the website and the server.

export const DOOR_KINDS = [
  { id: 'paint', name: 'Door paint', icon: '🎨' },
  { id: 'wreath', name: 'Wreaths', icon: '💐' },
  { id: 'mat', name: 'Welcome mats', icon: '🟫' },
  { id: 'lights', name: 'Lights', icon: '🏮' },
  { id: 'plant', name: 'Porch plants', icon: '🪴' },
];

export const DOOR_ITEMS = {
  // paint (color = the drawn door color)
  'paint-moss': { kind: 'paint', name: 'Moss Green', price: 0, color: '#4f6b4a' },
  'paint-sky': { kind: 'paint', name: 'Sky Blue', price: 20, color: '#5c9fc4' },
  'paint-coral': { kind: 'paint', name: 'Coral Pink', price: 20, color: '#d98c7a' },
  'paint-butter': { kind: 'paint', name: 'Butter Yellow', price: 20, color: '#e6c25a' },
  'paint-lilac': { kind: 'paint', name: 'Lilac', price: 25, color: '#a58cc9' },
  'paint-night': { kind: 'paint', name: 'Midnight', price: 30, color: '#263b5e' },
  'paint-cherry': { kind: 'paint', name: 'Cherry Red', price: 30, color: '#b8433f' },
  // wreaths
  'wreath-lily': { kind: 'wreath', name: 'Lily Wreath', price: 40, icon: '🪷', colors: ['#6f9a3a', '#fffaf0'] },
  'wreath-shell': { kind: 'wreath', name: 'Seashell Wreath', price: 50, icon: '🐚', colors: ['#e8d6a8', '#f4e6f0'] },
  'wreath-starfish': { kind: 'wreath', name: 'Starfish Wreath', price: 60, icon: '⭐', colors: ['#3f6a2a', '#ff9e7a'] },
  'wreath-berry': { kind: 'wreath', name: 'Pinecone & Berry', price: 60, icon: '🫐', colors: ['#3f6a2a', '#c92a2a'] },
  'wreath-heart': { kind: 'wreath', name: 'Heart Wreath', price: 70, icon: '💗', colors: ['#f783ac', '#fff0f6'] },
  // mats
  'mat-welcome': { kind: 'mat', name: 'Welcome Mat', price: 25, icon: '🟫', colors: ['#a8865f', '#fff3bf'] },
  'mat-shell': { kind: 'mat', name: 'Shell Mat', price: 35, icon: '🐚', colors: ['#3cc7c0', '#fffaf0'] },
  'mat-paw': { kind: 'mat', name: 'Paw Print Mat', price: 35, icon: '🐾', colors: ['#6b4d34', '#e8d6a8'] },
  'mat-rainbow': { kind: 'mat', name: 'Rainbow Mat', price: 50, icon: '🌈', colors: ['#ff8787', '#74c0fc'] },
  // lights
  'lights-lantern': { kind: 'lights', name: 'Pearl Lantern', price: 45, icon: '🏮', colors: ['#fff3bf', '#d9b45a'] },
  'lights-fairy': { kind: 'lights', name: 'Fairy Lights', price: 55, icon: '✨', colors: ['#fff3bf', '#ffd43b'] },
  'lights-firefly': { kind: 'lights', name: 'Firefly Jar', price: 65, icon: '🫙', colors: ['#e6ff9c', '#9be8de'] },
  // plants
  'plant-fern': { kind: 'plant', name: 'Potted Fern', price: 30, icon: '🌿', colors: ['#6f9a3a', '#a8865f'] },
  'plant-sunflower': { kind: 'plant', name: 'Sunflower Pot', price: 40, icon: '🌻', colors: ['#ffd43b', '#a8865f'] },
  'plant-mushroom': { kind: 'plant', name: 'Mushroom Cluster', price: 40, icon: '🍄', colors: ['#d9635b', '#fffaf0'] },
  'plant-cattail': { kind: 'plant', name: 'Cattails', price: 35, icon: '🌾', colors: ['#6b4d34', '#7fa65a'] },
  // ---------- more mats (drawn on the house canvas, 120 × 130) ----------
  'mat-otter': { kind: 'mat', name: 'Otter Welcome Mat', price: 45, icon: '🦦', svg: `<rect x="34" y="116" width="52" height="10" rx="2" fill="#c9a66b"/><ellipse cx="60" cy="121" rx="12" ry="3.2" fill="#8a6644"/><circle cx="49" cy="120" r="3" fill="#8a6644"/><circle cx="48" cy="119.5" r=".8" fill="#2b1c14"/><path d="M71,121 q5,-3 6,1" stroke="#8a6644" stroke-width="2" fill="none"/>` },
  'mat-lighthouse': { kind: 'mat', name: 'Lighthouse Mat', price: 40, icon: '🗼', svg: `<rect x="34" y="116" width="52" height="10" rx="2" fill="#1c3f60"/><path d="M58,125 L59,117 L61,117 L62,125Z" fill="#fff"/><rect x="58.5" y="120" width="3" height="1.4" fill="#e03131"/><path d="M62,117.5 l10,-2 v4Z" fill="#fff3bf" opacity=".7"/>` },
  'mat-anchor': { kind: 'mat', name: 'Anchor Mat', price: 35, icon: '⚓', svg: `<rect x="34" y="116" width="52" height="10" rx="2" fill="#f1f3f5" stroke="#c9a66b" stroke-width="1.5" stroke-dasharray="2 1"/><path d="M60,117.5 v7 M56,123 q4,3 8,0 M57.5,118.5 h5" stroke="#1c3f60" stroke-width="1.4" fill="none"/>` },
  'mat-crabby': { kind: 'mat', name: 'Crabby Mat', price: 40, icon: '🦀', svg: `<rect x="34" y="116" width="52" height="10" rx="2" fill="#ffe8cc"/><ellipse cx="60" cy="122" rx="6" ry="3" fill="#fa5252"/><path d="M53,120 q-3,-3 0,-4 M67,120 q3,-3 0,-4" stroke="#fa5252" stroke-width="1.6" fill="none"/><text x="60" y="119" font-size="2.6" text-anchor="middle" fill="#c92a2a" font-family="sans-serif" font-weight="bold">MIND THE CRABS</text>` },
  'mat-scallop': { kind: 'mat', name: 'Scallop Shell Mat', price: 40, icon: '🐚', svg: `<path d="M40,126 Q40,112 60,112 Q80,112 80,126Z" fill="#ffc9de"/><path d="M60,126 L48,115 M60,126 L54,113 M60,126 V112 M60,126 L66,113 M60,126 L72,115" stroke="#f783ac" stroke-width="1.2"/>` },
  'mat-leaf': { kind: 'mat', name: 'Leaf Welcome Mat', price: 35, icon: '🍃', svg: `<path d="M34,121 Q46,112 60,114 Q74,112 86,121 Q74,130 60,128 Q46,130 34,121Z" fill="#82c91e"/><path d="M36,121 H84" stroke="#5c940d" stroke-width="1.2"/>` },
  'mat-flower': { kind: 'mat', name: 'Flower Mat', price: 35, icon: '🌸', svg: `<rect x="34" y="116" width="52" height="10" rx="5" fill="#fff0f6"/>${[42, 52, 62, 72, 80].map((x, k) => `<circle cx="${x}" cy="121" r="2.2" fill="${['#ff8fab', '#ffd43b', '#b197fc', '#74c0fc', '#ff8fab'][k]}"/>`).join('')}` },
  'mat-shellyeah': { kind: 'mat', name: '"Shell Yeah!" Mat', price: 45, icon: '💬', svg: `<rect x="34" y="116" width="52" height="10" rx="2" fill="#c9a66b"/><text x="60" y="123.2" font-size="5" text-anchor="middle" fill="#3b2a1e" font-family="Georgia, serif" font-weight="bold">Shell Yeah!</text>` },
  // ---------- more lights ----------
  'lights-angler': { kind: 'lights', name: 'Anglerfish Light', price: 80, icon: '🎣', svg: `<path d="M92,56 v6" stroke="#5a3f2a" stroke-width="1.2"/><ellipse cx="94" cy="68" rx="8" ry="6" fill="#495057"/><path d="M88,70 l2,-2 l2,2 l2,-2 l2,2" stroke="#fff" stroke-width=".8" fill="none"/><circle cx="91" cy="66" r="1.4" fill="#fff"/><path d="M95,62 q-1,-6 -6,-6" stroke="#343a40" stroke-width="1" fill="none"/><g class="ani-glow"><circle cx="89" cy="56" r="2.2" fill="#ffd43b"/><circle cx="89" cy="56" r="5" fill="#fff3bf" opacity=".35"/></g>` },
  'lights-jelly': { kind: 'lights', name: 'Jellyfish Pendant', price: 60, icon: '🪼', svg: `<path d="M93,52 v8" stroke="#5a3f2a" stroke-width="1.2"/><g class="ani-pulse"><path d="M86,68 Q86,59 93,59 Q100,59 100,68Z" fill="#e599f7" opacity=".9"/><circle cx="93" cy="65" r="9" fill="#f3d9fa" opacity=".35"/><path d="M89,68 q-1,6 1,10 M93,68 q1,7 0,12 M97,68 q1,6 -1,10" stroke="#e599f7" stroke-width="1.2" fill="none"/></g>` },
  'lights-seaglass': { kind: 'lights', name: 'Sea Glass Lantern', price: 55, icon: '🏮', svg: `<path d="M92,58 v5" stroke="#5a3f2a" stroke-width="1.2"/><rect x="86" y="63" width="12" height="15" rx="2" fill="#5a3f2a"/><rect x="88" y="65" width="4" height="11" fill="#63e6be" opacity=".85"/><rect x="92" y="65" width="4" height="11" fill="#74c0fc" opacity=".85"/><circle cx="92" cy="70" r="9" fill="#c3fae8" opacity=".25"/>` },
  'lights-minilighthouse': { kind: 'lights', name: 'Mini Lighthouse Lamp', price: 65, icon: '🗼', svg: `<path d="M91,118 L93,92 L99,92 L101,118Z" fill="#fff"/><path d="M92,110 h9 M92.5,100 h8" stroke="#e03131" stroke-width="3"/><rect x="92" y="86" width="8" height="6" fill="#0c3440"/><path d="M91,86 L96,81 L101,86Z" fill="#e03131"/><g class="ani-glow"><circle cx="96" cy="89" r="2" fill="#fff3bf"/><path d="M100,89 l14,-4 v8Z" fill="#fff3bf" opacity=".4"/></g>` },
  'lights-bottle': { kind: 'lights', name: 'Message Bottle Light', price: 45, icon: '🍾', svg: `<path d="M92,56 v6" stroke="#5a3f2a" stroke-width="1.2"/><rect x="89" y="62" width="6" height="3" fill="#a8865f"/><rect x="87" y="65" width="10" height="15" rx="4" fill="#c5f6fa" opacity=".7" stroke="#66d9e8"/><rect x="89" y="70" width="6" height="5" fill="#fff3bf"/><circle cx="92" cy="72" r="8" fill="#fff3bf" opacity=".3"/>` },
  'lights-buoy': { kind: 'lights', name: 'Buoy Lights', price: 55, icon: '🛟', svg: `<path d="M30,70 Q60,52 90,70" stroke="#5a3f2a" stroke-width="1" fill="none"/>${[36, 48, 60, 72, 84].map((x, k) => `<ellipse cx="${x}" cy="${70 - Math.sin(((x - 30) / 60) * Math.PI) * 12 + 3}" rx="2.6" ry="3.4" fill="${['#e03131', '#ffd43b', '#fff', '#e03131', '#ffd43b'][k]}" stroke="#212529" stroke-width=".4"/>`).join('')}` },
  'lights-moonbeam': { kind: 'lights', name: 'Moonbeam Light', price: 60, icon: '🌙', svg: `<g class="ani-glow"><path d="M98,58 A10,10 0 1,0 98,76 A7,7 0 1,1 98,58Z" fill="#fff3bf"/><circle cx="94" cy="67" r="11" fill="#fff3bf" opacity=".22"/></g>` },
  'lights-glowcap': { kind: 'lights', name: 'Glowcap Lamp', price: 50, icon: '🍄', svg: `<path d="M90,118 v-8 M96,118 v-12 M101,118 v-6" stroke="#f8f9fa" stroke-width="2"/><g class="ani-pulse"><path d="M85,111 q5,-8 10,0Z M91,107 q5,-9 10,0Z M97,113 q4,-6 8,0Z" fill="#69db7c"/><circle cx="95" cy="108" r="10" fill="#d3f9d8" opacity=".3"/></g>` },
  // ---------- more porch plants ----------
  'plant-hydrangea': { kind: 'plant', name: 'Blue Hydrangeas', price: 45, icon: '💐', svg: `<path d="M14,118 l3,-12 h14 l3,12Z" fill="#f1f3f5"/>${[[18, 98], [26, 96], [22, 90], [30, 101]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="#74c0fc"/><circle cx="${x - 1}" cy="${y - 1}" r="2" fill="#a5d8ff"/>`).join('')}<path d="M16,104 l-4,-2 M32,104 l4,-2" stroke="#5c940d" stroke-width="2"/>` },
  'plant-seaholly': { kind: 'plant', name: 'Sea Holly', price: 40, icon: '💠', svg: `<path d="M14,118 l3,-12 h14 l3,12Z" fill="#a8865f"/><path d="M18,106 V86 M24,106 V82 M30,106 V88" stroke="#7a9e7e" stroke-width="1.6"/>${[[18, 84], [24, 80], [30, 86]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="4" fill="#4263eb"/><path d="M${x - 5},${y + 3} l5,-2 l5,2" stroke="#748ffc" stroke-width="1.2" fill="none"/>`).join('')}` },
  'plant-mangrove': { kind: 'plant', name: 'Miniature Mangrove', price: 60, icon: '🌳', svg: `<ellipse cx="24" cy="117" rx="12" ry="3" fill="#3cc7c0"/><path d="M20,116 q-6,-6 0,-10 M28,116 q6,-6 0,-10 M24,116 V92" stroke="#6b4d34" stroke-width="2.2" fill="none"/><circle cx="24" cy="86" r="11" fill="#2b8a3e"/><circle cx="17" cy="90" r="6" fill="#37b24d"/><circle cx="31" cy="90" r="6" fill="#37b24d"/>` },
  'plant-terrarium': { kind: 'plant', name: 'Sea Glass Terrarium', price: 65, icon: '🫙', svg: `<path d="M12,118 Q10,96 24,92 Q38,96 36,118Z" fill="#c3fae8" opacity=".55" stroke="#63e6be" stroke-width="1.5"/><ellipse cx="24" cy="114" rx="10" ry="3" fill="#e8d6a8"/>${[[18, 112, '#63e6be'], [26, 113, '#74c0fc'], [30, 111, '#b197fc']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="3" height="2" rx=".6" fill="${c}"/>`).join('')}<path d="M22,112 q-2,-8 2,-12 M26,112 q2,-6 0,-10" stroke="#2b8a3e" stroke-width="1.8" fill="none"/>` },
  'plant-lavender': { kind: 'plant', name: 'Lavender Pot', price: 40, icon: '💜', svg: `<path d="M14,118 l3,-12 h14 l3,12Z" fill="#e9ecef"/>${[17, 21, 25, 29].map((x, k) => `<path d="M${x},106 V${88 - (k % 2) * 4}" stroke="#94d82d" stroke-width="1.4"/>${[0, 4, 8].map((d) => `<ellipse cx="${x}" cy="${90 - (k % 2) * 4 + d}" rx="1.6" ry="2.2" fill="#9775fa"/>`).join('')}`).join('')}` },
  'plant-cherry': { kind: 'plant', name: 'Cherry Blossom Tree', price: 70, icon: '🌸', svg: `<path d="M14,118 l3,-10 h14 l3,10Z" fill="#a8865f"/><path d="M24,108 V92 M24,98 l-6,-6 M24,96 l6,-6" stroke="#6b4d34" stroke-width="2"/>${[[16, 88], [22, 84], [30, 86], [26, 92], [18, 94], [32, 92]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#ffc9de"/>`).join('')}` },
  ...BATCH2_DOOR,
};

export const DOOR_COZY = 1; // per decoration (paint not counted)
export const defaultDoor = () => ({ paint: 'paint-moss', wreath: null, mat: null, lights: null, plant: null });
export const doorColor = (door) => DOOR_ITEMS[door?.paint]?.color || '#4f6b4a';
