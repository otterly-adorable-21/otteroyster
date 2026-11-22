// More clothes: headwear, clothing, accessories and footwear.
// Drawn in the otter's frame (viewBox "0 -24 200 254"): head centred (100, 82),
// ears (63, 52) / (137, 52), eyes y≈75, neck y≈118, body (100, 160) 56×58,
// paws (76, 152) / (124, 152), feet (74, 214) / (126, 214).
// Body clothes are drawn under the paws and the oyster, so the otter still
// holds its oyster. Every piece can be replaced with art in assets/art/clothes/.

const star = (x, y, r, fill) => `<path d="M${x},${y - r} L${x + r * 0.3},${y - r * 0.3} L${x + r},${y} L${x + r * 0.3},${y + r * 0.3} L${x},${y + r} L${x - r * 0.3},${y + r * 0.3} L${x - r},${y} L${x - r * 0.3},${y - r * 0.3}Z" fill="${fill}"/>`;
const flower = (x, y, r, petal, mid = '#ffd43b') => [0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + Math.cos((a * Math.PI) / 180) * r).toFixed(1)}" cy="${(y + Math.sin((a * Math.PI) / 180) * r).toFixed(1)}" r="${r * 0.8}" fill="${petal}"/>`).join('') + `<circle cx="${x}" cy="${y}" r="${r * 0.6}" fill="${mid}"/>`;
const shell = (x, y, r, fill = '#f4e6f0', line = '#c9b3c8') => `<path d="M${x - r},${y + r * 0.4} Q${x - r},${y - r} ${x},${y - r} Q${x + r},${y - r} ${x + r},${y + r * 0.4}Z" fill="${fill}" stroke="${line}" stroke-width="1.2"/><path d="M${x},${y + r * 0.4} V${y - r} M${x},${y + r * 0.4} L${x - r * 0.6},${y - r * 0.7} M${x},${y + r * 0.4} L${x + r * 0.6},${y - r * 0.7}" stroke="${line}" stroke-width="1"/>`;

