// The art checklist page (/art.html): every upload spot with a preview.
import { GROUPS, loadArtManifest, artUrl, hasArt } from './art.js';
import { SLOTS as ANIM } from './animations.js';
import { otterSVG, itemPreviewSVG } from './otter.js';
import { furniturePreviewSVG } from './den.js';
import { WALLPAPERS, FLOORS } from './den-data.js';
import { defaultState } from './core.js';
import { SNACKS } from './data.js';
import { TRICKS, STAGES } from './growth.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

await loadArtManifest(4000);

const otterState = (extra = {}) => ({ ...defaultState(), name: 'Pebble', level: 6, stats: { hunger: 80, happiness: 90, energy: 90, clean: 90 }, ...extra });
const otterPv = (st) => `<svg viewBox="0 -24 200 254">${otterSVG(st, { idPrefix: `pv${Math.random().toString(36).slice(2, 7)}` })}</svg>`;

function drawn(g, s) {
  if (g.id === 'otter') {
    const stage = STAGES.find((x) => x.id === s.id);
    if (s.id === 'dirty') return otterPv(otterState({ stats: { hunger: 80, happiness: 60, energy: 80, clean: 10 } }));
    return otterPv(otterState({ sleeping: s.id === 'sleeping', level: stage ? stage.level : 6, stats: s.id === 'sad' ? { hunger: 10, happiness: 20, energy: 30, clean: 40 } : { hunger: 80, happiness: 90, energy: 90, clean: 90 } }));
  }
  if (g.id === 'clothes') return itemPreviewSVG(s.id);
  if (g.id === 'furniture') return furniturePreviewSVG(s.id);
  if (g.id === 'wallpaper') return `<div class="swatch" style="background:${WALLPAPERS[s.id].swatch || '#4f6b4a'}"></div>`;
  if (g.id === 'floor') return `<div class="swatch" style="background:${FLOORS[s.id].swatch || '#6b4d34'}"></div>`;
  return s.emoji || '🖼️';
}

function card(g, s, folder = `assets/art/${g.id}/`) {
  const key = `${g.id}/${s.id}`;
  const url = artUrl(key);
  return `<div class="slot ${url ? 'done' : 'todo'}"><span class="state">${url ? '✅' : '⬜'}</span>
    <div class="pv">${url ? (/\.webm$/.test(url) ? `<video src="${esc(url)}" autoplay muted loop playsinline style="max-height:96px"></video>` : `<img src="${esc(url)}" alt="">`) : drawn(g, s)}</div>
    <b>${esc(s.name)}</b><code>${esc(s.id)}</code>
    <small>${esc(s.size || g.size || '')}${s.note ? ` · ${esc(s.note)}` : ''}</small></div>`;
}

const animGroup = {
  id: 'animations', name: 'Animations', size: '420 × 520',
  tip: 'Animated WebP, GIF, APNG or WebM with a transparent background, about 2–3 seconds, otter centered with feet near the bottom. They play over the pond, or in a pop-up on tabs without the pond. Details: assets/animations/README.md',
  slots: [
    ...Object.entries(ANIM).map(([id, a]) => ({ id, name: a.label })),
    ...SNACKS.map((x) => ({ id: `feed-${x.id}`, name: `Eating ${x.name}`, emoji: x.icon, note: 'optional, overrides feed' })),
    ...TRICKS.map((t) => ({ id: `trick-${t.id}`, name: `Trick: ${t.name}`, emoji: t.icon })),
  ],
};

const all = [...GROUPS, animGroup];
const total = all.reduce((n, g) => n + g.slots.length, 0);
const done = all.reduce((n, g) => n + g.slots.filter((s) => hasArt(`${g.id}/${s.id}`)).length, 0);
document.getElementById('summary').innerHTML = `<div class="bar"><div style="width:${(done / total) * 100}%"></div></div><small><b>${done}</b> of <b>${total}</b> spots have your art.</small>`;

document.getElementById('groups').innerHTML = all.map((g) => {
  const folder = g.id === 'animations' ? 'assets/animations/' : `assets/art/${g.id}/`;
  const n = g.slots.filter((s) => hasArt(`${g.id}/${s.id}`)).length;
  return `<section data-group="${g.id}"><h2>${esc(g.name)} <small>${n}/${g.slots.length}</small></h2>
    <p class="tip">${esc(g.tip)}</p><div class="path">📁 ${folder}</div>
    ${g.id === 'otter' ? '<p class="tip">📐 <a href="assets/art/otter/_template.png" download>Download the otter canvas template</a> (800 × 1016, with the current otter faintly drawn and guide lines). Clothes use the same canvas.</p>' : ''}
    <div class="grid">${g.slots.map((s) => card(g, s)).join('')}</div></section>`;
}).join('');

document.querySelector('.filters').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  document.querySelectorAll('.filters button').forEach((x) => x.setAttribute('aria-pressed', x === b));
  const f = b.dataset.f;
  document.querySelectorAll('.slot').forEach((el) => el.classList.toggle('hidden', f !== 'all' && !el.classList.contains(f)));
  document.querySelectorAll('section').forEach((sec) => sec.classList.toggle('hidden', !sec.querySelector('.slot:not(.hidden)')));
});
