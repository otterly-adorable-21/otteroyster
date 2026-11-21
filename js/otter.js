// Draws the otter as SVG markup, layering on equipped clothes and mood.
// Styled after the Otter & Oyster brand art: soft brown fur, cream face mask,
// sleepy closed-eye smile, big glossy nose, holding an open oyster with a pearl.
import { ITEMS } from './data.js';
import { mood } from './core.js';

export { mood };

const C = {
  fur: '#7a5641',
  furLight: '#9a735a',
  furDark: '#4c3324',
  earIn: '#3a271c',
  cream: '#f5ead6',
  creamShade: '#e6d4b8',
  belly: '#eadbc0',
  nose: '#2e1f18',
  eye: '#2b1c14',
};

const DEFS = `<defs>
  <radialGradient id="oo-fur" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="${C.furLight}"/><stop offset=".65" stop-color="${C.fur}"/><stop offset="1" stop-color="${C.furDark}"/></radialGradient>
  <radialGradient id="oo-cream" cx="50%" cy="30%" r="75%"><stop offset="0" stop-color="#fffaf0"/><stop offset=".7" stop-color="${C.cream}"/><stop offset="1" stop-color="${C.creamShade}"/></radialGradient>
  <radialGradient id="oo-pearl" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#f4ecff"/><stop offset=".6" stop-color="#d4f4ef"/><stop offset=".85" stop-color="#ead6f7"/><stop offset="1" stop-color="#c6b8d6"/></radialGradient>
  <linearGradient id="oo-shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f2ff"/><stop offset=".5" stop-color="#dcd2e6"/><stop offset="1" stop-color="#a99cb8"/></linearGradient>
  <radialGradient id="oo-nacre" cx="50%" cy="80%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e9f6f4"/><stop offset="1" stop-color="#d9cbe8"/></radialGradient>
</defs>`;

const layer = (id) => (id && ITEMS[id] ? ITEMS[id].svg : '');

