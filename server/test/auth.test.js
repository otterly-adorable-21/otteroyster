import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../src/db.js';
import { createStore } from '../src/players.js';
import { createAuth } from '../src/auth.js';

const db = openDb(':memory:');
const store = createStore(db);

// Stand-in for Discord's OAuth endpoints.
const calls = [];
const fakeFetch = async (url, opts = {}) => {
  calls.push(url);
  if (url.endsWith('/oauth2/token')) {
    const body = new URLSearchParams(opts.body.toString());
    if (body.get('code') !== 'good-code') return { ok: false, json: async () => ({}) };
    assert.equal(body.get('client_secret'), 'shh');
    return { ok: true, json: async () => ({ access_token: 'at123' }) };
  }
  if (url.endsWith('/users/@me')) {
    assert.equal(opts.headers.Authorization, 'Bearer at123');
    return { ok: true, json: async () => ({ id: 'disc-oauth-1', username: 'shellyfan' }) };
  }
  throw new Error('unexpected ' + url);
};

const auth = createAuth({ store, db, clientId: 'app1', clientSecret: 'shh', publicUrl: 'https://otteroyster.online', siteUrl: 'https://otteroyster.online', allowedOrigins: ['https://otterly-adorable-21.github.io'], fetchImpl: fakeFetch });

test('sign in with Discord: start -> callback -> token for that Discord account', async () => {
  const s = auth.start();
  assert.equal(s.status, 302);
  const u = new URL(s.location);
  assert.equal(u.host, 'discord.com');
  assert.equal(u.searchParams.get('redirect_uri'), 'https://otteroyster.online/auth/discord/callback');
  assert.equal(u.searchParams.get('scope'), 'identify');
  const state = u.searchParams.get('state');

  const r = await auth.callback(new URLSearchParams({ code: 'good-code', state }));
  assert.match(r.location, /^https:\/\/otteroyster\.online\/#login=[0-9a-f]{64}$/);
  const token = r.location.split('#login=')[1];
  const p = store.byToken(token);
  assert.equal(p.discordId, 'disc-oauth-1');

  // the same Discord user signing in again gets the same account
  const s2 = new URL(auth.start().location).searchParams.get('state');
  const r2 = await auth.callback(new URLSearchParams({ code: 'good-code', state: s2 }));
  assert.equal(store.byToken(r2.location.split('#login=')[1]).id, p.id);
});

test('sign in with Discord: bad or reused state, cancel, and Discord errors are rejected', async () => {
  const state = new URL(auth.start().location).searchParams.get('state');
  assert.match((await auth.callback(new URLSearchParams({ code: 'good-code', state: 'nope' }))).location, /login-error=/);
  assert.match((await auth.callback(new URLSearchParams({ code: 'bad-code', state }))).location, /login-error=/);
  // state is single-use
  assert.match((await auth.callback(new URLSearchParams({ code: 'good-code', state }))).location, /login-error=.*expired/);
  assert.match((await auth.callback(new URLSearchParams({ error: 'access_denied' }))).location, /cancelled/);
});

test('sign in with Discord is off without a client secret', () => {
  const off = createAuth({ store, db, clientId: 'app1', clientSecret: '', publicUrl: 'https://x', siteUrl: 'https://x' });
  assert.equal(off.enabled, false);
  assert.match(off.start().location, /login-error=/);
});

test('sign in with Discord returns players to the page they came from (only trusted ones)', async () => {
  const st = (r) => new URL(r.location).searchParams.get('state');
  const a = await auth.callback(new URLSearchParams({ code: 'good-code', state: st(auth.start('https://otterly-adorable-21.github.io/otteroyster/?x=1')) }));
  assert.match(a.location, /^https:\/\/otterly-adorable-21\.github\.io\/otteroyster\/#login=[0-9a-f]{64}$/);
  const b = await auth.callback(new URLSearchParams({ code: 'good-code', state: st(auth.start('https://evil.example/steal')) }));
  assert.match(b.location, /^https:\/\/otteroyster\.online\/#login=/);
});
