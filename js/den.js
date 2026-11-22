// Draws the Otter's Den as one SVG (400 x 300 units). Used by the website
// (where items can be dragged around) and by the Discord bot (/den, /visit).
import { FURNITURE, WALLPAPERS, FLOORS, DEN_W, DEN_H, OTTER_W, zoneOf, itemSize } from './den-data.js';

export { DEN_W, DEN_H, OTTER_W, zoneOf, itemSize, clampPos } from './den-data.js';
import { otterSVG } from './otter.js';
import { artUrl } from './art.js';
import { companionSVG } from './extras-draw.js';
import { COMPANIONS } from './companions.js';
import { TRINKETS, FISH } from './treasures.js';

// What a display case or the aquarium shows inside it (emoji icons, or art).
const SHELF_SPOTS = {
  shellcabinet: [[22, 32], [45, 32], [68, 32], [22, 64], [45, 64], [68, 64], [22, 96], [45, 96], [68, 96]],
  rockshelf: [[12, 20], [30, 20], [48, 20], [66, 20], [84, 20], [100, 20], [12, 48], [30, 48], [48, 48], [66, 48], [84, 48], [100, 48]],
  fossildisplay: [[26, 30], [54, 30], [40, 58]],
  pearlcase: [[24, 30], [40, 26], [56, 30], [32, 52], [48, 52]],
  postcardwall: [[18, 22], [42, 20], [66, 24], [90, 22], [30, 48], [56, 50], [80, 48]],
  trophycabinet: [[24, 36], [45, 36], [66, 36], [24, 70], [45, 70], [66, 70], [24, 104], [45, 104], [66, 104]],
};
function displayContents(it, id, state) {
  const icon = (x, y, key, emoji, size) => {
    const url = artUrl(key);
    return url ? `<image href="${url}" x="${x - size / 2}" y="${y - size}" width="${size}" height="${size}"/>` : `<text x="${x}" y="${y}" font-size="${size * 0.8}" text-anchor="middle">${emoji}</text>`;
  };
  if (it.shows) {
    const groups = it.shows === 'fossil' ? ['fossil'] : it.shows === 'pearls' ? ['pearls'] : [it.shows];
    const have = Object.keys(state.trinkets || {}).filter((t) => groups.includes(TRINKETS[t]?.group));
    return (SHELF_SPOTS[id] || []).slice(0, have.length).map(([x, y], k) => icon(x, y, `trinkets/${have[k]}`, TRINKETS[have[k]].icon, 18)).join('');
  }
  if (it.use === 'aquarium') {
    const fish = Object.keys(state.aquarium?.fish || {}).slice(0, 6);
    return fish.map((f, k) => `<g class="aq-fish" style="--k:${k}">${icon(22 + (k % 3) * 34, 30 + Math.floor(k / 3) * 22, `fish/${f}`, FISH[f].icon, 16)}</g>`).join('');
  }
  return '';
}

const img = (url, x, y, w, h) => `<image href="${url}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>`;
// Uploaded furniture art fills the item's own drawing box.
const furnitureArt = (id, it) => { const u = artUrl(`furniture/${id}`); if (!u) return it.svg; const [x, y, w, h] = it.vb.split(' ').map(Number); return img(u, x, y, w, h); };

const WALL_BOTTOM = 196;

