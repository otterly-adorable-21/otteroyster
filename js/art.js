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
import { COMPANIONS } from './companions.js';
import { CROPS } from './garden.js';
import { DOOR_ITEMS } from './door.js';
import { NPCS } from './lore.js';
import { HAPPENINGS } from './worldsim.js';
import { TRINKETS, BOOKS, FISH } from './treasures.js';
import { COMP_ACCS } from './companions.js';

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
      { id: 'river-base', name: 'River otter (default)', note: 'River otters use their own river-… files, same canvas' },
      { id: 'river-happy', name: 'River otter: happy' },
      { id: 'river-sad', name: 'River otter: sad' },
      { id: 'river-sleeping', name: 'River otter: sleeping' },
      { id: 'river-dirty', name: 'River otter: mud overlay' },
      ...STAGES.map((s) => ({ id: `river-${s.id}`, name: `River otter: ${s.name}`, note: `Optional. Also: river-${s.id}-happy, river-${s.id}-sad, river-${s.id}-sleeping` })),
    ],
  },
  {
    id: 'clothes', size: OTTER_PX, name: 'Clothes', tip: `Transparent, ${OTTER_PX} px, on the same canvas as the otter: draw only the item, in the spot it sits on the otter. Shop cards crop to the item automatically.`,
    slots: Object.entries(ITEMS).map(([id, it]) => ({ id, name: it.name, note: `${it.slot}${it.event ? ' · event item' : ''}`, emoji: it.icon })),
  },
  {
    id: 'companions', size: '512 × 512', name: 'Pet companions', tip: 'Transparent, 512 × 512 px, the companion standing on the bottom edge, facing right. Optional sleeping pose: <id>-sleeping. Optional color versions: <id>-sunset, -ocean, -mint, -lilac, -golden (otherwise the colors are tinted automatically).',
    slots: Object.entries(COMPANIONS).flatMap(([id, c]) => [{ id, name: c.name, emoji: c.icon }, { id: `${id}-sleeping`, name: `${c.name} (sleeping)`, emoji: '💤', note: 'optional' }]),
  },
  {
    id: 'npcs', size: '512 × 512', name: 'Pond folk (characters)', tip: 'Transparent portraits, 512 × 512 px, head and shoulders or full body. Shown in conversations, on the map and in the Lore Book.',
    slots: Object.entries(NPCS).map(([id, n]) => ({ id, name: n.name, emoji: n.icon, note: n.species })),
  },
  {
    id: 'happenings', size: '256 × 256', name: 'World happenings', tip: 'Icons for the things happening around the pond, 256 × 256 px.',
    slots: Object.entries(HAPPENINGS).map(([id, h]) => ({ id, name: h.name, emoji: h.icon })),
  },
  {
    id: 'trinkets', size: '256 × 256', name: 'Trinkets', tip: 'Collectible trinkets, 256 × 256 px, transparent. They also appear inside the den display cases.',
    slots: Object.entries(TRINKETS).map(([id, t]) => ({ id, name: t.name, emoji: t.icon, note: t.rarity })),
  },
  {
    id: 'books', size: '256 × 256', name: 'Storybooks', tip: 'Book covers for the bookshelf, 256 × 256 px.',
    slots: Object.entries(BOOKS).map(([id, b]) => ({ id, name: b.title, emoji: b.icon })),
  },
  {
    id: 'fish', size: '256 × 256', name: 'Aquarium fish', tip: 'Fish for the aquarium, 256 × 256 px, transparent, facing left (they flip when swimming the other way).',
    slots: Object.entries(FISH).map(([id, f]) => ({ id, name: f.name, emoji: f.icon, note: f.rarity })),
  },
  {
    id: 'companion-acc', size: '256 × 256', name: 'Companion accessories', tip: 'Tiny accessories that sit on top of a companion\'s head, 256 × 256 px, transparent, drawn so the bottom edge sits on the head.',
    slots: Object.entries(COMP_ACCS).map(([id, a]) => ({ id, name: a.name, emoji: a.icon })),
  },
  {
    id: 'garden', name: 'Garden', tip: 'The garden outside the den.',
    slots: [
      { id: 'background', name: 'Garden background', size: '1600 × 1200', note: 'Plots sit in 2 rows of 3 on top; keep the lower two-thirds fairly plain' },
      { id: 'plot', name: 'Soil plot (dry)', size: '400 × 120', note: 'transparent' },
      { id: 'plot-wet', name: 'Soil plot (watered)', size: '400 × 120', note: 'transparent' },
    ],
  },
  {
    id: 'crops', name: 'Garden crops', tip: 'Transparent. Each crop has a seed-packet icon (256 × 256) and growth stages (320 × 400, plant standing on the bottom edge): -0 planted seed, -1 sprout, -2 growing, -3 ready to harvest.',
    slots: Object.entries(CROPS).flatMap(([id, c]) => [
      { id, name: `${c.name} icon`, emoji: c.icon, size: '256 × 256' },
      ...[0, 1, 2, 3].map((k) => ({ id: `${id}-${k}`, name: `${c.name}: ${['seed', 'sprout', 'growing', 'ready'][k]}`, size: '320 × 400', note: k === 3 ? '' : 'optional' })),
    ]),
  },
  {
    id: 'door', size: '480 × 520', name: 'Front door', tip: 'Transparent, 480 × 520 px: the same canvas as the Otter Lane house (lane/house). Draw only the piece, in the spot it goes on the house, so the pieces stack. Paint layers are the door itself.',
    slots: Object.entries(DOOR_ITEMS).map(([id, it]) => ({ id, name: it.name, emoji: it.icon || '🎨', note: it.kind })),
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
    id: 'scene', size: '1600 × 1000', name: 'The pond scene', tip: 'The picture behind your otter on the Otter page, 1600 × 1000 px. The pond box is wide on computers and narrower on phones, so keep the important parts in the middle 1100 px; the left and right edges get trimmed on phones. Your otter stands in the bottom middle. Uploading a scene replaces the drawn willows, lily pads, lilies, sky and water shimmer. Optional overlays (transparent, can be animated GIF/WebP) sit on top of the background but under the otter: use them for moving water, bobbing lily pads or swaying reeds.',
    slots: [
      { id: 'base', name: 'Pond (default)' },
      { id: 'dawn', name: 'Dawn' }, { id: 'day', name: 'Day' }, { id: 'dusk', name: 'Dusk' }, { id: 'night', name: 'Night' },
      { id: 'overlay', name: 'Animated overlay (all day)', note: 'transparent; optional' },
      { id: 'overlay-night', name: 'Animated overlay at night', note: 'transparent; optional, replaces the overlay at night' },
    ],
  },
  {
    id: 'weather', size: '1600 × 1000', name: 'Weather overlays', tip: 'Transparent, 1600 × 1000 px, drawn over the pond and the otter (rain falls in front). Animated WebP/GIF works great here. Each one replaces the built-in effect for that weather.',
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
