// Custom art upload spots. Drop an image into assets/art/<group>/<id>.<ext> and
// it replaces the drawn version everywhere (website, and Discord pictures for
// the otter, clothes and den). assets/art/manifest.json lists which files exist;
// it's rebuilt automatically by a GitHub Action (tools/art-manifest.mjs).
// The full list of spots, sizes and tips is in SLOTS below and on /art.html.
import { ITEMS, SNACKS, MISSIONS, GAME_LIST } from './data.js';
import { FURNITURE, WALLPAPERS, FLOORS } from './den-data.js';
import { LOCATIONS, FINDS } from './world.js';
import { EVENTS, EVENT_FINDS } from './events.js';
import { ACHIEVEMENTS } from './achievements.js';
import { TRAITS } from './personality.js';
import { STAGES, TRICKS } from './growth.js';
import { POSTCARD_ART } from './social.js';
import { WEATHER } from './ambience.js';

let files = {};
let loaded = false;
let prefix = 'assets/art/';

// Website: load the manifest. Server: passes a map of data URIs.
export function setArt(map, base = 'assets/art/') { files = map || {}; prefix = base; loaded = true; }
export const artLoaded = () => loaded;
export const hasArt = (key) => !!files[key];
export const artUrl = (key) => (files[key] ? (/^(data:|https?:|\/)/.test(files[key]) ? files[key] : prefix + files[key]) : null);
export const firstArt = (keys) => keys.find((k) => files[k]) || null;
export const artCount = () => Object.keys(files).length;

