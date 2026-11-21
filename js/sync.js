// Talks to the OtterOyster server so the website and Discord bot share one pet.
// Everything here is optional: if the server is unreachable the game runs offline.
import { API_BASE } from './config.js';

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

async function call(path, { method = 'GET', body, auth = true, timeout = 8000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = ls(TOKEN_KEY);
    if (auth && token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: ctrl.signal });
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

  async check() {
    try {
      const r = await call('/api/info', { auth: false, timeout: 4000 });
      this.online = r.ok && r.data && r.data.app === 'otteroyster';
      this.info = this.online ? r.data : null;
    } catch {
      this.online = false;
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
  async push(state) {
    if (!this.linked) return { ok: false };
    const r = await call('/api/save', { method: 'PUT', body: { state, version: this.version } });
    if (r.status === 409) return { conflict: true, ...r.data };
    if (r.status === 401) { this.unlink(); return { ok: false }; }
    if (r.ok) { this.version = r.data.version; return { ok: true }; }
    return { ok: false };
  },

  // keep: 'web' | 'discord' | undefined. Returns server response data with status.
  async link(code, state, keep) {
    const r = await call('/api/link', { method: 'POST', auth: false, body: { code, state, keep } });
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
  friends() { return this.api('/api/friends'); },
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
