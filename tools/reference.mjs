// Builds docs/REFERENCE.md: every Discord command, every art spot with its size,
// and every animation, straight from the game's code (so it never goes stale).
// The website feature list is written by hand at the bottom of this file.
//   node tools/reference.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { commands } from '../server/src/bot/commands.js';
import { GROUPS } from '../js/art.js';
import { SLOTS as ANIM } from '../js/animations.js';
import { SNACKS } from '../js/data.js';
import { TRICKS } from '../js/growth.js';

// ---------- hand-written parts ----------
const BRAND = [
  ['logo.png', '1672 × 941 (any wide banner)', 'Small in the top bar, large at the bottom of every page, adoption screen, link previews'],
  ['emblem.png', '1254 × 1254 (square)', 'Header badge, browser tab and phone icon; also Shelly\'s Discord avatar'],
  ['lily-border.png', '2172 × 724', 'Section dividers'],
  ['pond.png', '1344 × 896', 'Faded page background'],
  ['otter-float.png', '1024 × 1024', 'Discord section picture'],
  ['(Discord) avatar', '512 × 512 or larger', 'Upload in the Discord Developer Portal'],
  ['(Discord) banner', '680 × 240', 'Optional profile banner, Developer Portal'],
];

const WEBSITE = [
  ['Getting started', [
    'Adopt an otter: choose a **sea otter or river otter** (pictures of both), then name them',
    'Already have one? Load it from another device, Discord, or a backup file',
    'Existing otters choose sea or river once from the Otter tab',
  ]],
  ['Otter tab', [
    '**Care**: Cuddle, Bath, Nap / Wake, and 4 snacks (Kelp Chips, Clam, Fresh Fish, Oyster Cake); snacks from your pantry are free',
    '**Stats**: Full, Happy, Energy, Clean, level, XP, pearls; save status chip',
    '**Companion card**: play, treats, style (colors, patterns, accessories), switch companions, Companion Cove shop',
    '**Today**: daily gift, birthday party banner, seasonal event banner, today\'s mood, weather, 24-hour forecast, tides',
    '**The living pond**: day/night, shared weather, tides, seasonal effects, thought bubbles, sleeping poses, your companion beside your otter',
    '**Growing up**: Pup → Young (Lv 5) → Grown (Lv 10) → Wise (Lv 20), each with a free item; tell stories, learn 4 tricks, share wisdom; birthday (change once)',
    '**Legacy** (shown from level 18, claimable from Wise, level 20): 9 masteries × 4 tiers, Legacy stars, 8 Legend ranks, titles shown everywhere',
    '**Personality**: 6 traits that grow from how you play, each with a perk; favorite snack, place and game',
    '**Achievements**: 18 badges with pearl rewards',
    '**Journal** and **adventure book** of memories; rename, start over',
    '**Welcome back**: little stories of what your otter did while you were away',
    'Sign-in reminder if a Discord sign-in expires',
  ]],
  ['Den tab', [
    '**Inside**: drag furniture, flip, put away to storage; coziness score (counts every room); tap your otter to cuddle',
    '**Rooms**: the main den plus up to 3 more (250 pearls at Lv 3, 500 at Lv 6, 900 at Lv 10); each has its own name, wallpaper, floor and furniture; storage is shared; your otter follows you from room to room. Visitors and Discord see the main den',
    'Furniture shop tabs: Furniture, Decor, Plushies, Rugs, Wall, Seating, Beds, Tables & storage, Display cases, Fun, Walls & floors (46 wallpapers, 16 floors), with previews',
    '**Furniture you can use**: bookshelf (storybook library + Shell Mail), aquarium (go fishing every 3 h, 10 fish), arcade machine (opens the arcade), photo booth (picture with up to 3 friends, save or share)',
    '**Display cases** show your trinkets: shell cabinet, rock shelf, fossil display, pearl case, postcard wall, trophy cabinet',
    '**Garden** (Den tab, 🌱 button by the title): 6 plots (unlock by level), 7 crops, watering (rain helps, friends can water for +25%), harvest pearls and pantry snacks',
    '**Front door** (🚪 button by the title): 7 paints, 5 wreaths, 4 mats, 3 lights, 4 plants; shown on Otter Lane; +1 coziness each',
    'Birthday party decorations and sleepover guests appear in the den',
  ]],
  ['Closet tab', [
    'My clothes / Shop, with slot tabs: Hats, Clothing, Eyewear, Neckwear, Accessories, Extras, Footwear',
    'The Party Hat is a birthday special: only sold on your otter\'s birthday',
    '110+ items; 👀 try on before buying; confirm purchase (can turn off)',
    'Rare items from missions; limited items from seasonal events',
  ]],
  ['Explore tab', [
    '**The Pond Gazette**: today\'s happenings, Captain Barnacle\'s boat, community news (legendary finds, solved mysteries, new Legend ranks)',
    '**World map**: 7 places (pins show happenings and who\'s there), Pond Museum, Otter Lane',
    '**Explore** each place for discoveries (35 + event finds), trinkets (34) and lost storybooks (8); luck from weather, tides, happenings, species home waters, companions',
    '**Collection journal**; complete a place\'s set for a 🏅 and pearls',
    '**Missions** (5) that run in real time',
    '**Pond folk** (7): talk daily, do daily favors, unlock their stories',
    '**Mysteries** (4, with 4 chapters each) solved by visiting places at the right time, weather and tide',
    '**Lore Book** (44 pages) and **Treasures** pages (like the journal), **Captain Barnacle\'s boat** (30% off, about 3 days a week)',
    '**Pond Museum**: donate spares, first-donor credit, community milestones, top donors',
    '**Otter Lane**: stroll past dens, peek inside, add friends, hide your den',
    '**Seasonal events** (11 a year): tokens, daily quests, limited shop, limited discoveries',
  ]],
  ['Arcade tab', [
    '10 games: Oyster Dive, Fish Frenzy, Bubble Hop, Tide Fishing, Bubble Burst, Crab Catcher, Shell Match, Pearl Pop, Shell Shuffle, Word Tide',
    'Pearls, personal bests, shared leaderboards with Discord, challenge a friend to beat your score',
  ]],
  ['Friends tab', [
    'Friend codes and requests, friendship levels (hearts), visits, daily hugs, gifts',
    'Notices inbox (including friends\' birthdays), guestbook, Shell Mail postcards (arrive in 30 min), pen pals',
    'Visiting: pet-sit (snack/cuddle/bath), sleepover invites, water their garden, sign their guestbook',
    'Friend score challenges; sign in with Discord; device codes; account merging; save online without Discord',
  ]],
  ['Saving', [
    'Saves on the device and to the server automatically; works offline',
    'Back up to a file and restore; save chip shows the status',
  ]],
];

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const L = [];
const p = (s = '') => L.push(s);

