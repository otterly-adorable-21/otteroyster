// Drawings for companions, the garden and the front door. Uploaded art
// (assets/art/companions, garden, crops, door) replaces each piece.
import { COMPANIONS, COMP_COLORS } from './companions.js';
import { CROPS, PLOT_LEVELS, plotStage } from './garden.js';
import { DOOR_ITEMS, doorColor } from './door.js';
import { artUrl } from './art.js';

const img = (url, x, y, w, h) => `<image href="${url}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
const eye = (x, y, r = 3) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2b1c14"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.35}" fill="#fff"/>`;
const sleepyEye = (x, y) => `<path d="M${x - 4},${y} q4,3 8,0" stroke="#2b1c14" stroke-width="2" fill="none" stroke-linecap="round"/>`;

// Each companion is drawn in a 100 x 100 box, standing on y = 96.
const BODIES = {
  duckling: (e) => `<ellipse cx="50" cy="70" rx="30" ry="24" fill="#ffd43b"/><circle cx="56" cy="38" r="20" fill="#ffd43b"/>
    <path d="M74,40 l14,4 l-14,5Z" fill="#f08c00"/><path d="M26,66 q-10,-6 -4,-16 q8,6 10,14Z" fill="#fcc419"/>
    ${e(62, 34)}<path d="M40,94 l-4,4 h10 M60,94 l-4,4 h10" stroke="#f08c00" stroke-width="3" stroke-linecap="round"/>`,
  crab: (e) => `<path d="M22,62 q-12,-20 -2,-30 q2,10 10,12Z M78,62 q12,-20 2,-30 q-2,10 -10,12Z" fill="#e8590c"/>
    <ellipse cx="50" cy="72" rx="30" ry="20" fill="#fa5252"/><path d="M34,48 v16 M66,48 v16" stroke="#e03131" stroke-width="3"/>
    ${e(34, 46, 4)}${e(66, 46, 4)}<path d="M24,84 l-10,10 M30,88 l-6,10 M76,84 l10,10 M70,88 l6,10" stroke="#e03131" stroke-width="3" stroke-linecap="round"/>
    <path d="M44,78 q6,4 12,0" stroke="#c92a2a" stroke-width="2" fill="none"/>`,
  frog: (e) => `<ellipse cx="50" cy="72" rx="34" ry="22" fill="#74b816"/><ellipse cx="50" cy="78" rx="22" ry="14" fill="#d8f5a2"/>
    <circle cx="34" cy="46" r="12" fill="#74b816"/><circle cx="66" cy="46" r="12" fill="#74b816"/>${e(34, 45, 5)}${e(66, 45, 5)}
    <path d="M38,64 q12,8 24,0" stroke="#2b8a3e" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="22" cy="92" rx="10" ry="5" fill="#5c940d"/><ellipse cx="78" cy="92" rx="10" ry="5" fill="#5c940d"/>`,
  turtle: (e) => `<ellipse cx="46" cy="66" rx="32" ry="24" fill="#5c940d"/><path d="M30,56 l16,-10 l16,10 l-4,18 h-24Z" fill="#82c91e" stroke="#5c940d" stroke-width="2"/>
    <circle cx="84" cy="62" r="13" fill="#a9e34b"/>${e(88, 58)}<path d="M84,68 q4,2 7,0" stroke="#2b1c14" stroke-width="1.5" fill="none"/>
    <ellipse cx="26" cy="88" rx="9" ry="6" fill="#a9e34b"/><ellipse cx="66" cy="88" rx="9" ry="6" fill="#a9e34b"/>`,
  starfish: (e) => `<path d="M50,8 L60,40 L94,40 L66,60 L78,94 L50,74 L22,94 L34,60 L6,40 L40,40Z" fill="#ff922b" stroke="#e8590c" stroke-width="3" stroke-linejoin="round"/>
    ${e(43, 50)}${e(57, 50)}<path d="M44,60 q6,5 12,0" stroke="#2b1c14" stroke-width="2" fill="none" stroke-linecap="round"/>
    <g fill="#ffd8a8"><circle cx="50" cy="24" r="2"/><circle cx="76" cy="46" r="2"/><circle cx="26" cy="46" r="2"/><circle cx="66" cy="80" r="2"/><circle cx="34" cy="80" r="2"/></g>`,
  seahorse: (e) => `<path d="M46,96 q-16,-6 -8,-22 q8,-14 0,-28 q-6,-10 4,-22 q10,-10 22,-4 q-4,6 -2,10 q10,4 6,14 q-6,12 -4,26 q2,16 -8,24 q-6,4 -10,2Z" fill="#cc5de8"/>
    <path d="M68,22 l14,-2 l-2,8Z" fill="#cc5de8"/><path d="M40,40 q-10,4 -8,14" stroke="#e599f7" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${e(60, 26)}<path d="M44,92 q-10,0 -8,-8" stroke="#ae3ec9" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  firefly: (e) => `<circle cx="50" cy="70" r="24" fill="#e6ff9c" opacity=".45"/><ellipse cx="50" cy="70" rx="12" ry="14" fill="#fff3bf"/>
    <ellipse cx="50" cy="46" rx="14" ry="13" fill="#5c4033"/>${e(45, 44, 2.6)}${e(56, 44, 2.6)}
    <ellipse cx="32" cy="52" rx="14" ry="8" fill="#d0ebff" opacity=".8" transform="rotate(-25 32 52)"/><ellipse cx="68" cy="52" rx="14" ry="8" fill="#d0ebff" opacity=".8" transform="rotate(25 68 52)"/>
    <path d="M44,34 q-4,-10 -10,-12 M56,34 q4,-10 10,-12" stroke="#5c4033" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  octopus: (e) => `<path d="M22,58 q0,-40 28,-40 q28,0 28,40 q0,8 -6,10 Z" fill="#f783ac"/>
    ${[20, 32, 44, 56, 68, 80].map((x, k) => `<path d="M${x},64 q${k % 2 ? 6 : -6},16 0,28" stroke="#f783ac" stroke-width="9" fill="none" stroke-linecap="round"/>`).join('')}
    ${e(40, 46, 4.5)}${e(60, 46, 4.5)}<path d="M44,58 q6,5 12,0" stroke="#2b1c14" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="32" cy="56" r="4" fill="#faa2c1"/><circle cx="68" cy="56" r="4" fill="#faa2c1"/>`,
  jellyfish: (e) => `<path d="M20,52 Q20,14 50,14 Q80,14 80,52 Q72,46 65,52 Q57,46 50,52 Q43,46 35,52 Q27,46 20,52Z" fill="#f3a6d8" opacity=".9"/>
    ${[26, 38, 50, 62, 74].map((x, k) => `<path d="M${x},52 q${k % 2 ? 6 : -6},14 0,28 q${k % 2 ? -4 : 4},8 0,14" stroke="#e599f7" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('')}
    ${e(42, 34)}${e(58, 34)}<path d="M45,42 q5,4 10,0" stroke="#2b1c14" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="36" cy="22" rx="8" ry="4" fill="#fff" opacity=".5"/>`,
  seal: (e) => `<ellipse cx="50" cy="70" rx="38" ry="24" fill="#dee2e6"/><circle cx="50" cy="44" r="24" fill="#e9ecef"/>${e(41, 40, 4.5)}${e(59, 40, 4.5)}
    <ellipse cx="50" cy="51" rx="5" ry="3.5" fill="#2b1c14"/><path d="M38,52 l-10,-2 M38,55 l-10,2 M62,52 l10,-2 M62,55 l10,2" stroke="#868e96" stroke-width="1.2"/>
    <ellipse cx="22" cy="84" rx="12" ry="6" fill="#ced4da" transform="rotate(-20 22 84)"/><ellipse cx="78" cy="84" rx="12" ry="6" fill="#ced4da" transform="rotate(20 78 84)"/>`,
  puffin: (e) => `<ellipse cx="50" cy="66" rx="26" ry="30" fill="#212529"/><ellipse cx="50" cy="72" rx="17" ry="22" fill="#fff"/><circle cx="50" cy="34" r="20" fill="#212529"/>
    <ellipse cx="50" cy="38" rx="14" ry="12" fill="#fff"/>${e(44, 34, 3)}<path d="M50,40 l14,2 l-14,8Z" fill="#fd7e14"/><path d="M50,42 l10,1" stroke="#ffd43b" stroke-width="2"/>
    <path d="M40,94 l-6,4 h10 M60,94 l-6,4 h10" stroke="#fd7e14" stroke-width="3" stroke-linecap="round"/>`,
  axolotl: (e) => `<ellipse cx="54" cy="72" rx="34" ry="16" fill="#ffc9de"/><path d="M84,70 q14,-6 14,6 q-6,6 -14,2Z" fill="#ffc9de"/><ellipse cx="34" cy="54" rx="24" ry="20" fill="#ffdeeb"/>
    ${[-1, 1].map((d) => [0, 1, 2].map((k) => `<path d="M${34 + d * 20},${44 + k * 8} l${d * 12},${-4 + k * 2}" stroke="#f06595" stroke-width="4" stroke-linecap="round"/>`).join('')).join('')}
    ${e(26, 52, 3.5)}${e(42, 52, 3.5)}<path d="M28,62 q6,5 12,0" stroke="#c2255c" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="34" cy="88" rx="6" ry="4" fill="#faa2c1"/><ellipse cx="70" cy="88" rx="6" ry="4" fill="#faa2c1"/>`,
  minnow: (e) => `<path d="M14,60 Q40,30 70,58 Q40,86 14,60Z" fill="#adb5bd"/><path d="M68,58 L92,40 L88,58 L92,76Z" fill="#868e96"/><path d="M30,60 Q44,54 58,60" stroke="#e9ecef" stroke-width="3" fill="none"/>
    ${e(28, 54, 4)}<path d="M18,64 q4,3 8,0" stroke="#495057" stroke-width="1.5" fill="none"/>`,
  snail: (e) => `<path d="M10,90 Q10,78 30,76 L80,76 Q90,76 90,86 Q90,92 80,92 L18,92Z" fill="#ffd8a8"/><circle cx="58" cy="56" r="26" fill="#c9a66b" stroke="#8a6644" stroke-width="3"/>
    <path d="M58,56 m-16,0 a16,16 0 1,1 16,16 a10,10 0 1,1 -8,-14" stroke="#8a6644" stroke-width="3" fill="none"/><path d="M22,76 L16,50 M30,76 L30,52" stroke="#ffd8a8" stroke-width="4" stroke-linecap="round"/>
    ${e(16, 48, 3.5)}${e(30, 50, 3.5)}<path d="M18,84 q5,4 10,0" stroke="#8a6644" stroke-width="2" fill="none"/>`,
  butterfly: (e) => `<path d="M50,50 Q20,6 10,30 Q4,52 50,56Z M50,50 Q80,6 90,30 Q96,52 50,56Z" fill="#74c0fc"/><path d="M50,58 Q24,64 22,82 Q36,92 50,62Z M50,58 Q76,64 78,82 Q64,92 50,62Z" fill="#a5d8ff"/>
    <circle cx="28" cy="32" r="6" fill="#fff" opacity=".7"/><circle cx="72" cy="32" r="6" fill="#fff" opacity=".7"/><ellipse cx="50" cy="58" rx="5" ry="20" fill="#343a40"/>
    <path d="M48,40 q-6,-12 -12,-14 M52,40 q6,-12 12,-14" stroke="#343a40" stroke-width="2" fill="none"/>${e(46, 46, 2)}${e(54, 46, 2)}`,
  moth: (e) => `<path d="M50,50 Q14,10 8,40 Q6,62 50,58Z M50,50 Q86,10 92,40 Q94,62 50,58Z" fill="#e9e3d5"/><circle cx="28" cy="40" r="8" fill="#c5f6fa" opacity=".8"/><circle cx="72" cy="40" r="8" fill="#c5f6fa" opacity=".8"/>
    <ellipse cx="50" cy="60" rx="9" ry="20" fill="#f8f9fa"/><path d="M46,42 q-10,-14 -20,-14 M54,42 q10,-14 20,-14" stroke="#adb5bd" stroke-width="2.5" fill="none" stroke-linecap="round"/>${e(46, 50, 2.6)}${e(54, 50, 2.6)}`,
  ghostcrab: (e) => `<path d="M22,62 q-12,-20 -2,-30 q2,10 10,12Z M78,62 q12,-20 2,-30 q-2,10 -10,12Z" fill="#e9dcc4"/>
    <ellipse cx="50" cy="72" rx="28" ry="18" fill="#f3ead8"/><path d="M36,46 v18 M64,46 v18" stroke="#d8c39c" stroke-width="3"/>
    ${e(36, 44, 4.5)}${e(64, 44, 4.5)}<path d="M24,84 l-10,10 M30,88 l-6,10 M76,84 l10,10 M70,88 l6,10" stroke="#d8c39c" stroke-width="3" stroke-linecap="round"/>
    <path d="M44,78 q6,4 12,0" stroke="#a8865f" stroke-width="2" fill="none"/>`,
};

// Where a little accessory sits on each companion (x, y of the top of the head).
const HEAD = {
  duckling: [56, 18], crab: [50, 50], frog: [50, 32], turtle: [84, 48], starfish: [50, 14], seahorse: [62, 14], firefly: [50, 33], octopus: [50, 20],
  jellyfish: [50, 14], seal: [50, 20], puffin: [50, 14], axolotl: [34, 34], minnow: [32, 40], snail: [24, 40], butterfly: [50, 34], moth: [50, 38], ghostcrab: [50, 52],
};
const ACC_DRAW = {
  bow: (x, y) => `<path d="M${x},${y} l-10,-6 v12Z M${x},${y} l10,-6 v12Z" fill="#f06595"/><circle cx="${x}" cy="${y}" r="3" fill="#c2255c"/>`,
  tophat: (x, y) => `<rect x="${x - 8}" y="${y - 20}" width="16" height="16" rx="2" fill="#212529"/><rect x="${x - 8}" y="${y - 8}" width="16" height="3" fill="#c92a2a"/><ellipse cx="${x}" cy="${y - 4}" rx="13" ry="3" fill="#343a40"/>`,
  flowers: (x, y) => [-12, -4, 4, 12].map((d, k) => `<circle cx="${x + d}" cy="${y - 2 - Math.abs(d) * -0.1}" r="4" fill="${['#ff8fab', '#ffd43b', '#b197fc', '#ff8fab'][k]}"/>`).join(''),
  bandana: (x, y) => `<path d="M${x - 16},${y + 4} Q${x},${y - 10} ${x + 16},${y + 4} L${x + 18},${y + 8} L${x + 24},${y + 4} L${x + 20},${y + 12}Z" fill="#e03131"/><circle cx="${x - 4}" cy="${y}" r="1.5" fill="#fff"/><circle cx="${x + 6}" cy="${y + 1}" r="1.5" fill="#fff"/>`,
  specs: (x, y) => `<circle cx="${x - 8}" cy="${y + 14}" r="6" fill="none" stroke="#343a40" stroke-width="2"/><circle cx="${x + 8}" cy="${y + 14}" r="6" fill="none" stroke="#343a40" stroke-width="2"/><path d="M${x - 2},${y + 14} H${x + 2}" stroke="#343a40" stroke-width="2"/>`,
  crown: (x, y) => `<path d="M${x - 12},${y} L${x - 12},${y - 12} L${x - 6},${y - 6} L${x},${y - 16} L${x + 6},${y - 6} L${x + 12},${y - 12} L${x + 12},${y}Z" fill="#ffd43b" stroke="#e67700" stroke-width="1.5"/>`,
};
const PATTERN_DRAW = {
  spots: () => [[38, 66], [56, 74], [64, 60], [46, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#fff" opacity=".55"/>`).join(''),
  stripes: () => [58, 68, 78].map((y) => `<path d="M28,${y} Q50,${y - 6} 72,${y}" stroke="#fff" stroke-width="3" opacity=".5" fill="none"/>`).join(''),
  sparkles: () => [[32, 58], [66, 66], [50, 80], [60, 50]].map(([x, y]) => `<path d="M${x},${y - 5} L${x + 1.5},${y - 1.5} L${x + 5},${y} L${x + 1.5},${y + 1.5} L${x},${y + 5} L${x - 1.5},${y + 1.5} L${x - 5},${y} L${x - 1.5},${y - 1.5}Z" fill="#fff3bf"/>`).join(''),
  hearts: () => [[38, 64], [62, 72], [50, 82]].map(([x, y]) => `<path d="M${x},${y + 4} C${x - 7},${y - 1} ${x - 4},${y - 6} ${x},${y - 2} C${x + 4},${y - 6} ${x + 7},${y - 1} ${x},${y + 4}Z" fill="#ff8fab" opacity=".85"/>`).join(''),
};

