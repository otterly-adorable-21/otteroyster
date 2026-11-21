import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { openDb } from '../src/db.js';
import { createStore } from '../src/players.js';
import { startHttp } from '../src/http.js';
import * as core from '../../js/core.js';

const store = createStore(openDb(':memory:'));
const server = startHttp({ store, port: 0, siteRoot: resolve(import.meta.dirname, '..', '..'), allowedOrigins: [], info: () => ({ invite: null }) });
await new Promise((r) => server.once('listening', r));
const base = `http://localhost:${server.address().port}`;
after(() => server.close());

const call = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body && JSON.stringify(body) });
  return { status: res.status, data: await res.json().catch(() => null), text: res.headers.get('content-type') };
};

test('info + static site', async () => {
  assert.equal((await call('/api/info')).data.app, 'otteroyster');
  const page = await fetch(`${base}/`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Otter Oyster/);
  assert.equal((await fetch(`${base}/server/.env`)).status, 404);
  assert.equal((await fetch(`${base}/../../etc/passwd`)).status, 404);
  assert.equal((await fetch(`${base}/.git/config`)).status, 404);
});

test('link: new Discord user adopts the website otter', async () => {
  const p = store.forDiscord({ id: 'd1', username: 'ana' });
  const code = store.makeLinkCode(p.id);
  const web = { ...core.defaultState(), name: 'Webby', pearls: 77 };
  const r = await call('/api/link', { method: 'POST', body: { code, state: web } });
  assert.equal(r.status, 200);
  assert.equal(r.data.state.name, 'Webby');
  assert.equal(store.getByDiscord('d1').state.pearls, 77);

  // code is single-use
  assert.equal((await call('/api/link', { method: 'POST', body: { code, state: web } })).status, 400);

  // save round trip with versioning
  const { token } = r.data;
  const g = await call('/api/save', { token });
  assert.equal(g.data.state.name, 'Webby');
  const st = { ...g.data.state, pearls: 90 };
  const put = await call('/api/save', { method: 'PUT', token, body: { state: st, version: g.data.version } });
  assert.equal(put.status, 200);

  // Discord changes it → website's stale version conflicts
  store.mutate(p.id, (s) => { s.pearls += 5; });
  const stale = await call('/api/save', { method: 'PUT', token, body: { state: st, version: put.data.version } });
  assert.equal(stale.status, 409);
  assert.equal(stale.data.state.pearls, 95);

  assert.equal((await call('/api/save', { token: 'nope' })).status, 401);
});

test('link: both sides have otters → ask, then keep the chosen one', async () => {
  const p = store.forDiscord({ id: 'd2', username: 'bo' });
  store.mutate(p.id, (s) => { s.name = 'Disco'; });
  const code = store.makeLinkCode(p.id);
  const web = { ...core.defaultState(), name: 'Webster' };
  const r1 = await call('/api/link', { method: 'POST', body: { code, state: web } });
  assert.equal(r1.status, 409);
  assert.equal(r1.data.server.name, 'Disco');
  const r2 = await call('/api/link', { method: 'POST', body: { code, state: web, keep: 'discord' } });
  assert.equal(r2.status, 200);
  assert.equal(r2.data.state.name, 'Disco');
});

test('scores + leaderboard (lower-is-better games sort ascending)', async () => {
  const a = store.forDiscord({ id: 'd1' });
  const b = store.forDiscord({ id: 'd2' });
  store.recordScore(a.id, 'dive', 30);
  store.recordScore(b.id, 'dive', 50);
  store.recordScore(a.id, 'dive', 10); // not a best, ignored
  assert.deepEqual((await call('/api/leaderboard?game=dive')).data.top.map((r) => r.score), [50, 30]);
  store.recordScore(a.id, 'memory', 14);
  store.recordScore(b.id, 'memory', 9);
  assert.deepEqual((await call('/api/leaderboard?game=memory')).data.top.map((r) => r.score), [9, 14]);
  assert.equal(store.recordScore(a.id, 'not-a-game', 5), false);
});

test('Discord pearl income is capped per day', () => {
  const p = store.forDiscord({ id: 'd1' });
  let total = 0;
  for (let k = 0; k < 20; k++) total += store.award(p.id, 50, 'test');
  assert.equal(total, 300);
});

test('link endpoint is rate limited', async () => {
  let limited = false;
  for (let k = 0; k < 15; k++) if ((await call('/api/link', { method: 'POST', body: { code: 'XXXXXX' } })).status === 429) limited = true;
  assert.ok(limited);
});
