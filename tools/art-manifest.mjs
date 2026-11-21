// Rebuilds assets/art/manifest.json (which uploaded art exists) and the README
// in every art folder. Runs automatically on GitHub after art is uploaded
// (.github/workflows/art-manifest.yml); run it by hand with:
//   node tools/art-manifest.mjs
import { readdirSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GROUPS } from '../js/art.js';
import { SLOTS as ANIM_SLOTS } from '../js/animations.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ART = join(ROOT, 'assets/art');
const ANIM = join(ROOT, 'assets/animations');
// PNG first: it works on the website and in Shelly's Discord pictures (WebP only works on the website).
const PREFER = ['.png', '.webp', '.gif', '.webm', '.jpg', '.jpeg', '.svg'];

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return [p];
  });
}

const files = {};
const add = (key, rel) => {
  const ext = extname(rel).toLowerCase();
  if (!PREFER.includes(ext)) return;
  if (files[key] && PREFER.indexOf(extname(files[key]).toLowerCase()) <= PREFER.indexOf(ext)) return;
  files[key] = rel;
};

for (const p of walk(ART)) {
  const rel = relative(ART, p).split('\\').join('/');
  if (rel.split('/').some((part) => part.startsWith('_') || part.startsWith('.'))) continue; // templates, hidden
  if (statSync(p).size === 0) continue; // empty uploads
  add(rel.slice(0, -extname(rel).length).toLowerCase(), rel);
}
for (const p of walk(ANIM)) {
  const rel = relative(ANIM, p).split('\\').join('/');
  if (rel.includes('/') || statSync(p).size === 0) continue;
  if (rel === 'animations.json') { files['animations/_config'] = '../animations/animations.json'; continue; }
  add(`animations/${rel.slice(0, -extname(rel).length).toLowerCase()}`, `../animations/${rel}`);
}

const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
mkdirSync(ART, { recursive: true });
writeFileSync(join(ART, 'manifest.json'), `${JSON.stringify({ note: 'Made automatically by tools/art-manifest.mjs. Do not edit.', files: sorted }, null, 2)}\n`);

// A README in each folder listing its upload spots.
for (const g of GROUPS) {
  const dir = join(ART, g.id);
  mkdirSync(dir, { recursive: true });
  const rows = g.slots.map((s) => {
    const have = files[`${g.id}/${s.id}`];
    return `| ${have ? '✅' : '⬜'} | \`${s.id}\` | ${s.emoji ? `${s.emoji} ` : ''}${s.name} | ${s.size || g.size || ''} | ${s.note || ''} |`;
  });
  writeFileSync(join(dir, 'README.md'), `# ${g.name}

${g.tip}

Upload files named exactly like the **File name** column, plus the extension
(\`.png\` is best: it also works in Shelly's Discord pictures. \`.webp\` and animated \`.gif\` work on the website), e.g. \`${g.slots[0].id}.png\`. Use lowercase.
The website picks them up a minute or two after you upload. Until then, and for
any spot left empty, the drawn version stays.

| | File name | What | Size (px) | Notes |
| --- | --- | --- | --- | --- |
${rows.join('\n')}
`);
}

// The art folder's own README (overview).
const total = GROUPS.reduce((n, g) => n + g.slots.length, 0);
const done = GROUPS.reduce((n, g) => n + g.slots.filter((s) => files[`${g.id}/${s.id}`]).length, 0);
writeFileSync(join(ART, 'README.md'), `# Art upload spots

Drop a picture into the right folder with the right name and it replaces the
drawn version on the website (and in Shelly's Discord pictures for the otter,
clothes and den). **${done} of ${total}** spots have art so far.

See every spot with a live preview on the site's art checklist page: \`/art.html\`.

| Folder | What goes there | Spots |
| --- | --- | --- |
${GROUPS.map((g) => `| [\`${g.id}/\`](${g.id}/) | ${g.name} | ${g.slots.filter((s) => files[`${g.id}/${s.id}`]).length}/${g.slots.length} |`).join('\n')}

Animations live in [\`../animations/\`](../animations/) (${Object.keys(ANIM_SLOTS).length} moments plus tricks and per-snack ones).

**Tips**
- Upload with the final file name. Renaming images on GitHub's website has emptied them before.
- Transparent PNG or WebP for anything that sits on top of something else.
- Files or folders starting with \`_\` are ignored (handy for templates and drafts).
`);

console.log(`art manifest: ${Object.keys(sorted).length} files (${done}/${total} spots)`);
