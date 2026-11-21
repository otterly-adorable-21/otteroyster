// More for the den: seating, beds, tables and storage, decorations, display
// collections, furniture you can use, event pieces, wallpapers and floors.
// Each item is drawn in its own viewBox `vb`, shown `w` den-units wide (the
// den is 400 × 300), standing on the bottom edge. Art in assets/art/furniture/.
//
// use: what tapping it does in the den ('books', 'aquarium', 'arcade', 'photo')
// shows: which trinket collection it displays

const wood = '#8a6644';
const woodDark = '#6b4d34';
const pearl = (x, y, r = 5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#d8c8e8" stroke-width="1"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.3}" fill="#fff" opacity=".9"/>`;
const shellFan = (cx, cy, r, fill, line) => `<path d="M${cx - r},${cy} Q${cx - r},${cy - r * 1.4} ${cx},${cy - r * 1.4} Q${cx + r},${cy - r * 1.4} ${cx + r},${cy}Z" fill="${fill}" stroke="${line}" stroke-width="2"/>${[-0.6, -0.3, 0, 0.3, 0.6].map((k) => `<path d="M${cx},${cy} L${cx + k * r},${cy - r * 1.3}" stroke="${line}" stroke-width="1.5"/>`).join('')}`;
const legs = (x1, x2, y, h, c = woodDark) => `<rect x="${x1}" y="${y}" width="6" height="${h}" rx="2" fill="${c}"/><rect x="${x2 - 6}" y="${y}" width="6" height="${h}" rx="2" fill="${c}"/>`;
const emo = (x, y, s, e) => `<text x="${x}" y="${y}" font-size="${s}" text-anchor="middle">${e}</text>`;
const frame = (w, h, inner, c = '#a8865f') => `<rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="4" fill="${c}"/><rect x="8" y="8" width="${w - 16}" height="${h - 16}" fill="#fff"/>${inner}`;

// [name, cat, price, level, cozy, vb, w, svg, extra]
const F = {
  // ---------- seating ----------
  rockingchair: ['Driftwood Rocking Chair', 'seating', 90, 2, 3, '0 0 90 100', 64, `<path d="M18,10 Q16,4 24,4 L64,4 Q72,4 70,10 L66,58 L22,58Z" fill="${wood}"/><path d="M28,10 V54 M44,10 V54 M60,10 V54" stroke="${woodDark}" stroke-width="3"/><rect x="12" y="56" width="68" height="12" rx="5" fill="#a8865f"/>${legs(16, 76, 66, 20)}<path d="M4,86 Q46,100 88,86" stroke="${woodDark}" stroke-width="6" fill="none" stroke-linecap="round"/>`],
  jellybeanbag: ['Jellyfish Beanbag', 'seating', 85, 2, 4, '0 0 100 80', 70, `<path d="M8,60 Q6,10 50,8 Q94,10 92,60 Q50,74 8,60Z" fill="#f3a6d8"/><path d="M20,62 q-2,10 4,16 M40,66 q-2,8 2,12 M60,66 q2,8 -2,12 M80,62 q2,10 -4,16" stroke="#e599f7" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="36" cy="26" rx="14" ry="7" fill="#fff" opacity=".45"/>`],
  shellloveseat: ['Seashell Loveseat', 'seating', 140, 4, 5, '0 0 150 90', 104, `${shellFan(75, 56, 62, '#f4e6f0', '#c9b3c8')}<rect x="10" y="50" width="130" height="22" rx="10" fill="#3cc7c0"/><rect x="14" y="44" width="122" height="12" rx="6" fill="#9be8de"/>${legs(18, 132, 70, 16)}`],
  coralthrone: ['Coral Throne', 'seating', 260, 9, 6, '0 0 100 130', 72, `<path d="M20,70 L14,20 L24,30 L28,4 L38,26 L50,0 L62,26 L72,4 L76,30 L86,20 L80,70Z" fill="#ff8787" stroke="#e03131" stroke-width="2"/><rect x="12" y="66" width="76" height="18" rx="6" fill="#c92a2a"/><rect x="18" y="84" width="64" height="40" rx="4" fill="#e03131"/>${pearl(50, 40, 7)}`],
  floatlounger: ['Floating Lounger', 'seating', 70, 3, 3, '0 0 130 50', 92, `<ellipse cx="65" cy="30" rx="62" ry="18" fill="#ff922b"/><ellipse cx="65" cy="28" rx="44" ry="10" fill="#ffe8cc"/><path d="M10,26 Q65,6 120,26" stroke="#fff" stroke-width="3" fill="none" stroke-dasharray="10 8"/>`],
  whalesofa: ['Whale Sofa', 'seating', 220, 7, 6, '0 0 160 90', 112, `<path d="M10,70 Q4,20 60,18 Q120,16 140,40 L156,22 Q160,46 146,56 Q140,82 90,84 L20,84Z" fill="#4c6ef5"/><path d="M20,64 Q80,74 138,58 L138,80 Q80,88 20,82Z" fill="#dbe4ff"/><circle cx="36" cy="42" r="4" fill="#1b2a6b"/><path d="M30,54 q8,5 16,0" stroke="#1b2a6b" stroke-width="2" fill="none"/><path d="M60,10 q2,-8 8,-8 M66,10 q4,-6 10,-4" stroke="#74c0fc" stroke-width="3" fill="none" stroke-linecap="round"/>`],
  kelpchair: ['Woven Kelp Chair', 'seating', 75, 2, 3, '0 0 90 100', 62, `<path d="M14,8 Q45,0 76,8 L72,60 L18,60Z" fill="#5c940d"/>${[18, 30, 42, 54].map((y) => `<path d="M16,${y} Q45,${y + 6} 74,${y}" stroke="#82c91e" stroke-width="4" fill="none"/>`).join('')}<rect x="8" y="58" width="74" height="16" rx="7" fill="#2b8a3e"/>${legs(14, 76, 72, 24, '#2b8a3e')}`],
  // ---------- beds ----------
  clambed: ['Giant Clam Bed', 'beds', 180, 5, 6, '0 0 150 90', 116, `<path d="M8,54 Q8,4 75,4 Q142,4 142,54Z" fill="#a5d8ff" stroke="#4dabf7" stroke-width="3"/><path d="M8,54 Q75,92 142,54 Q140,86 75,88 Q10,86 8,54Z" fill="#74c0fc" stroke="#4dabf7" stroke-width="3"/><ellipse cx="75" cy="58" rx="58" ry="14" fill="#fff0f6"/>${pearl(104, 46, 9)}<ellipse cx="44" cy="52" rx="16" ry="7" fill="#fff"/>`],
  canopybed: ['Driftwood Canopy Bed', 'beds', 240, 7, 7, '0 0 140 130', 112, `<rect x="8" y="6" width="6" height="120" fill="${woodDark}"/><rect x="126" y="6" width="6" height="120" fill="${woodDark}"/><path d="M4,8 H136" stroke="${wood}" stroke-width="8"/><path d="M14,12 Q30,60 20,92 M126,12 Q110,60 120,92" stroke="#fff" stroke-width="8" opacity=".8" fill="none"/><rect x="10" y="88" width="120" height="26" rx="8" fill="${wood}"/><rect x="14" y="80" width="112" height="16" rx="7" fill="#fff3bf"/><ellipse cx="34" cy="80" rx="16" ry="7" fill="#fff"/>`],
  mushroombed: ['Mushroom Bed', 'beds', 160, 4, 6, '0 0 140 110', 112, `<path d="M6,60 Q8,2 70,2 Q132,2 134,60 Q70,48 6,60Z" fill="#e03131"/><circle cx="40" cy="26" r="8" fill="#fff"/><circle cx="84" cy="18" r="7" fill="#fff"/><circle cx="112" cy="38" r="6" fill="#fff"/><rect x="22" y="58" width="96" height="46" rx="10" fill="#fff3e6"/><rect x="18" y="70" width="104" height="18" rx="8" fill="#74c0fc"/>`],
  shellcradle: ['Seashell Cradle', 'beds', 120, 3, 5, '0 0 120 80', 92, `<path d="M6,30 Q60,96 114,30 Q60,58 6,30Z" fill="#ffdeeb" stroke="#f783ac" stroke-width="3"/><path d="M20,40 L18,74 M100,40 L102,74" stroke="${woodDark}" stroke-width="5"/><path d="M8,76 Q60,82 112,76" stroke="${woodDark}" stroke-width="5" fill="none"/><ellipse cx="60" cy="40" rx="40" ry="8" fill="#fff"/>`],
  netbed: ['Hammock Bed', 'beds', 110, 3, 5, '0 0 150 90', 118, `<rect x="4" y="4" width="6" height="84" fill="${woodDark}"/><rect x="140" y="4" width="6" height="84" fill="${woodDark}"/><path d="M8,20 Q75,90 142,20" fill="#ffe8a3" stroke="#e8c547" stroke-width="3"/><path d="M20,30 Q75,80 130,30" stroke="#e8c547" stroke-width="2" fill="none" stroke-dasharray="6 6"/>`],
  pearlbed: ['Pearl Cushion Bed', 'beds', 200, 6, 6, '0 0 130 90', 104, `<ellipse cx="65" cy="56" rx="62" ry="32" fill="#f1e8ff" stroke="#d0bfff" stroke-width="3"/><ellipse cx="65" cy="46" rx="48" ry="20" fill="#fff"/><ellipse cx="46" cy="38" rx="14" ry="7" fill="#fff" stroke="#e5dbff"/><circle cx="96" cy="30" r="5" fill="#fff" opacity=".9"/>`],
  chestbed: ['Sunken Treasure Chest Bed', 'beds', 230, 7, 6, '0 0 140 100', 112, `<path d="M8,40 Q70,-6 132,40Z" fill="#8a6644"/><rect x="8" y="38" width="124" height="58" rx="6" fill="#a8865f"/><path d="M8,38 H132 M8,62 H132" stroke="#e8c547" stroke-width="4"/><rect x="16" y="46" width="108" height="14" rx="6" fill="#fff3bf"/><circle cx="70" cy="76" r="6" fill="#e8c547"/>${pearl(110, 50, 5)}<circle cx="34" cy="48" r="4" fill="#ffd43b"/>`],
  bubblebed: ['Underwater Bubble Bed', 'beds', 260, 9, 7, '0 0 130 120', 104, `<circle cx="65" cy="60" r="56" fill="#c5f6fa" opacity=".55" stroke="#66d9e8" stroke-width="3"/><ellipse cx="65" cy="90" rx="48" ry="14" fill="#3bc9db"/><ellipse cx="65" cy="84" rx="40" ry="9" fill="#e3fafc"/><ellipse cx="44" cy="30" rx="14" ry="8" fill="#fff" opacity=".7"/><circle cx="104" cy="22" r="5" fill="#fff" opacity=".7"/>`],
  cloudbed: ['Cloud Bed', 'beds', 280, 10, 7, '0 0 150 90', 118, `<path d="M14,70 Q0,44 26,40 Q26,12 56,18 Q70,0 92,14 Q122,6 124,34 Q150,36 140,66 Q120,80 75,78 Q30,80 14,70Z" fill="#fff" stroke="#d0ebff" stroke-width="3"/><path d="M30,62 Q75,70 120,60" stroke="#d0ebff" stroke-width="3" fill="none"/>`],
  knitnest: ['Cozy Knitted Nest', 'beds', 130, 3, 6, '0 0 120 70', 96, `<ellipse cx="60" cy="44" rx="58" ry="24" fill="#e8a0b4"/>${[16, 32, 48, 64, 80, 96].map((x) => `<path d="M${x},26 q6,10 0,20 q-6,10 0,20" stroke="#d6849b" stroke-width="3" fill="none"/>`).join('')}<ellipse cx="60" cy="38" rx="40" ry="12" fill="#ffdeeb"/>`],
  // ---------- tables & storage ----------
  coffeetable: ['Driftwood Coffee Table', 'tables', 60, 1, 2, '0 0 120 50', 82, `<path d="M4,14 Q60,2 116,14 L114,24 Q60,14 6,24Z" fill="#a8865f"/>${legs(14, 106, 20, 26)}`],
  oystertable: ['Oyster-Shell Side Table', 'tables', 55, 1, 2, '0 0 70 70', 46, `<ellipse cx="35" cy="16" rx="32" ry="12" fill="#e9e3f5" stroke="#b8a9cf" stroke-width="2"/>${pearl(35, 12, 6)}<path d="M35,26 V66 M22,66 H48" stroke="${woodDark}" stroke-width="6" stroke-linecap="round"/>`],
  coralshelf: ['Coral Bookshelf', 'tables', 120, 3, 3, '0 0 80 120', 58, `<path d="M6,118 L10,10 Q40,0 70,10 L74,118Z" fill="#ff8787"/><rect x="14" y="20" width="52" height="88" fill="#ffc9c9"/>${[38, 66, 94].map((y) => `<rect x="14" y="${y}" width="52" height="4" fill="#ff8787"/>`).join('')}${[18, 26, 34, 44, 52].map((x, k) => `<rect x="${x}" y="${22 + (k % 2) * 2}" width="6" height="${16 - (k % 2) * 2}" fill="${['#4c6ef5', '#ffd43b', '#2b8a3e', '#e64980', '#7048e8'][k]}"/>`).join('')}`, { use: 'books' }],
  chestdresser: ['Treasure Chest Dresser', 'tables', 110, 3, 2, '0 0 90 90', 64, `<rect x="6" y="20" width="78" height="66" rx="5" fill="#a8865f"/><path d="M6,22 Q45,2 84,22" fill="#8a6644"/>${[34, 52, 70].map((y) => `<rect x="12" y="${y}" width="66" height="14" rx="3" fill="#c9a66b"/><circle cx="45" cy="${y + 7}" r="3" fill="#e8c547"/>`).join('')}`],
  bottlecabinet: ['Glass Bottle Cabinet', 'tables', 130, 4, 3, '0 0 80 120', 58, `<rect x="4" y="4" width="72" height="112" rx="4" fill="${wood}"/><rect x="10" y="10" width="60" height="100" fill="#c5f6fa" opacity=".6"/>${[[20, 40, '#69db7c'], [36, 40, '#74c0fc'], [52, 40, '#ffa94d'], [24, 90, '#e599f7'], [44, 90, '#69db7c']].map(([x, y, c]) => `<rect x="${x - 5}" y="${y - 22}" width="10" height="22" rx="3" fill="${c}" opacity=".8"/><rect x="${x - 2}" y="${y - 28}" width="4" height="7" fill="${c}"/>`).join('')}<rect x="10" y="48" width="60" height="4" fill="${wood}"/>`],
  mushroomstand: ['Mushroom Nightstand', 'tables', 50, 1, 2, '0 0 60 70', 42, `<path d="M4,30 Q6,2 30,2 Q54,2 56,30Z" fill="#c9a66b"/><circle cx="20" cy="16" r="4" fill="#fff3bf"/><rect x="20" y="28" width="20" height="40" rx="6" fill="#fff3e6"/>`],
  fishbowltable: ['Fishbowl Table', 'tables', 90, 3, 3, '0 0 80 90', 56, `<rect x="6" y="40" width="68" height="8" rx="3" fill="#a8865f"/>${legs(12, 68, 46, 40)}<circle cx="40" cy="22" r="20" fill="#a5d8ff" opacity=".6" stroke="#4dabf7" stroke-width="2"/><path d="M32,24 q6,-6 12,0 q-6,6 -12,0 l-4,-3 v6Z" fill="#ff922b"/>`],
  kelpbasket: ['Kelp Basket', 'tables', 30, 1, 1, '0 0 70 60', 44, `<path d="M6,18 L12,56 L58,56 L64,18Z" fill="#5c940d"/>${[26, 38, 50].map((y) => `<path d="M8,${y} H62" stroke="#82c91e" stroke-width="3"/>`).join('')}<path d="M14,18 Q35,-4 56,18" stroke="#2b8a3e" stroke-width="4" fill="none"/>`],
  vanity: ['Antique Vanity', 'tables', 170, 6, 3, '0 0 90 120', 64, `<ellipse cx="45" cy="34" rx="26" ry="30" fill="#e8c547"/><ellipse cx="45" cy="34" rx="20" ry="24" fill="#d0ebff"/><path d="M38,22 l10,10" stroke="#fff" stroke-width="3"/><rect x="4" y="66" width="82" height="16" rx="4" fill="${wood}"/><rect x="10" y="82" width="70" height="20" fill="#a8865f"/>${legs(10, 80, 100, 18)}`],
  // ---------- decorations ----------
  oceanpainting: ['Framed Ocean Painting', 'wall', 70, 2, 2, '0 0 90 70', 66, frame(90, 70, '<rect x="8" y="8" width="74" height="54" fill="#a5d8ff"/><path d="M8,44 Q30,34 46,44 Q64,54 82,42 V62 H8Z" fill="#1c7ed6"/><circle cx="64" cy="22" r="7" fill="#ffd43b"/>')],
  seaweedart: ['Pressed Seaweed Artwork', 'wall', 55, 1, 2, '0 0 60 80', 42, frame(60, 80, '<path d="M30,70 Q22,50 30,36 Q38,22 30,12 M30,50 Q18,44 16,36 M30,40 Q42,34 44,26" stroke="#2b8a3e" stroke-width="3" fill="none"/>', '#c9a66b')],
  pearlstand: ['Pearl Display Stand', 'decor', 80, 3, 2, '0 0 50 70', 32, `<path d="M25,36 V64 M12,66 H38" stroke="#b08d3c" stroke-width="4" stroke-linecap="round"/><path d="M12,36 Q25,46 38,36" fill="#e8c547"/>${pearl(25, 26, 11)}`],
  shipbottle: ['Ship in a Bottle', 'decor', 75, 3, 2, '0 0 90 50', 56, `<rect x="6" y="10" width="68" height="34" rx="16" fill="#c5f6fa" opacity=".55" stroke="#66d9e8" stroke-width="2"/><rect x="74" y="20" width="12" height="14" rx="3" fill="#a8865f"/><path d="M20,34 L58,34 L54,40 L24,40Z" fill="${woodDark}"/><path d="M38,14 V34 M38,16 L50,30 H38Z M38,18 L28,30 H38Z" fill="#fff" stroke="${woodDark}" stroke-width="1.5"/>`],
  minilighthouse: ['Miniature Lighthouse', 'decor', 90, 3, 2, '0 0 50 110', 30, `<path d="M14,106 L18,26 L32,26 L36,106Z" fill="#fff"/><path d="M15,84 L35,84 L35.6,94 L14.4,94Z M16,52 L34,52 L34.6,62 L15.4,62Z" fill="#e03131"/><rect x="16" y="12" width="18" height="14" rx="2" fill="#0c3440"/><path d="M14,12 L25,2 L36,12Z" fill="#e03131"/><circle cx="25" cy="19" r="4" fill="#fff3bf"/>`],
  coralsculpture: ['Coral Sculpture', 'decor', 85, 3, 2, '0 0 70 90', 46, `<path d="M35,86 V50 Q35,30 20,20 M35,56 Q50,40 54,16 M35,66 Q20,56 12,44 M54,30 Q62,26 64,18 M20,20 Q16,10 20,4" stroke="#ff8787" stroke-width="8" fill="none" stroke-linecap="round"/><rect x="18" y="80" width="34" height="8" rx="3" fill="#c9a66b"/>`],
  jellylanterns: ['Hanging Jellyfish Lanterns', 'wall', 95, 4, 3, '0 0 120 70', 86, `<path d="M4,6 Q60,20 116,6" stroke="#5a3f2a" stroke-width="2" fill="none"/>${[22, 60, 98].map((x) => `<path d="M${x},14 v6" stroke="#5a3f2a" stroke-width="1.5"/><path d="M${x - 12},34 Q${x - 12},20 ${x},20 Q${x + 12},20 ${x + 12},34Z" fill="#e599f7" opacity=".85"/><circle cx="${x}" cy="30" r="12" fill="#f3d9fa" opacity=".4"/><path d="M${x - 8},34 q-2,10 2,18 M${x},34 q2,10 0,22 M${x + 8},34 q2,10 -2,18" stroke="#e599f7" stroke-width="2" fill="none"/>`).join('')}`],
  glassfloats: ['Glass Floats', 'decor', 60, 2, 2, '0 0 80 50', 50, `<circle cx="22" cy="30" r="18" fill="#69db7c" opacity=".7"/><circle cx="54" cy="32" r="16" fill="#4dabf7" opacity=".7"/><circle cx="40" cy="16" r="12" fill="#ffa94d" opacity=".7"/><path d="M8,30 Q22,22 36,30 M42,32 Q54,24 68,32" stroke="${woodDark}" stroke-width="1.5" fill="none"/><circle cx="16" cy="24" r="4" fill="#fff" opacity=".7"/>`],
  divehelmet: ['Antique Diving Helmet', 'decor', 140, 5, 2, '0 0 70 80', 46, `<circle cx="35" cy="36" r="30" fill="#b08d3c"/><circle cx="35" cy="36" r="18" fill="#c5f6fa" opacity=".6" stroke="#7a5c1f" stroke-width="5"/><rect x="10" y="62" width="50" height="14" rx="4" fill="#7a5c1f"/><circle cx="8" cy="36" r="5" fill="#7a5c1f"/><circle cx="62" cy="36" r="5" fill="#7a5c1f"/>`],
  driftsculpture: ['Driftwood Sculpture', 'decor', 70, 2, 2, '0 0 60 90', 40, `<path d="M30,86 Q20,60 30,40 Q40,20 26,6 M30,60 Q44,50 48,32 M30,46 Q16,40 12,28" stroke="#a8865f" stroke-width="7" fill="none" stroke-linecap="round"/><rect x="14" y="82" width="32" height="6" rx="2" fill="${woodDark}"/>`],
  messagebottle: ['Message in a Bottle', 'decor', 40, 1, 1, '0 0 70 40', 40, `<rect x="4" y="12" width="48" height="24" rx="10" fill="#c5f6fa" opacity=".6" stroke="#66d9e8" stroke-width="2"/><rect x="52" y="18" width="12" height="12" rx="2" fill="#a8865f"/><rect x="14" y="18" width="28" height="12" rx="2" fill="#fff3bf" transform="rotate(-6 28 24)"/>`],
  windchimes: ['Shell Wind Chimes', 'wall', 50, 1, 2, '0 0 60 80', 36, `<path d="M8,8 H52" stroke="${wood}" stroke-width="4"/>${[12, 22, 30, 38, 48].map((x, k) => `<path d="M${x},8 V${30 + k * 6}" stroke="#adb5bd" stroke-width="1"/><path d="M${x - 5},${36 + k * 6} Q${x},${26 + k * 6} ${x + 5},${36 + k * 6}Z" fill="#f4e6f0" stroke="#c9b3c8"/>`).join('')}`],
  stargarland: ['Starfish Garland', 'wall', 45, 1, 2, '0 0 140 40', 104, `<path d="M4,8 Q70,34 136,8" stroke="#e8c547" stroke-width="2" fill="none"/>${[20, 46, 70, 94, 120].map((x, k) => { const y = 8 + Math.sin((x / 140) * Math.PI) * 20; return `<path d="M${x},${y - 7} L${x + 2},${y - 2} L${x + 7},${y} L${x + 2},${y + 2} L${x},${y + 7} L${x - 2},${y + 2} L${x - 7},${y} L${x - 2},${y - 2}Z" fill="${k % 2 ? '#ff922b' : '#ffa94d'}"/>`; }).join('')}`],
  hangingplants: ['Hanging Plants', 'wall', 55, 2, 3, '0 0 60 90', 40, `<path d="M30,2 V20" stroke="#5a3f2a" stroke-width="1.5"/><path d="M14,20 L46,20 L42,36 L18,36Z" fill="#c9a66b"/><path d="M20,34 Q14,56 18,80 M30,36 Q32,60 28,86 M40,34 Q46,56 42,76" stroke="#5c940d" stroke-width="3" fill="none"/>${[[17, 50], [19, 66], [31, 56], [29, 74], [43, 50], [44, 64]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#82c91e"/>`).join('')}`],
  shellcurtains: ['Seashell Curtains', 'wall', 80, 3, 2, '0 0 100 110', 70, `<path d="M4,4 H96" stroke="${wood}" stroke-width="5"/>${[14, 32, 50, 68, 86].map((x) => `<path d="M${x},4 V100" stroke="#e9ecef" stroke-width="1"/>${[24, 46, 68, 90].map((y) => `<circle cx="${x}" cy="${y}" r="4" fill="#f4e6f0" stroke="#c9b3c8"/>`).join('')}`).join('')}`],
  candles: ['Floating Candles', 'decor', 50, 2, 3, '0 0 70 40', 44, `<ellipse cx="35" cy="32" rx="32" ry="7" fill="#3cc7c0" opacity=".5"/>${[16, 35, 54].map((x, k) => `<rect x="${x - 5}" y="${14 + k % 2 * 4}" width="10" height="${16 - k % 2 * 4}" rx="2" fill="#fff3e6"/><ellipse cx="${x}" cy="${10 + k % 2 * 4}" rx="3" ry="5" fill="#ffd43b"/><circle cx="${x}" cy="${10 + k % 2 * 4}" r="8" fill="#fff3bf" opacity=".3"/>`).join('')}`],
  nauticalmap: ['Vintage Nautical Map', 'wall', 75, 3, 2, '0 0 100 70', 72, `<path d="M4,6 L36,2 L64,8 L96,4 L96,64 L64,68 L36,62 L4,66Z" fill="#f3e3b8" stroke="#c9a66b" stroke-width="2"/><path d="M36,2 V62 M64,8 V68" stroke="#d8c39c" stroke-width="1.5"/><path d="M14,40 Q24,24 40,34 Q52,44 46,52" stroke="#a8865f" stroke-width="2" fill="none"/><path d="M60,26 l20,14 M74,46 l6,-6" stroke="#c92a2a" stroke-width="2" stroke-dasharray="3 3"/><path d="M78,40 l4,4 m0,-4 l-4,4" stroke="#c92a2a" stroke-width="2"/>`],
  // ---------- display collections (show your trinkets) ----------
  shellcabinet: ['Shell Collection Cabinet', 'collect', 140, 3, 3, '0 0 90 110', 64, `<rect x="4" y="4" width="82" height="104" rx="5" fill="${wood}"/><rect x="10" y="10" width="70" height="92" fill="#e6f7f3"/><rect x="10" y="40" width="70" height="3" fill="${wood}"/><rect x="10" y="72" width="70" height="3" fill="${wood}"/>`, { shows: 'beach' }],
  rockshelf: ['Rock Collection Shelf', 'collect', 120, 2, 3, '0 0 110 60', 80, `<rect x="2" y="22" width="106" height="7" rx="2" fill="${wood}"/><rect x="2" y="50" width="106" height="7" rx="2" fill="${wood}"/>`, { shows: 'rocks', wall: true }],
  fossildisplay: ['Fossil Display', 'collect', 150, 5, 2, '0 0 80 90', 56, `<rect x="6" y="70" width="68" height="18" rx="3" fill="${woodDark}"/><rect x="10" y="10" width="60" height="60" fill="#c5f6fa" opacity=".4" stroke="#adb5bd" stroke-width="2"/>`, { shows: 'fossil' }],
  pearlcase: ['Pearl Collection Case', 'collect', 180, 6, 3, '0 0 80 90', 56, `<rect x="6" y="66" width="68" height="22" rx="3" fill="#7048e8"/><rect x="10" y="8" width="60" height="58" rx="4" fill="#f3f0ff" opacity=".7" stroke="#b197fc" stroke-width="2"/>`, { shows: 'pearls' }],
  postcardwall: ['Postcard Wall', 'collect', 90, 2, 2, '0 0 110 70', 80, `<rect x="2" y="2" width="106" height="66" rx="3" fill="#c9a66b"/><rect x="6" y="6" width="98" height="58" fill="#e8d6a8"/>`, { shows: 'postcards', wall: true }],
  trophycabinet: ['Trophy Cabinet', 'collect', 200, 7, 3, '0 0 90 120', 64, `<rect x="4" y="4" width="82" height="114" rx="5" fill="#5c3a21"/><rect x="10" y="10" width="70" height="100" fill="#fff8e1"/><rect x="10" y="44" width="70" height="3" fill="#5c3a21"/><rect x="10" y="78" width="70" height="3" fill="#5c3a21"/>`, { shows: 'novelty' }],
  // ---------- furniture you can use ----------
  aquarium: ['Aquarium', 'fun', 160, 3, 4, '0 0 120 90', 90, `<rect x="4" y="66" width="112" height="22" rx="3" fill="${woodDark}"/><rect x="8" y="6" width="104" height="62" rx="4" fill="#4dabf7" opacity=".55" stroke="#1c7ed6" stroke-width="3"/><path d="M8,58 Q34,50 60,58 Q86,66 112,56 V66 H8Z" fill="#e8d6a8"/><path d="M24,58 q-4,-14 2,-24 M96,58 q4,-16 -2,-28" stroke="#2b8a3e" stroke-width="3" fill="none"/>`, { use: 'aquarium' }],
  arcademachine: ['Arcade Machine', 'fun', 220, 5, 3, '0 0 70 130', 46, `<path d="M8,128 L8,20 Q8,4 24,4 L46,4 Q62,4 62,20 L62,128Z" fill="#7048e8"/><rect x="14" y="20" width="42" height="34" rx="3" fill="#0c3440"/><rect x="18" y="24" width="34" height="26" fill="#22b8cf" opacity=".5"/><text x="35" y="42" font-size="9" text-anchor="middle" fill="#fff3bf" font-family="monospace">PLAY</text><rect x="10" y="62" width="50" height="14" rx="2" fill="#5f3dc4"/><circle cx="24" cy="69" r="4" fill="#e03131"/><circle cx="40" cy="69" r="3" fill="#ffd43b"/><circle cx="48" cy="69" r="3" fill="#69db7c"/>`, { use: 'arcade' }],
  photobooth: ['Photo Booth', 'fun', 240, 6, 3, '0 0 90 130', 62, `<rect x="4" y="4" width="82" height="124" rx="4" fill="#e03131"/><rect x="12" y="20" width="44" height="100" fill="#212529"/><path d="M12,20 Q24,60 12,120 M56,20 Q44,60 56,120" fill="#c92a2a"/><rect x="60" y="30" width="20" height="16" rx="3" fill="#343a40"/><circle cx="70" cy="38" r="5" fill="#868e96"/><text x="45" y="15" font-size="9" text-anchor="middle" fill="#fff3bf" font-weight="bold" font-family="sans-serif">PHOTOS</text>`, { use: 'photo' }],
  // ---------- event pieces (event shops only) ----------
  flowerbed: ['Spring Flower Bed', 'decor', null, 1, 3, '0 0 110 50', 80, `<rect x="4" y="30" width="102" height="18" rx="4" fill="#8a6644"/>${[14, 30, 46, 62, 78, 94].map((x, k) => `<path d="M${x},32 V18" stroke="#2b8a3e" stroke-width="2"/><circle cx="${x}" cy="14" r="6" fill="${['#ff8fab', '#ffd43b', '#b197fc', '#ff8787', '#74c0fc', '#ffa94d'][k]}"/><circle cx="${x}" cy="14" r="2" fill="#fff3bf"/>`).join('')}`, { event: true }],
  butterflylamp: ['Butterfly Lamp', 'decor', null, 1, 3, '0 0 50 100', 32, `<path d="M25,40 V94 M12,96 H38" stroke="#5c940d" stroke-width="4" stroke-linecap="round"/><path d="M25,30 Q6,6 6,26 Q6,44 25,36 Q44,44 44,26 Q44,6 25,30Z" fill="#b197fc" opacity=".9"/><circle cx="25" cy="30" r="14" fill="#fff3bf" opacity=".35"/>`, { event: true }],
  eggbasket: ['Egg Basket', 'decor', null, 1, 2, '0 0 70 60', 44, `<path d="M6,26 L12,56 L58,56 L64,26Z" fill="#c9a66b"/><path d="M14,26 Q35,0 56,26" stroke="#a8865f" stroke-width="4" fill="none"/>${[[20, 26, '#ffc9de'], [34, 22, '#c5f6fa'], [48, 26, '#fff3bf']].map(([x, y, c]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="10" fill="${c}" stroke="#adb5bd"/>`).join('')}`, { event: true }],
  paintedeggs: ['Painted Eggs', 'decor', null, 1, 2, '0 0 70 40', 44, [[14, '#ff8fab'], [35, '#74c0fc'], [56, '#ffd43b']].map(([x, c]) => `<ellipse cx="${x}" cy="24" rx="11" ry="14" fill="${c}"/><path d="M${x - 10},22 Q${x},16 ${x + 10},22" stroke="#fff" stroke-width="2" fill="none"/><path d="M${x - 9},30 l4,-4 l4,4 l4,-4 l4,4" stroke="#fff" stroke-width="1.5" fill="none"/>`).join(''), { event: true }],
  beachumbrella: ['Beach Umbrella', 'decor', null, 1, 2, '0 0 100 110', 70, `<path d="M50,30 V106" stroke="#fff" stroke-width="4"/><path d="M4,40 Q50,-8 96,40Z" fill="#ff6b6b"/><path d="M50,0 Q34,20 26,40 M50,0 Q66,20 74,40" stroke="#fff" stroke-width="6" fill="none"/>`, { event: true }],
  sandcastledecor: ['Sandcastle', 'decor', null, 1, 2, '0 0 80 70', 54, `<rect x="10" y="30" width="60" height="38" fill="#e8d6a8"/><rect x="4" y="18" width="18" height="50" fill="#d8c39c"/><rect x="58" y="18" width="18" height="50" fill="#d8c39c"/><path d="M4,18 v-6 h4 v6 h4 v-6 h4 v6 h4 v-6 h2 v6 M58,18 v-6 h4 v6 h4 v-6 h4 v6 h4 v-6 h2 v6" stroke="#d8c39c" stroke-width="2" fill="none"/><path d="M34,68 V50 Q40,42 46,50 V68Z" fill="#c9a66b"/><path d="M40,4 V18 M40,4 L52,8 L40,12" fill="#ff6b6b" stroke="#a8865f" stroke-width="1.5"/>`, { event: true }],
  shipwheel: ["Ship's Wheel", 'wall', null, 1, 2, '0 0 80 80', 52, `<circle cx="40" cy="40" r="26" fill="none" stroke="${wood}" stroke-width="8"/><circle cx="40" cy="40" r="7" fill="${woodDark}"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M40,40 L${(40 + Math.cos((a * Math.PI) / 180) * 38).toFixed(1)},${(40 + Math.sin((a * Math.PI) / 180) * 38).toFixed(1)}" stroke="${woodDark}" stroke-width="5" stroke-linecap="round"/>`).join('')}`, { event: true }],
  treasurepile: ['Treasure Pile', 'decor', null, 1, 2, '0 0 80 50', 54, `<path d="M4,46 Q40,0 76,46Z" fill="#f2c94c"/>${[[24, 34], [40, 22], [56, 34], [32, 42], [48, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#ffd43b" stroke="#d4a017"/>`).join('')}<path d="M36,14 l4,-8 l4,8Z" fill="#e03131"/>`, { event: true }],
  coralgarden: ['Coral Garden', 'decor', null, 1, 3, '0 0 110 60', 80, `<ellipse cx="55" cy="54" rx="52" ry="6" fill="#e8d6a8"/><path d="M20,54 q-4,-24 6,-38 M26,40 q8,-8 10,-20" stroke="#ff8787" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M56,54 q2,-20 -6,-34 M56,40 q10,-10 6,-24" stroke="#b197fc" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M90,54 q-2,-16 6,-26" stroke="#ffd43b" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="78" cy="40" r="5" fill="#ff922b"/>`, { event: true }],
  reefposter: ['Save the Reef Poster', 'wall', null, 1, 2, '0 0 60 80', 42, frame(60, 80, '<rect x="8" y="8" width="44" height="64" fill="#1c7ed6"/><path d="M18,64 q-2,-16 4,-26 M30,64 q2,-20 -2,-30 M42,64 q2,-14 -4,-22" stroke="#ff8787" stroke-width="4" fill="none" stroke-linecap="round"/><text x="30" y="22" font-size="8" text-anchor="middle" fill="#fff" font-weight="bold" font-family="sans-serif">SAVE</text><text x="30" y="31" font-size="7" text-anchor="middle" fill="#fff" font-family="sans-serif">the reef</text>', '#fff')],
  hauntedlighthouse: ['Haunted Lighthouse', 'decor', null, 1, 2, '0 0 60 120', 36, `<path d="M16,116 L20,32 L40,32 L44,116Z" fill="#495057"/><path d="M17,92 L43,92 L43.6,102 L16.4,102Z" fill="#7048e8"/><rect x="18" y="16" width="24" height="16" rx="2" fill="#0c3440"/><path d="M16,16 L30,4 L44,16Z" fill="#7048e8"/><circle cx="30" cy="24" r="5" fill="#69db7c"/><path d="M46,40 Q58,30 52,50 Q60,60 48,58Z" fill="#f8f9fa" opacity=".8"/>`, { event: true }],
  pumpkinchair: ['Pumpkin Chair', 'seating', null, 1, 4, '0 0 90 80', 64, `<ellipse cx="45" cy="50" rx="42" ry="28" fill="#fd7e14"/><path d="M26,26 Q22,50 26,74 M45,22 V78 M64,26 Q68,50 64,74" stroke="#e8590c" stroke-width="3" fill="none"/><path d="M45,22 q4,-14 12,-16" stroke="#5c940d" stroke-width="5" fill="none" stroke-linecap="round"/>`, { event: true }],
  leafrug: ['Autumn Leaf Rug', 'rug', null, 1, 2, '0 0 140 40', 104, `<ellipse cx="70" cy="22" rx="68" ry="16" fill="#e8590c"/>${[30, 56, 84, 110].map((x, k) => `<path d="M${x},${16 + k % 2 * 8} l6,-4 l-2,6 l6,2 l-6,2 l2,6 l-6,-4 l-6,4 l2,-6 l-6,-2 l6,-2 l-2,-6Z" fill="${['#ffd43b', '#c92a2a', '#ffa94d', '#a61e4d'][k]}"/>`).join('')}`, { event: true }],
  snowglobe: ['Snow Globe', 'decor', null, 1, 2, '0 0 60 70', 40, `<rect x="10" y="52" width="40" height="16" rx="4" fill="${woodDark}"/><circle cx="30" cy="30" r="26" fill="#d0ebff" opacity=".6" stroke="#a5d8ff" stroke-width="2"/><path d="M22,46 L30,26 L38,46Z" fill="#2b8a3e"/>${[[18, 20], [40, 16], [26, 12], [44, 32], [14, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#fff"/>`).join('')}`, { event: true }],
  icechair: ['Ice Chair', 'seating', null, 1, 3, '0 0 80 90', 56, `<path d="M12,8 L68,8 L64,54 L16,54Z" fill="#c5f6fa" opacity=".85" stroke="#99e9f2" stroke-width="2"/><rect x="8" y="52" width="64" height="14" rx="4" fill="#a5d8ff"/><rect x="12" y="64" width="8" height="24" fill="#c5f6fa"/><rect x="60" y="64" width="8" height="24" fill="#c5f6fa"/><path d="M24,16 l12,12" stroke="#fff" stroke-width="3"/>`, { event: true }],
  xmastree: ['Decorated Tree', 'decor', null, 1, 4, '0 0 80 120', 56, `<path d="M40,6 L70,56 L54,56 L74,96 L6,96 L26,56 L10,56Z" fill="#2b8a3e"/><rect x="34" y="96" width="12" height="18" fill="${woodDark}"/>${[[30, 50, '#e03131'], [50, 44, '#ffd43b'], [24, 80, '#4dabf7'], [56, 78, '#e03131'], [40, 66, '#ffd43b']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/>`).join('')}<path d="M40,0 l3,6 l6,0 l-5,4 l2,6 l-6,-4 l-6,4 l2,-6 l-5,-4 l6,0Z" fill="#ffd43b"/>`, { event: true }],
  stockings: ['Stockings', 'wall', null, 1, 2, '0 0 100 60', 70, `<path d="M4,6 H96" stroke="${wood}" stroke-width="4"/>${[18, 50, 82].map((x, k) => `<path d="M${x - 8},8 L${x + 4},8 L${x + 4},38 Q${x + 4},50 ${x - 8},50 Q${x - 18},50 ${x - 16},42 L${x - 8},36Z" fill="${['#e03131', '#2b8a3e', '#e03131'][k]}"/><rect x="${x - 10}" y="8" width="16" height="8" fill="#fff"/>`).join('')}`, { event: true }],
  loveletters: ['Love Letters', 'decor', null, 1, 2, '0 0 70 40', 44, `${[[10, 14, -8], [26, 10, 4], [40, 16, -4]].map(([x, y, r]) => `<g transform="rotate(${r} ${x + 12} ${y + 9})"><rect x="${x}" y="${y}" width="26" height="18" fill="#fff0f6" stroke="#f783ac"/><path d="M${x},${y} L${x + 13},${y + 10} L${x + 26},${y}" stroke="#f783ac" fill="none"/></g>`).join('')}<path d="M52,30 C44,24 46,18 52,22 C58,18 60,24 52,30Z" fill="#e64980"/>`, { event: true }],
  rosebouquet: ['Rose Bouquet', 'decor', null, 1, 3, '0 0 50 80', 34, `<path d="M18,40 L25,76 L32,40Z" fill="#a5d8ff"/>${[[16, 26], [25, 18], [34, 26], [20, 36], [30, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#e64980"/><path d="M${x - 3},${y} q3,-4 6,0" stroke="#c2255c" stroke-width="1.5" fill="none"/>`).join('')}`, { event: true }],
  fireworks: ['Fireworks Display', 'wall', null, 1, 2, '0 0 110 70', 80, [[28, 30, '#ffd43b'], [70, 22, '#ff8fab'], [90, 46, '#74c0fc']].map(([x, y, c]) => [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M${x},${y} L${(x + Math.cos((a * Math.PI) / 180) * 16).toFixed(1)},${(y + Math.sin((a * Math.PI) / 180) * 16).toFixed(1)}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`).join('') + `<circle cx="${x}" cy="${y}" r="3" fill="#fff"/>`).join(''), { event: true }],
  goldgarland: ['Golden Garland', 'wall', null, 1, 2, '0 0 140 40', 104, `<path d="M4,8 Q70,40 136,8" stroke="#f2c94c" stroke-width="6" fill="none"/>${[20, 44, 70, 96, 120].map((x) => `<circle cx="${x}" cy="${8 + Math.sin((x / 140) * Math.PI) * 24}" r="5" fill="#fff3bf" stroke="#d4a017"/>`).join('')}`, { event: true }],
};