export const PATTERNS = {
  'wp-moss': `<pattern id="wp-moss" width="60" height="44" patternUnits="userSpaceOnUse"><rect width="60" height="44" fill="#4f6b4a"/>
    <ellipse cx="14" cy="12" rx="12" ry="8" fill="#587652"/><ellipse cx="44" cy="30" rx="14" ry="9" fill="#587652"/><ellipse cx="46" cy="6" rx="7" ry="4" fill="#5f7d56"/>
    <circle cx="28" cy="38" r="2" fill="#6f8f60"/><circle cx="8" cy="30" r="1.5" fill="#6f8f60"/></pattern>`,
  'wp-willow': `<pattern id="wp-willow" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#3f5f3f"/><rect width="20" height="40" fill="#476b45"/>
    <path d="M10,4 q4,6 0,12 M10,22 q-4,6 0,12 M30,12 q4,6 0,12" stroke="#7fa65a" stroke-width="2.5" fill="none" stroke-linecap="round"/></pattern>`,
  'wp-stars': `<pattern id="wp-stars" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="50" height="50" fill="#1b2c4a"/>
    <path d="M12,8 C13,12 13,12 17,13 C13,14 13,14 12,18 C11,14 11,14 7,13 C11,12 11,12 12,8Z" fill="#f3d98c"/>
    <circle cx="36" cy="30" r="1.6" fill="#fff3bf"/><circle cx="20" cy="40" r="1" fill="#fff3bf"/><circle cx="42" cy="8" r="1" fill="#fff3bf"/></pattern>`,
  'wp-coral': `<pattern id="wp-coral" width="30" height="20" patternUnits="userSpaceOnUse"><rect width="30" height="20" fill="#d98c7a"/>
    <path d="M0,20 Q7.5,6 15,20 Q22.5,6 30,20" fill="none" stroke="#e8a898" stroke-width="2.5"/></pattern>`,
  'wp-sand': `<pattern id="wp-sand" width="36" height="36" patternUnits="userSpaceOnUse"><rect width="36" height="36" fill="#d8c39c"/>
    <circle cx="6" cy="8" r="1.2" fill="#c4ad84"/><circle cx="24" cy="18" r="1.5" fill="#c4ad84"/><circle cx="14" cy="30" r="1" fill="#e6d4b2"/><circle cx="32" cy="4" r="1" fill="#e6d4b2"/></pattern>`,
  'fl-earth': `<pattern id="fl-earth" width="40" height="30" patternUnits="userSpaceOnUse"><rect width="40" height="30" fill="#6b4d34"/>
    <ellipse cx="10" cy="8" rx="4" ry="1.5" fill="#5e432d"/><ellipse cx="30" cy="22" rx="5" ry="1.8" fill="#5e432d"/><circle cx="24" cy="10" r="1" fill="#7d5c40"/></pattern>`,
  'fl-planks': `<pattern id="fl-planks" width="80" height="16" patternUnits="userSpaceOnUse"><rect width="80" height="16" fill="#8a6644"/>
    <rect y="8" width="80" height="8" fill="#7a593a"/><path d="M0,8 H80 M50,0 V8 M20,8 V16" stroke="#5e432d" stroke-width="1"/></pattern>`,
  'fl-pebbles': `<pattern id="fl-pebbles" width="34" height="22" patternUnits="userSpaceOnUse"><rect width="34" height="22" fill="#7a6e60"/>
    <ellipse cx="8" cy="6" rx="6" ry="4" fill="#9c9080"/><ellipse cx="24" cy="8" rx="7" ry="4" fill="#8c8070"/><ellipse cx="14" cy="17" rx="7" ry="4" fill="#a89c8c"/><ellipse cx="30" cy="19" rx="4" ry="3" fill="#9c9080"/></pattern>`,
  'fl-moss': `<pattern id="fl-moss" width="30" height="20" patternUnits="userSpaceOnUse"><rect width="30" height="20" fill="#5d7a3a"/>
    <path d="M4,14 l2,-5 l2,5 M18,8 l2,-5 l2,5 M24,18 l2,-4 l2,4" stroke="#7fa04e" stroke-width="1.6" fill="none"/></pattern>`,
};