// ---------- headwear ----------
const HATS = {
  shellberet: ['Shell Beret', '🐚', 40, 1, `<ellipse cx="94" cy="40" rx="42" ry="13" fill="#e8a0b4" transform="rotate(-8 94 40)"/><ellipse cx="94" cy="43" rx="40" ry="6" fill="#d6849b" transform="rotate(-8 94 43)"/>${shell(96, 26, 7)}`],
  fisherbeanie: ["Fisherman's Beanie", '🧶', 35, 1, `<path d="M58,50 Q58,14 100,12 Q142,14 142,50Z" fill="#2f5d8a"/><rect x="56" y="40" width="88" height="14" rx="6" fill="#244a6e"/><path d="M70,40 V54 M84,40 V54 M98,40 V54 M112,40 V54 M126,40 V54" stroke="#3d72a6" stroke-width="2"/>`],
  pearlcrown: ['Pearl Crown', '👑', 160, 8, `<path d="M66,46 L66,22 L80,34 L92,14 L100,30 L108,14 L120,34 L134,22 L134,46Z" fill="#e9e3f5" stroke="#b8a9cf" stroke-width="2"/>${[66, 92, 108, 134].map((x, k) => `<circle cx="${x}" cy="${[22, 14, 14, 22][k]}" r="5" fill="#fff" stroke="#d8c8e8"/>`).join('')}<circle cx="100" cy="38" r="6" fill="#fff" stroke="#c6b8d6"/>`],
  jellyhat: ['Jellyfish Hat', '🪼', 70, 3, `<path d="M58,50 Q58,8 100,8 Q142,8 142,50 Q132,44 122,50 Q111,44 100,50 Q89,44 78,50 Q68,44 58,50Z" fill="#f3a6d8" opacity=".85"/><path d="M62,50 q-4,14 2,26 M78,52 q-4,10 0,18 M122,52 q4,10 0,18 M138,50 q4,14 -2,26" stroke="#e599f7" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="88" cy="24" rx="10" ry="5" fill="#fff" opacity=".45"/>`],
  mushroomcap: ['Mushroom Cap', '🍄', 45, 2, `<path d="M50,52 Q52,4 100,4 Q148,4 150,52 Q100,42 50,52Z" fill="#e03131"/><circle cx="80" cy="22" r="7" fill="#fff"/><circle cx="114" cy="16" r="6" fill="#fff"/><circle cx="130" cy="36" r="5" fill="#fff"/><circle cx="66" cy="40" r="4" fill="#fff"/>`],
  sailorhat: ['Sailor Hat', '⚓', 40, 1, `<path d="M66,46 Q68,18 100,16 Q132,18 134,46Z" fill="#fff"/><ellipse cx="100" cy="46" rx="44" ry="9" fill="#f1f3f5" stroke="#ced4da" stroke-width="2"/><rect x="68" y="34" width="64" height="5" fill="#1c7ed6"/>`],
  buckethat: ['Bucket Hat', '🪣', 40, 1, `<path d="M70,44 L76,14 Q100,8 124,14 L130,44Z" fill="#94d82d"/><path d="M50,52 Q100,30 150,52 Q100,62 50,52Z" fill="#82c91e"/><path d="M72,40 Q100,34 128,40" stroke="#5c940d" stroke-width="2" fill="none"/>`],
  crabhat: ['Crab Buddy', '🦀', 90, 4, `<g transform="translate(70 0) scale(.6)"><path d="M22,62 q-12,-20 -2,-30 q2,10 10,12Z M78,62 q12,-20 2,-30 q-2,10 -10,12Z" fill="#e8590c"/><ellipse cx="50" cy="72" rx="30" ry="20" fill="#fa5252"/><path d="M34,48 v16 M66,48 v16" stroke="#e03131" stroke-width="3"/><circle cx="34" cy="46" r="4" fill="#2b1c14"/><circle cx="66" cy="46" r="4" fill="#2b1c14"/><path d="M44,78 q6,4 12,0" stroke="#c92a2a" stroke-width="2" fill="none"/></g>`],
  tophat: ['Tiny Top Hat', '🎩', 75, 3, `<g transform="rotate(12 112 30)"><rect x="98" y="2" width="30" height="30" rx="3" fill="#212529"/><rect x="98" y="24" width="30" height="5" fill="#c92a2a"/><ellipse cx="113" cy="32" rx="24" ry="5" fill="#343a40"/></g>`],
  kelpbow: ['Seaweed Hair Bow', '🎀', 25, 1, `<path d="M126,44 Q108,30 110,48 Q108,62 126,48 Q144,62 142,48 Q144,30 126,44Z" fill="#5c940d"/><circle cx="126" cy="46" r="4" fill="#2b8a3e"/><path d="M122,50 q-4,10 -10,14 M130,50 q4,10 10,14" stroke="#5c940d" stroke-width="3" fill="none" stroke-linecap="round"/>`],
  conchhelmet: ['Conch Shell Helmet', '🐚', 110, 6, `<path d="M56,54 Q52,10 100,6 Q150,10 146,54 Q100,44 56,54Z" fill="#ffd8c2" stroke="#e8a98a" stroke-width="2"/><path d="M100,8 Q120,20 116,34 Q110,46 96,42 Q86,36 92,28 Q98,22 104,28" stroke="#e8a98a" stroke-width="3" fill="none"/><path d="M60,48 Q100,40 142,48" stroke="#f4a582" stroke-width="3" fill="none"/>`],
  divinghelmet: ['Diving Helmet', '🤿', 180, 9, `<circle cx="100" cy="80" r="54" fill="#b08d3c" opacity=".9"/><circle cx="100" cy="80" r="38" fill="#c5f6fa" opacity=".35" stroke="#7a5c1f" stroke-width="6"/><circle cx="54" cy="80" r="8" fill="#7a5c1f"/><circle cx="146" cy="80" r="8" fill="#7a5c1f"/><circle cx="100" cy="28" r="7" fill="#7a5c1f"/><ellipse cx="84" cy="64" rx="10" ry="6" fill="#fff" opacity=".5"/>`],
  rainbonnet: ['Rain Bonnet', '🌧️', 40, 2, `<path d="M58,50 Q58,12 100,10 Q142,12 142,50Z" fill="#fcc419"/><path d="M44,54 Q100,36 156,54 Q170,62 156,64 Q100,52 44,64 Q30,62 44,54Z" fill="#fab005"/>`],
  sleepcap: ['Sleeping Cap', '😴', 30, 1, `<path d="M58,50 Q60,14 100,12 Q140,18 166,62 Q140,40 142,50Z" fill="#74c0fc"/><rect x="56" y="42" width="88" height="12" rx="6" fill="#fff"/><circle cx="166" cy="64" r="9" fill="#fff"/>${star(92, 28, 4, '#fff3bf')}${star(118, 30, 3, '#fff3bf')}`],
  wizardhat: ['Wizard Hat', '🧙', 95, 5, `<path d="M70,46 L104,-24 L132,46Z" fill="#5f3dc4"/><ellipse cx="100" cy="46" rx="50" ry="9" fill="#7048e8"/>${star(100, 10, 5, '#ffd43b')}${star(114, 30, 4, '#ffd43b')}${star(88, 34, 3, '#fff3bf')}`],
  coralantlers: ['Coral Antlers', '🪸', 85, 5, `<path d="M74,46 Q70,24 60,12 M70,30 Q60,26 56,30 M66,20 Q72,10 74,4 M126,46 Q130,24 140,12 M130,30 Q140,26 144,30 M134,20 Q128,10 126,4" stroke="#ff8787" stroke-width="7" fill="none" stroke-linecap="round"/>`],
  starclips: ['Starfish Hair Clips', '⭐', 25, 1, `${star(72, 46, 9, '#ff922b')}${star(128, 46, 9, '#ff922b')}<circle cx="72" cy="46" r="2" fill="#ffd8a8"/><circle cx="128" cy="46" r="2" fill="#ffd8a8"/>`],
  newspaperhat: ['Newspaper Hat', '📰', 15, 1, `<path d="M56,50 L100,6 L144,50Z" fill="#f1f3f5" stroke="#adb5bd" stroke-width="2"/><path d="M74,36 H126 M80,28 H118 M88,20 H110" stroke="#868e96" stroke-width="2"/><rect x="56" y="44" width="88" height="8" fill="#e9ecef" stroke="#adb5bd"/>`],
  tricorn: ['Pirate Tricorn', '🏴‍☠️', 90, 4, `<path d="M44,46 Q60,18 100,14 Q140,18 156,46 Q130,36 100,40 Q70,36 44,46Z" fill="#212529"/><path d="M44,46 Q100,58 156,46" stroke="#e8c547" stroke-width="3" fill="none"/><circle cx="100" cy="28" r="6" fill="#fff"/><path d="M96,34 l8,0" stroke="#212529" stroke-width="2"/>`],
  // event headwear
  bunnyears: ['Bunny Ears', '🐰', null, 1, `<ellipse cx="80" cy="10" rx="10" ry="30" fill="#fff" stroke="#f3d9e6" stroke-width="2"/><ellipse cx="80" cy="12" rx="5" ry="22" fill="#ffc9de"/><ellipse cx="120" cy="10" rx="10" ry="30" fill="#fff" stroke="#f3d9e6" stroke-width="2"/><ellipse cx="120" cy="12" rx="5" ry="22" fill="#ffc9de"/><path d="M62,46 Q100,30 138,46" stroke="#ffc9de" stroke-width="6" fill="none"/>`],
  santahat: ['Santa Hat', '🎅', null, 1, `<path d="M60,46 Q66,8 110,10 Q146,20 160,52 Q140,36 140,46Z" fill="#e03131"/><rect x="56" y="40" width="88" height="14" rx="7" fill="#fff"/><circle cx="160" cy="54" r="9" fill="#fff"/>`],
  elfhat: ['Elf Hat', '🧝', null, 1, `<path d="M62,46 L100,-10 L138,46Z" fill="#2b8a3e"/><path d="M62,46 Q100,36 138,46 L138,52 Q100,42 62,52Z" fill="#e03131"/><circle cx="100" cy="-10" r="6" fill="#ffd43b"/>`],
  snowhat: ['Snowflake Hat', '❄️', null, 1, `<path d="M58,50 Q58,12 100,10 Q142,12 142,50Z" fill="#d0ebff"/><rect x="56" y="40" width="88" height="14" rx="6" fill="#fff"/><circle cx="100" cy="8" r="10" fill="#fff"/>${star(84, 28, 5, '#fff')}${star(116, 28, 5, '#fff')}`],
  newyearcrown: ["New Year's Crown", '🎆', null, 1, `<path d="M70,46 L72,22 L86,32 L100,12 L114,32 L128,22 L130,46Z" fill="#f2c94c" stroke="#d4a017" stroke-width="2"/>${star(100, 4, 6, '#fff3bf')}${star(72, 16, 4, '#fff3bf')}${star(128, 16, 4, '#fff3bf')}`],
  explorerhat: ['Explorer Hat', '🧭', null, 1, `<path d="M64,46 Q64,14 100,12 Q136,14 136,46Z" fill="#d8c39c"/><ellipse cx="100" cy="46" rx="52" ry="10" fill="#c9b084"/><rect x="64" y="36" width="72" height="6" fill="#6b4d34"/>`],
};