// look: { color, pattern, acc } from the companion's save.
export function companionSVG(id, { sleeping = false, look = {} } = {}) {
  if (!COMPANIONS[id]) return '';
  const url = (sleeping && artUrl(`companions/${id}-sleeping`)) || (look.color && look.color !== 'natural' && artUrl(`companions/${id}-${look.color}`)) || artUrl(`companions/${id}`);
  const hue = COMP_COLORS[look.color]?.hue || 0;
  const filt = hue && !(url && artUrl(`companions/${id}-${look.color}`)) ? `cmp-hue-${hue}` : '';
  const body = url ? img(url, 0, 0, 100, 100) : (BODIES[id] || (() => ''))(sleeping ? (x, y) => sleepyEye(x, y) : eye);
  const [hx, hy] = HEAD[id] || [50, 20];
  const pat = look.pattern && PATTERN_DRAW[look.pattern] ? PATTERN_DRAW[look.pattern]() : '';
  const acc = look.acc && ACC_DRAW[look.acc] ? (artUrl(`companion-acc/${look.acc}`) ? img(artUrl(`companion-acc/${look.acc}`), hx - 16, hy - 24, 32, 32) : ACC_DRAW[look.acc](hx, hy)) : '';
  const tint = COMP_COLORS[look.color]?.tint;
  return `${filt ? `<defs><filter id="${filt}"><feColorMatrix type="hueRotate" values="${hue}" result="h"/><feFlood flood-color="${tint}" flood-opacity=".38"/><feComposite in2="SourceAlpha" operator="in" result="t"/><feMerge><feMergeNode in="h"/><feMergeNode in="t"/></feMerge></filter></defs>` : ''}<g${filt ? ` filter="url(#${filt})"` : ''}>${body}${pat}</g>${acc}`;
}