export async function loadArtManifest(timeoutMs = 1500) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    // Cache-bust hourly so new uploads show up without a hard refresh.
    const res = await fetch(`assets/art/manifest.json?h=${Math.floor(Date.now() / 3600000)}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) setArt((await res.json()).files || {}, new URL('assets/art/', location.href).href);
  } catch { /* no custom art yet: the drawn versions stay */ }
  return files;
}

const escAttr = (s) => String(s).replace(/"/g, '&quot;');

// An icon: the uploaded picture if there is one, else the emoji.
export function ic(key, emoji, alt = '') {
  const url = artUrl(key);
  return url ? `<img class="art-icon" src="${escAttr(url)}" alt="${escAttr(alt)}" draggable="false">` : emoji;
}

// The same, inside an SVG (centered on 0,0, `size` units wide).
export function svgIcon(key, emoji, size, textAttrs = '') {
  const url = artUrl(key);
  return url ? `<image href="${escAttr(url)}" x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>` : `<text ${textAttrs}>${emoji}</text>`;
}

// The otter canvas: everything about the otter (body, poses, clothes) shares
// one frame so layers line up: 200 x 254 units starting at (0, -24).
export const OTTER_BOX = { x: 0, y: -24, w: 200, h: 254 };
export const otterImage = (url) => `<image href="${escAttr(url)}" x="${OTTER_BOX.x}" y="${OTTER_BOX.y}" width="${OTTER_BOX.w}" height="${OTTER_BOX.h}" preserveAspectRatio="xMidYMid meet"/>`;

// ---------- the checklist of every upload spot ----------
const OTTER_PX = '800 × 1016';
const icon = (n = 256) => `${n} × ${n}`;
const vbPx = (vb) => { const [, , w, h] = vb.split(' ').map(Number); return `${Math.round(w * 4)} × ${Math.round(h * 4)}`; };

export const GROUPS = [
  {
    id: 'otter', size: OTTER_PX, name: 'The otter', tip: `Transparent PNG/WebP, ${OTTER_PX} px. Every otter picture and every clothing layer uses this same canvas, so they line up when stacked: keep the otter centered with its feet near the bottom, the same spot in every pose. A template with guide lines is at assets/art/otter/_template.png.`,
    slots: [
      { id: 'base', name: 'Otter (default)', note: 'Used whenever a more specific pose is missing' },
      { id: 'happy', name: 'Happy' },
      { id: 'sad', name: 'Sad / hungry / tired' },
      { id: 'sleeping', name: 'Sleeping' },
      { id: 'dirty', name: 'Mud overlay', note: 'Drawn on top when the otter needs a bath. Leave empty for no mud on custom art' },
      ...STAGES.map((s) => ({ id: s.id, name: `${s.name} (default for this stage)`, note: `Optional. Also: ${s.id}-happy, ${s.id}-sad, ${s.id}-sleeping` })),
    ],
  },
  {
    id: 'clothes', size: OTTER_PX, name: 'Clothes', tip: `Transparent, ${OTTER_PX} px, on the same canvas as the otter: draw only the item, in the spot it sits on the otter. Shop cards crop to the item automatically.`,
    slots: Object.entries(ITEMS).map(([id, it]) => ({ id, name: it.name, note: `${it.slot}${it.event ? ' · event item' : ''}`, emoji: it.icon })),
  },
  {
    id: 'furniture', name: 'Den furniture', tip: 'Transparent PNG/WebP at the size shown (4× the den size). The bottom edge of the picture is where it sits on the floor or wall.',
    slots: Object.entries(FURNITURE).map(([id, f]) => ({ id, name: f.name, size: vbPx(f.vb), note: f.event ? 'event item' : f.cat })),
  },
  {
    id: 'wallpaper', name: 'Wallpapers', tip: 'The whole back wall, 1600 × 784 px (no transparency needed).',
    slots: Object.entries(WALLPAPERS).map(([id, w]) => ({ id, name: w.name, size: '1600 × 784' })),
  },
  {
    id: 'floor', name: 'Floors', tip: 'The whole floor strip, 1600 × 416 px.',
    slots: Object.entries(FLOORS).map(([id, f]) => ({ id, name: f.name, size: '1600 × 416' })),
  },
  {
    id: 'den', size: '1600 × 1200', name: 'The den room', tip: '1600 × 1200 px, transparent, covering the whole den.',
    slots: [
      { id: 'back', name: 'Window and tunnel', note: 'Sits on the wallpaper, behind furniture' },
      { id: 'frame', name: 'Burrow frame', note: 'The arch around the den, on top of everything. Keep the middle see-through' },
    ],
  },
  {
    id: 'scene', size: '1080 × 1000', name: 'The pond scene', tip: 'Background behind your otter on the Otter page, 1080 × 1000 px. Replaces the drawn willows, lilies and sky.',
    slots: [
      { id: 'base', name: 'Pond (default)' },
      { id: 'dawn', name: 'Dawn' }, { id: 'day', name: 'Day' }, { id: 'dusk', name: 'Dusk' }, { id: 'night', name: 'Night' },
    ],
  },
  {
    id: 'weather', size: '1080 × 1000', name: 'Weather overlays', tip: 'Transparent, 1080 × 1000 px, drawn over the pond. Animated WebP/GIF works great here.',
    slots: Object.entries(WEATHER).map(([id, w]) => ({ id, name: w.name, emoji: w.icon })),
  },
  {
    id: 'map', name: 'World map', tip: 'The whole map is 1600 × 1840 px. Place pins stay on top at the same spots, so keep each place where it is on the current map.',
    slots: [{ id: 'world', name: 'World map', size: '1600 × 1840' }],
  },
  {
    id: 'places', size: icon(), name: 'Places', tip: `Map pins and headings, ${icon()} px, transparent.`,
    slots: [...LOCATIONS.map((l) => ({ id: l.id, name: l.name, emoji: l.icon })), { id: 'museum', name: 'Pond Museum', emoji: '🏛️' }, { id: 'lane', name: 'Otter Lane', emoji: '🏘️' }],
  },
  {
    id: 'lane', name: 'Otter Lane', tip: 'Transparent.',
    slots: [{ id: 'house', name: 'House front', size: '480 × 520', note: 'Each player\'s otter stands on the porch, bottom right' }, { id: 'street', name: 'Street background', size: '1600 × 640' }],
  },
  {
    id: 'finds', size: icon(), name: 'Discoveries', tip: `${icon()} px, transparent.`,
    slots: [...Object.entries(FINDS).map(([id, f]) => ({ id, name: f.name, emoji: f.icon })), ...Object.entries(EVENT_FINDS).map(([id, f]) => ({ id, name: f.name, emoji: f.icon, note: 'event find' }))],
  },
  {
    id: 'missions', size: icon(), name: 'Missions', tip: `${icon()} px, transparent.`,
    slots: MISSIONS.map((m) => ({ id: m.id, name: m.name, emoji: m.icon })),
  },
  {
    id: 'snacks', size: icon(), name: 'Snacks', tip: `${icon()} px, transparent.`,
    slots: SNACKS.map((s) => ({ id: s.id, name: s.name, emoji: s.icon })),
  },
  {
    id: 'games', size: icon(), name: 'Arcade games', tip: `Game icon, ${icon()} px, transparent.`,
    slots: GAME_LIST.map((g) => ({ id: g.id, name: g.name, emoji: g.icon })),
  },
  {
    id: 'badges', size: icon(), name: 'Achievement badges', tip: `${icon()} px, transparent.`,
    slots: ACHIEVEMENTS.map((a) => ({ id: a.id, name: a.name, emoji: a.icon })),
  },
  {
    id: 'events', size: icon(), name: 'Seasonal events', tip: `Event icon and token, ${icon()} px each.`,
    slots: EVENTS.flatMap((e) => [{ id: e.id, name: `${e.name} icon`, emoji: e.icon }, { id: `${e.id}-token`, name: `${e.name} token (${e.token.name})`, emoji: e.token.icon }]),
  },
  {
    id: 'traits', size: icon(), name: 'Personality traits', tip: `${icon()} px.`,
    slots: Object.entries(TRAITS).map(([id, t]) => ({ id, name: t.name, emoji: t.icon })),
  },
  {
    id: 'stages', size: icon(), name: 'Growth stages', tip: `${icon()} px.`,
    slots: STAGES.map((s) => ({ id: s.id, name: s.name, emoji: s.icon })),
  },
  {
    id: 'tricks', size: icon(), name: 'Tricks', tip: `${icon()} px.`,
    slots: TRICKS.map((t) => ({ id: t.id, name: t.name, emoji: t.icon })),
  },
  {
    id: 'postcards', name: 'Shell Mail postcards', tip: 'The postcard background, 1000 × 640 px. The message is written on top, so keep it light and calm.',
    slots: Object.entries(POSTCARD_ART).map(([id, p]) => ({ id, name: p.name, emoji: p.icon, size: '1000 × 640' })),
  },
  {
    id: 'icons', size: icon(128), name: 'Interface icons', tip: `${icon(128)} px, transparent.`,
    slots: [
      { id: 'pearl', name: 'Pearl (money)' },
      { id: 'tab-home', name: 'Tab: Otter', emoji: '🦦' }, { id: 'tab-den', name: 'Tab: Den', emoji: '🏡' }, { id: 'tab-closet', name: 'Tab: Closet', emoji: '👗' },
      { id: 'tab-missions', name: 'Tab: Explore', emoji: '🗺️' }, { id: 'tab-arcade', name: 'Tab: Arcade', emoji: '🎮' }, { id: 'tab-friends', name: 'Tab: Friends', emoji: '💞' },
    ],
  },
];