function room(wallpaper, floor) {
  const wp = artUrl(`wallpaper/${wallpaper}`);
  const fl = artUrl(`floor/${floor}`);
  const back = artUrl('den/back');
  return `
  ${wp ? img(wp, 0, 0, DEN_W, WALL_BOTTOM) : `<rect width="${DEN_W}" height="${WALL_BOTTOM}" fill="url(#wp-${wallpaper})"/>`}
  ${fl ? img(fl, 0, WALL_BOTTOM, DEN_W, DEN_H - WALL_BOTTOM) : `<rect y="${WALL_BOTTOM}" width="${DEN_W}" height="${DEN_H - WALL_BOTTOM}" fill="url(#fl-${floor})"/>`}
  <rect y="${WALL_BOTTOM}" width="${DEN_W}" height="${DEN_H - WALL_BOTTOM}" fill="url(#den-floorshade)"/>
  <rect y="${WALL_BOTTOM - 4}" width="${DEN_W}" height="6" fill="#5a3f2a" opacity=".7"/>
  ${back ? img(back, 0, 0, DEN_W, DEN_H) : `
  <!-- round window to the pond -->
  <g transform="translate(300 78)">
    <circle r="40" fill="url(#den-window)"/>
    <ellipse cx="-6" cy="22" rx="16" ry="5" fill="#6f9a3a"/><path d="M-6,20 l-5,-7 l5,3 l5,-3Z" fill="#fffaf0"/>
    <circle cx="16" cy="-16" r="7" fill="#fff3bf"/>
    <path d="M-30,-36 q4,20 -2,34 M-20,-40 q2,16 -2,26" stroke="#8fbf4a" stroke-width="3" stroke-dasharray="3 3" fill="none"/>
    <circle r="40" fill="none" stroke="#8a6644" stroke-width="8"/><path d="M-40,0 H40 M0,-40 V40" stroke="#8a6644" stroke-width="4"/>
    <circle r="44" fill="none" stroke="#6b4d34" stroke-width="2"/>
  </g>
  <!-- tunnel back out to the pond -->
  <path d="M28,${WALL_BOTTOM + 2} V136 Q28,104 58,104 Q88,104 88,136 V${WALL_BOTTOM + 2}Z" fill="#2a1d14"/>
  <path d="M28,${WALL_BOTTOM + 2} V136 Q28,104 58,104 Q88,104 88,136 V${WALL_BOTTOM + 2}" fill="none" stroke="#8a6644" stroke-width="5"/>
  <circle cx="58" cy="150" r="3" fill="#e6ff9c" opacity=".8"/>`}`;
}

function burrowFrame() {
  const fr = artUrl('den/frame');
  if (fr) return img(fr, 0, 0, DEN_W, DEN_H);
  return `
  <path fill-rule="evenodd" fill="#3b2a1e" d="M0,0 H${DEN_W} V${DEN_H} H0Z M14,${DEN_H} V112 Q14,10 200,8 Q386,10 386,112 V${DEN_H}Z"/>
  <path d="M14,${DEN_H} V112 Q14,10 200,8 Q386,10 386,112 V${DEN_H}" fill="none" stroke="#5a3f2a" stroke-width="6"/>
  <g stroke="#6b4d34" stroke-width="3" fill="none" stroke-linecap="round">
    <path d="M120,14 q4,18 -4,30 q-4,8 2,16"/><path d="M190,9 q-3,14 3,24"/><path d="M262,12 q6,20 0,34"/>
  </g>
  <g fill="#e6ff9c"><circle cx="120" cy="62" r="2.4" opacity=".9"/><circle cx="262" cy="48" r="2" opacity=".8"/></g>`;
}

const DEFS = (wallpaper, floor) => `<defs>
  ${PATTERNS[`wp-${wallpaper}`] || WALLPAPERS[wallpaper]?.pattern || PATTERNS['wp-moss']}${PATTERNS[`fl-${floor}`] || FLOORS[floor]?.pattern || PATTERNS['fl-earth']}
  <linearGradient id="den-floorshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <radialGradient id="den-window" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#9be8de"/><stop offset=".6" stop-color="#3cc7c0"/><stop offset="1" stop-color="#1f8f95"/></radialGradient>
  <radialGradient id="den-pearl" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#f1e8ff"/><stop offset=".75" stop-color="#d2f2ee"/><stop offset="1" stop-color="#c6b8d6"/></radialGradient>
  <radialGradient id="den-light" cx="50%" cy="10%" r="80%"><stop offset="0" stop-color="#fff3bf" stop-opacity=".22"/><stop offset="1" stop-color="#fff3bf" stop-opacity="0"/></radialGradient>
</defs>`;