// ---------- garden ----------
const SPROUT = '<path d="M50,92 v-18" stroke="#5c940d" stroke-width="4" stroke-linecap="round"/><path d="M50,78 q-14,-4 -16,-16 q12,0 16,14Z M50,76 q12,-6 18,-14 q-14,-2 -18,12Z" fill="#82c91e"/>';
const GROWING = '<path d="M50,92 v-34" stroke="#5c940d" stroke-width="4" stroke-linecap="round"/><path d="M50,74 q-18,-2 -22,-18 q16,-2 22,16Z M50,66 q16,-6 22,-20 q-16,-2 -22,18Z M50,60 q-10,-8 -8,-20 q10,6 8,20Z" fill="#82c91e"/>';
const SEED = '<ellipse cx="50" cy="88" rx="16" ry="6" fill="#5e432d"/><ellipse cx="44" cy="86" rx="2.5" ry="2" fill="#e8d6a8"/><ellipse cx="54" cy="85" rx="2.5" ry="2" fill="#e8d6a8"/>';

function cropSVG(cropId, stage) {
  const url = artUrl(`crops/${cropId}-${stage}`);
  if (url) return img(url, 10, 0, 80, 100);
  const c = CROPS[cropId];
  if (stage === 0) return SEED;
  if (stage === 1) return SPROUT;
  if (stage === 2) return GROWING;
  const art = artUrl(`crops/${cropId}`);
  return `${GROWING}${art ? img(art, 24, 14, 52, 52) : `<text x="50" y="56" text-anchor="middle" font-size="38">${c.icon}</text>`}`;
}

