// Illustrated world map (viewBox 0 0 400 460) with tappable places.
import { LOCATIONS, LOC, ROUTES } from './world.js';
import { artUrl, svgIcon } from './art.js';

const willow = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})">
  <rect x="-3" y="-4" width="6" height="22" rx="2" fill="#5a3f2a"/>
  <path d="M-22,6 Q-24,-24 0,-26 Q24,-24 22,6 Q16,-2 12,10 Q8,-4 4,12 Q0,-4 -4,12 Q-8,-4 -12,10 Q-16,-2 -22,6Z" fill="#6f9a3a"/>
  <path d="M-14,-6 q-2,10 0,18 M-6,-12 q-2,14 0,24 M6,-12 q2,14 0,24 M14,-6 q2,10 0,18" stroke="#a7c86a" stroke-width="2" fill="none" stroke-linecap="round"/>
</g>`;

const lily = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><ellipse rx="9" ry="4.5" fill="#6f9a3a"/><path d="M0,-1 l-4,-5 l4,2 l4,-2Z" fill="#fffaf0"/></g>`;

function scenery() {
  return `
  <!-- sea -->
  <rect width="400" height="460" fill="url(#map-sea)"/>
  <g fill="none" stroke="#9be8de" stroke-opacity=".18" stroke-width="2">
    <path d="M30,400 q10,-6 20,0 t20,0"/><path d="M240,440 q10,-6 20,0 t20,0"/><path d="M100,430 q10,-6 20,0 t20,0"/><path d="M360,360 q10,-6 20,0 t20,0"/>
  </g>
  <!-- land -->
  <path d="M0,0 H400 V196 Q376,226 340,214 Q300,206 276,236 Q250,268 236,262 Q214,250 196,262 Q170,284 132,282 Q100,262 72,276 Q40,300 18,300 Q6,300 0,310Z" fill="#e8d6a8"/>
  <path d="M0,0 H400 V184 Q372,212 340,202 Q300,194 270,224 Q248,250 234,246 Q214,236 194,248 Q168,268 132,268 Q100,248 70,262 Q40,284 14,284 Q4,284 0,292Z" fill="url(#map-land)"/>
  <!-- cliff for the lighthouse -->
  <path d="M286,150 Q300,126 336,124 Q370,126 384,148 L384,176 Q350,190 300,176Z" fill="#8a7a5a"/>
  <path d="M290,146 Q304,124 336,122 Q366,124 380,144" fill="none" stroke="#a89a78" stroke-width="3"/>
  <!-- the pond and its river to the sea -->
  <path d="M220,168 Q240,200 238,236 Q236,252 240,262" stroke="#3cc7c0" stroke-width="10" fill="none" stroke-linecap="round"/>
  <ellipse cx="196" cy="150" rx="58" ry="34" fill="#1f8f95"/><ellipse cx="196" cy="150" rx="50" ry="28" fill="#3cc7c0"/>
  ${lily(172, 140)}${lily(214, 160, 0.9)}${lily(204, 136, 0.7)}
  <!-- willow grove -->
  ${willow(48, 60, 1.1)}${willow(104, 54, 0.95)}${willow(70, 104, 1.2)}${willow(128, 96, 0.85)}${willow(24, 110, 0.9)}
  <!-- tide pool rocks -->
  <g fill="#8c8070"><ellipse cx="62" cy="298" rx="16" ry="8"/><ellipse cx="112" cy="300" rx="12" ry="7"/><ellipse cx="88" cy="312" rx="18" ry="7"/></g>
  <g fill="#3cc7c0"><ellipse cx="62" cy="296" rx="8" ry="3.5"/><ellipse cx="88" cy="310" rx="9" ry="3"/></g>
  <!-- lighthouse -->
  <g transform="translate(346 66)">
    <path d="M-9,64 L-6,6 L6,6 L9,64Z" fill="#fffaf0"/><path d="M-8,46 L8,46 L8.6,54 L-8.6,54Z M-7,24 L7,24 L7.6,32 L-7.6,32Z" fill="#d9635b"/>
    <rect x="-8" y="-4" width="16" height="11" rx="2" fill="#0c3440"/><path d="M-10,-4 L0,-14 L10,-4Z" fill="#d9635b"/>
    <path d="M8,1 L60,-14 L60,14Z" fill="#fff3bf" opacity=".35"/><circle cx="0" cy="2" r="4" fill="#fff3bf"/>
  </g>
  <!-- shipwreck -->
  <g transform="translate(312 318) rotate(-12)">
    <path d="M-30,0 Q0,16 30,0 L24,-10 L-26,-10Z" fill="#6b4d34"/><path d="M-20,-10 V-34 M6,-10 V-40" stroke="#5a3f2a" stroke-width="3"/>
    <path d="M6,-38 Q20,-30 6,-20Z" fill="#e8d6a8" opacity=".85"/><path d="M-30,0 Q0,16 30,0" stroke="#3cc7c0" stroke-width="3" fill="none" opacity=".6"/>
  </g>
  <!-- reef -->
  <g transform="translate(186 390)">
    <path d="M-34,6 q4,-20 10,-6 q4,-16 8,0 q6,-14 8,2" stroke="#ff9e7a" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M6,8 q2,-18 10,-8 q2,-14 10,2" stroke="#c9a6e8" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="30" cy="-4" r="5" fill="#ffd43b"/><circle cx="-10" cy="-12" r="3" fill="url(#map-pearl)"/>
  </g>
  <!-- moonlit trench -->
  <ellipse cx="326" cy="430" rx="64" ry="30" fill="#0a2430"/>
  <ellipse cx="326" cy="430" rx="40" ry="18" fill="#071a22"/>
  <ellipse cx="326" cy="428" rx="10" ry="4" fill="#fff3bf" opacity=".5"/>
  <!-- compass rose -->
  <g transform="translate(40 410)" opacity=".75"><circle r="18" fill="none" stroke="#d9b45a" stroke-width="1.5"/>
    <path d="M0,-22 L4,0 L0,22 L-4,0Z" fill="#d9b45a"/><path d="M-22,0 L0,4 L22,0 L0,-4Z" fill="#a8865f"/>
    <text y="-26" text-anchor="middle" font-size="10" fill="#f3d98c" font-family="Georgia, serif">N</text></g>`;
}