export const MORE_FURNITURE = Object.fromEntries(Object.entries(F).map(([id, [name, cat, price, level, cozy, vb, w, svg, extra = {}]]) => [id, { name, cat, price: price ?? 0, level, cozy, vb, w, svg, ...(price === null ? { event: true } : {}), ...extra }]));

export const MORE_DEN_CATS = [
  { id: 'seating', name: 'Seating', icon: '🪑' },
  { id: 'beds', name: 'Beds', icon: '🛏️' },
  { id: 'tables', name: 'Tables & storage', icon: '🗄️' },
  { id: 'collect', name: 'Display cases', icon: '🏺' },
  { id: 'fun', name: 'Fun', icon: '🎮' },
];

// ---------- wallpapers & floors (patterns made from a few simple recipes) ----------
// [name, price, base, kind, c2, motif]
const WP = {
  bioglow: ['Deep Sea Glow', 90, '#0b1d3a', 'glow', '#66d9e8'],
  reef: ['Coral Reef', 70, '#1c7ed6', 'emoji', '#ff8787', '🪸'],
  kelpforest: ['Kelp Forest', 60, '#2b5d3a', 'strands', '#5c940d'],
  jellydrift: ['Jellyfish Drift', 80, '#1b2a6b', 'emoji', '#e599f7', '🪼'],
  bubbles: ['Underwater Bubbles', 50, '#1098ad', 'rings', '#c5f6fa'],
  pearlgrad: ['Pearl Gradient', 60, '#f3f0ff', 'bands', '#e3fafc'],
  tidepools: ['Tide Pools', 55, '#8c8070', 'blobs', '#3cc7c0'],
  waves: ['Ocean Waves', 50, '#1c7ed6', 'waves', '#a5d8ff'],
  wreckwall: ['Shipwreck Planks', 55, '#5c3a21', 'planks', '#4a2e19'],
  treasure: ['Sunken Treasure', 85, '#0c3440', 'dots', '#f2c94c'],
  tropical: ['Tropical Fish', 70, '#3bc9db', 'emoji', '#ff922b', '🐠'],
  seaglass: ['Sea Glass Mosaic', 80, '#c3fae8', 'mosaic', '#63e6be'],
  shellpattern: ['Seashell Pattern', 45, '#fff0f6', 'emoji', '#f783ac', '🐚'],
  driftgrain: ['Driftwood Grain', 40, '#c9a66b', 'grain', '#a8865f'],
  coastflorals: ['Coastal Florals', 55, '#fff9db', 'flowers', '#74c0fc'],
  dunes: ['Sand Dunes', 40, '#f3e3b8', 'waves', '#e8d6a8'],
  beachgrass: ['Beach Grass', 40, '#fff3bf', 'strands', '#94d82d'],
  mushroomwall: ['Mushroom Forest', 60, '#2f4f2f', 'emoji', '#e03131', '🍄'],
  fernmoss: ['Ferns and Moss', 45, '#3f6a2a', 'strands', '#82c91e'],
  wildflowers: ['Wildflowers', 50, '#d3f9d8', 'flowers', '#ff8fab'],
  pressedflowers: ['Pressed Flowers', 55, '#fff8e1', 'flowers', '#b197fc'],
  gingham: ['Cottagecore Gingham', 45, '#fff', 'gingham', '#ffa8a8'],
  mermaid: ['Mermaid Scales', 90, '#20c997', 'scales', '#96f2d7'],
  moonlit: ['Moonlit Ocean', 80, '#0b1d3a', 'emoji', '#fff3bf', '🌙'],
  constellations: ['Starry Constellations', 85, '#1b2c4a', 'stars', '#fff3bf'],
  enchanted: ['Enchanted Forest', 75, '#1e3a2a', 'emoji', '#69db7c', '🌲'],
  crystals: ['Crystal Caves', 95, '#2b1b4a', 'emoji', '#b197fc', '💎'],
  fairylights: ['Fairy Lights', 70, '#2c2a4a', 'glow', '#ffd43b'],
  runes: ['Magical Runes', 90, '#2b1b4a', 'emoji', '#cc5de8', 'ᚱ'],
  aurora: ['Aurora Borealis', 110, '#0b1d3a', 'bands', '#38d9a9'],
  clouds: ['Celestial Clouds', 70, '#d0ebff', 'emoji', '#fff', '☁️'],
  islands: ['Floating Islands', 95, '#a5d8ff', 'emoji', '#82c91e', '🏝️'],
  tinyotters: ['Hundreds of Tiny Otters', 99, '#fff3e6', 'emoji', '#8a6644', '🦦'],
  bigoysters: ['Suspiciously Large Oysters', 77, '#e3fafc', 'emoji', '#adb5bd', '🦪'],
  fishhats: ['Fish Wearing Hats', 66, '#e7f5ff', 'emoji', '#4dabf7', '🐟'],
  clamfaces: ['Clams With Faces', 66, '#fff0f6', 'emoji', '#f783ac', '😊'],
  ducks: ['Ducks', 50, '#fff9db', 'emoji', '#ffd43b', '🦆'],
  cheese: ['Cheese Pattern', 60, '#ffd43b', 'holes', '#fab005'],
  newsprint: ['Newspaper Print', 40, '#f1f3f5', 'lines', '#868e96'],
  retro: ['Vintage Computer', 88, '#0c3440', 'grid', '#69db7c'],
  pawprints: ['Otter Paw Prints', 45, '#e6f7f3', 'emoji', '#8a6644', '🐾'],
};
const FL = {
  polished: ['Polished Driftwood', 60, '#a8865f', 'planks', '#8a6644'],
  beach: ['Sandy Beach', 45, '#f3e3b8', 'dots', '#e8d6a8'],
  riverstones: ['Smooth River Stones', 55, '#868e96', 'blobs', '#adb5bd'],
  pearlmosaic: ['Pearl Mosaic', 90, '#f3f0ff', 'mosaic', '#e5dbff'],
  coraltile: ['Coral Tile', 70, '#ffc9c9', 'checker', '#ffa8a8'],
  blueglass: ['Blue Glass Tiles', 75, '#74c0fc', 'checker', '#4dabf7'],
  mossystone: ['Mossy Stone', 50, '#5c6b5a', 'blobs', '#82c91e'],
  shellmosaic: ['Seashell Mosaic', 80, '#fff0f6', 'emoji', '#f783ac', '🐚'],
  shipdeck: ['Wooden Ship Deck', 65, '#8a6644', 'planks', '#5c3a21'],
  undersand: ['Underwater Sand', 50, '#d8c39c', 'waves', '#c9b084'],
  checker: ['Checkerboard', 55, '#fff', 'checker', '#343a40'],
  plush: ['Plush Carpeting', 70, '#c5a3d6', 'dots', '#b197fc'],
};

