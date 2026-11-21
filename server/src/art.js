// Loads uploaded art (assets/art, listed in manifest.json) so Shelly's Discord
// pictures use it too. Images are embedded as data URIs for the SVG renderer.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { setArt } from '../../js/art.js';

const RENDERED = ['otter/', 'clothes/', 'furniture/', 'wallpaper/', 'floor/', 'den/'];
const MIME = { png: 'image/png', gif: 'image/gif', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml' };

export function loadServerArt(root) {
  const dir = join(root, 'assets/art');
  const manifest = join(dir, 'manifest.json');
  if (!existsSync(manifest)) return 0;
  try {
    const { files = {} } = JSON.parse(readFileSync(manifest, 'utf8'));
    const map = {};
    for (const [key, rel] of Object.entries(files)) {
      const ext = rel.split('.').pop().toLowerCase();
      if (!RENDERED.some((g) => key.startsWith(g)) || !MIME[ext]) continue;
      const p = join(dir, rel);
      if (existsSync(p)) map[key] = `data:${MIME[ext]};base64,${readFileSync(p).toString('base64')}`;
    }
    setArt(map);
    return Object.keys(map).length;
  } catch (e) {
    console.warn('⚠️  Could not load custom art:', e.message);
    return 0;
  }
}