// ---------- clothing (body) ----------
const TORSO = 'M60,124 Q60,112 76,110 Q100,104 124,110 Q140,112 140,124 L148,192 Q100,208 52,192Z';
const LONG = 'M60,124 Q60,112 76,110 Q100,104 124,110 Q140,112 140,124 L158,222 Q100,234 42,222Z';
const DRESS = 'M66,122 Q66,112 80,110 Q100,106 120,110 Q134,112 134,122 L164,222 Q100,236 36,222Z';
const cuffs = (c) => `<ellipse cx="72" cy="148" rx="15" ry="13" fill="${c}"/><ellipse cx="128" cy="148" rx="15" ry="13" fill="${c}"/>`;
function garment(id, { c1, c2 = c1, shape = TORSO, pattern = '', collar = 'round', extra = '', sleeves = true }) {
  const clip = `oo-cl-${id}`;
  const pat = {
    stripes: [124, 138, 152, 166, 180, 194, 208].map((y) => `<rect x="30" y="${y}" width="140" height="6" fill="${c2}"/>`).join(''),
    knit: [72, 86, 100, 114, 128].map((x) => `<path d="M${x},112 q4,6 0,12 q-4,6 0,12 q4,6 0,12 q-4,6 0,12 q4,6 0,12 q-4,6 0,12 q4,6 0,12" stroke="${c2}" stroke-width="3" fill="none"/>`).join(''),
    plaid: [126, 146, 166, 186, 206].map((y) => `<rect x="30" y="${y}" width="140" height="5" fill="${c2}" opacity=".7"/>`).join('') + [64, 84, 104, 124, 144].map((x) => `<rect x="${x}" y="100" width="5" height="140" fill="${c2}" opacity=".5"/>`).join(''),
    dots: [[78, 130], [118, 126], [96, 150], [70, 172], [128, 168], [100, 188], [84, 206], [118, 204]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="${c2}"/>`).join(''),
    quilt: [128, 146, 164, 182, 200].map((y) => `<path d="M40,${y} Q100,${y + 8} 160,${y}" stroke="${c2}" stroke-width="3" fill="none"/>`).join(''),
    floral: [[76, 134], [122, 132], [96, 160], [68, 186], [130, 184], [104, 206]].map(([x, y]) => flower(x, y, 4, c2, '#fff3bf')).join(''),
    stars: [[76, 136], [124, 132], [98, 168], [70, 196], [130, 196], [100, 214]].map(([x, y]) => star(x, y, 5, c2)).join(''),
  }[pattern] || '';
  const neck = {
    round: `<path d="M78,112 Q100,124 122,112" stroke="${c2}" stroke-width="4" fill="none"/>`,
    v: `<path d="M80,111 L100,134 L120,111" fill="#e9dcc4" stroke="${c2}" stroke-width="3"/>`,
    shirt: `<path d="M80,110 L96,126 L100,114Z M120,110 L104,126 L100,114Z" fill="#fff" stroke="${c2}" stroke-width="1.5"/>`,
    turtle: `<path d="M70,108 Q100,128 130,108 L132,122 Q100,140 68,122Z" fill="${c1}" stroke="${c2}" stroke-width="2"/>`,
    sailor: `<path d="M70,110 L100,138 L130,110 L140,128 L100,150 L60,128Z" fill="#1c7ed6"/><path d="M68,118 L100,146 L132,118" stroke="#fff" stroke-width="2" fill="none"/><path d="M96,140 l4,8 l4,-8" fill="#e03131"/>`,
    none: '',
  }[collar] ?? '';
  return `<defs><clipPath id="${clip}"><path d="${shape}"/></clipPath></defs>${sleeves ? cuffs(c1) : ''}<path d="${shape}" fill="${c1}"/><g clip-path="url(#${clip})">${pat}</g>${neck}${extra}`;
}
const buttons = (c, ys = [132, 150, 168, 186]) => ys.map((y) => `<circle cx="100" cy="${y}" r="3" fill="${c}"/>`).join('');
const belt = (c, b = '#ffd43b') => `<rect x="50" y="176" width="100" height="9" fill="${c}"/><rect x="94" y="174" width="12" height="13" rx="2" fill="none" stroke="${b}" stroke-width="3"/>`;

const BODY = {
  sweater: ['Oversized Knit Sweater', '🧶', 80, 2, { c1: '#e8a0b4', c2: '#d6849b', pattern: 'knit', collar: 'round', shape: LONG }],
  cardigan: ["Fisherman's Cardigan", '🧥', 85, 3, { c1: '#c9b084', c2: '#a8906a', pattern: 'knit', collar: 'v', extra: buttons('#6b4d34') }],
  sailorshirt: ['Striped Sailor Shirt', '⛵', 60, 1, { c1: '#fff', c2: '#1c7ed6', pattern: 'stripes', collar: 'sailor' }],
  raincoat: ['Raincoat', '🧥', 70, 2, { c1: '#fcc419', c2: '#e8a400', collar: 'shirt', shape: LONG, extra: buttons('#b07d00', [134, 156, 178, 200]) }],
  puffer: ['Puffer Jacket', '🧥', 100, 4, { c1: '#4dabf7', c2: '#1c7ed6', pattern: 'quilt', collar: 'turtle' }],
  cottagedress: ['Cottagecore Dress', '👗', 95, 3, { c1: '#f8f0e3', c2: '#e599a8', pattern: 'floral', collar: 'round', shape: DRESS, extra: '<path d="M74,124 Q100,134 126,124" stroke="#e599a8" stroke-width="4" fill="none"/>' }],
  waistcoat: ['Victorian Waistcoat', '🎩', 110, 5, { c1: '#5c3a21', c2: '#7a5034', pattern: 'plaid', collar: 'shirt', sleeves: false, extra: buttons('#e8c547') + '<path d="M118,150 q14,6 18,20" stroke="#e8c547" stroke-width="2" fill="none"/>' }],
  apron: ['Apron', '🧑‍🍳', 35, 1, { c1: '#fff', c2: '#ffa8a8', shape: 'M72,120 L128,120 L136,206 Q100,214 64,206Z', sleeves: false, collar: 'none', extra: '<path d="M72,120 Q86,106 100,104 Q114,106 128,120" stroke="#ffa8a8" stroke-width="3" fill="none"/><rect x="82" y="168" width="36" height="20" rx="4" fill="#ffe3e3" stroke="#ffa8a8"/>' }],
  overalls: ['Overalls', '👖', 75, 2, { c1: '#4c6ef5', c2: '#3b5bdb', shape: 'M68,140 L132,140 L150,198 Q100,214 50,198Z', sleeves: false, collar: 'none', extra: '<rect x="76" y="136" width="48" height="26" rx="4" fill="#4c6ef5" stroke="#3b5bdb" stroke-width="2"/><path d="M78,138 L70,112 M122,138 L130,112" stroke="#3b5bdb" stroke-width="6"/><circle cx="80" cy="142" r="3" fill="#ffd43b"/><circle cx="120" cy="142" r="3" fill="#ffd43b"/>' }],
  bathrobe: ['Fluffy Bathrobe', '🛁', 65, 2, { c1: '#fff0f6', c2: '#fcc2d7', shape: LONG, collar: 'v', extra: belt('#fcc2d7', '#fcc2d7') }],
  pajamas: ['Pajamas', '🌙', 50, 1, { c1: '#a5d8ff', c2: '#d0ebff', pattern: 'stars', collar: 'shirt', extra: buttons('#fff') }],
  turtleneck: ['Turtleneck', '🧣', 55, 1, { c1: '#495057', c2: '#343a40', collar: 'turtle' }],
  hawaiian: ['Hawaiian Shirt', '🌺', 60, 2, { c1: '#20c997', c2: '#ff6b6b', pattern: 'floral', collar: 'shirt', extra: buttons('#fff') }],
  gradgown: ['Graduation Gown', '🎓', 120, 10, { c1: '#212529', c2: '#343a40', shape: LONG, collar: 'v', extra: '<path d="M82,112 L76,210 M118,112 L124,210" stroke="#f2c94c" stroke-width="7"/>' }],
  piratecoat: ['Pirate Coat', '🏴‍☠️', 130, 6, { c1: '#a61e4d', c2: '#7a1235', shape: LONG, collar: 'shirt', extra: buttons('#f2c94c', [130, 150, 170, 190, 210]) + belt('#3b2a1e') }],
  wizardrobe: ['Wizard Robe', '🧙', 125, 6, { c1: '#5f3dc4', c2: '#ffd43b', pattern: 'stars', shape: LONG, collar: 'v' }],
  flannel: ['Flannel Shirt', '🪵', 55, 1, { c1: '#c92a2a', c2: '#212529', pattern: 'plaid', collar: 'shirt', extra: buttons('#fff') }],
  scubasuit: ['Scuba Suit', '🤿', 140, 7, { c1: '#212529', c2: '#22b8cf', collar: 'turtle', extra: '<path d="M60,140 L140,140 M56,170 L144,170" stroke="#22b8cf" stroke-width="5"/>' }],
  tuxedo: ['Tuxedo', '🤵', 150, 8, { c1: '#212529', c2: '#000', collar: 'none', extra: '<path d="M84,110 L100,150 L116,110Z" fill="#fff"/><path d="M84,110 L76,160 L100,150Z M116,110 L124,160 L100,150Z" fill="#343a40"/><path d="M92,118 L100,122 L92,126Z M108,118 L100,122 L108,126Z" fill="#000"/>' + buttons('#000', [156, 170]) }],
  // event clothing
  pastelhoodie: ['Pastel Hoodie', '🐣', null, 1, { c1: '#e5dbff', c2: '#fff3bf', pattern: 'dots', collar: 'round' }],
  swimsuit: ['Striped Swimsuit', '🩱', null, 1, { c1: '#ff8787', c2: '#fff', pattern: 'stripes', collar: 'none', sleeves: false, shape: 'M70,128 Q100,122 130,128 L138,196 Q100,208 62,196Z' }],
  ghostsheet: ['Ghost Sheet', '👻', null, 1, { c1: '#f8f9fa', c2: '#dee2e6', shape: 'M48,118 Q50,102 100,100 Q150,102 152,118 L160,226 L146,214 L132,228 L118,214 L100,228 L82,214 L68,228 L54,214 L40,226Z', collar: 'none', sleeves: false }],
  explorervest: ['Explorer Vest', '🧭', null, 1, { c1: '#8f7a52', c2: '#6b5a3a', collar: 'v', sleeves: false, extra: '<rect x="66" y="150" width="20" height="18" rx="3" fill="#6b5a3a"/><rect x="114" y="150" width="20" height="18" rx="3" fill="#6b5a3a"/>' }],
  leafsweater: ['Leafy Knit Sweater', '🍂', null, 1, { c1: '#e8590c', c2: '#ffa94d', pattern: 'knit', collar: 'turtle', shape: LONG }],
  elfsuit: ['Elf Outfit', '🧝', null, 1, { c1: '#2b8a3e', c2: '#e03131', collar: 'none', extra: belt('#212529') + '<path d="M60,118 L72,128 L84,118 L96,128 L108,118 L120,128 L132,118 L140,124" stroke="#e03131" stroke-width="4" fill="none"/>' }],
};

// ---------- accessories ----------
// slot: 'acc' (ears, wrists, halo, shoulder), 'neck', 'eyes' or 'back'
const ACC = {
  shellearrings: ['Seashell Earrings', '🐚', 'acc', 30, 1, `${shell(56, 70, 5)}${shell(144, 70, 5)}`],
  tinyspecs: ['Tiny Spectacles', '👓', 'eyes', 35, 1, `<circle cx="84" cy="76" r="9" fill="none" stroke="#7a5c1f" stroke-width="2.5"/><circle cx="116" cy="76" r="9" fill="none" stroke="#7a5c1f" stroke-width="2.5"/><path d="M93,76 Q100,72 107,76" stroke="#7a5c1f" stroke-width="2" fill="none"/>`],
  friendbracelet: ['Friendship Bracelet', '🧵', 'acc', 20, 1, `<ellipse cx="70" cy="160" rx="10" ry="4" fill="none" stroke="#ff6b6b" stroke-width="3"/><ellipse cx="70" cy="160" rx="10" ry="4" fill="none" stroke="#4dabf7" stroke-width="3" stroke-dasharray="3 3"/>`],
  pocketwatch: ['Pocket Watch', '⏱️', 'acc', 60, 3, `<path d="M104,170 Q118,174 126,184" stroke="#e8c547" stroke-width="2" fill="none"/><circle cx="130" cy="190" r="9" fill="#f2c94c" stroke="#b08d3c" stroke-width="2"/><circle cx="130" cy="190" r="6" fill="#fff"/><path d="M130,190 v-4 M130,190 h3" stroke="#212529" stroke-width="1.2"/>`],
  earflower: ['Flower Behind the Ear', '🌺', 'acc', 20, 1, flower(140, 58, 5, '#ff6b9a')],
  messengerbag: ['Messenger Bag', '💼', 'acc', 55, 2, `<path d="M70,112 L140,190" stroke="#8a6644" stroke-width="6"/><rect x="126" y="178" width="34" height="26" rx="4" fill="#a8865f" stroke="#6b4d34" stroke-width="2"/><path d="M126,186 H160" stroke="#6b4d34" stroke-width="2"/>`],
  shellpurse: ['Shell Purse', '👛', 'acc', 45, 2, `<path d="M64,114 L58,180" stroke="#e599a8" stroke-width="3"/>${shell(56, 190, 12, '#ffdeeb', '#e599a8')}`],
  camera: ['Camera', '📷', 'neck', 70, 3, `<path d="M74,116 Q100,140 126,116" stroke="#343a40" stroke-width="3" fill="none"/><rect x="112" y="128" width="30" height="20" rx="4" fill="#343a40"/><circle cx="127" cy="138" r="7" fill="#868e96" stroke="#212529" stroke-width="2"/><rect x="134" y="124" width="6" height="4" fill="#343a40"/>`],
  binoculars: ['Binoculars', '🔭', 'neck', 65, 3, `<path d="M74,116 Q100,136 126,116" stroke="#3b2a1e" stroke-width="3" fill="none"/><rect x="108" y="126" width="12" height="20" rx="4" fill="#495057"/><rect x="122" y="126" width="12" height="20" rx="4" fill="#495057"/><rect x="116" y="130" width="10" height="6" fill="#343a40"/>`],
  compass: ['Compass Pendant', '🧭', 'neck', 50, 2, `<path d="M78,114 Q100,134 122,114" stroke="#b08d3c" stroke-width="2" fill="none"/><circle cx="100" cy="132" r="9" fill="#f2c94c" stroke="#b08d3c" stroke-width="2"/><path d="M100,125 L103,132 L100,139 L97,132Z" fill="#e03131"/>`],
  locket: ['Friendship Locket', '💗', 'neck', 55, 2, `<path d="M78,114 Q100,134 122,114" stroke="#e8c547" stroke-width="2" fill="none"/><path d="M100,140 C88,132 92,124 100,128 C108,124 112,132 100,140Z" fill="#f2c94c" stroke="#b08d3c" stroke-width="1.5"/>`],
  satchel: ['Tiny Satchel', '🎒', 'acc', 40, 1, `<path d="M128,112 L64,182" stroke="#6b4d34" stroke-width="5"/><rect x="44" y="176" width="26" height="22" rx="5" fill="#8a6644" stroke="#5a3f2a" stroke-width="2"/><circle cx="57" cy="186" r="2.5" fill="#e8c547"/>`],
  ribboncollar: ['Ribbon Collar', '🎀', 'neck', 25, 1, `<path d="M66,112 Q100,128 134,112 L134,118 Q100,134 66,118Z" fill="#f783ac"/><path d="M100,124 L88,118 L88,132Z M100,124 L112,118 L112,132Z" fill="#e64980"/><circle cx="100" cy="125" r="3.5" fill="#c2255c"/>`],
  bubblehalo: ['Floating Bubble Halo', '🫧', 'acc', 90, 6, [[70, 22], [84, 14], [100, 10], [116, 14], [130, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#d0f4ff" opacity=".7" stroke="#99e9f2"/><circle cx="${x - 2}" cy="${y - 2}" r="1.5" fill="#fff"/>`).join('')],
  shouldercrab: ['Miniature Crab Pal', '🦀', 'acc', 80, 4, `<g transform="translate(130 104) scale(.32)"><path d="M22,62 q-12,-20 -2,-30 q2,10 10,12Z M78,62 q12,-20 2,-30 q-2,10 -10,12Z" fill="#e8590c"/><ellipse cx="50" cy="72" rx="30" ry="20" fill="#fa5252"/><circle cx="36" cy="50" r="5" fill="#2b1c14"/><circle cx="64" cy="50" r="5" fill="#2b1c14"/></g>`],
  royalcape: ['Royal Cape', '👑', 'back', 160, 8, `<path d="M64,110 Q26,170 30,226 L170,226 Q174,170 136,110 Z" fill="#c92a2a"/><path d="M60,108 Q100,128 140,108 L144,122 Q100,142 56,122Z" fill="#fff"/>${[70, 86, 100, 114, 130].map((x) => `<circle cx="${x}" cy="${x === 100 ? 132 : 124}" r="2" fill="#212529"/>`).join('')}`],
  // ---------- more eyewear ----------
  cateye: ['Cat-Eye Glasses', '🐱', 'eyes', 55, 2, `<path d="M68,70 Q76,66 92,70 Q96,80 86,84 Q72,86 68,74 L62,66Z M132,70 Q124,66 108,70 Q104,80 114,84 Q128,86 132,74 L138,66Z" fill="#fff0f6" opacity=".35" stroke="#c2255c" stroke-width="3" stroke-linejoin="round"/><path d="M92,73 Q100,69 108,73" stroke="#c2255c" stroke-width="2.5" fill="none"/>`],
  aviators: ['Aviators', '🕶️', 'eyes', 60, 3, `<path d="M68,68 H94 Q96,84 84,86 Q70,86 68,72Z M132,68 H106 Q104,84 116,86 Q130,86 132,72Z" fill="#495057" opacity=".85" stroke="#d9b45a" stroke-width="2"/><path d="M94,69 Q100,66 106,69 M68,68 H132" stroke="#d9b45a" stroke-width="2" fill="none"/>`],
  seaglassframes: ['Sea Glass Frames', '🟢', 'eyes', 50, 2, `<rect x="68" y="66" width="28" height="20" rx="7" fill="#63e6be" opacity=".35" stroke="#20c997" stroke-width="3.5"/><rect x="104" y="66" width="28" height="20" rx="7" fill="#74c0fc" opacity=".35" stroke="#20c997" stroke-width="3.5"/><path d="M96,73 H104" stroke="#20c997" stroke-width="3"/>`],
  starframes: ['Star Frames', '⭐', 'eyes', 55, 2, `${[83, 117].map((x) => `<path d="M${x},62 L${x + 4},71 L${x + 13},71 L${x + 6},77 L${x + 9},86 L${x},81 L${x - 9},86 L${x - 6},77 L${x - 13},71 L${x - 4},71Z" fill="#ffd43b" opacity=".75" stroke="#f08c00" stroke-width="2" stroke-linejoin="round"/>`).join('')}<path d="M95,74 H105" stroke="#f08c00" stroke-width="2"/>`],
  oceantint: ['Ocean Tint Glasses', '🌊', 'eyes', 45, 1, `<circle cx="83" cy="76" r="11" fill="#1c7ed6" opacity=".55" stroke="#1864ab" stroke-width="2"/><circle cx="117" cy="76" r="11" fill="#1c7ed6" opacity=".55" stroke="#1864ab" stroke-width="2"/><path d="M94,75 Q100,71 106,75" stroke="#1864ab" stroke-width="2" fill="none"/><path d="M77,71 l4,-3 M111,71 l4,-3" stroke="#fff" stroke-width="2" opacity=".7"/>`],
  heartsunnies: ['Heart Sunglasses', '💗', 'eyes', 50, 2, `<path d="M84,90 C62,76 68,60 84,68 C100,60 106,76 84,90Z M116,90 C94,76 100,60 116,68 C132,60 138,76 116,90Z" fill="#f06595" opacity=".8" stroke="#a61e4d" stroke-width="2"/><path d="M98,72 L102,72" stroke="#a61e4d" stroke-width="2"/>`],
  // ---------- more extras ----------
  parasol: ['Mini Parasol', '⛱️', 'back', 55, 2, `<path d="M150,140 L120,20" stroke="#6b4d34" stroke-width="3"/><path d="M84,32 Q118,-12 160,22 Q140,22 122,30 Q104,24 84,32Z" fill="#ff8fab"/><path d="M122,30 L120,6" stroke="#fff" stroke-width="2" opacity=".6"/>`],
  wickerbasket: ['Wicker Basket', '🧺', 'acc', 40, 1, `<path d="M128,112 L58,174" stroke="#a8865f" stroke-width="4"/><path d="M40,172 L46,200 L76,200 L82,172Z" fill="#c9a66b"/>${[178, 186, 194].map((y) => `<path d="M42,${y} H80" stroke="#a8865f" stroke-width="2"/>`).join('')}<path d="M48,172 Q61,156 74,172" stroke="#a8865f" stroke-width="3" fill="none"/><circle cx="54" cy="170" r="4" fill="#fa5252"/><circle cx="62" cy="168" r="4" fill="#ffd43b"/>`],
  rolledmap: ['Rolled Map', '🗺️', 'acc', 45, 2, `<g transform="rotate(-30 140 170)"><rect x="118" y="164" width="46" height="12" rx="6" fill="#f3e3b8" stroke="#c9a66b" stroke-width="1.5"/><ellipse cx="164" cy="170" rx="3" ry="6" fill="#e8d6a8" stroke="#c9a66b"/><path d="M138,164 v12" stroke="#c92a2a" stroke-width="2"/></g>`],
  shoulderstar: ['Shoulder Starfish', '⭐', 'acc', 50, 2, `<path d="M140,96 L144,106 L155,106 L146,112 L150,123 L140,116 L130,123 L134,112 L125,106 L136,106Z" fill="#ff922b" stroke="#e8590c" stroke-width="1.5" stroke-linejoin="round"/><circle cx="137" cy="110" r="1.3" fill="#2b1c14"/><circle cx="143" cy="110" r="1.3" fill="#2b1c14"/>`],
  telescope: ['Pocket Telescope', '🔭', 'acc', 60, 3, `<g transform="rotate(-25 140 176)"><rect x="118" y="170" width="16" height="10" rx="2" fill="#b08d3c"/><rect x="132" y="168" width="16" height="14" rx="2" fill="#d4a017"/><rect x="146" y="166" width="10" height="18" rx="2" fill="#b08d3c"/><circle cx="156" cy="175" r="5" fill="#c5f6fa"/></g>`],
  shoulderoctopus: ['Shoulder Octopus', '🐙', 'acc', 75, 4, `<g transform="translate(124 88) scale(.34)"><path d="M22,58 q0,-40 28,-40 q28,0 28,40 q0,8 -6,10 Z" fill="#f783ac"/>${[20, 32, 44, 56, 68].map((x, k) => `<path d="M${x},64 q${k % 2 ? 6 : -6},16 0,28" stroke="#f783ac" stroke-width="9" fill="none" stroke-linecap="round"/>`).join('')}<g class="ani-wave"><path d="M80,64 q14,-4 12,-22" stroke="#f783ac" stroke-width="9" fill="none" stroke-linecap="round"/></g><circle cx="40" cy="46" r="4.5" fill="#2b1c14"/><circle cx="60" cy="46" r="4.5" fill="#2b1c14"/></g>`],
  pinwheel: ['Pinwheel', '🎐', 'back', 35, 1, `<path d="M156,150 L150,40" stroke="#adb5bd" stroke-width="2.5"/><g class="ani-spin"><path d="M150,40 L150,18 Q162,26 150,40Z" fill="#ff6b6b"/><path d="M150,40 L172,40 Q164,52 150,40Z" fill="#ffd43b"/><path d="M150,40 L150,62 Q138,54 150,40Z" fill="#4dabf7"/><path d="M150,40 L128,40 Q136,28 150,40Z" fill="#69db7c"/></g><circle cx="150" cy="40" r="2.5" fill="#fff"/>`],
  // event accessories
  eyepatch: ['Pirate Eyepatch', '🏴‍☠️', 'eyes', null, 1, `<path d="M58,58 L142,86" stroke="#212529" stroke-width="2.5"/><ellipse cx="117" cy="76" rx="11" ry="9" fill="#212529"/>`],
  loveglasses: ['Love Glasses', '💕', 'eyes', null, 1, `<path d="M84,88 C66,76 72,62 84,70 C96,62 102,76 84,88Z M116,88 C98,76 104,62 116,70 C128,62 134,76 116,88Z" fill="#ff8fab" stroke="#e64980" stroke-width="2"/><path d="M96,74 L104,74" stroke="#e64980" stroke-width="2"/>`],
  partybowtie: ['Glitter Bowtie', '✨', 'neck', null, 1, `<path d="M100,122 L80,112 L80,134Z M100,122 L120,112 L120,134Z" fill="#f2c94c"/><circle cx="100" cy="122" r="5" fill="#e8c547"/>${star(86, 120, 2.5, '#fff')}${star(114, 126, 2.5, '#fff')}`],
};