// One SVG <pattern> per recipe. `size` keeps each motif a sensible size.
export function patternSVG(pid, base, kind, c2, motif = '') {
  const S = 40;
  const body = {
    glow: `${[[8, 10, 2], [28, 6, 1.5], [20, 26, 2.5], [36, 32, 1.5], [6, 34, 1.8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="${c2}" opacity=".18"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c2}"/>`).join('')}`,
    emoji: `<circle cx="10" cy="12" r="4" fill="${c2}" opacity=".35"/><circle cx="30" cy="32" r="4" fill="${c2}" opacity=".35"/><text x="10" y="16" font-size="13" text-anchor="middle" opacity=".9" fill="${c2}">${motif}</text><text x="30" y="36" font-size="13" text-anchor="middle" opacity=".9" fill="${c2}">${motif}</text>`,
    strands: `<path d="M8,0 q6,10 0,20 q-6,10 0,20 M28,0 q-6,10 0,20 q6,10 0,20" stroke="${c2}" stroke-width="4" fill="none"/>`,
    rings: `<circle cx="10" cy="12" r="5" fill="none" stroke="${c2}" stroke-width="1.5"/><circle cx="30" cy="30" r="7" fill="none" stroke="${c2}" stroke-width="1.5"/><circle cx="26" cy="8" r="2.5" fill="none" stroke="${c2}"/>`,
    bands: `<rect y="0" width="40" height="10" fill="${c2}" opacity=".5"/><rect y="20" width="40" height="6" fill="${c2}" opacity=".3"/>`,
    blobs: `<ellipse cx="10" cy="12" rx="8" ry="5" fill="${c2}"/><ellipse cx="30" cy="30" rx="9" ry="6" fill="${c2}"/><ellipse cx="32" cy="8" rx="4" ry="3" fill="${c2}" opacity=".7"/>`,
    waves: `<path d="M0,12 q10,-8 20,0 t20,0 M0,32 q10,-8 20,0 t20,0" stroke="${c2}" stroke-width="3" fill="none"/>`,
    planks: `<rect y="0" width="40" height="20" fill="${base}"/><rect y="20" width="40" height="20" fill="${c2}"/><path d="M0,20 H40 M24,0 V20 M8,20 V40" stroke="#3b2a1e" stroke-width="1" opacity=".5"/>`,
    dots: `<circle cx="10" cy="10" r="3" fill="${c2}"/><circle cx="30" cy="30" r="3" fill="${c2}"/>`,
    mosaic: `<rect x="1" y="1" width="18" height="18" rx="3" fill="${c2}"/><rect x="21" y="21" width="18" height="18" rx="3" fill="${c2}" opacity=".6"/><rect x="21" y="1" width="18" height="18" rx="3" fill="#fff" opacity=".35"/>`,
    grain: `<path d="M0,8 Q20,4 40,10 M0,22 Q20,28 40,20 M0,34 Q18,30 40,36" stroke="${c2}" stroke-width="2" fill="none"/>`,
    flowers: [[10, 12], [30, 30]].map(([x, y]) => [0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + Math.cos((a * Math.PI) / 180) * 4).toFixed(1)}" cy="${(y + Math.sin((a * Math.PI) / 180) * 4).toFixed(1)}" r="3" fill="${c2}"/>`).join('') + `<circle cx="${x}" cy="${y}" r="2" fill="#ffd43b"/>`).join(''),
    gingham: `<rect width="20" height="40" fill="${c2}" opacity=".45"/><rect width="40" height="20" fill="${c2}" opacity=".45"/>`,
    scales: `<path d="M0,20 Q10,4 20,20 Q30,4 40,20 M-10,40 Q0,24 10,40 Q20,24 30,40 Q40,24 50,40" stroke="${c2}" stroke-width="2.5" fill="none"/>`,
    stars: `<circle cx="8" cy="10" r="1.6" fill="${c2}"/><circle cx="30" cy="16" r="1.2" fill="${c2}"/><circle cx="18" cy="32" r="1.8" fill="${c2}"/><path d="M8,10 L30,16 L18,32" stroke="${c2}" stroke-width=".6" opacity=".6" fill="none"/>`,
    holes: `<circle cx="10" cy="12" r="5" fill="${c2}"/><circle cx="30" cy="28" r="7" fill="${c2}"/><circle cx="32" cy="6" r="2.5" fill="${c2}"/>`,
    lines: `<path d="M4,6 H36 M4,12 H30 M4,18 H34 M4,26 H36 M4,32 H26" stroke="${c2}" stroke-width="2"/>`,
    grid: `<path d="M0,0 H40 V40" stroke="${c2}" stroke-width="1" fill="none" opacity=".6"/><rect x="18" y="18" width="4" height="4" fill="${c2}"/>`,
    checker: `<rect width="20" height="20" fill="${c2}"/><rect x="20" y="20" width="20" height="20" fill="${c2}"/>`,
  }[kind] || '';
  return `<pattern id="${pid}" width="${S}" height="${S}" patternUnits="userSpaceOnUse"><rect width="${S}" height="${S}" fill="${base}"/>${body}</pattern>`;
}

export const MORE_WALLPAPERS = Object.fromEntries(Object.entries(WP).map(([id, [name, price, base, kind, c2, motif]]) => [id, { name, price, swatch: base, pattern: patternSVG(`wp-${id}`, base, kind, c2, motif) }]));
export const MORE_FLOORS = Object.fromEntries(Object.entries(FL).map(([id, [name, price, base, kind, c2, motif]]) => [id, { name, price, swatch: base, pattern: patternSVG(`fl-${id}`, base, kind, c2, motif) }]));