export function mapSVG(state, selected) {
  const routes = ROUTES.map(([a, b]) => {
    const A = LOC[a];
    const B = LOC[b];
    const mx = (A.x + B.x) / 2 + (A.y - B.y) * 0.12;
    const my = (A.y + B.y) / 2 + (B.x - A.x) * 0.12;
    return `<path d="M${A.x},${A.y} Q${mx},${my} ${B.x},${B.y}" stroke="#fff3bf" stroke-opacity=".55" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round" fill="none"/>`;
  }).join('');
  const pins = LOCATIONS.map((l) => {
    const locked = state.level < l.level;
    const sel = l.id === selected;
    const done = state.sets?.includes(l.id);
    const here = state.mission && l.missions.includes(state.mission.id);
    return `<g class="map-pin${locked ? ' locked' : ''}${sel ? ' sel' : ''}" data-loc="${l.id}" transform="translate(${l.x} ${l.y})" tabindex="0" role="button" aria-label="${l.name}${locked ? ` (level ${l.level})` : ''}">
      <circle r="30" fill="transparent"/>
      ${sel ? '<circle r="25" fill="none" stroke="#f3d98c" stroke-width="2" stroke-dasharray="4 4" class="pin-ring"/>' : ''}
      <circle r="19" fill="${locked ? '#5d6b6b' : '#fffaf0'}" stroke="#d9b45a" stroke-width="3"/>
      ${locked ? '<text y="7" text-anchor="middle" font-size="19">🔒</text>' : svgIcon(`places/${l.id}`, l.icon, 30, 'y="7" text-anchor="middle" font-size="19"')}
      ${done ? '<text x="15" y="-11" text-anchor="middle" font-size="12">🏅</text>' : ''}
      ${here ? '<circle cx="-15" cy="-14" r="7" fill="#d9635b" stroke="#fffaf0" stroke-width="2"/><text x="-15" y="-10.5" text-anchor="middle" font-size="9" fill="#fff">🦦</text>' : ''}
      <text y="35" text-anchor="middle" font-size="11.5" font-weight="800" fill="#fffaf0" stroke="#0c3440" stroke-width="3.5" paint-order="stroke" font-family="Nunito, system-ui, sans-serif">${l.name}${locked ? ` · Lv ${l.level}` : ''}</text>
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 400 460" class="map-svg" role="img" aria-label="World map">
    <defs>
      <radialGradient id="map-sea" cx="50%" cy="80%" r="80%"><stop offset="0" stop-color="#1f8f95"/><stop offset=".6" stop-color="#0f5560"/><stop offset="1" stop-color="#0a3a44"/></radialGradient>
      <linearGradient id="map-land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4d7a3a"/><stop offset="1" stop-color="#7fa65a"/></linearGradient>
      <radialGradient id="map-pearl" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d2f2ee"/></radialGradient>
    </defs>
    ${artUrl('map/world') ? `<image href="${artUrl('map/world')}" width="400" height="460" preserveAspectRatio="xMidYMid slice"/>` : scenery()}
    ${routes}
    ${pins}
    ${[['museum', '🏛️', 'Pond Museum', 128, 214], ['lane', '🏘️', 'Otter Lane', 276, 198]].map(([id, icon, name, x, y]) => `<g class="map-pin building" data-place="${id}" transform="translate(${x} ${y})" tabindex="0" role="button" aria-label="${name}">
      <circle r="28" fill="transparent"/><rect x="-18" y="-18" width="36" height="36" rx="10" fill="#fffaf0" stroke="#d9b45a" stroke-width="3"/>
      ${svgIcon(`places/${id}`, icon, 30, 'y="7" text-anchor="middle" font-size="19"')}
      <text y="34" text-anchor="middle" font-size="11.5" font-weight="800" fill="#fff3bf" stroke="#0c3440" stroke-width="3.5" paint-order="stroke" font-family="Nunito, system-ui, sans-serif">${name}</text></g>`).join('')}
  </svg>`;
}