// ---------- footwear ----------
const pair = (svg) => [74, 126].map((x) => svg(x)).join('');
const FEET = {
  rainboots: ['Rain Boots', '🥾', 45, 1, pair((x) => `<path d="M${x - 14},196 L${x + 12},196 L${x + 14},216 Q${x + 22},216 ${x + 22},224 L${x - 18},224 Q${x - 20},212 ${x - 14},196Z" fill="#fcc419" stroke="#e8a400" stroke-width="2"/>`)],
  flippers: ['Flippers', '🤿', 50, 2, pair((x) => `<path d="M${x - 12},208 L${x + 12},208 L${x + 22},232 Q${x},238 ${x - 22},232Z" fill="#15aabf" stroke="#0c8599" stroke-width="2"/><path d="M${x},212 V232 M${x - 8},214 L${x - 12},230 M${x + 8},214 L${x + 12},230" stroke="#0c8599" stroke-width="1.5"/>`)],
  sandals: ['Sandals', '🩴', 25, 1, pair((x) => `<ellipse cx="${x}" cy="222" rx="20" ry="6" fill="#c9a66b"/><path d="M${x - 12},214 Q${x},206 ${x + 12},214" stroke="#a8865f" stroke-width="4" fill="none"/>`)],
  slippers: ['Fuzzy Slippers', '🧦', 35, 1, pair((x) => `<ellipse cx="${x}" cy="216" rx="22" ry="12" fill="#ffdeeb"/><ellipse cx="${x}" cy="210" rx="18" ry="6" fill="#fff"/><circle cx="${x - 8}" cy="212" r="2" fill="#2b1c14"/><circle cx="${x + 8}" cy="212" r="2" fill="#2b1c14"/>`)],
  rollerskates: ['Roller Skates', '🛼', 70, 3, pair((x) => `<path d="M${x - 16},198 L${x + 10},198 L${x + 12},212 Q${x + 20},212 ${x + 20},220 L${x - 18},220Z" fill="#f783ac"/><circle cx="${x - 10}" cy="226" r="5" fill="#ffd43b"/><circle cx="${x + 12}" cy="226" r="5" fill="#ffd43b"/>`)],
  snowboots: ['Snow Boots', '👢', 55, 2, pair((x) => `<path d="M${x - 15},198 L${x + 12},198 L${x + 14},216 Q${x + 22},216 ${x + 22},224 L${x - 18},224Z" fill="#8a6644"/><ellipse cx="${x - 2}" cy="198" rx="17" ry="6" fill="#fff"/>`)],
  balletslippers: ['Ballet Slippers', '🩰', 40, 2, pair((x) => `<ellipse cx="${x}" cy="218" rx="20" ry="9" fill="#ffc9de"/><path d="M${x - 6},212 L${x - 10},196 M${x + 6},212 L${x + 10},196" stroke="#f783ac" stroke-width="2"/>`)],
  pirateboots: ['Pirate Boots', '🏴‍☠️', 65, 4, pair((x) => `<path d="M${x - 16},188 L${x + 12},188 L${x + 14},216 Q${x + 22},216 ${x + 22},224 L${x - 18},224Z" fill="#212529"/><path d="M${x - 18},186 L${x + 14},186 L${x + 16},196 L${x - 20},196Z" fill="#495057"/><rect x="${x - 6}" y="206" width="10" height="6" fill="none" stroke="#f2c94c" stroke-width="2"/>`)],
  sneakers: ['Little Sneakers', '👟', 45, 1, pair((x) => `<path d="M${x - 18},206 Q${x - 16},200 ${x - 4},200 L${x + 8},208 Q${x + 22},210 ${x + 22},220 L${x - 20},220Z" fill="#fff" stroke="#adb5bd" stroke-width="1.5"/><rect x="${x - 20}" y="218" width="42" height="5" rx="2" fill="#4dabf7"/><path d="M${x - 6},204 l4,4 M${x - 2},202 l4,4" stroke="#4dabf7" stroke-width="1.5"/>`)],
};

