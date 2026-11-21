// Drawings for companions, the garden and the front door. Uploaded art
// (assets/art/companions, garden, crops, door) replaces each piece.
import { COMPANIONS } from './companions.js';
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
};

export function companionSVG(id, { sleeping = false } = {}) {
  if (!COMPANIONS[id]) return '';
  const url = (sleeping && artUrl(`companions/${id}-sleeping`)) || artUrl(`companions/${id}`);
  if (url) return img(url, 0, 0, 100, 100);
  return (BODIES[id] || (() => ''))(sleeping ? (x, y) => sleepyEye(x, y) : eye);
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
