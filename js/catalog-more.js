// The second batch: the rest of the suggested plushies, rugs, welcome mats,
// porch lights, porch plants, eyewear and extras. Each placeholder is made from
// a small recipe so it reads clearly until real art is uploaded.
// No imports here, so data.js, den-data.js and door.js can all use it.

const eye = (x, y, r = 2.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2b1c14"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.35}" fill="#fff"/>`;
const smile = (x, y, w = 6, c = '#2b1c14') => `<path d="M${x - w / 2},${y} q${w / 2},${w * 0.5} ${w},0" stroke="${c}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
const star5 = (x, y, r, fill) => { let d = ''; for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2; const rr = i % 2 ? r * 0.45 : r; d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`; } return `<path d="${d}Z" fill="${fill}"/>`; };
const flower = (x, y, r, c, mid = '#fff3bf') => [0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + Math.cos((a * Math.PI) / 180) * r).toFixed(1)}" cy="${(y + Math.sin((a * Math.PI) / 180) * r).toFixed(1)}" r="${(r * 0.75).toFixed(1)}" fill="${c}"/>`).join('') + `<circle cx="${x}" cy="${y}" r="${(r * 0.55).toFixed(1)}" fill="${mid}"/>`;

// ---------- plushies (den, cat 'plush'): a soft round body plus a detail ----------
// [name, price, level, body, belly, extra(svg drawn in 0 0 60 60), w]
const plushBody = (c1, c2) => `<ellipse cx="30" cy="38" rx="22" ry="18" fill="${c1}"/><ellipse cx="30" cy="42" rx="13" ry="10" fill="${c2}"/>`;
const PL = {
  otterplush: ['Sea Otter Plush', 70, 2, '#8a6644', '#f5ead6', `<circle cx="17" cy="22" r="5" fill="#6b4d34"/><circle cx="43" cy="22" r="5" fill="#6b4d34"/><circle cx="30" cy="28" r="14" fill="#9a735a"/><ellipse cx="30" cy="32" rx="9" ry="6" fill="#f5ead6"/>${eye(25, 27)}${eye(35, 27)}<ellipse cx="30" cy="31" rx="2.5" ry="1.8" fill="#2b1c14"/><ellipse cx="30" cy="44" rx="6" ry="4" fill="#e9e3f5"/>`],
  sealplush: ['Baby Seal Plush', 55, 1, '#e9ecef', '#f8f9fa', `<circle cx="30" cy="26" r="13" fill="#f1f3f5"/>${eye(25, 25, 2.6)}${eye(35, 25, 2.6)}<ellipse cx="30" cy="30" rx="2.4" ry="1.6" fill="#2b1c14"/><ellipse cx="12" cy="50" rx="7" ry="3" fill="#dee2e6"/><ellipse cx="48" cy="50" rx="7" ry="3" fill="#dee2e6"/>`],
  stingplush: ['Stingray Plush', 55, 2, 'none', 'none', `<path d="M30,18 Q48,18 58,34 Q44,34 34,42 L30,46 L26,42 Q16,34 2,34 Q12,18 30,18Z" fill="#a5d8ff"/><path d="M30,46 q2,8 -4,12" stroke="#74c0fc" stroke-width="2" fill="none"/>${eye(25, 26, 1.8)}${eye(35, 26, 1.8)}${smile(30, 32, 5)}`],
  puffinplush: ['Puffin Plush', 55, 2, '#212529', '#fff', `<circle cx="30" cy="22" r="12" fill="#212529"/><ellipse cx="30" cy="24" rx="8" ry="7" fill="#fff"/>${eye(27, 22, 1.8)}<path d="M31,25 l9,2 l-9,5Z" fill="#fd7e14"/>`],
  horseshoeplush: ['Horseshoe Crab Plush', 60, 3, 'none', 'none', `<path d="M8,40 Q8,16 30,16 Q52,16 52,40Z" fill="#8a6644"/><path d="M14,40 Q30,50 46,40" fill="#6b4d34"/><path d="M30,46 L30,58" stroke="#6b4d34" stroke-width="3" stroke-linecap="round"/>${eye(22, 28, 2)}${eye(38, 28, 2)}`],
  hatchlingplush: ['Sea Turtle Hatchling Plush', 50, 1, 'none', 'none', `<ellipse cx="28" cy="38" rx="18" ry="13" fill="#5c940d"/><path d="M18,34 l10,-6 l10,6 l-3,10 h-14Z" fill="#82c91e"/><circle cx="50" cy="34" r="8" fill="#a9e34b"/>${eye(52, 32, 1.8)}<ellipse cx="16" cy="50" rx="5" ry="3" fill="#a9e34b"/><ellipse cx="40" cy="50" rx="5" ry="3" fill="#a9e34b"/>`],
  orcaplush: ['Orca Plush', 70, 3, 'none', 'none', `<path d="M4,38 Q6,22 30,22 Q50,22 52,34 L60,26 Q60,40 54,44 Q46,54 26,52 Q6,52 4,38Z" fill="#212529"/><ellipse cx="18" cy="30" rx="5" ry="3" fill="#fff"/><path d="M8,44 Q28,52 48,44 Q38,52 26,52 Q12,52 8,44Z" fill="#fff"/><path d="M30,22 l4,-12 l4,12Z" fill="#212529"/>`],
  dolphinplush: ['Dolphin Plush', 60, 2, 'none', 'none', `<path d="M4,36 Q8,20 32,22 Q50,24 54,34 L60,28 Q60,42 54,44 Q44,52 26,50 Q10,48 4,36Z" fill="#74c0fc"/><path d="M28,22 l2,-10 l6,10Z" fill="#74c0fc"/><path d="M10,42 Q28,50 46,44" stroke="#d0ebff" stroke-width="4" fill="none"/>${eye(14, 32, 1.8)}${smile(8, 38, 5)}`],
  hermitplush: ['Hermit Crab Plush', 50, 1, 'none', 'none', `<path d="M34,50 Q20,50 22,34 Q24,18 40,20 Q54,24 52,40 Q50,50 34,50Z" fill="#e8d6a8" stroke="#c9a66b" stroke-width="2"/><path d="M40,28 q-8,4 -4,12 q4,6 10,2" stroke="#c9a66b" stroke-width="2" fill="none"/><ellipse cx="16" cy="44" rx="10" ry="7" fill="#fa5252"/><path d="M10,34 v-6 M18,34 v-6" stroke="#fa5252" stroke-width="2"/>${eye(10, 27, 2)}${eye(18, 27, 2)}`],
  urchinplush: ['Sea Urchin Plush', 40, 1, 'none', 'none', `${Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * Math.PI * 2; return `<path d="M30,38 L${(30 + Math.cos(a) * 24).toFixed(1)},${(38 + Math.sin(a) * 20).toFixed(1)}" stroke="#7048e8" stroke-width="2.4" stroke-linecap="round"/>`; }).join('')}<circle cx="30" cy="38" r="14" fill="#9775fa"/>${eye(25, 36)}${eye(35, 36)}${smile(30, 42, 5)}`],
  jellyplush: ['Jellyfish Plush', 45, 1, 'none', 'none', `<path d="M12,34 Q12,12 30,12 Q48,12 48,34Z" fill="#f3a6d8"/>${[16, 24, 32, 40, 46].map((x, k) => `<path d="M${x},34 q${k % 2 ? 4 : -4},10 0,22" stroke="#e599f7" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('')}${eye(24, 26)}${eye(36, 26)}${smile(30, 30, 5)}`],
  shrimpplush: ['Shrimp Plush', 40, 1, 'none', 'none', `<path d="M14,22 Q44,14 48,36 Q50,52 32,52 Q22,50 26,42 Q36,44 36,36 Q34,26 14,30Z" fill="#ff8787"/>${[24, 32, 40].map((x) => `<path d="M${x},22 q4,10 -2,20" stroke="#fa5252" stroke-width="1.5" fill="none"/>`).join('')}<path d="M14,24 q-8,-8 -10,-2 M16,26 q-10,-2 -12,4" stroke="#fa5252" stroke-width="1.5" fill="none"/>${eye(18, 25, 1.8)}`],
  seahorseplush: ['Seahorse Plush', 50, 2, 'none', 'none', `<path d="M28,58 q-10,-4 -4,-14 q6,-10 0,-18 q-4,-8 4,-16 q8,-6 16,-2 q-2,4 -1,6 q6,2 4,8 q-4,8 -2,16 q2,10 -6,16 q-4,3 -7,2Z" fill="#ffa94d"/><path d="M42,10 l10,-2 l-2,6Z" fill="#ffa94d"/>${eye(38, 14, 1.8)}`],
  albatrossplush: ['Albatross Plush', 55, 3, '#f8f9fa', '#fff', `<path d="M8,36 Q-4,26 4,22 Q18,28 22,34Z M52,36 Q64,26 56,22 Q42,28 38,34Z" fill="#495057"/><circle cx="30" cy="22" r="11" fill="#fff"/>${eye(27, 21, 1.8)}<path d="M32,23 l12,2 l-12,4Z" fill="#ffd43b"/>`],
  foxplush: ['Arctic Fox Plush', 65, 3, '#f8f9fa', '#fff', `<path d="M18,24 L14,6 L26,16Z M42,24 L46,6 L34,16Z" fill="#f1f3f5"/><circle cx="30" cy="26" r="13" fill="#fff"/>${eye(25, 25)}${eye(35, 25)}<circle cx="30" cy="31" r="2" fill="#2b1c14"/><path d="M50,48 q10,-4 8,-14 q-6,2 -8,14Z" fill="#fff" stroke="#e9ecef"/>`],
  frogplush: ['Frog Plush', 45, 1, '#74b816', '#d8f5a2', `<circle cx="20" cy="22" r="7" fill="#74b816"/><circle cx="40" cy="22" r="7" fill="#74b816"/>${eye(20, 22, 3)}${eye(40, 22, 3)}${smile(30, 34, 12, '#2b8a3e')}`],
  axolotlplush: ['Axolotl Plush', 60, 2, '#ffc9de', '#ffdeeb', `${[-1, 1].map((d) => [0, 1, 2].map((k) => `<path d="M${30 + d * 14},${24 + k * 6} l${d * 9},${-3 + k * 2}" stroke="#f06595" stroke-width="3" stroke-linecap="round"/>`).join('')).join('')}<circle cx="30" cy="28" r="12" fill="#ffdeeb"/>${eye(25, 27)}${eye(35, 27)}${smile(30, 32, 6, '#c2255c')}`],
};

// ---------- rugs (den, cat 'rug'): a shape filled with a motif ----------
const rugShape = { oval: 'M2,25 a53,23 0 1,0 106,0 a53,23 0 1,0 -106,0Z', rect: 'M4,4 H106 V46 H4Z', round: 'M30,25 a25,23 0 1,0 50,0 a25,23 0 1,0 -50,0Z' };
// [name, price, level, svg] (viewBox 0 0 110 50, 88 wide)
const RUG = {
  starfishrug: ['Starfish Rug', 55, 2, star5(55, 27, 24, '#ff922b') + star5(55, 27, 12, '#ffa94d')],
  moonrug: ['Moonlit Rug', 70, 3, `<path d="${rugShape.oval}" fill="#1b2a6b"/>${[[22, 25, 7], [40, 20, 6], [56, 25, 7], [72, 20, 6], [88, 25, 7]].map(([x, y, r], k) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff3bf"/>${k !== 2 ? `<circle cx="${x + (k < 2 ? 3 : -3)}" cy="${y}" r="${r}" fill="#1b2a6b"/>` : ''}`).join('')}${star5(30, 38, 2.5, '#fff3bf')}${star5(80, 38, 2.5, '#fff3bf')}`],
  reefrug: ['Coral Reef Rug', 75, 3, `<path d="${rugShape.oval}" fill="#3bc9db"/><path d="M24,40 q-2,-14 4,-20 M30,40 q4,-12 0,-18 M70,40 q2,-14 -4,-20 M78,40 q-4,-10 2,-16" stroke="#ff8787" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M48,24 q6,-6 12,0 q-6,6 -12,0 l-4,-3 v6Z" fill="#ffd43b"/><circle cx="90" cy="20" r="3" fill="#fff" opacity=".7"/>`],
  cloudrug: ['Cloud Rug', 65, 3, `<path d="M14,40 Q2,32 14,24 Q14,8 34,12 Q44,2 60,10 Q80,4 86,18 Q106,18 100,34 Q96,44 80,42 Q60,48 40,44 Q22,48 14,40Z" fill="#fff" stroke="#d0ebff" stroke-width="2"/>`],
  pebblerug: ['Pebble Beach Rug', 50, 1, `<path d="${rugShape.oval}" fill="#e8d6a8"/>${[[20, 22, '#adb5bd'], [34, 30, '#868e96'], [50, 20, '#ced4da'], [64, 30, '#adb5bd'], [80, 22, '#868e96'], [92, 30, '#ced4da']].map(([x, y, c]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4.5" fill="${c}"/>`).join('')}`],
  tidepoolrug: ['Tidepool Rug', 60, 2, `<path d="${rugShape.oval}" fill="#8c8070"/><ellipse cx="38" cy="25" rx="20" ry="11" fill="#3cc7c0"/><ellipse cx="76" cy="27" rx="14" ry="8" fill="#3cc7c0"/>${star5(38, 25, 5, '#ff922b')}<circle cx="78" cy="26" r="3" fill="#e599f7"/>`],
  kelprug: ['Kelp Forest Rug', 55, 2, `<path d="${rugShape.rect}" fill="#2b5d3a" rx="6"/>${[16, 32, 48, 64, 80, 96].map((x) => `<path d="M${x},46 q6,-10 0,-20 q-6,-10 0,-22" stroke="#82c91e" stroke-width="4" fill="none"/>`).join('')}`],
  sanddollarrug: ['Sand Dollar Rug', 55, 2, `<circle cx="55" cy="25" r="23" fill="#f3e3b8" stroke="#d8c39c" stroke-width="2"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${(55 + Math.cos(((a - 90) * Math.PI) / 180) * 10).toFixed(1)}" cy="${(25 + Math.sin(((a - 90) * Math.PI) / 180) * 10).toFixed(1)}" rx="2" ry="5" transform="rotate(${a} ${(55 + Math.cos(((a - 90) * Math.PI) / 180) * 10).toFixed(1)} ${(25 + Math.sin(((a - 90) * Math.PI) / 180) * 10).toFixed(1)})" fill="#d8c39c"/>`).join('')}`],
  whaletailrug: ['Whale Tail Rug', 65, 3, `<path d="M55,48 Q50,30 40,22 Q20,14 6,22 Q20,6 40,10 Q50,12 55,20 Q60,12 70,10 Q90,6 104,22 Q90,14 70,22 Q60,30 55,48Z" fill="#4c6ef5"/>`],
  stripesrug: ['Nautical Stripe Rug', 45, 1, `<path d="${rugShape.rect}" fill="#fff"/>${[10, 22, 34].map((y) => `<rect x="4" y="${y}" width="102" height="6" fill="#1c3f60"/>`).join('')}<path d="M4,4 H106 V46 H4Z" fill="none" stroke="#e03131" stroke-width="2"/>`],
  seaglassrug: ['Sea Glass Mosaic Rug', 70, 3, `<path d="${rugShape.rect}" fill="#e3fafc"/>${Array.from({ length: 24 }, (_, k) => `<rect x="${8 + (k % 8) * 12}" y="${8 + Math.floor(k / 8) * 12}" width="10" height="10" rx="2" fill="${['#63e6be', '#74c0fc', '#b2f2bb', '#99e9f2'][k % 4]}"/>`).join('')}`],
  netrug: ['Fishing Net Rug', 45, 1, `<path d="${rugShape.oval}" fill="#e8d6a8"/>${[18, 32, 46, 60, 74, 88].map((x) => `<path d="M${x},4 L${x + 14},46 M${x + 14},4 L${x},46" stroke="#a8865f" stroke-width="1.5"/>`).join('')}<path d="${rugShape.oval}" fill="none" stroke="#6b4d34" stroke-width="3"/>`],
  frozenrug: ['Frozen Pond Rug', 60, 2, `<path d="${rugShape.oval}" fill="#d0ebff"/><path d="M20,20 l14,6 l10,-8 M60,30 l12,-6 l16,8 M44,34 l10,6" stroke="#fff" stroke-width="2" fill="none"/><ellipse cx="36" cy="18" rx="10" ry="3" fill="#fff" opacity=".7"/>`],
  shagrug: ['Coral Pink Shag Rug', 60, 2, `<path d="${rugShape.oval}" fill="#ffa8a8"/>${Array.from({ length: 30 }, (_, k) => `<path d="M${10 + (k % 10) * 9},${12 + Math.floor(k / 10) * 10} v6" stroke="#ff8787" stroke-width="2" stroke-linecap="round"/>`).join('')}`],
  patchworkrug: ['Seashell Patchwork Rug', 65, 3, `<path d="${rugShape.rect}" fill="#fff0f6"/>${Array.from({ length: 8 }, (_, k) => `<rect x="${4 + (k % 4) * 25.5}" y="${4 + Math.floor(k / 4) * 21}" width="25.5" height="21" fill="${['#ffdeeb', '#e7f5ff', '#fff3bf', '#e6fcf5'][(k + Math.floor(k / 4)) % 4]}" stroke="#fcc2d7"/><path d="M${10 + (k % 4) * 25.5},${20 + Math.floor(k / 4) * 21} q7,-12 14,0Z" fill="#f783ac" opacity=".7"/>`).join('')}`],
};

// ---------- welcome mats (front door, drawn on the 120 × 130 house canvas) ----------
const matBase = (c, inner, rx = 2) => `<rect x="34" y="116" width="52" height="10" rx="${rx}" fill="${c}"/>${inner}`;
const matText = (c, t, size = 4.4, fill = '#3b2a1e') => matBase(c, `<text x="60" y="123" font-size="${size}" text-anchor="middle" fill="${fill}" font-family="Georgia, serif" font-weight="bold">${t}</text>`);
const MAT = {
  'mat-fish': ['School of Fish Mat', 40, matBase('#e7f5ff', [42, 52, 62, 72].map((x) => `<path d="M${x},121 q3,-3 6,0 q-3,3 -6,0 l-2,-1.5 v3Z" fill="#339af0"/>`).join(''))],
  'mat-moon': ['Moon Mat', 40, matBase('#1b2a6b', `<path d="M62,117 a4.5,4.5 0 1,0 0,8 a3.4,3.4 0 1,1 0,-8Z" fill="#fff3bf"/>${star5(48, 121, 1.6, '#fff3bf')}${star5(74, 120, 1.4, '#fff3bf')}`)],
  'mat-seaglass': ['Sea Glass Mat', 45, matBase('#f8f9fa', Array.from({ length: 8 }, (_, k) => `<rect x="${37 + k * 6}" y="${118 + (k % 2) * 2}" width="5" height="4" rx="1" fill="${['#63e6be', '#74c0fc', '#b2f2bb', '#99e9f2'][k % 4]}"/>`).join(''))],
  'mat-tidepool': ['Tidepool Mat', 40, matBase('#8c8070', `<ellipse cx="60" cy="121" rx="14" ry="3.5" fill="#3cc7c0"/>${star5(56, 121, 2, '#ff922b')}`)],
  'mat-whale': ['Whale Tail Mat', 40, matBase('#e7f5ff', '<path d="M60,125 Q58,121 54,119 Q48,117 44,120 Q48,115 54,116 Q58,117 60,119 Q62,117 66,116 Q72,115 76,120 Q72,117 66,119 Q62,121 60,125Z" fill="#4c6ef5"/>')],
  'mat-kelp': ['Kelp Forest Mat', 35, matBase('#2b5d3a', [42, 50, 58, 66, 74].map((x) => `<path d="M${x},125 q2,-3 0,-6 q-2,-2 0,-4" stroke="#82c91e" stroke-width="1.5" fill="none"/>`).join(''))],
  'mat-pearl': ['Pearl Mat', 50, matBase('#f3f0ff', [40, 46, 52, 58, 64, 70, 76, 82].map((x) => `<circle cx="${x}" cy="121" r="2" fill="#fff" stroke="#d0bfff" stroke-width=".6"/>`).join(''), 5)],
  'mat-boat': ['Fishing Boat Mat', 40, matBase('#d0ebff', '<path d="M50,122 L70,122 L67,125 L53,125Z" fill="#c92a2a"/><path d="M60,122 V116 M60,117 L66,121 H60Z" stroke="#6b4d34" fill="#fff" stroke-width=".8"/>')],
  'mat-jelly': ['Jellyfish Mat', 40, matBase('#1b2a6b', [48, 60, 72].map((x) => `<path d="M${x - 3},121 q3,-5 6,0Z" fill="#e599f7"/><path d="M${x - 1.5},121 v3 M${x + 1.5},121 v3" stroke="#e599f7" stroke-width=".8"/>`).join(''))],
  'mat-gull': ['Seagull Mat', 35, matBase('#f1f3f5', '<path d="M52,121 q4,-4 8,0 q4,-4 8,0" stroke="#495057" stroke-width="1.4" fill="none"/><path d="M44,123 q2,-2 4,0 q2,-2 4,0" stroke="#868e96" stroke-width="1" fill="none"/>')],
  'mat-mermaid': ['Mermaid Tail Mat', 50, matBase('#c3fae8', '<path d="M50,121 Q58,117 66,121 L72,117 L72,125 L66,121" fill="#20c997"/>')],
  'mat-driftwood': ['Driftwood Mat', 35, '<path d="M34,118 Q60,113 86,118 L86,125 Q60,128 34,125Z" fill="#c9a66b"/><path d="M38,120 Q60,117 82,120 M38,123 Q60,121 82,123" stroke="#a8865f" stroke-width="1" fill="none"/>'],
  'mat-beachhut': ['Little Beach Hut Mat', 45, matBase('#fff9db', '<path d="M55,124 V119 L60,116 L65,119 V124Z" fill="#ff8787"/><path d="M57,124 V120 M59,124 V120 M61,124 V120 M63,124 V120" stroke="#fff" stroke-width=".7"/>')],
  'mat-otterswelcome': ['"Otters Welcome" Mat', 45, matText('#c9a66b', 'Otters Welcome', 4)],
  'mat-soggypaws': ['"Soggy Paws" Mat', 45, matText('#a5d8ff', 'Soggy Paws 🐾', 4.2, '#1864ab')],
};

// ---------- porch lights (front door) ----------
const hang = (x, y1, y2) => `<path d="M${x},${y1} v${y2 - y1}" stroke="#5a3f2a" stroke-width="1.2"/>`;
const halo = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".28"/>`;
const LIGHT = {
  'lights-coral': ['Coral Lamp', 55, `<path d="M94,118 v-8 M86,118 h16" stroke="#6b4d34" stroke-width="2"/><path d="M94,110 q-6,-6 -4,-14 M94,106 q6,-4 6,-12 M94,104 v-10" stroke="#ff8787" stroke-width="3" fill="none" stroke-linecap="round"/>${halo(94, 98, 10, '#ffc9c9')}`],
  'lights-starfish': ['Starfish Night Light', 45, `<g class="ani-glow">${star5(94, 68, 7, '#ffa94d')}${halo(94, 68, 11, '#fff3bf')}</g>`],
  'lights-oyster': ['Oyster Pearl Lamp', 60, `${hang(93, 56, 62)}<path d="M85,70 Q86,62 93,62 Q100,62 101,70Z" fill="#e9e3f5" stroke="#b8a9cf"/><path d="M85,70 Q93,76 101,70" fill="#dcd2e6" stroke="#b8a9cf"/><g class="ani-glow"><circle cx="93" cy="68" r="3" fill="#fff"/>${halo(93, 68, 9, '#f3f0ff')}</g>`],
  'lights-whale': ['Whale Lamp', 55, `${hang(93, 54, 62)}<path d="M84,70 Q84,62 94,62 Q102,62 103,68 L107,64 Q107,72 103,72 Q100,76 92,76 Q84,76 84,70Z" fill="#4c6ef5"/><circle cx="88" cy="67" r="1" fill="#fff"/>${halo(94, 70, 10, '#d0ebff')}`],
  'lights-float': ['Glass Float Light', 50, `${hang(93, 56, 62)}<circle cx="93" cy="69" r="7" fill="#69db7c" opacity=".75"/><path d="M86,69 h14 M93,62 v14" stroke="#6b4d34" stroke-width=".8"/>${halo(93, 69, 11, '#d3f9d8')}`],
  'lights-conch': ['Conch Shell Lamp', 60, `<path d="M90,118 h10" stroke="#6b4d34" stroke-width="2"/><path d="M95,116 Q86,112 88,100 Q92,90 100,94 Q104,100 98,106 Q102,112 95,116Z" fill="#ffd8c2" stroke="#e8a98a"/>${halo(95, 104, 11, '#fff3bf')}`],
  'lights-bubble': ['Bubble Lamp', 45, `<g class="ani-pulse">${[[92, 66, 5], [98, 60, 3.5], [88, 58, 2.5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#c5f6fa" opacity=".8" stroke="#66d9e8" stroke-width=".8"/>`).join('')}${halo(93, 63, 11, '#e3fafc')}</g>`],
  'lights-kelp': ['Kelp-Wrapped Lantern', 50, `${hang(92, 56, 63)}<rect x="86" y="63" width="12" height="14" rx="3" fill="#fff3bf"/><path d="M86,66 q6,4 12,0 M86,71 q6,4 12,0 M86,76 q6,-4 12,0" stroke="#2b8a3e" stroke-width="2" fill="none"/>${halo(92, 70, 10, '#fff3bf')}`],
  'lights-geode': ['Crystal Geode Lamp', 70, `<path d="M86,118 Q86,106 95,104 Q104,106 104,118Z" fill="#868e96"/><path d="M89,118 l2,-9 l3,6 l3,-9 l3,8 l2,4Z" fill="#9775fa"/><g class="ani-glow">${halo(95, 110, 11, '#e5dbff')}</g>`],
  'lights-candle': ['Tidal Pool Candle', 40, `<ellipse cx="94" cy="117" rx="8" ry="2.5" fill="#3cc7c0"/><rect x="91" y="106" width="6" height="10" rx="1.5" fill="#fff3e6"/><g class="ani-glow"><ellipse cx="94" cy="103" rx="2" ry="3" fill="#ffd43b"/>${halo(94, 103, 7, '#fff3bf')}</g>`],
};

// ---------- porch plants (front door, left of the step) ----------
const pot = (c = '#a8865f') => `<path d="M14,118 l3,-12 h14 l3,12Z" fill="${c}"/>`;
const stems = (xs, top, c = '#5c940d') => xs.map((x, k) => `<path d="M${x},106 V${top - (k % 2) * 4}" stroke="${c}" stroke-width="1.4"/>`).join('');
const PLANT = {
  'plant-pinetree': ['Pinecone Tree', 50, `${pot()}<path d="M24,72 L34,92 H28 L36,106 H12 L20,92 H14Z" fill="#2b8a3e"/><ellipse cx="30" cy="100" rx="2" ry="3" fill="#8a6644"/>`],
  'plant-delphinium': ['Blue Delphiniums', 45, `${pot()}${stems([18, 24, 30], 84)}${[18, 24, 30].map((x, k) => [0, 4, 8, 12].map((d) => `<circle cx="${x}" cy="${84 - (k % 2) * 4 + d}" r="2.2" fill="#4263eb"/>`).join('')).join('')}`],
  'plant-thrift': ['Sea Thrift', 35, `${pot('#c9b084')}${stems([18, 22, 26, 30], 96, '#94d82d')}${[18, 22, 26, 30].map((x, k) => `<circle cx="${x}" cy="${96 - (k % 2) * 4}" r="3" fill="#f783ac"/>`).join('')}`],
  'plant-bluestar': ['Blue Star Fern', 40, `${pot('#e9ecef')}<path d="M24,106 q-12,-6 -12,-16 M24,106 q-4,-14 0,-22 M24,106 q10,-8 12,-18" stroke="#63a4a0" stroke-width="5" fill="none" stroke-linecap="round"/>`],
  'plant-coralsucc': ['Coral Succulent', 45, `${pot('#f1f3f5')}<path d="M24,106 q-6,-8 -2,-16 M24,104 q6,-6 4,-14 M22,96 q-6,-2 -6,-8 M28,94 q6,0 6,-6" stroke="#ff8787" stroke-width="4" fill="none" stroke-linecap="round"/>`],
  'plant-bonsai': ['Miniature Bonsai', 65, `<path d="M12,118 h24 l-2,-6 h-20Z" fill="#1c3f60"/><path d="M24,112 q-4,-8 4,-14 q-6,-4 -10,-2" stroke="#6b4d34" stroke-width="2.5" fill="none"/><ellipse cx="30" cy="96" rx="8" ry="5" fill="#2b8a3e"/><ellipse cx="16" cy="94" rx="6" ry="4" fill="#2b8a3e"/>`],
  'plant-bluebells': ['Bluebells', 35, `${pot()}${[18, 24, 30].map((x, k) => `<path d="M${x},106 q2,-12 6,-16" stroke="#5c940d" stroke-width="1.4" fill="none"/>${[0, 5].map((d) => `<path d="M${x + 4 - d * 0.4},${92 + d} q-2,4 0,5 q2,-1 3,-4Z" fill="#748ffc"/>`).join('')}`).join('')}`],
  'plant-forgetmenot': ['Forget-Me-Nots', 35, `${pot()}${stems([18, 24, 30], 96)}${[[18, 94], [24, 90], [30, 94], [21, 98], [27, 98]].map(([x, y]) => flower(x, y, 2, '#74c0fc', '#ffd43b')).join('')}`],
  'plant-daisies': ['Daisies', 35, `${pot()}${stems([18, 24, 30], 92)}${[[18, 92], [24, 88], [30, 92]].map(([x, y]) => flower(x, y, 3, '#fff', '#ffd43b')).join('')}`],
  'plant-foxglove': ['Foxglove', 40, `${pot()}${stems([20, 28], 76)}${[20, 28].map((x, k) => [0, 5, 10, 15].map((d) => `<ellipse cx="${x + 2}" cy="${78 - (k % 2) * 4 + d}" rx="2" ry="2.8" fill="#cc5de8"/>`).join('')).join('')}`],
  'plant-rosemary': ['Rosemary', 30, `${pot('#c9b084')}${[16, 20, 24, 28, 32].map((x, k) => `<path d="M${x},106 V${88 - (k % 2) * 4}" stroke="#5c7a5a" stroke-width="2.5" stroke-dasharray="1 1"/>`).join('')}`],
  'plant-sealavender': ['Sea Lavender', 35, `${pot()}<path d="M24,106 V96 M24,98 l-8,-8 M24,98 l8,-8 M24,96 V88" stroke="#7a9e7e" stroke-width="1.2"/>${[[16, 88], [32, 88], [24, 86], [20, 92], [28, 92]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#b197fc"/>`).join('')}`],
  'plant-pitcher': ['Pitcher Plant', 50, `${pot()}${[18, 26, 32].map((x, k) => `<path d="M${x - 3},${104 - k * 2} q0,-12 3,-16 q3,4 3,16Z" fill="${k % 2 ? '#a9e34b' : '#c92a2a'}"/>`).join('')}`],
  'plant-flytrap': ['Venus Flytrap', 50, `${pot()}<path d="M24,106 V94 M20,106 q-4,-6 -6,-10 M28,106 q4,-6 6,-10" stroke="#5c940d" stroke-width="1.6" fill="none"/>${[[24, 92], [14, 94], [34, 94]].map(([x, y]) => `<path d="M${x - 4},${y} q4,-6 8,0" fill="#e03131"/><path d="M${x - 4},${y} l1,-2 m2,1 l0,-2 m2,2 l1,-2" stroke="#a9e34b" stroke-width=".7"/>`).join('')}`],
  'plant-kelp': ['Potted Kelp', 35, `<path d="M12,118 Q12,104 24,104 Q36,104 36,118Z" fill="#c5f6fa" opacity=".7" stroke="#66d9e8"/>${[18, 24, 30].map((x) => `<path d="M${x},116 q4,-8 0,-14 q-4,-6 0,-14" stroke="#5c940d" stroke-width="3" fill="none"/>`).join('')}`],
  'plant-driftplanter': ['Driftwood Planter', 45, `<path d="M8,118 Q24,110 40,118 L38,112 Q24,104 10,112Z" fill="#a8865f"/>${[16, 24, 32].map((x) => flower(x, 104, 2.5, '#ffd43b', '#fff')).join('')}<path d="M14,110 l4,-4 M30,110 l-4,-4" stroke="#5c940d" stroke-width="1.2"/>`],
  'plant-coralarr': ['Coral Arrangement', 55, `<path d="M12,118 h24 l-2,-8 h-20Z" fill="#e8d6a8"/><path d="M18,110 q-4,-8 0,-16 M24,110 q2,-10 -2,-18 M30,110 q4,-8 2,-14" stroke="#ff8787" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M26,96 q4,-4 6,-10" stroke="#b197fc" stroke-width="3" fill="none" stroke-linecap="round"/>`],
  'plant-lilybowl': ['Water Lily Bowl', 50, `<ellipse cx="24" cy="112" rx="13" ry="6" fill="#1c7ed6"/><ellipse cx="24" cy="110" rx="12" ry="4" fill="#3cc7c0"/><ellipse cx="19" cy="110" rx="5" ry="2" fill="#6f9a3a"/>${flower(29, 108, 2.4, '#fff', '#ffd43b')}`],
};

// ---------- eyewear (closet, otter canvas: eyes at (83, 76) and (117, 76)) ----------
const twoLens = (shape, stroke, fill = 'none', w = 3, bridge = true) => [83, 117].map((x) => shape(x, 76).replace('STROKE', stroke).replace('FILL', fill).replace('W', w)).join('') + (bridge ? `<path d="M94,74 Q100,70 106,74" stroke="${stroke}" stroke-width="2" fill="none"/>` : '');
const circleLens = (r) => (x, y) => `<circle cx="${x}" cy="${y}" r="${r}" fill="FILL" stroke="STROKE" stroke-width="W"/>`;
const hexLens = (x, y) => `<path d="M${x - 11},${y} L${x - 5.5},${y - 9.5} L${x + 5.5},${y - 9.5} L${x + 11},${y} L${x + 5.5},${y + 9.5} L${x - 5.5},${y + 9.5}Z" fill="FILL" stroke="STROKE" stroke-width="W"/>`;
const rectLens = (x, y) => `<rect x="${x - 13}" y="${y - 9}" width="26" height="18" rx="2" fill="FILL" stroke="STROKE" stroke-width="W"/>`;
const EYES = {
  roundframes: ['Vintage Round Frames', 45, 1, twoLens(circleLens(10), '#d4a017', 'none', 2)],
  steampunk: ['Steampunk Goggles', 75, 4, `<path d="M60,70 H140" stroke="#6b4d34" stroke-width="5"/>${twoLens(circleLens(12), '#b08d3c', '#ffa94d', 5)}${[71, 95, 105, 129].map((x) => `<circle cx="${x}" cy="76" r="1.5" fill="#6b4d34"/>`).join('')}`],
  pearlsunnies: ['Pearl Sunglasses', 70, 3, `${twoLens(rectLens, '#f8f9fa', '#343a40', 3)}${[71, 79, 87, 95, 105, 113, 121, 129].map((x) => `<circle cx="${x}" cy="66" r="2" fill="#fff" stroke="#d8c8e8" stroke-width=".6"/>`).join('')}`],
  operaglasses: ['Opera Glasses', 65, 4, `${twoLens(circleLens(9), '#d4a017', '#e7f5ff', 2.5)}<path d="M126,82 L146,112" stroke="#d4a017" stroke-width="3" stroke-linecap="round"/>`],
  hexframes: ['Hexagonal Frames', 45, 2, twoLens(hexLens, '#495057', 'none', 2.5)],
  academic: ['Square Academic Glasses', 40, 1, twoLens(rectLens, '#212529', 'none', 4)],
  rimless: ['Rimless Glasses', 40, 1, `${twoLens(circleLens(10), '#dee2e6', '#e7f5ff', 0.8, false)}<path d="M93,74 H107" stroke="#adb5bd" stroke-width="1.5"/>`],
  tortoiseshell: ['Tortoiseshell Frames', 50, 2, `${twoLens(rectLens, '#8a5a2b', 'none', 4)}${[74, 90, 108, 124].map((x) => `<circle cx="${x}" cy="${x % 3 ? 68 : 84}" r="1.6" fill="#3b2a1e"/>`).join('')}`],
  greenframes: ['Round Green Frames', 40, 1, twoLens(circleLens(10), '#2b8a3e', 'none', 3)],
  frosted: ['Frosted Glasses', 45, 2, twoLens(circleLens(10), '#ced4da', '#f8f9fa', 2)],
  iridescent: ['Iridescent Sunglasses', 65, 3, `<defs><linearGradient id="oo-iri" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#da77f2"/><stop offset=".5" stop-color="#66d9e8"/><stop offset="1" stop-color="#ffd43b"/></linearGradient></defs>${twoLens(rectLens, '#495057', 'url(#oo-iri)', 2)}`],
  pearlmonocle: ['Pearl-Rimmed Monocle', 60, 3, `<circle cx="117" cy="76" r="11" fill="#e7f5ff" opacity=".4"/>${Array.from({ length: 12 }, (_, k) => `<circle cx="${(117 + Math.cos((k / 12) * Math.PI * 2) * 11).toFixed(1)}" cy="${(76 + Math.sin((k / 12) * Math.PI * 2) * 11).toFixed(1)}" r="1.8" fill="#fff" stroke="#d8c8e8" stroke-width=".5"/>`).join('')}<path d="M128,80 Q136,100 130,118" stroke="#e9ecef" stroke-width="1" fill="none"/>`],
  nightvision: ['Night-Vision Goggles', 80, 5, `<path d="M58,72 H142" stroke="#343a40" stroke-width="6"/>${[83, 117].map((x) => `<rect x="${x - 10}" y="64" width="20" height="22" rx="4" fill="#495057"/><circle cx="${x}" cy="75" r="7" fill="#69db7c" opacity=".85"/>`).join('')}`],
  snowgoggles: ['Snow Goggles', 55, 2, `<path d="M56,72 H144" stroke="#4dabf7" stroke-width="5"/><path d="M66,66 Q100,58 134,66 Q138,80 128,86 Q114,90 100,82 Q86,90 72,86 Q62,80 66,66Z" fill="#ffa94d" opacity=".85" stroke="#212529" stroke-width="3"/>`],
  snorkelmask: ['Diving Mask with Snorkel', 70, 4, `<path d="M66,64 Q100,56 134,64 Q138,84 124,88 Q110,90 100,84 Q90,90 76,88 Q62,84 66,64Z" fill="#c5f6fa" opacity=".6" stroke="#fab005" stroke-width="4"/><path d="M134,72 Q148,70 148,50 V20" stroke="#fab005" stroke-width="5" fill="none" stroke-linecap="round"/>`],
  chainspecs: ['Spectacles with Chain', 50, 2, `${twoLens(circleLens(9), '#d4a017', 'none', 2)}<path d="M72,78 Q64,110 100,118 Q136,110 128,78" stroke="#d4a017" stroke-width="1" fill="none" stroke-dasharray="1.5 1.5"/>`],
};

// ---------- extras (closet). slot: 'acc' (in front) or 'back' (behind) ----------
const EXTRA = {
  floatcharm: ['Glass Float Charm', 'acc', 35, 1, `<path d="M118,150 V162" stroke="#a8865f" stroke-width="1.2"/><circle cx="118" cy="168" r="6" fill="#69db7c" opacity=".8"/><path d="M112,168 h12 M118,162 v12" stroke="#6b4d34" stroke-width=".8"/>`],
  fishingrod: ['Tiny Fishing Rod', 'back', 50, 2, `<path d="M140,170 L176,30" stroke="#8a6644" stroke-width="3"/><path d="M176,30 Q190,60 184,96" stroke="#dee2e6" stroke-width="1" fill="none"/><circle cx="184" cy="98" r="3" fill="#e03131"/>`],
  bouquet: ['Flower Bouquet', 'acc', 45, 2, `<path d="M118,176 L126,146 L134,176Z" fill="#a5d8ff"/>${[[120, 142], [128, 136], [136, 142], [124, 148], [132, 148]].map(([x, y], k) => flower(x, y, 3.5, ['#ff8fab', '#ffd43b', '#b197fc', '#ff8787', '#74c0fc'][k])).join('')}`],
  sleepingbag: ['Rolled Sleeping Bag', 'back', 45, 2, `<rect x="52" y="26" width="96" height="22" rx="11" fill="#2b8a3e"/><ellipse cx="148" cy="37" rx="5" ry="11" fill="#37b24d"/><path d="M76,26 v22 M124,26 v22" stroke="#8a6644" stroke-width="3"/>`],
  picnicbasket: ['Little Picnic Basket', 'acc', 50, 2, `<path d="M128,112 L58,174" stroke="#a8865f" stroke-width="3"/><rect x="40" y="172" width="40" height="26" rx="3" fill="#c9a66b"/><path d="M40,180 H80 M40,188 H80" stroke="#a8865f" stroke-width="2"/><path d="M40,172 H80 L76,166 H44Z" fill="#e03131"/><path d="M44,166 l4,6 l4,-6 l4,6 l4,-6 l4,6 l4,-6 l4,6 l4,-6" stroke="#fff" stroke-width="1.2" fill="none"/>`],
  minianchor: ['Miniature Anchor', 'acc', 35, 1, `<path d="M70,112 L60,150" stroke="#adb5bd" stroke-width="1.5" stroke-dasharray="2 1"/><path d="M60,150 v18 M53,163 q7,8 14,0 M56,154 h8" stroke="#495057" stroke-width="2.5" fill="none" stroke-linecap="round"/>`],
  mapsatchel: ['Treasure Map Satchel', 'acc', 55, 3, `<path d="M128,112 L62,178" stroke="#6b4d34" stroke-width="5"/><rect x="40" y="172" width="34" height="26" rx="4" fill="#f3e3b8" stroke="#a8865f" stroke-width="2"/><path d="M46,184 l6,4 l6,-6 l6,4" stroke="#c92a2a" stroke-width="1.5" fill="none" stroke-dasharray="2 2"/><path d="M64,180 l4,4 m0,-4 l-4,4" stroke="#c92a2a" stroke-width="1.5"/>`],
  shellfan: ['Seashell Fan', 'acc', 40, 2, `<path d="M140,150 L150,176" stroke="#c9a66b" stroke-width="2.5"/><path d="M124,152 Q128,124 150,124 Q168,128 162,150Z" fill="#ffdeeb" stroke="#f783ac" stroke-width="1.5"/><path d="M140,150 L132,130 M140,150 L142,126 M140,150 L154,130" stroke="#f783ac" stroke-width="1"/>`],
  kite: ['Tiny Kite', 'back', 45, 2, `<path d="M156,150 Q170,110 168,60" stroke="#dee2e6" stroke-width="1" fill="none"/><path d="M168,30 L182,50 L168,74 L154,50Z" fill="#ff6b6b"/><path d="M168,30 V74 M154,50 H182" stroke="#fff" stroke-width="1.2"/><path d="M168,74 q-6,8 0,12 q6,6 0,12" stroke="#ffd43b" stroke-width="2" fill="none"/>`],
  bubblewand: ['Bubble Wand', 'acc', 30, 1, `<path d="M132,170 L150,128" stroke="#f783ac" stroke-width="2.5"/><circle cx="152" cy="122" r="6" fill="none" stroke="#f783ac" stroke-width="2"/><g class="ani-pulse">${[[162, 108, 5], [170, 96, 3.5], [158, 92, 2.5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#d0f4ff" opacity=".7" stroke="#99e9f2"/>`).join('')}</g>`],
  pearlbrooch: ['Pearl Brooch', 'acc', 45, 2, `<circle cx="80" cy="132" r="6" fill="#d4a017"/>${[0, 60, 120, 180, 240, 300].map((a) => `<circle cx="${(80 + Math.cos((a * Math.PI) / 180) * 6).toFixed(1)}" cy="${(132 + Math.sin((a * Math.PI) / 180) * 6).toFixed(1)}" r="2" fill="#fff" stroke="#d8c8e8" stroke-width=".5"/>`).join('')}<circle cx="80" cy="132" r="3" fill="#fff"/>`],
  friendcharm: ['Friendship Charm', 'acc', 30, 1, `<path d="M70,156 v8" stroke="#adb5bd" stroke-width="1"/><path d="M70,174 C62,168 64,162 70,166 C76,162 78,168 70,174Z" fill="#ff8fab" stroke="#e64980" stroke-width="1"/><path d="M70,166 V174" stroke="#fff" stroke-width=".8" stroke-dasharray="1 1"/>`],
  snowglobecharm: ['Little Snow Globe', 'acc', 50, 3, `<path d="M126,150 v10" stroke="#adb5bd" stroke-width="1"/><rect x="118" y="174" width="16" height="5" rx="1.5" fill="#6b4d34"/><circle cx="126" cy="168" r="8" fill="#d0ebff" opacity=".75" stroke="#a5d8ff"/><path d="M122,172 L126,164 L130,172Z" fill="#2b8a3e"/>${[[122, 164], [130, 166], [126, 162]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".8" fill="#fff"/>`).join('')}`],
  compassclip: ['Compass Clip', 'acc', 40, 2, `<circle cx="72" cy="176" r="7" fill="#f2c94c" stroke="#b08d3c" stroke-width="1.5"/><path d="M72,170 L74,176 L72,182 L70,176Z" fill="#e03131"/><path d="M72,169 v-6" stroke="#b08d3c" stroke-width="2"/>`],
  butterflyclip: ['Butterfly Companion Clip', 'acc', 45, 2, `<g class="ani-pulse"><path d="M136,60 Q124,46 122,56 Q122,66 136,62Z M136,60 Q148,46 150,56 Q150,66 136,62Z" fill="#74c0fc"/><path d="M136,62 Q128,68 128,74 Q134,72 136,64Z M136,62 Q144,68 144,74 Q138,72 136,64Z" fill="#a5d8ff"/></g><ellipse cx="136" cy="62" rx="1.5" ry="6" fill="#343a40"/>`],
  stuffedfish: ['Tiny Stuffed Fish', 'acc', 35, 1, `<path d="M118,166 Q130,154 144,166 Q130,178 118,166Z" fill="#ff922b"/><path d="M144,166 L154,158 L152,166 L154,174Z" fill="#fd7e14"/><circle cx="126" cy="164" r="1.6" fill="#2b1c14"/><path d="M130,160 q4,6 0,12" stroke="#fff3bf" stroke-width="1.5" fill="none"/>`],
  kelpribbon: ['Kelp Ribbon', 'acc', 25, 1, `<path d="M138,46 Q126,36 128,48 Q126,58 138,50 Q150,58 148,48 Q150,36 138,46Z" fill="#2b8a3e"/><path d="M134,52 q-6,10 -2,22 M142,52 q6,10 2,22" stroke="#5c940d" stroke-width="3" fill="none" stroke-linecap="round"/>`],
  walkingstick: ['Driftwood Walking Stick', 'acc', 40, 2, `<path d="M146,222 Q140,180 150,140 Q154,126 146,118" stroke="#a8865f" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M150,140 q8,-2 10,-8" stroke="#a8865f" stroke-width="3" fill="none" stroke-linecap="round"/>`],
  pearlbracelet: ['Pearl Bracelet', 'acc', 40, 2, Array.from({ length: 9 }, (_, k) => `<circle cx="${(70 + Math.cos((k / 9) * Math.PI * 2) * 10).toFixed(1)}" cy="${(160 + Math.sin((k / 9) * Math.PI * 2) * 4).toFixed(1)}" r="2.2" fill="#fff" stroke="#d8c8e8" stroke-width=".6"/>`).join('')],
};

// Shop-card crops for the extras (x y w h in the otter frame).
const EXTRA_VIEWS = {
  floatcharm: '104 146 28 30', fishingrod: '130 20 66 160', bouquet: '108 128 40 50', sleepingbag: '46 18 110 36', picnicbasket: '34 110 100 92',
  minianchor: '46 108 30 64', mapsatchel: '34 110 100 92', shellfan: '118 118 52 62', kite: '148 24 40 130', bubblewand: '126 84 52 90',
  pearlbrooch: '70 122 20 20', friendcharm: '60 152 20 26', snowglobecharm: '112 148 28 34', compassclip: '62 160 20 26', butterflyclip: '118 42 36 36',
  stuffedfish: '114 154 44 26', kelpribbon: '124 34 28 44', walkingstick: '134 112 30 114', pearlbracelet: '56 150 28 20',
};

// ---------- exports in each catalog's shape ----------
export const BATCH2_FURNITURE = {
  ...Object.fromEntries(Object.entries(PL).map(([id, [name, price, level, c1, c2, extra]]) => [id, { name, cat: 'plush', price, level, cozy: 2, vb: '0 0 60 60', w: 34, svg: (c1 !== 'none' ? plushBody(c1, c2) : '') + extra }])),
  ...Object.fromEntries(Object.entries(RUG).map(([id, [name, price, level, svg]]) => [id, { name, cat: 'rug', price, level, cozy: 2, vb: '0 0 110 50', w: 88, svg }])),
};
export const BATCH2_DOOR = {
  ...Object.fromEntries(Object.entries(MAT).map(([id, [name, price, svg]]) => [id, { kind: 'mat', name, price, icon: '🟫', svg }])),
  ...Object.fromEntries(Object.entries(LIGHT).map(([id, [name, price, svg]]) => [id, { kind: 'lights', name, price, icon: '💡', svg }])),
  ...Object.fromEntries(Object.entries(PLANT).map(([id, [name, price, svg]]) => [id, { kind: 'plant', name, price, icon: '🪴', svg }])),
};
export const BATCH2_ITEMS = {
  ...Object.fromEntries(Object.entries(EYES).map(([id, [name, price, level, svg]]) => [id, { name, icon: '👓', slot: 'eyes', price, level, svg }])),
  ...Object.fromEntries(Object.entries(EXTRA).map(([id, [name, slot, price, level, svg]]) => [id, { name, icon: '🎒', slot, price, level, svg, view: EXTRA_VIEWS[id] }])),
};
