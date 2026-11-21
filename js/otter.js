// Draws the otter as SVG markup, layering on equipped clothes and mood.
import { ITEMS } from './data.js';

const C = {
  fur: '#8a5a3b',
  furDark: '#6b4329',
  earIn: '#4a2e1c',
  face: '#a06a47',
  belly: '#d9b38c',
  muzzle: '#f1dcc0',
  nose: '#3b2418',
  eye: '#2b1a10',
};

export function mood(state) {
  const s = state.stats;
  const vals = [s.hunger, s.happiness, s.energy, s.clean];
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const min = Math.min(...vals);
  if (min < 15 || avg < 35) return 'sad';
  if (avg > 62 && s.happiness > 55) return 'happy';
  return 'ok';
}

const layer = (id) => (id && ITEMS[id] ? ITEMS[id].svg : '');

function eyes(m, asleep) {
  if (asleep) {
    return `<path d="M75,77 Q83,83 91,77 M109,77 Q117,83 125,77" stroke="${C.eye}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
  const base = `<circle cx="83" cy="76" r="6.5" fill="${C.eye}"/><circle cx="117" cy="76" r="6.5" fill="${C.eye}"/>
    <circle cx="85.5" cy="73.5" r="2.2" fill="#fff"/><circle cx="119.5" cy="73.5" r="2.2" fill="#fff"/>`;
  if (m === 'sad') {
    return `${base}<path d="M74,64 L90,68 M126,64 L110,68" stroke="${C.earIn}" stroke-width="3" stroke-linecap="round"/>`;
  }
  return base;
}

function mouth(m, asleep) {
  const st = `stroke="${C.nose}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  if (asleep) return `<path d="M96,101 Q100,104 104,101" ${st}/>`;
  if (m === 'happy') return `<path d="M100,95 L100,99 M89,99 Q94,107 100,99 Q106,107 111,99" ${st}/>`;
  if (m === 'sad') return `<path d="M100,95 L100,99 M90,105 Q100,97 110,105" ${st}/>`;
  return `<path d="M100,95 L100,99 M92,101 Q100,104 108,101" ${st}/>`;
}

function dirt(clean) {
  if (clean >= 40) return '';
  let s = `<g fill="#5c3d22" opacity=".55">
    <ellipse cx="70" cy="146" rx="8" ry="5"/><ellipse cx="128" cy="186" rx="7" ry="4.5"/>
    <ellipse cx="122" cy="58" rx="5" ry="3.5"/></g>`;
  if (clean < 20) {
    s += `<g fill="#5c3d22" opacity=".55"><ellipse cx="86" cy="196" rx="6" ry="4"/>
      <ellipse cx="134" cy="150" rx="6" ry="4"/><ellipse cx="72" cy="104" rx="5" ry="3"/></g>`;
  }
  return s;
}

export function otterSVG(state) {
  const m = mood(state);
  const asleep = state.sleeping;
  const eq = state.equipped;
  return `
  <g class="o-back">${layer(eq.back)}</g>
  <path d="M138,196 Q190,206 182,160 Q176,186 136,178 Z" fill="${C.furDark}"/>
  <ellipse cx="74" cy="214" rx="19" ry="10" fill="${C.furDark}"/>
  <ellipse cx="126" cy="214" rx="19" ry="10" fill="${C.furDark}"/>
  <ellipse cx="100" cy="160" rx="56" ry="58" fill="${C.fur}"/>
  <ellipse cx="100" cy="170" rx="36" ry="42" fill="${C.belly}"/>
  <g class="o-oyster">
    <ellipse cx="100" cy="152" rx="18" ry="12" fill="#adb5bd" stroke="#868e96" stroke-width="2"/>
    <path d="M86,150 Q100,140 114,150 M89,156 Q100,148 111,156" stroke="#868e96" stroke-width="1.5" fill="none"/>
  </g>
  <ellipse cx="81" cy="154" rx="10" ry="8" fill="${C.furDark}"/>
  <ellipse cx="119" cy="154" rx="10" ry="8" fill="${C.furDark}"/>
  <circle cx="64" cy="48" r="13" fill="${C.furDark}"/><circle cx="64" cy="48" r="6" fill="${C.earIn}"/>
  <circle cx="136" cy="48" r="13" fill="${C.furDark}"/><circle cx="136" cy="48" r="6" fill="${C.earIn}"/>
  <circle cx="100" cy="82" r="44" fill="${C.fur}"/>
  <ellipse cx="100" cy="94" rx="34" ry="27" fill="${C.face}"/>
  <ellipse cx="100" cy="98" rx="22" ry="15" fill="${C.muzzle}"/>
  ${m === 'happy' && !asleep ? '<ellipse cx="71" cy="94" rx="7" ry="4" fill="#ff8fab" opacity=".5"/><ellipse cx="129" cy="94" rx="7" ry="4" fill="#ff8fab" opacity=".5"/>' : ''}
  ${eyes(m, asleep)}
  <path d="M92,88 Q100,84 108,88 Q106,95 100,96 Q94,95 92,88 Z" fill="${C.nose}"/>
  ${mouth(m, asleep)}
  <path d="M82,99 L58,95 M82,103 L58,105 M118,99 L142,95 M118,103 L142,105" stroke="#f1dcc0" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
  ${dirt(state.stats.clean)}
  <g class="o-neck">${layer(eq.neck)}</g>
  <g class="o-eyes">${asleep ? '' : layer(eq.eyes)}</g>
  <g class="o-hat">${layer(eq.hat)}</g>`;
}

// A small standalone preview of a single item (for shop/wardrobe cards).
export function itemPreviewSVG(id) {
  const it = ITEMS[id];
  const boxes = { hat: '40 -24 120 80', eyes: '50 50 100 50', neck: '50 96 100 80', back: '20 -10 170 240' };
  return `<svg viewBox="${it.view || boxes[it.slot]}" aria-hidden="true">${it.svg}</svg>`;
}
