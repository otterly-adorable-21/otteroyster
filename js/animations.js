// Custom care animations. Drop files into assets/animations/ (see the README
// there) and they play when the matching care button is pressed. Until a file
// exists, the built-in effects play instead.
//
// Slots: feed, feed-<snackId>, cuddle, bath, nap, sleeping (loops while asleep),
// wake, gift. Each can be a .webm (with transparency), .webp, .gif or .png (APNG).
import { artLoaded, artUrl } from './art.js';

const DIR = 'assets/animations/';
const TYPES = ['webm', 'webp', 'gif', 'png'];
export const SLOTS = {
  feed: { duration: 2400, label: 'Eating a snack' },
  cuddle: { duration: 2000, label: 'Being cuddled' },
  bath: { duration: 2800, label: 'Bath time' },
  nap: { duration: 2200, label: 'Falling asleep' },
  sleeping: { duration: 0, label: 'Sleeping (loops)' },
  wake: { duration: 2000, label: 'Waking up' },
  gift: { duration: 2200, label: 'Opening the daily gift' },
  levelup: { duration: 2400, label: 'Level up' },
  grow: { duration: 3200, label: 'Growing into the next stage' },
  birthday: { duration: 3200, label: 'Birthday party' },
  'mission-return': { duration: 2600, label: 'Coming home from a mission' },
  discover: { duration: 2400, label: 'Making a new discovery' },
  hug: { duration: 2000, label: 'Hugging a friend' },
  outfit: { duration: 1800, label: 'Putting on an outfit' },
  donate: { duration: 2200, label: 'Donating to the museum' },
  'companion-play': { duration: 2200, label: 'Playing with your companion' },
  plant: { duration: 1800, label: 'Planting a seed' },
  water: { duration: 1800, label: 'Watering the garden' },
  harvest: { duration: 2200, label: 'Harvesting the garden' },
  investigate: { duration: 2000, label: 'Finding a mystery clue' },
  'mystery-solved': { duration: 3200, label: 'Solving a mystery' },
};

let manifest = null; // optional assets/animations/animations.json
const found = new Map(); // slot -> url | null

async function loadManifest() {
  if (manifest !== null) return manifest;
  if (artLoaded() && !artUrl('animations/_config')) { manifest = {}; return manifest; }
  try {
    const r = await fetch(`${DIR}animations.json`, { cache: 'no-cache' });
    manifest = r.ok ? await r.json() : {};
  } catch { manifest = {}; }
  return manifest;
}

function exists(url) {
  return fetch(url, { method: 'HEAD', cache: 'no-cache' }).then((r) => r.ok).catch(() => false);
}

// Find the file for a slot (checks the manifest, then name.webm/webp/gif/png).
export async function findAnimation(slot) {
  if (found.has(slot)) return found.get(slot);
  // The art manifest lists animation files too, so no need to go looking.
  if (artLoaded()) { const u = artUrl(`animations/${slot}`); found.set(slot, u); return u; }
  const m = (await loadManifest())[slot];
  let url = null;
  if (m?.file && (await exists(DIR + m.file))) url = DIR + m.file;
  for (const t of TYPES) {
    if (url) break;
    if (await exists(`${DIR}${slot}.${t}`)) url = `${DIR}${slot}.${t}`;
  }
  found.set(slot, url);
  return url;
}

function mediaFor(url, loop) {
  if (url.endsWith('.webm')) {
    const v = document.createElement('video');
    Object.assign(v, { src: url, autoplay: true, muted: true, playsInline: true, loop });
    v.setAttribute('playsinline', '');
    return v;
  }
  const img = document.createElement('img');
  img.src = loop ? url : `${url}?play=${Date.now()}`; // restart GIF/WebP from frame 1
  img.alt = '';
  return img;
}

// Play a slot over the otter. Returns true if a custom animation played.
// opts.snack picks feed-<snack> first. "mode": "overlay" in the manifest keeps
// the drawn otter visible underneath; the default replaces it while playing.
export async function playCare(slot, { snack, wrap = document.getElementById('otter-wrap') } = {}) {
  const url = (snack && (await findAnimation(`feed-${snack}`))) || (await findAnimation(slot));
  if (!url) return false;
  // Pond not on screen (Den, Explore, Friends tabs): play it in a little pop-up.
  if (!wrap || wrap.offsetParent === null) wrap = popup();
  const cfg = { ...SLOTS[slot], ...((await loadManifest())[snack ? `feed-${snack}` : slot] || {}), ...((await loadManifest())[slot] || {}) };
  wrap.querySelectorAll('.care-anim:not(.loop)').forEach((el) => el.remove());
  const el = mediaFor(url, false);
  el.className = 'care-anim';
  if (cfg.mode !== 'overlay') wrap.classList.add('anim-replace');
  wrap.appendChild(el);
  const done = () => { el.remove(); if (!wrap.querySelector('.care-anim')) wrap.classList.remove('anim-replace'); if (wrap.classList.contains('anim-popup')) wrap.remove(); };
  if (el.tagName === 'VIDEO') el.addEventListener('ended', done, { once: true });
  setTimeout(done, cfg.duration || 2500);
  return true;
}

// Looping "sleeping" animation while the otter naps (if provided).
export async function setSleeping(on, wrap = document.getElementById('otter-wrap')) {
  const current = wrap?.querySelector('.care-anim.loop');
  if (!on) { if (current) { current.remove(); wrap.classList.remove('anim-replace'); } return; }
  if (current) return;
  const url = await findAnimation('sleeping');
  if (!url || !wrap) return;
  const el = mediaFor(url, true);
  el.className = 'care-anim loop';
  wrap.classList.add('anim-replace');
  wrap.appendChild(el);
}

function popup() {
  document.querySelector('.anim-popup')?.remove();
  const box = document.createElement('div');
  box.className = 'anim-popup';
  box.setAttribute('aria-hidden', 'true');
  document.body.appendChild(box);
  return box;
}