function itemSVG(p, { selected = false, editable = false, state = null } = {}) {
  const it = FURNITURE[p.id];
  if (!it) return '';
  const { w, h } = itemSize(p.id);
  const x = p.x - w / 2;
  const y = p.y - h;
  const flip = p.flip ? ` transform="translate(${p.x * 2} 0) scale(-1 1)"` : '';
  const shadow = zoneOf(p.id) === 'floor' ? `<ellipse cx="${p.x}" cy="${p.y - 1}" rx="${w * 0.42}" ry="${Math.max(3, w * 0.07)}" fill="#000" opacity=".22"/>` : '';
  const sel = selected ? `<rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" rx="8" fill="none" stroke="#f3d98c" stroke-width="2.5" stroke-dasharray="6 4"/>` : '';
  return `<g class="den-item${editable ? ' editable' : ''}" data-uid="${p.uid}">${shadow}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"/><g${flip}><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${it.vb}" overflow="visible">${furnitureArt(p.id, it)}${state ? displayContents(it, p.id, state) : ''}</svg></g>${sel}</g>`;
}

function otterInDen(state, pos, { selected = false, editable = false } = {}) {
  const h = OTTER_W * 1.25;
  const x = pos.x - OTTER_W / 2;
  const y = pos.y - h;
  const sel = selected ? `<rect x="${x - 4}" y="${y - 4}" width="${OTTER_W + 8}" height="${h + 8}" rx="8" fill="none" stroke="#f3d98c" stroke-width="2.5" stroke-dasharray="6 4"/>` : '';
  return `<g class="den-item den-otter${editable ? ' editable' : ''}" data-uid="otter">
    <ellipse cx="${pos.x}" cy="${pos.y - 2}" rx="${OTTER_W * 0.36}" ry="5" fill="#000" opacity=".25"/>
    <svg x="${x}" y="${y}" width="${OTTER_W}" height="${h}" viewBox="0 -24 200 254" overflow="visible">${otterSVG(state, { idPrefix: 'den-otter' })}</svg>${state.sleeping ? `<text x="${pos.x + 22}" y="${y + 6}" font-size="16" font-family="Georgia, serif" font-style="italic" fill="#fff3bf">z z</text>` : ''}${sel}</g>`;
}

// Where the otter is shown: in bed if napping and there's a bed, else where it was put.
function otterPos(state) {
  const den = state.den;
  if (state.sleeping) {
    const bed = den.items.find((p) => p.id === 'shellbed' || p.id === 'hammock');
    if (bed) return { x: bed.x, y: bed.y - itemSize(bed.id).h * 0.35, inBed: true };
  }
  return den.otter || { x: 200, y: 286 };
}

