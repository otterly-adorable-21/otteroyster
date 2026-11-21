// Small HTTP server: JSON API for the website + static hosting of the site itself.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname, sep } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon', '.txt': 'text/plain',
};
const MAX_BODY = 128 * 1024;

// Very small fixed-window rate limiter per IP + bucket.
function limiter(max, windowMs) {
  const hits = new Map();
  setInterval(() => hits.clear(), windowMs).unref();
  return (key) => {
    const n = (hits.get(key) || 0) + 1;
    hits.set(key, n);
    return n <= max;
  };
}

export function startHttp({ store, port, siteRoot, allowedOrigins, info }) {
  const linkLimit = limiter(10, 60_000);
  const apiLimit = limiter(240, 60_000);

  function cors(req, res) {
    const origin = req.headers.origin;
    if (origin && (allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
      res.setHeader('Access-Control-Max-Age', '600');
    }
  }

  const send = (res, status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  };

  async function body(req) {
    let size = 0;
    const chunks = [];
    for await (const c of req) {
      size += c.length;
      if (size > MAX_BODY) throw Object.assign(new Error('too large'), { status: 413 });
      chunks.push(c);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { throw Object.assign(new Error('bad json'), { status: 400 }); }
  }

  const authed = (req) => store.byToken((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));

  async function api(req, res, url) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
    if (!apiLimit(ip)) return send(res, 429, { error: 'Slow down a little!' });
    const route = `${req.method} ${url.pathname}`;

    switch (route) {
      case 'GET /api/info':
        return send(res, 200, { app: 'otteroyster', ...info() });

      case 'POST /api/link': {
        if (!linkLimit(ip)) return send(res, 429, { error: 'Too many tries. Wait a minute and run /link again.' });
        const b = await body(req);
        const r = store.link(b.code, b.state, b.keep === 'web' || b.keep === 'discord' ? b.keep : undefined);
        const { status, ...rest } = r;
        return send(res, status, rest);
      }

      case 'GET /api/save': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not linked' });
        return send(res, 200, { state: p.state, version: p.version, discordName: p.discordName });
      }

      case 'PUT /api/save': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not linked' });
        const b = await body(req);
        if (!b.state || typeof b.state !== 'object' || !Number.isInteger(b.version)) return send(res, 400, { error: 'Bad save' });
        const r = store.putSave(p.id, b.state, b.version);
        const { status, ...rest } = r;
        return send(res, status, rest);
      }

      case 'POST /api/score': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not linked' });
        const b = await body(req);
        const improved = store.recordScore(p.id, String(b.game || ''), b.score);
        return send(res, 200, { improved });
      }

      case 'GET /api/leaderboard': {
        const game = url.searchParams.get('game') || '';
        return send(res, 200, { top: store.leaderboard(game, 10) });
      }

      default:
        return send(res, 404, { error: 'Not found' });
    }
  }

  async function staticFile(req, res, url) {
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = normalize(join(siteRoot, rel));
    const blocked = !file.startsWith(siteRoot + sep) || rel.split('/').some((part) => part.startsWith('.')) || rel.startsWith('/server');
    if (blocked) { res.writeHead(404); return res.end('Not found'); }
    try {
      const st = await stat(file);
      if (!st.isFile()) throw new Error('not a file');
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    cors(req, res);
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    try {
      if (url.pathname.startsWith('/api/')) return await api(req, res, url);
      if (req.method === 'GET' || req.method === 'HEAD') return await staticFile(req, res, url);
      res.writeHead(405); res.end();
    } catch (err) {
      if (!res.headersSent) send(res, err.status || 500, { error: err.status ? err.message : 'Server error' });
      if (!err.status) console.error(err);
    }
  });
  server.listen(port, () => console.log(`🌊 OtterOyster web + API on http://localhost:${port}`));
  return server;
}