const out = {};
const add = (id, name, icon, slot, price, level, svg, extra = {}) => { out[id] = { name, icon, slot, price, level, svg, ...extra }; };
for (const [id, [name, icon, price, level, svg]] of Object.entries(HATS)) add(id, name, icon, 'hat', price, level, svg, price === null ? { event: true } : {});
for (const [id, [name, icon, price, level, o]] of Object.entries(BODY)) add(id, name, icon, 'body', price, level, garment(id, o), { view: '30 96 140 140', ...(price === null ? { event: true } : {}) });
for (const [id, [name, icon, slot, price, level, svg]] of Object.entries(ACC)) add(id, name, icon, slot, price, level, svg, price === null ? { event: true } : {});
for (const [id, [name, icon, price, level, svg]] of Object.entries(FEET)) add(id, name, icon, 'feet', price, level, svg, { view: '40 180 120 60' });
out.shouldercrab.view = '110 90 60 50';
out.pocketwatch.view = '96 164 50 40';
out.earflower.view = '120 40 40 40';
out.shellearrings.view = '40 50 120 40';
out.friendbracelet.view = '50 140 40 40';
out.bubblehalo.view = '56 0 88 36';
for (const id of ['messengerbag', 'satchel', 'shellpurse']) out[id].view = '30 100 140 110';
out.royalcape.view = '24 100 152 130';
out.parasol.view = '78 -10 90 160';
out.pinwheel.view = '120 10 60 150';
out.wickerbasket.view = '36 110 100 96';
out.rolledmap.view = '110 140 64 50';
out.shoulderstar.view = '120 90 40 40';
out.telescope.view = '110 150 60 50';
out.shoulderoctopus.view = '118 80 44 44';

export const MORE_ITEMS = out;
export const MORE_SLOTS = [
  { id: 'body', name: 'Clothing' },
  { id: 'feet', name: 'Footwear' },
  { id: 'acc', name: 'Accessories' },
];
