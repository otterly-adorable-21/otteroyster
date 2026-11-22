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

export function startHttp({ store, social, social2, museum, lane, auth, port, siteRoot, allowedOrigins, info }) {
  const linkLimit = limiter(10, 60_000);
  const loginLimit = limiter(10, 60_000);
  const registerLimit = limiter(20, 60_000);
  const apiLimit = limiter(240, 60_000);

  // Any website may call the API: it uses Bearer tokens (never cookies), so a page
  // can only act for a player whose token it already holds. This keeps the game
  // working from otteroyster.online, GitHub Pages, or a preview address alike.
  function cors(req, res) {
    if (!req.headers.origin) return;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  void allowedOrigins;

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
        return send(res, 200, { app: 'otteroyster', discordLogin: !!auth?.enabled, ...info() });

      // Bring a website-only account (or another account) into the signed-in one.
      // body: { token: <the other account's token>, keep: 'this' | 'other' }
      case 'POST /api/merge': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not signed in' });
        const b = await body(req);
        const other = store.byToken(String(b.token || ''));
        if (!other) return send(res, 404, { error: 'Nothing to merge.' });
        if (other.id !== p.id) {
          const keepState = b.keep === 'other' ? other.state : p.state;
          social.merge(p.id, other.id, keepState.name ? keepState : (other.state.name ? other.state : p.state));
        }
        const fresh = store.get(p.id);
        return send(res, 200, { state: fresh.state, version: fresh.version, discordName: fresh.discordName });
      }

      case 'POST /api/register': {
        if (!registerLimit(ip)) return send(res, 429, { error: 'Too many tries. Wait a minute.' });
        const b = await body(req);
        const { status, ...rest } = social.register(b.state);
        return send(res, status, rest);
      }

      case 'POST /api/link': {
        if (!linkLimit(ip)) return send(res, 429, { error: 'Too many tries. Wait a minute and run /link again.' });
        const b = await body(req);
        const me = authed(req);
        if (me) {
          // Already have a website account: merge it with the Discord one.
          const discordId = store.redeemCode(b.code);
          if (!discordId) return send(res, 400, { error: 'That code is invalid or expired. Run /link again in Discord.' });
          const d = store.get(discordId);
          const keep = b.keep === 'web' || b.keep === 'discord' ? b.keep : undefined;
          const web = b.state?.name ? b.state : me.state;
          if (d.id !== me.id && web?.name && d.state.name && !keep) return send(res, 409, { conflict: true, server: { name: d.state.name, level: d.state.level } });
          const finalState = keep === 'discord' || !web?.name ? d.state : web;
          if (d.id !== me.id) social.merge(d.id, me.id, finalState);
          store.consumeCode(b.code);
          const fresh = store.get(d.id);
          return send(res, 200, { token: (req.headers.authorization || '').replace(/^Bearer\s+/i, ''), state: fresh.state, version: fresh.version, discordName: fresh.discordName });
        }
        const r = store.link(b.code, b.state, b.keep === 'web' || b.keep === 'discord' ? b.keep : undefined);
        const { status, ...rest } = r;
        return send(res, status, rest);
      }

      case 'GET /api/save': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not linked' });
        return send(res, 200, { state: p.state, version: p.version, discordName: p.discordName, username: social.accounts.nameOf(p.id), code: social.codeOf(p.id) });
      }

      // Sign in with a sign-in name and password (no Discord needed).
      case 'POST /api/account/login': {
        if (!loginLimit(ip)) return send(res, 429, { error: 'Too many tries. Wait a minute.' });
        const { status, ...rest } = social.accounts.login(await body(req));
        return send(res, status, rest);
      }

      // Set or change this account's sign-in name and password.
      case 'POST /api/account/password': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not signed in' });
        if (!loginLimit(ip)) return send(res, 429, { error: 'Too many tries. Wait a minute.' });
        const { status, ...rest } = social.accounts.set(p.id, await body(req));
        return send(res, status, rest);
      }

      // Shareable, no sign-in needed: the public dens on Otter Lane and one den by link.
      case 'GET /api/public/lane': {
        const { status, ...rest } = lane.publicLane();
        return send(res, status, rest);
      }
      case 'GET /api/public/den': {
        const { status, ...rest } = lane.publicPeek(social.idByCode(String(url.searchParams.get('code') || '').toUpperCase()));
        return send(res, status, rest);
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

      case 'POST /api/device-code': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not signed in' });
        return send(res, 200, { code: store.makeLinkCode(p.id), expiresIn: 600 });
      }

      case 'GET /api/friends': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not signed in' });
        const { status, ...rest } = social.list(p.id);
        return send(res, status, rest);
      }

      case 'POST /api/friends/add':
      case 'POST /api/friends/respond':
      case 'POST /api/friends/remove':
      case 'POST /api/friends/hug':
      case 'POST /api/friends/gift': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not signed in' });
        const b = await body(req);
        const other = social.idByCode(b.code);
        const action = url.pathname.split('/').pop();
        const r = action === 'add' ? social.request(p.id, other)
          : action === 'respond' ? social.respond(p.id, other, !!b.accept)
            : action === 'remove' ? social.remove(p.id, other)
              : action === 'hug' ? social.hug(p.id, other, p.state.name || 'A friend')
                : social.gift(p.id, other, b);
        const { status, ...rest } = r;
        return send(res, status, rest);
      }

      case 'GET /api/friends/visit': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not signed in' });
        const other = social.idByCode(url.searchParams.get('code'));
        const { status, ...rest } = social.visit(p.id, other);
        if (status === 200) rest.guestbook = social2.guestbook(other).map((g) => ({ ...g, mine: g.authorCode === social.codeOf(p.id) }));
        return send(res, status, rest);
      }

      case 'GET /api/lane':
      case 'GET /api/lane/peek': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not signed in' });
        const r = route === 'GET /api/lane' ? lane.lane(p.id) : lane.peek(p.id, social.idByCode(url.searchParams.get('code')));
        const { status, ...rest } = r;
        return send(res, status, rest);
      }

      case 'GET /api/world': return send(res, 200, store.world());
      case 'POST /api/garden/water': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not signed in' });
        const b = await body(req);
        const { status, ...rest } = lane.waterFriend(p.id, social.idByCode(String(b.code || '').toUpperCase()));
        return send(res, status, rest);
      }
      case 'POST /api/lane/public': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not signed in' });
        const b = await body(req);
        const { status, ...rest } = lane.setPublic(p.id, b.on);
        return send(res, status, rest);
      }

      case 'GET /api/museum': {
        const p = authed(req);
        const { status, ...rest } = museum.view(p?.id || null);
        return send(res, status, rest);
      }

      case 'POST /api/museum/donate':
      case 'POST /api/museum/claim': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not signed in' });
        const b = await body(req);
        const r = route.endsWith('donate') ? museum.donate(p.id, String(b.find || '')) : museum.claim(p.id, b.pct);
        const { status, ...rest } = r;
        return send(res, status, rest);
      }

      case 'GET /api/inbox': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not signed in' });
        const { status, ...rest } = social2.inbox(p.id);
        return send(res, status, rest);
      }

      case 'POST /api/guestbook/sign':
      case 'POST /api/guestbook/delete':
      case 'POST /api/mail/send':
      case 'POST /api/mail/read':
      case 'POST /api/emote':
      case 'POST /api/sit':
      case 'POST /api/sleepover/invite':
      case 'POST /api/sleepover/respond':
      case 'POST /api/penpal/join':
      case 'POST /api/penpal/leave':
      case 'POST /api/challenge/send':
      case 'POST /api/challenge/answer': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not signed in' });
        const b = await body(req);
        const other = b.code ? social.idByCode(b.code) : null;
        const me = p.id;
        const r = {
          'POST /api/guestbook/sign': () => social2.sign(me, other, b.text),
          'POST /api/guestbook/delete': () => social2.unsign(me, b.id),
          'POST /api/mail/send': () => social2.sendMail(me, other, b.design, b.text),
          'POST /api/mail/read': () => social2.readMail(me, b.id),
          'POST /api/emote': () => social2.emote(me, other, b.emote),
          'POST /api/sit': () => social2.sit(me, other, b.action),
          'POST /api/sleepover/invite': () => social2.invite(me, other),
          'POST /api/sleepover/respond': () => social2.respondSleepover(me, other, !!b.accept),
          'POST /api/penpal/join': () => social2.joinPenpals(me),
          'POST /api/penpal/leave': () => social2.leavePenpal(me, other),
          'POST /api/challenge/send': () => social2.challenge(me, other, b.game, b.score),
          'POST /api/challenge/answer': () => social2.answerChallenges(me, String(b.game || ''), Number(b.score)),
        }[route]();
        const { status, ...rest } = r;
        return send(res, status, rest);
      }

      case 'GET /api/gifts': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not signed in' });
        const { status, ...rest } = social.inbox(p.id);
        return send(res, status, rest);
      }

      case 'POST /api/gifts/claim': {
        const p = authed(req);
        if (!p) return send(res, 401, { error: 'Not signed in' });
        const b = await body(req);
        const { status, ...rest } = social.claim(p.id, b.id);
        return send(res, status, rest);
      }

      case 'GET /api/leaderboard': {
        const game = url.searchParams.get('game') || '';
        // Discord names stay in Discord: the website (and shared links) show otter names only.
        return send(res, 200, { top: store.leaderboard(game, 10).map(({ name, score }) => ({ name, score })) });
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
    // www.otteroyster.online -> otteroyster.online
    const host = String(req.headers.host || '');
    if (host.startsWith('www.')) {
      res.writeHead(301, { Location: `https://${host.slice(4)}${req.url}` });
      return res.end();
    }
    cors(req, res);
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    try {
      if (url.pathname === '/auth/discord' || url.pathname === '/auth/discord/callback') {
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
        if (!apiLimit(ip)) { res.writeHead(429); return res.end('Slow down a little!'); }
        const r = url.pathname === '/auth/discord' ? auth.start(url.searchParams.get('return')) : await auth.callback(url.searchParams);
        res.writeHead(r.status, { Location: r.location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
        return res.end();
      }
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