// Full den picture. `opts.editable` adds hooks for dragging; `opts.selected` = uid.
export function denSVG(state, opts = {}) {
  const den = state.den;
  const wallpaper = WALLPAPERS[den.wallpaper] ? den.wallpaper : 'moss';
  const floor = FLOORS[den.floor] ? den.floor : 'earth';
  const items = den.items.filter((p) => FURNITURE[p.id]);
  const layer = (z) => items.filter((p) => zoneOf(p.id) === z).sort((a, b) => a.y - b.y);
  const pos = otterPos(state);
  const floorThings = layer('floor').map((p) => ({ y: p.y, html: itemSVG(p, { selected: opts.selected === p.uid, editable: opts.editable, state }) }));
  for (const [k, g] of (opts.guests || []).entries()) {
    const gx = Math.max(60, Math.min(340, pos.x + (k % 2 ? -1 : 1) * (70 + k * 20)));
    const gstate = { ...state, name: g.name, equipped: g.equipped || {}, sleeping: state.sleeping, stats: { hunger: 90, happiness: 90, energy: 90, clean: 90 }, persona: state.persona };
    floorThings.push({ y: 288, html: `<g class="den-guest">${otterInDen(gstate, { x: gx, y: 288 }, {}).replace('data-uid="otter"', 'data-uid="guest"').replace(/den-otter-/g, `den-guest${k}-`)}<text x="${gx}" y="296" text-anchor="middle" font-size="10" font-weight="800" fill="#fffaf0" stroke="#3b2a1e" stroke-width="3" paint-order="stroke" font-family="Nunito, sans-serif">${String(g.name).replace(/[<&>]/g, '')} 🌙</text></g>` });
  }
  if (!state.mission) {
    floorThings.push({ y: pos.inBed ? pos.y + 30 : pos.y, html: otterInDen(state, pos, { selected: opts.selected === 'otter', editable: opts.editable && !pos.inBed }) });
  }
  const comp = state.companions?.active;
  if (comp && COMPANIONS[comp] && !state.mission) {
    const cx = Math.max(40, Math.min(360, pos.x + (pos.x > 300 ? -52 : 52)));
    const cy = pos.inBed ? 292 : Math.min(296, pos.y + 4);
    floorThings.push({ y: cy, html: `<g class="den-companion" pointer-events="none"><ellipse cx="${cx}" cy="${cy - 1}" rx="13" ry="3.5" fill="#000" opacity=".22"/><svg x="${cx - 17}" y="${cy - 34}" width="34" height="34" viewBox="0 0 100 100">${companionSVG(comp, { sleeping: state.sleeping, look: (({ color, pattern, acc }) => ({ color, pattern, acc }))(state.companions.owned[comp] || {}) })}</svg></g>` });
  }
  floorThings.sort((a, b) => a.y - b.y);
  const ex = opts.extraAttrs || '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${DEN_W} ${DEN_H}" ${ex}>${DEFS(wallpaper, floor)}
    ${room(wallpaper, floor)}
    ${layer('wall').map((p) => itemSVG(p, { selected: opts.selected === p.uid, editable: opts.editable, state })).join('')}
    ${layer('rug').map((p) => itemSVG(p, { selected: opts.selected === p.uid, editable: opts.editable, state })).join('')}
    ${floorThings.map((t) => t.html).join('')}
    ${opts.party ? partyDecor() : ''}
    <rect width="${DEN_W}" height="${DEN_H}" fill="url(#den-light)" pointer-events="none"/>
    ${state.sleeping ? `<rect width="${DEN_W}" height="${DEN_H}" fill="#071f26" opacity=".35" pointer-events="none"/>` : ''}
    ${burrowFrame()}
  </svg>`;
}

// Birthday party: bunting across the wall and a cake with candles.
function partyDecor() {
  const colors = ['#ff8787', '#ffd43b', '#74c0fc', '#b197fc', '#69db7c'];
  const flags = Array.from({ length: 11 }, (_, k) => {
    const x = 60 + k * 28;
    const y = 30 + 18 * Math.sin((k / 10) * Math.PI);
    return `<path d="M${x - 10},${y} L${x + 10},${y} L${x},${y + 18}Z" fill="${colors[k % colors.length]}"/>`;
  }).join('');
  return `<g pointer-events="none"><path d="M50,28 Q200,64 350,28" stroke="#a8865f" stroke-width="2" fill="none"/>${flags}
    <g transform="translate(132 300)"><rect x="-26" y="-34" width="52" height="26" rx="5" fill="#fff0f6" stroke="#f783ac" stroke-width="2"/>
    <rect x="-26" y="-22" width="52" height="5" fill="#f783ac"/>${[-14, 0, 14].map((x) => `<rect x="${x - 2}" y="-48" width="4" height="14" fill="#74c0fc"/><ellipse cx="${x}" cy="-51" rx="3" ry="5" fill="#ffd43b"/>`).join('')}</g></g>`;
}

// Small preview of one catalog item for shop cards.
export function furniturePreviewSVG(id) {
  const it = FURNITURE[id];
  return `<svg viewBox="${it.vb}" aria-hidden="true"><defs><radialGradient id="den-pearl" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#f1e8ff"/><stop offset=".75" stop-color="#d2f2ee"/><stop offset="1" stop-color="#c6b8d6"/></radialGradient></defs>${furnitureArt(id, it)}</svg>`;
}