// The garden: 400 x 300. Plots are 3 x 2; tapping one is up to the page.
export const PLOT_POS = [[82, 150], [200, 150], [318, 150], [82, 252], [200, 252], [318, 252]];

export function gardenSVG(state, { now = Date.now(), extraAttrs = '', raining = false } = {}) {
  const bg = artUrl('garden/background');
  const unlocked = PLOT_LEVELS.filter((l) => state.level >= l).length;
  const plots = PLOT_POS.map(([x, y], k) => {
    const p = state.garden?.plots[k];
    const stage = plotStage(p, now);
    const wet = p?.wateredAt && stage < 3;
    const plotArt = artUrl(wet ? 'garden/plot-wet' : 'garden/plot') || artUrl('garden/plot');
    const locked = k >= unlocked;
    return `<g class="plot ${locked ? 'locked' : ''} ${stage === 3 ? 'ready' : ''}" data-plot="${k}" transform="translate(${x - 50} ${y - 92})" tabindex="0" role="button" aria-label="Garden plot ${k + 1}">
      <rect x="0" y="0" width="100" height="100" fill="transparent"/>
      ${plotArt ? img(plotArt, 0, 70, 100, 30) : `<ellipse cx="50" cy="90" rx="46" ry="13" fill="${wet ? '#4a3323' : '#7a5a3c'}"/><ellipse cx="50" cy="88" rx="40" ry="9" fill="${wet ? '#3b2a1e' : '#6b4d34'}"/>`}
      ${locked ? `<text x="50" y="80" text-anchor="middle" font-size="22">🔒</text><text x="50" y="99" text-anchor="middle" font-size="10" font-weight="800" fill="#fffaf0" stroke="#3b2a1e" stroke-width="3" paint-order="stroke" font-family="Nunito, sans-serif">Lv ${PLOT_LEVELS[k]}</text>`
    : p ? `${cropSVG(p.crop, stage)}${stage === 0 ? '<text x="78" y="62" font-size="18">💧</text>' : ''}${stage === 3 ? '<text x="80" y="30" font-size="16">✨</text>' : ''}`
      : '<text x="50" y="84" text-anchor="middle" font-size="20" opacity=".55">＋</text>'}
    </g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" ${extraAttrs}>
    ${bg ? img(bg, 0, 0, 400, 300) : `<rect width="400" height="300" fill="#7fa65a"/><rect width="400" height="70" fill="#9be8de"/>
      <path d="M0,70 Q100,52 200,66 Q300,80 400,60 V300 H0Z" fill="#6f9a3a"/>
      <g stroke="#a8865f" stroke-width="5" stroke-linecap="round"><path d="M10,92 H390"/><path d="M10,110 H390"/></g>
      <g fill="#c9a66b">${Array.from({ length: 14 }, (_, k) => `<rect x="${10 + k * 29}" y="78" width="9" height="42" rx="3"/>`).join('')}</g>
      <path d="M330,70 Q330,22 366,22 Q400,22 400,70Z" fill="#4f6b4a"/><path d="M352,70 V50 Q352,40 366,40 Q380,40 380,50 V70Z" fill="#2a1d14"/>
      <circle cx="40" cy="30" r="14" fill="#fff3bf" opacity=".8"/>`}
    ${raining ? '<g stroke="#d0ebff" stroke-width="1.5" opacity=".6">' + Array.from({ length: 30 }, (_, k) => `<path d="M${(k * 37) % 400},${(k * 53) % 300} l-4,10"/>`).join('') + '</g>' : ''}
    ${plots}
  </svg>`;
}

// ---------- front of the house (120 x 130), shared by Otter Lane and the Den tab ----------
const DOOR_PATH = 'M38,118 V82 Q38,62 60,62 Q82,62 82,82 V118Z';

function decoration(id) {
  const it = DOOR_ITEMS[id];
  if (!it) return '';
  const url = artUrl(`door/${id}`);
  if (url) return img(url, 0, 0, 120, 130);
  const [a, b] = it.colors || ['#fff', '#ccc'];
  switch (it.kind) {
    case 'wreath': return `<circle cx="60" cy="84" r="10" fill="none" stroke="${a}" stroke-width="5"/><g fill="${b}">${[0, 60, 120, 180, 240, 300].map((d) => `<circle cx="${60 + 10 * Math.cos((d * Math.PI) / 180)}" cy="${84 + 10 * Math.sin((d * Math.PI) / 180)}" r="2.2"/>`).join('')}</g><path d="M57,94 l3,5 l3,-5" fill="${b}"/>`;
    case 'mat': return `<rect x="36" y="117" width="48" height="8" rx="2" fill="${a}"/><path d="M40,121 H80" stroke="${b}" stroke-width="2" stroke-dasharray="4 3"/>`;
    case 'lights':
      if (id === 'lights-fairy') return `<path d="M30,70 Q60,52 90,70" stroke="#5a3f2a" stroke-width="1" fill="none"/>${[34, 42, 50, 60, 70, 78, 86].map((x, k) => `<circle cx="${x}" cy="${70 - Math.sin(((x - 30) / 60) * Math.PI) * 12}" r="2" fill="${k % 2 ? a : b}"/>`).join('')}`;
      return `<path d="M92,58 v6" stroke="#5a3f2a" stroke-width="1.5"/><rect x="87" y="64" width="10" height="13" rx="3" fill="${b}"/><rect x="89" y="66" width="6" height="9" rx="2" fill="${a}"/><circle cx="92" cy="70" r="9" fill="${a}" opacity=".25"/>`;
    case 'plant': return `<path d="M14,118 l3,-12 h14 l3,12Z" fill="${b}"/>${id === 'plant-sunflower' ? `<path d="M24,106 v-16" stroke="#5c940d" stroke-width="2"/><circle cx="24" cy="86" r="7" fill="${a}"/><circle cx="24" cy="86" r="3" fill="#6b4d34"/>`
      : id === 'plant-mushroom' ? `<path d="M20,106 v-8 M28,106 v-6" stroke="#fffaf0" stroke-width="3"/><path d="M14,99 q6,-10 12,0Z M23,101 q5,-8 10,0Z" fill="${a}"/>`
        : id === 'plant-cattail' ? `<path d="M20,106 v-24 M26,106 v-28 M30,106 v-20" stroke="${b === '#a8865f' ? '#5c940d' : b}" stroke-width="1.8"/><rect x="18" y="80" width="4" height="9" rx="2" fill="${a}"/><rect x="24" y="76" width="4" height="9" rx="2" fill="${a}"/>`
          : `<path d="M24,106 q-10,-8 -8,-18 M24,106 q0,-14 2,-20 M24,106 q10,-8 10,-16" stroke="${a}" stroke-width="4" fill="none" stroke-linecap="round"/>`}`;
    default: return '';
  }
}

export function houseFrontSVG(door, { extra = '', cozyStar = false, balloon = false } = {}) {
  const base = artUrl('lane/house');
  const paintArt = artUrl(`door/${door?.paint || 'paint-moss'}`);
  const color = doorColor(door);
  const kinds = ['mat', 'plant', 'wreath', 'lights'];
  return `${base ? img(base, 0, 0, 120, 130) : `<ellipse cx="60" cy="118" rx="58" ry="12" fill="#3f6a2a" opacity=".5"/>
      <path d="M6,118 Q6,30 60,26 Q114,30 114,118Z" fill="#6f9a3a"/><path d="M14,118 Q14,40 60,36 Q106,40 106,118Z" fill="#8a6644"/>
      ${[[24, 40], [60, 28], [96, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#a7c86a"/>`).join('')}`}
    ${paintArt ? img(paintArt, 0, 0, 120, 130) : `<path d="${DOOR_PATH}" fill="${color}" stroke="#5a3f2a" stroke-width="4"/><circle cx="74" cy="94" r="3" fill="#d9b45a"/>`}
    ${kinds.map((k) => decoration(door?.[k])).join('')}
    ${cozyStar ? '<text x="98" y="58" font-size="14">✨</text>' : ''}${balloon ? '<text x="8" y="60" font-size="14">🎈</text>' : ''}${extra}`;
}