p('# Otter & Oyster reference');
p();
p('Made by `node tools/reference.mjs` from the game itself. Contents: [Website](#website), [Discord commands](#discord-commands), [Art](#art), [Animations](#animations).');
p();

// ---------- website (hand-written) ----------
p('## Website');
p();
for (const [title, items] of WEBSITE) {
  p(`### ${title}`);
  for (const it of items) p(`- ${it}`);
  p();
}

// ---------- discord ----------
p('## Discord commands');
p();
p('Every command works in servers, in DMs with Shelly, and in any chat if the app is added to your account.');
p();
const fmtOpt = (o) => `${o.required ? '<' : '['}${o.name}${o.required ? '>' : ']'}`;
for (const c of commands) {
  const subs = (c.options || []).filter((o) => o.type === 1);
  const rows = subs.length ? subs.map((s) => [`/${c.name} ${s.name}`, s.options || [], s.description]) : [[`/${c.name}`, c.options || [], c.description]];
  for (const [name, opts, desc] of rows) {
    p(`- **\`${[name, ...opts.map(fmtOpt)].join(' ')}\`**: ${desc}`);
    for (const o of opts.filter((x) => x.choices?.length)) p(`  - ${o.name}: ${o.choices.map((x) => x.name).join(', ')}`);
  }
}
p();

// ---------- art ----------
const total = GROUPS.reduce((n, g) => n + g.slots.length, 0);
p('## Art');
p();
p(`**${total} picture spots** plus the brand art. Upload each file to the folder shown, named like the code (plus \`.png\`). PNG works everywhere; WebP/GIF only on the website. Until a spot has art, a drawn version shows. Live checklist with previews: \`/art.html\`.`);
p();
p('### Brand art (`assets/`)');
p('| File | Size | Where |');
p('| --- | --- | --- |');
for (const r of BRAND) p(`| \`${r[0]}\` | ${r[1]} | ${r[2]} |`);
p();
for (const g of GROUPS) {
  p(`### ${g.name} (\`assets/art/${g.id}/\`) · ${g.slots.length}`);
  p(g.tip);
  p();
  const bySize = {};
  for (const s of g.slots) (bySize[s.size || g.size || 'see tip'] ||= []).push(s);
  for (const [size, list] of Object.entries(bySize)) {
    p(`- **${size}**: ${list.map((s) => `\`${s.id}\`${s.emoji ? ` ${s.emoji}` : ''} ${s.name}${s.note ? ` _(${s.note})_` : ''}`).join(' · ')}`);
  }
  p();
}

// ---------- animations ----------
p('## Animations');
p();
p('Folder `assets/animations/`. **800 × 1016 px** (or half size, 400 × 508), the same canvas as the otter. Animated WebP, GIF, APNG or WebM with a transparent background, about 2–3 seconds. Where the pond isn\'t on screen they play in a pop-up.');
p();
p('| File | When it plays |');
p('| --- | --- |');
for (const [id, a] of Object.entries(ANIM)) p(`| \`${id}\` | ${a.label}${id === 'sleeping' ? ' (loops)' : ''} |`);
for (const sn of SNACKS) p(`| \`feed-${sn.id}\` | Eating ${sn.name} (optional, replaces \`feed\`) |`);
for (const t of TRICKS) p(`| \`trick-${t.id}\` | Performing ${t.name} |`);
p();
p(`**${Object.keys(ANIM).length + SNACKS.length + TRICKS.length} animations** in all. Optional settings (length, play on top instead of replacing): \`assets/animations/animations.json\`, see the README there.`);
p();

mkdirSync(`${ROOT}docs`, { recursive: true });
writeFileSync(`${ROOT}docs/REFERENCE.md`, L.join('\n'));
console.log(`docs/REFERENCE.md: ${commands.length} commands, ${total} art spots, ${Object.keys(ANIM).length + SNACKS.length + TRICKS.length} animations`);