function eyes(m, asleep) {
  const closed = (lift) => `<path d="M74,${77 + lift} Q83,${69 + lift} 92,${77 + lift} M108,${77 + lift} Q117,${69 + lift} 126,${77 + lift}" stroke="${C.eye}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <path d="M74,${77 + lift} l-3,-2 M126,${77 + lift} l3,-2" stroke="${C.eye}" stroke-width="2" stroke-linecap="round"/>`;
  if (asleep) {
    return `<path d="M74,74 Q83,81 92,74 M108,74 Q117,81 126,74" stroke="${C.eye}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  }
  if (m === 'happy') return closed(0);
  const open = `<ellipse cx="83" cy="75" rx="6.5" ry="7.5" fill="${C.eye}"/><ellipse cx="117" cy="75" rx="6.5" ry="7.5" fill="${C.eye}"/>
    <circle cx="85.5" cy="72" r="2.4" fill="#fff"/><circle cx="119.5" cy="72" r="2.4" fill="#fff"/>
    <circle cx="81" cy="78" r="1.1" fill="#fff" opacity=".8"/><circle cx="115" cy="78" r="1.1" fill="#fff" opacity=".8"/>`;
  if (m === 'sad') {
    return `${open}<path d="M73,63 Q80,62 90,66 M127,63 Q120,62 110,66" stroke="${C.furDark}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
  return open;
}

function mouth(m, asleep) {
  const st = `stroke="${C.nose}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  if (asleep) return `<path d="M100,97 L100,100 M95,102 Q100,105 105,102" ${st}/>`;
  if (m === 'happy') return `<path d="M100,97 L100,101 M86,99 Q93,109 100,101 Q107,109 114,99" ${st}/>`;
  if (m === 'sad') return `<path d="M100,97 L100,101 M91,107 Q100,100 109,107" ${st}/>`;
  return `<path d="M100,97 L100,101 M91,102 Q100,107 109,102" ${st}/>`;
}

function dirt(clean) {
  if (clean >= 40) return '';
  let s = `<g fill="#5b4a2e" opacity=".5">
    <ellipse cx="70" cy="148" rx="8" ry="5"/><ellipse cx="130" cy="188" rx="7" ry="4.5"/>
    <ellipse cx="124" cy="56" rx="5" ry="3.5"/></g>`;
  if (clean < 20) {
    s += `<g fill="#5b4a2e" opacity=".5"><ellipse cx="86" cy="198" rx="6" ry="4"/>
      <ellipse cx="136" cy="152" rx="6" ry="4"/><ellipse cx="70" cy="106" rx="5" ry="3"/></g>`;
  }
  return s;
}

const sparkle = (x, y, r, fill = '#fff6d0') => `<path d="M${x},${y - r} C${x + r * 0.15},${y - r * 0.15} ${x + r * 0.15},${y - r * 0.15} ${x + r},${y} C${x + r * 0.15},${y + r * 0.15} ${x + r * 0.15},${y + r * 0.15} ${x},${y + r} C${x - r * 0.15},${y + r * 0.15} ${x - r * 0.15},${y + r * 0.15} ${x - r},${y} C${x - r * 0.15},${y - r * 0.15} ${x - r * 0.15},${y - r * 0.15} ${x},${y - r}Z" fill="${fill}"/>`;

// The open oyster with its pearl, held against the belly.
function oyster() {
  return `<g class="o-oyster">
    <path d="M72,150 Q74,126 100,122 Q126,126 128,150 Q114,144 100,145 Q86,144 72,150Z" fill="url(#oo-shell)" stroke="#b8a37a" stroke-width="1.6"/>
    <path d="M80,146 Q84,132 100,128 Q116,132 120,146" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" fill="none"/>
    <path d="M88,145 Q92,134 100,131 Q108,134 112,145" stroke="#c9b8dc" stroke-width="1" fill="none"/>
    <path d="M70,150 Q100,170 130,150 Q127,164 100,168 Q73,164 70,150Z" fill="url(#oo-shell)" stroke="#b8a37a" stroke-width="1.6"/>
    <ellipse cx="100" cy="152" rx="25" ry="7" fill="url(#oo-nacre)"/>
    <circle cx="100" cy="146" r="9.5" fill="url(#oo-pearl)"/>
    <circle cx="96.5" cy="142.5" r="2.6" fill="#fff" opacity=".9"/>
    ${sparkle(108, 138, 5)}
  </g>`;
}

export function otterSVG(state, { idPrefix = 'oo' } = {}) {
  const m = mood(state);
  const asleep = state.sleeping;
  const eq = state.equipped;
  const blush = !asleep && m !== 'sad' ? '<ellipse cx="70" cy="91" rx="7" ry="4" fill="#f2a5a0" opacity=".45"/><ellipse cx="130" cy="91" rx="7" ry="4" fill="#f2a5a0" opacity=".45"/>' : '';
  return `${DEFS}
  <g class="o-back">${layer(eq.back)}</g>
  <path d="M136,196 Q192,212 186,168 Q180,150 170,160 Q176,186 134,180Z" fill="${C.furDark}"/>
  <ellipse cx="74" cy="214" rx="19" ry="10" fill="${C.furDark}"/>
  <ellipse cx="126" cy="214" rx="19" ry="10" fill="${C.furDark}"/>
  <ellipse cx="100" cy="160" rx="56" ry="58" fill="url(#oo-fur)"/>
  <ellipse cx="100" cy="168" rx="38" ry="44" fill="url(#oo-cream)" opacity=".92"/>
  <path d="M82,190 q6,4 12,0 M106,196 q6,4 12,0 M90,206 q5,3 10,0" stroke="${C.creamShade}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  ${oyster()}
  <ellipse cx="76" cy="152" rx="11" ry="9" fill="${C.furDark}"/>
  <ellipse cx="124" cy="152" rx="11" ry="9" fill="${C.furDark}"/>
  <path d="M70,148 q3,-3 6,0 M76,147 q3,-3 6,0 M118,147 q3,-3 6,0 M124,148 q3,-3 6,0" stroke="#2b1c14" stroke-width="1.2" fill="none" opacity=".6"/>
  <circle cx="63" cy="52" r="12" fill="${C.furDark}"/><circle cx="64" cy="53" r="5.5" fill="${C.earIn}"/>
  <circle cx="137" cy="52" r="12" fill="${C.furDark}"/><circle cx="136" cy="53" r="5.5" fill="${C.earIn}"/>
  <circle cx="100" cy="82" r="44" fill="url(#oo-fur)"/>
  <path d="M58,84 Q60,64 78,66 Q90,68 100,74 Q110,68 122,66 Q140,64 142,84 Q144,112 100,122 Q56,112 58,84Z" fill="url(#oo-cream)"/>
  <path d="M84,44 q4,-6 8,-2 M100,40 q3,-6 7,-1 M112,44 q4,-5 7,0" stroke="${C.furLight}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>
  ${blush}
  ${eyes(m, asleep)}
  <path d="M87,86 Q100,79 113,86 Q114,95 100,98 Q86,95 87,86Z" fill="${C.nose}"/>
  <ellipse cx="95" cy="85.5" rx="4" ry="2" fill="#fff" opacity=".35"/>
  ${mouth(m, asleep)}
  <g stroke="#fffaf0" stroke-width="1.1" stroke-linecap="round" opacity=".9" fill="none">
    <path d="M80,98 Q62,92 44,90"/><path d="M80,102 Q60,102 42,106"/><path d="M82,105 Q64,110 50,118"/>
    <path d="M120,98 Q138,92 156,90"/><path d="M120,102 Q140,102 158,106"/><path d="M118,105 Q136,110 150,118"/>
  </g>
  ${dirt(state.stats.clean)}
  <g class="o-neck">${layer(eq.neck)}</g>
  <g class="o-eyes">${asleep ? '' : layer(eq.eyes)}</g>
  <g class="o-hat">${layer(eq.hat)}</g>`.replace(/oo-/g, `${idPrefix}-`);
}

// A small standalone preview of a single item (for shop/wardrobe cards).
export function itemPreviewSVG(id) {
  const it = ITEMS[id];
  const boxes = { hat: '40 -24 120 80', eyes: '50 50 100 50', neck: '50 96 100 80', back: '20 -10 170 240' };
  return `<svg viewBox="${it.view || boxes[it.slot]}" aria-hidden="true">${it.svg}</svg>`;
}
