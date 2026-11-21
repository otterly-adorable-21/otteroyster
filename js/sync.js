// Talks to the OtterOyster server so the website and Discord bot share one pet.
// Everything here is optional: if the server is unreachable the game runs offline.
import { API_BASE, API_CANDIDATES } from './config.js';

const TOKEN_KEY = 'otteroyster.token';
const VERSION_KEY = 'otteroyster.version';

function ls(k, v) {
  try {
    if (v === undefined) return localStorage.getItem(k);
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch { /* storage blocked */ }
  return null;
}

let base = API_BASE;

async function call(path, { method = 'GET', body, auth = true, timeout = 8000, keepalive = false, at = base, token: useToken } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = useToken || ls(TOKEN_KEY);
    if (auth && token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${at}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: ctrl.signal, keepalive });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  } finally {
    clearTimeout(t);
  }
}

export const sync = {
  online: false,
  info: null,
  get linked() { return !!ls(TOKEN_KEY); },
  get version() { return Number(ls(VERSION_KEY) || 0); },
  set version(v) { ls(VERSION_KEY, String(v)); },

  tried: [],
  get base() { return base; },

  // Find the server: same address as the site first, then the configured fallback.
  async check() {
    this.online = false;
    this.info = null;
    this.tried = [];
    for (const at of API_CANDIDATES) {
      this.tried.push(at);
      try {
        const r = await call('/api/info', { auth: false, timeout: 4000, at });
        if (r.ok && r.data && r.data.app === 'otteroyster') {
          base = at;
          this.online = true;
          this.info = r.data;
          break;
        }
      } catch { /* try the next one */ }
    }
    return this.online;
  },

  // Returns { state, version, discord } or null.
  async pull() {
    if (!this.linked) return null;
    const r = await call('/api/save');
    if (r.status === 401) { this.unlink(); return null; }
    if (!r.ok) return null;
    return r.data;
  },

  // Returns { ok: true } or { conflict: true, state, version }.
  async push(state, { keepalive = false } = {}) {
    if (!this.linked) return { ok: false };
    const r = await call('/api/save', { method: 'PUT', body: { state, version: this.version }, keepalive });
    if (r.status === 409) return { conflict: true, ...r.data };
    if (r.status === 401) { this.unlink(); return { ok: false }; }
    if (r.ok) { this.version = r.data.version; return { ok: true }; }
    return { ok: false };
  },

  // keep: 'web' | 'discord' | undefined. Returns server response data with status.
  async link(code, state, keep) {
    // Send our token if we have one, so a website account and a Discord account merge.
    const r = await call('/api/link', { method: 'POST', body: { code, state, keep } });
    if (r.ok && r.data.token) {
      ls(TOKEN_KEY, r.data.token);
      this.version = r.data.version;
    }
    return { status: r.status, ...r.data };
  },

  unlink() {
    ls(TOKEN_KEY, null);
    ls(VERSION_KEY, null);
  },

  // Create an online account for the otter on this device (no Discord needed).
  async register(state) {
    const r = await call('/api/register', { method: 'POST', auth: false, body: { state } });
    if (r.ok && r.data.token) {
      ls(TOKEN_KEY, r.data.token);
      this.version = r.data.version;
    }
    return { status: r.status, ...r.data };
  },

  // Signed-in API helper: returns { status, ok, ...data }.
  async api(path, body) {
    const r = await call(path, body === undefined ? {} : { method: 'POST', body });
    if (r.status === 401) this.unlink();
    return { status: r.status, ok: r.ok, ...r.data };
  },
  get token() { return ls(TOKEN_KEY); },
  get discordLoginUrl() { return this.info?.discordLogin ? `${base}/auth/discord?return=${encodeURIComponent(location.origin + location.pathname)}` : null; },

  // Peek at an account by token without switching to it.
  async peek(token) {
    const r = await call('/api/save', { token });
    return r.ok ? r.data : null;
  },

  // Switch this device to the account behind `token`.
  useToken(token, version = 0) {
    ls(TOKEN_KEY, token);
    this.version = version;
  },

  // Merge the account behind `otherToken` into the account behind `intoToken`.
  // keep: 'this' (keep intoToken's otter) | 'other' (keep otherToken's otter)
  async merge(intoToken, otherToken, keep) {
    const r = await call('/api/merge', { method: 'POST', token: intoToken, body: { token: otherToken, keep } });
    return { status: r.status, ok: r.ok, ...r.data };
  },

  // One-time code to load this otter on another device (enter it like a /link code).
  deviceCode() { return this.api('/api/device-code', {}); },
  friends() { return this.api('/api/friends'); },
  inbox() { return this.api('/api/inbox'); },
  museum() { return this.api('/api/museum'); },
  museumDonate(find) { return this.api('/api/museum/donate', { find }); },
  museumClaim(pct) { return this.api('/api/museum/claim', { pct }); },
  lane() { return this.api('/api/lane'); },
  lanePeek(code) { return this.api(`/api/lane/peek?code=${encodeURIComponent(code)}`); },
  lanePublic(on) { return this.api('/api/lane/public', { on }); },
  waterFriend(code) { return this.api('/api/garden/water', { code }); },
  signGuestbook(code, text) { return this.api('/api/guestbook/sign', { code, text }); },
  deleteGuestbook(id) { return this.api('/api/guestbook/delete', { id }); },
  sendMail(code, design, text) { return this.api('/api/mail/send', { code, design, text }); },
  readMail(id) { return this.api('/api/mail/read', { id }); },
  emote(code, emote) { return this.api('/api/emote', { code, emote }); },
  sit(code, action) { return this.api('/api/sit', { code, action }); },
  sleepInvite(code) { return this.api('/api/sleepover/invite', { code }); },
  sleepRespond(code, accept) { return this.api('/api/sleepover/respond', { code, accept }); },
  penpalJoin() { return this.api('/api/penpal/join', {}); },
  penpalLeave(code) { return this.api('/api/penpal/leave', { code }); },
  challengeSend(code, game, score) { return this.api('/api/challenge/send', { code, game, score }); },
  challengeAnswer(game, score) { return this.api('/api/challenge/answer', { game, score }); },
  addFriend(code) { return this.api('/api/friends/add', { code }); },
  respond(code, accept) { return this.api('/api/friends/respond', { code, accept }); },
  removeFriend(code) { return this.api('/api/friends/remove', { code }); },
  visit(code) { return this.api(`/api/friends/visit?code=${encodeURIComponent(code)}`); },
  hug(code) { return this.api('/api/friends/hug', { code }); },
  gift(code, gift) { return this.api('/api/friends/gift', { code, ...gift }); },
  gifts() { return this.api('/api/gifts'); },
  claim(id) { return this.api('/api/gifts/claim', { id }); },

  async score(game, score) {
    if (!this.linked || !this.online) return;
    try { await call('/api/score', { method: 'POST', body: { game, score } }); } catch { /* ignore */ }
  },

  async leaderboard(game) {
    const r = await call(`/api/leaderboard?game=${encodeURIComponent(game)}`, { auth: false });
    return r.ok ? r.data.top : null;
  },
};
