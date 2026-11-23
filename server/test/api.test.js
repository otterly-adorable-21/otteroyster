import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { openDb } from '../src/db.js';
import { createStore } from '../src/players.js';
import { createSocial } from '../src/social.js';
import { createSocial2 } from '../src/social2.js';
import { createMuseum } from '../src/museum.js';
import { createNeighborhood } from '../src/neighborhood.js';
import { startHttp } from '../src/http.js';
import * as core from '../../js/core.js';
import { weatherAt } from '../../js/ambience.js';

const db = openDb(':memory:');
const store = createStore(db);
const social = createSocial(db, store);
const social2 = createSocial2(db, store, social);
const museum = createMuseum(db, store);
const lane = createNeighborhood(db, store, social);
const server = startHttp({ store, social, social2, museum, lane, port: 0, siteRoot: resolve(import.meta.dirname, '..', '..'), allowedOrigins: [], info: () => ({ invite: null }) });
await new Promise((r) => server.once('listening', r));
const base = `http://localhost:${server.address().port}`;
after(() => server.close());

const call = async (path, { method = 'GET', body, token, ip } = {}) => {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(ip ? { 'X-Forwarded-For': ip } : {}) }, body: body && JSON.stringify(body) });
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


test('friends: register, request, accept, visit, hug, gifts', async () => {
  const mk = (name, extra = {}) => ({ ...core.defaultState(), name, pearls: 200, ...extra });
  const A = (await call('/api/register', { method: 'POST', body: { state: mk('Ana') } })).data;
  const B = (await call('/api/register', { method: 'POST', body: { state: mk('Bo') } })).data;
  assert.match(A.code, /^OTR-[A-Z0-9]{5}$/);
  assert.equal((await call('/api/register', { method: 'POST', body: { state: core.defaultState() } })).status, 400);

  // request + accept
  assert.equal((await call('/api/friends/add', { method: 'POST', token: A.token, body: { code: A.code } })).status, 400);
  assert.equal((await call('/api/friends/add', { method: 'POST', token: A.token, body: { code: 'OTR-NOPE0' } })).status, 404);
  const req = await call('/api/friends/add', { method: 'POST', token: A.token, body: { code: B.code } });
  assert.equal(req.data.accepted, false);
  let lb = (await call('/api/friends', { token: B.token })).data;
  assert.equal(lb.incoming.length, 1);
  assert.equal(lb.incoming[0].name, 'Ana');
  assert.equal((await call('/api/friends/visit?code=' + A.code, { token: B.token })).status, 403);
  await call('/api/friends/respond', { method: 'POST', token: B.token, body: { code: A.code, accept: true } });
  lb = (await call('/api/friends', { token: B.token })).data;
  assert.equal(lb.friends.length, 1);

  // visit shows the otter + den, and grows friendship once a day
  const v = (await call('/api/friends/visit?code=' + B.code, { token: A.token })).data;
  assert.equal(v.otter.name, 'Bo');
  assert.ok(Array.isArray(v.otter.den.items));
  await call('/api/friends/visit?code=' + B.code, { token: A.token });
  assert.equal((await call('/api/friends', { token: A.token })).data.friends[0].points, 1);

  // hug: once a day, cheers up the other otter
  const bBefore = store.byToken(B.token).state.stats.happiness;
  assert.equal((await call('/api/friends/hug', { method: 'POST', token: A.token, body: { code: B.code } })).status, 200);
  assert.equal((await call('/api/friends/hug', { method: 'POST', token: A.token, body: { code: B.code } })).status, 429);
  assert.ok(store.byToken(B.token).state.stats.happiness > bBefore - 1);

  // gifts: pearls (daily cap) and furniture from storage
  const g1 = await call('/api/friends/gift', { method: 'POST', token: A.token, body: { code: B.code, kind: 'pearls', amount: 50, note: 'hi <b>' } });
  assert.equal(g1.status, 200);
  assert.equal(g1.data.state.pearls, 150);
  assert.equal((await call('/api/friends/gift', { method: 'POST', token: A.token, body: { code: B.code, kind: 'pearls', amount: 60 } })).status, 400);
  assert.equal((await call('/api/friends/gift', { method: 'POST', token: A.token, body: { code: B.code, kind: 'furniture', item: 'shellbed' } })).status, 400); // still placed in den
  const aId = store.byToken(A.token).id;
  store.mutate(aId, (s) => { const bed = s.den.items.find((p) => p.id === 'shellbed'); core.storeItem(s, bed.uid); });
  assert.equal((await call('/api/friends/gift', { method: 'POST', token: A.token, body: { code: B.code, kind: 'furniture', item: 'shellbed' } })).status, 200);
  const inbox = (await call('/api/gifts', { token: B.token })).data.gifts;
  assert.equal(inbox.length, 2);
  assert.equal(inbox.find((g) => g.kind === 'pearls').note, 'hi b');
  const before = store.byToken(B.token).state;
  const opened = (await call('/api/gifts/claim', { method: 'POST', token: B.token, body: { id: 'all' } })).data;
  assert.equal(opened.opened.length, 2);
  assert.equal(opened.state.pearls, before.pearls + 50);
  assert.equal(opened.state.furniture.shellbed, (before.furniture.shellbed || 0) + 1);
  assert.equal((await call('/api/gifts/claim', { method: 'POST', token: B.token, body: { id: 'all' } })).status, 404);
  assert.ok((await call('/api/friends', { token: A.token })).data.friends[0].points >= 6);
});

test('linking Discord to an existing website account merges them', async () => {
  const W = (await call('/api/register', { method: 'POST', body: { state: { ...core.defaultState(), name: 'Webbo' } } })).data;
  const F = (await call('/api/register', { method: 'POST', body: { state: { ...core.defaultState(), name: 'Pal' } } })).data;
  await call('/api/friends/add', { method: 'POST', token: W.token, body: { code: F.code } });
  await call('/api/friends/respond', { method: 'POST', token: F.token, body: { code: W.code, accept: true } });
  // a Discord user with their own otter runs /link
  const d = store.forDiscord({ id: 'disc-merge', username: 'webbo_on_discord' });
  store.mutate(d.id, (s) => { s.name = 'Discotter'; });
  const code = store.makeLinkCode(d.id);
  const ask = await call('/api/link', { method: 'POST', token: W.token, body: { code, state: store.byToken(W.token).state } });
  assert.equal(ask.status, 409);
  const done = await call('/api/link', { method: 'POST', token: W.token, body: { code, state: store.byToken(W.token).state, keep: 'web' } });
  assert.equal(done.status, 200);
  assert.equal(done.data.token, W.token);
  const merged = store.byToken(W.token);
  assert.equal(merged.discordId, 'disc-merge');
  assert.equal(merged.state.name, 'Webbo');
  // friends and friend code survived the merge
  const list = (await call('/api/friends', { token: W.token })).data;
  assert.equal(list.friends.length, 1);
  assert.equal(list.friends[0].name, 'Pal');
  assert.equal(list.code, W.code);
});

test('device codes load the same otter on another device', async () => {
  const A = (await call('/api/register', { method: 'POST', body: { state: { ...core.defaultState(), name: 'Roamer', pearls: 321 } } })).data;
  assert.equal((await call('/api/device-code', { method: 'POST', body: {} })).status, 401);
  const { code } = (await call('/api/device-code', { method: 'POST', token: A.token, body: {} })).data;
  assert.match(code, /^[A-Z2-9]{6}$/);
  // a fresh device with no otter of its own
  const fresh = await call('/api/link', { method: 'POST', body: { code } });
  assert.equal(fresh.status, 200);
  assert.equal(fresh.data.state.name, 'Roamer');
  assert.equal(fresh.data.state.pearls, 321);
  assert.notEqual(fresh.data.token, A.token);
  assert.equal((await call('/api/save', { token: fresh.data.token })).data.state.name, 'Roamer');
});

test('merge: bring a website account into a Discord account', async () => {
  const W = (await call('/api/register', { method: 'POST', body: { state: { ...core.defaultState(), name: 'Websy', pearls: 77 } } })).data;
  const d = store.forDiscord({ id: 'disc-merge-2', username: 'mergey' });
  store.mutate(d.id, (s) => { s.name = 'Discy'; });
  const { randomBytes, createHash } = await import('node:crypto');
  const dTok = randomBytes(32).toString('hex');
  db.prepare('INSERT INTO tokens (hash, player_id, created) VALUES (?, ?, ?)').run(createHash('sha256').update(dTok).digest('hex'), d.id, Date.now());
  const r = await call('/api/merge', { method: 'POST', token: dTok, body: { token: W.token, keep: 'other' } });
  assert.equal(r.status, 200);
  assert.equal(r.data.state.name, 'Websy');
  assert.equal(r.data.state.pearls, 77);
  // the old website token now opens the merged Discord account
  assert.equal(store.byToken(W.token).discordId, 'disc-merge-2');
});

test('social part 2: guestbook, mail, emotes, sitting, sleepovers, pen pals, challenges', async () => {
  const reg = async (name) => (await call('/api/register', { method: 'POST', body: { state: { ...core.defaultState(), name, pearls: 100 } } })).data;
  const A = await reg('Ada'); const B = await reg('Bea'); const C = await reg('Cal');
  await call('/api/friends/add', { method: 'POST', token: A.token, body: { code: B.code } });
  await call('/api/friends/respond', { method: 'POST', token: B.token, body: { code: A.code, accept: true } });

  // guestbook: friends only, cleaned text, notice to owner, delete
  assert.equal((await call('/api/guestbook/sign', { method: 'POST', token: C.token, body: { code: A.code, text: 'hi' } })).status, 403);
  assert.equal((await call('/api/guestbook/sign', { method: 'POST', token: B.token, body: { code: A.code, text: 'You are <b>stupid</b> cute' } })).status, 200);
  let inbox = (await call('/api/inbox', { token: A.token })).data;
  assert.equal(inbox.guestbook[0].text, 'You are 🦦 cute');
  assert.ok(inbox.notices.some((n) => n.kind === 'guestbook'));
  assert.equal((await call('/api/inbox', { token: A.token })).data.notices.length, 0, 'notices are shown once');
  const v = (await call('/api/friends/visit?code=' + A.code, { token: B.token })).data;
  assert.equal(v.guestbook.length, 1);
  assert.equal(v.guestbook[0].mine, true);
  await call('/api/guestbook/delete', { method: 'POST', token: A.token, body: { id: inbox.guestbook[0].id } });
  assert.equal((await call('/api/inbox', { token: A.token })).data.guestbook.length, 0);

  // Shell Mail: arrives after the seagull flight
  assert.equal((await call('/api/mail/send', { method: 'POST', token: C.token, body: { code: A.code, text: 'hey' } })).status, 403);
  const sent = await call('/api/mail/send', { method: 'POST', token: B.token, body: { code: A.code, design: 'reef', text: 'Greetings from the reef!' } });
  assert.equal(sent.status, 200);
  inbox = (await call('/api/inbox', { token: A.token })).data;
  assert.equal(inbox.mail.length, 0);
  assert.equal(inbox.mailInFlight, 1);
  db.prepare('UPDATE mail SET deliver_at = 0').run();
  inbox = (await call('/api/inbox', { token: A.token })).data;
  assert.equal(inbox.mail[0].text, 'Greetings from the reef!');
  assert.equal(inbox.mailUnread, 1);
  await call('/api/mail/read', { method: 'POST', token: A.token, body: { id: inbox.mail[0].id } });
  assert.equal((await call('/api/inbox', { token: A.token })).data.mailUnread, 0);

  // emotes: once per kind per day
  assert.equal((await call('/api/emote', { method: 'POST', token: B.token, body: { code: A.code, emote: 'wave' } })).status, 200);
  assert.equal((await call('/api/emote', { method: 'POST', token: B.token, body: { code: A.code, emote: 'wave' } })).status, 429);
  assert.match((await call('/api/inbox', { token: A.token })).data.notices[0].text, /waved at you/);

  // pet-sitting changes the friend's otter
  const before = store.byToken(A.token).state.stats.clean;
  store.mutate(store.byToken(A.token).id, (s) => { s.stats.clean = 20; });
  assert.equal((await call('/api/sit', { method: 'POST', token: B.token, body: { code: A.code, action: 'bath' } })).status, 200);
  assert.ok(store.byToken(A.token).state.stats.clean >= 50);
  assert.equal((await call('/api/sit', { method: 'POST', token: B.token, body: { code: A.code, action: 'bath' } })).status, 429);
  void before;

  // sleepover: invite -> accept -> both happier, guest shows for host
  assert.equal((await call('/api/sleepover/invite', { method: 'POST', token: A.token, body: { code: B.code } })).status, 200);
  assert.equal((await call('/api/inbox', { token: B.token })).data.sleepovers[0].status, 'invited');
  assert.equal((await call('/api/sleepover/respond', { method: 'POST', token: B.token, body: { code: A.code, accept: true } })).status, 200);
  const hostView = (await call('/api/inbox', { token: A.token })).data.sleepovers[0];
  assert.equal(hostView.hosting, true);
  assert.equal(hostView.status, 'accepted');
  assert.equal(hostView.name, 'Bea');

  // pen pals: two strangers get matched and can mail each other
  assert.equal((await call('/api/penpal/join', { method: 'POST', token: C.token, body: {} })).data.matched, false);
  const D = await reg('Dot');
  const m = (await call('/api/penpal/join', { method: 'POST', token: D.token, body: {} })).data;
  assert.equal(m.matched, true);
  assert.equal(m.pal, 'Cal');
  assert.equal((await call('/api/mail/send', { method: 'POST', token: D.token, body: { code: C.code, text: 'Hi pen pal!' } })).status, 200);

  // challenges: B dares A; A plays and wins; B hears about it
  assert.equal((await call('/api/challenge/send', { method: 'POST', token: B.token, body: { code: A.code, game: 'dive', score: 20 } })).status, 200);
  assert.equal((await call('/api/inbox', { token: A.token })).data.challenges.length, 1);
  const ans = (await call('/api/challenge/answer', { method: 'POST', token: A.token, body: { game: 'dive', score: 31 } })).data;
  assert.equal(ans.results[0].won, true);
  assert.match((await call('/api/inbox', { token: B.token })).data.notices.map((n) => n.text).join(' '), /beat your 20/);
  // lower-is-better games compare the other way
  await call('/api/challenge/send', { method: 'POST', token: B.token, body: { code: A.code, game: 'memory', score: 12 } });
  assert.equal((await call('/api/challenge/answer', { method: 'POST', token: A.token, body: { game: 'memory', score: 10 } })).data.results[0].won, true);
});

test('museum: donate spares, first-donor credit, community milestones', async () => {
  const reg = async (name, collection) => (await call('/api/register', { method: 'POST', body: { state: { ...core.defaultState(), name, collection } } })).data;
  const A = await reg('Musa', { crab: 3, spiral: 1 });
  const B = await reg('Nemo', { crab: 2 });
  assert.equal((await call('/api/museum/donate', { method: 'POST', token: A.token, body: { find: 'spiral' } })).status, 400, 'only spares');
  const d1 = await call('/api/museum/donate', { method: 'POST', token: A.token, body: { find: 'crab' } });
  assert.equal(d1.status, 200);
  assert.equal(d1.data.first, true);
  assert.equal(d1.data.state.collection.crab, 2);
  const d2 = await call('/api/museum/donate', { method: 'POST', token: B.token, body: { find: 'crab' } });
  assert.equal(d2.data.first, false);
  const v = (await call('/api/museum', { token: B.token })).data;
  assert.equal(v.exhibits.crab.count, 2);
  assert.equal(v.exhibits.crab.first.by, 'Musa');
  assert.deepEqual(v.patrons.map((x) => x.name).sort(), ['Musa', 'Nemo']);
  assert.equal(v.species, 1);
  assert.equal((await call('/api/museum/claim', { method: 'POST', token: A.token, body: { pct: 10 } })).status, 400, 'not reached yet');
  // fill 10% of the museum and claim
  const ids = Object.keys((await import('../src/museum.js')).ALL_FINDS).slice(0, 5);
  for (const id of ids) db.prepare('INSERT INTO museum (player_id, find_id, created) VALUES (?, ?, ?)').run('x', id, Date.now());
  const c = await call('/api/museum/claim', { method: 'POST', token: A.token, body: { pct: 10 } });
  assert.equal(c.status, 200);
  assert.equal((await call('/api/museum/claim', { method: 'POST', token: A.token, body: { pct: 10 } })).status, 400, 'once each');
  assert.equal((await call('/api/museum')).data.you, null, 'public view works signed out');
});

test('Otter Lane: friends and public neighbors, private dens stay private', async () => {
  const reg = async (name) => (await call('/api/register', { method: 'POST', body: { state: { ...core.defaultState(), name } } })).data;
  const L = await reg('Lane'); const F = await reg('Fren'); const N = await reg('Neigh'); const P = await reg('Priv');
  await call('/api/friends/add', { method: 'POST', token: L.token, body: { code: F.code } });
  await call('/api/friends/respond', { method: 'POST', token: F.token, body: { code: L.code, accept: true } });
  await call('/api/lane/public', { method: 'POST', token: P.token, body: { on: false } });
  const v = (await call('/api/lane', { token: L.token })).data;
  assert.equal(v.you.name, 'Lane');
  assert.deepEqual(v.friends.map((h) => h.name), ['Fren']);
  const names = v.neighbors.map((h) => h.name);
  assert.ok(v.neighbors.length > 0 && v.neighbors.length <= 12, 'shows a handful of neighbors');
  assert.ok(!names.includes('Priv'), 'private dens are not on the lane');
  assert.ok(!names.includes('Lane'), 'you are not your own neighbor');
  assert.ok(!names.includes('Fren'), 'friends are not repeated as neighbors');
  const peek = await call('/api/lane/peek?code=' + N.code, { token: L.token });
  assert.equal(peek.status, 200);
  assert.equal(peek.data.friend, false);
  assert.ok(Array.isArray(peek.data.otter.den.items));
  assert.equal((await call('/api/lane/peek?code=' + P.code, { token: L.token })).status, 403);
  assert.ok(store.byToken(L.token).state.counters.visited.length >= 1, 'peeks count toward Good Neighbor');
});

// Runs last: it deliberately uses up the link rate limit.
test('link endpoint is rate limited', async () => {
  let limited = false;
  for (let k = 0; k < 15; k++) if ((await call('/api/link', { method: 'POST', body: { code: 'XXXXXX' } })).status === 429) limited = true;
  assert.ok(limited);
});

test('friends can water your garden for a bonus, and Otter Lane shows doors and companions', async () => {
  const mk = (name) => ({ ...core.defaultState(), name, pearls: 200 });
  const A = (await call('/api/register', { method: 'POST', body: { state: mk('Gardener') } })).data;
  const B = (await call('/api/register', { method: 'POST', body: { state: mk('Helper') } })).data;
  await call('/api/friends/add', { method: 'POST', token: B.token, body: { code: A.code } });
  await call('/api/friends/respond', { method: 'POST', token: A.token, body: { code: B.code, accept: true } });
  const pa = store.byToken(A.token);
  store.mutate(pa.id, (s) => {
    s.garden.plots[0] = { crop: 'lily', plantedAt: Date.now(), wateredAt: null, growMs: 0 };
    s.door.wreath = 'wreath-lily'; s.doorItems.push('wreath-lily');
    s.companions.owned.duckling = { name: 'Pip', bond: 50, lastPlay: Date.now() };
    s.companions.active = 'duckling';
  });
  const before = store.byToken(B.token).state.pearls;
  const v = (await call('/api/friends/visit?code=' + A.code, { token: B.token })).data;
  if (weatherAt(Date.now()) === 'rainy') {
    assert.equal(v.garden.dry, 0); // the rain got there first
  } else {
    assert.equal(v.garden.dry, 1);
    const w = await call('/api/garden/water', { method: 'POST', token: B.token, body: { code: A.code } });
    assert.equal(w.status, 200, JSON.stringify(w.data));
    assert.equal(w.data.state.pearls, before + 3);
    assert.ok(store.get(pa.id).state.garden.plots[0].friend);
  }
  assert.equal((await call('/api/garden/water', { method: 'POST', token: B.token, body: { code: A.code } })).status, 409);
  const lane = (await call('/api/lane', { token: B.token })).data;
  const house = lane.friends.find((h) => h.name === 'Gardener');
  assert.equal(house.door.wreath, 'wreath-lily');
  assert.equal(house.companion, 'duckling');
});

test('the Pond Gazette hears about big moments', async () => {
  const mk = (name) => ({ ...core.defaultState(), name, pearls: 200 });
  const A = (await call('/api/register', { method: 'POST', body: { state: mk('Moonie') } })).data;
  const p = store.byToken(A.token);
  store.mutate(p.id, (s) => { s.collection.rainbowpearl = 1; s.lore.solved.push('song'); });
  const w = (await call('/api/world')).data;
  assert.ok(w.feed.some((f) => /Moonie found a legendary/.test(f.text)), JSON.stringify(w.feed));
  assert.ok(w.feed.some((f) => /Moonie solved the mystery “The Singing Shell”/.test(f.text)));
  assert.ok(w.activeToday >= 1);
});

test('sign-in name and password: set, log in elsewhere, mistakes', async () => {
  const a = await call('/api/register', { method: 'POST', ip: '10.9.9.9', body: { state: { ...core.defaultState(), name: 'Pebble' } } });
  assert.equal(a.status, 200);
  const tok = a.data.token;
  assert.equal((await call('/api/account/password', { method: 'POST', ip: '10.9.9.9', token: tok, body: { username: 'x', password: 'longenough' } })).status, 400);
  assert.equal((await call('/api/account/password', { method: 'POST', ip: '10.9.9.9', token: tok, body: { username: 'pebble_otter', password: 'short' } })).status, 400);
  const set = await call('/api/account/password', { method: 'POST', ip: '10.9.9.9', token: tok, body: { username: 'Pebble_Otter', password: 'kelp-forest-9' } });
  assert.equal(set.status, 200);
  assert.equal(set.data.username, 'pebble_otter');
  assert.equal((await call('/api/save', { token: tok })).data.username, 'pebble_otter');
  // Wrong password, wrong name.
  assert.equal((await call('/api/account/login', { method: 'POST', ip: '10.9.9.9', body: { username: 'pebble_otter', password: 'nope-nope-nope' } })).status, 401);
  assert.equal((await call('/api/account/login', { method: 'POST', ip: '10.9.9.9', body: { username: 'nobody_here', password: 'kelp-forest-9' } })).status, 401);
  // Right: a new token for the same otter.
  const li = await call('/api/account/login', { method: 'POST', ip: '10.9.9.9', body: { username: 'PEBBLE_OTTER', password: 'kelp-forest-9' } });
  assert.equal(li.status, 200);
  assert.notEqual(li.data.token, tok);
  assert.equal((await call('/api/save', { token: li.data.token })).data.state.name, 'Pebble');
  // Changing it needs the current password; names are unique.
  assert.equal((await call('/api/account/password', { method: 'POST', ip: '10.9.9.9', token: tok, body: { username: 'pebble_otter', password: 'new-password-1' } })).status, 403);
  const b = await call('/api/register', { method: 'POST', ip: '10.9.9.9', body: { state: { ...core.defaultState(), name: 'Rocky' } } });
  assert.equal((await call('/api/account/password', { method: 'POST', ip: '10.9.9.9', token: b.data.token, body: { username: 'pebble_otter', password: 'another-pass-2' } })).status, 409);
  // Merging keeps the sign-in name.
  const m = await call('/api/merge', { method: 'POST', ip: '10.9.9.9', token: b.data.token, body: { token: tok, keep: 'this' } });
  assert.equal(m.status, 200);
  const again = await call('/api/account/login', { method: 'POST', ip: '10.9.9.9', body: { username: 'pebble_otter', password: 'kelp-forest-9' } });
  assert.equal(again.status, 200);
  assert.equal((await call('/api/save', { token: again.data.token })).data.state.name, 'Rocky');
});

test('shareable without signing in: public lane, den links, leaderboard', async () => {
  const a = await call('/api/register', { method: 'POST', ip: '10.9.9.9', body: { state: { ...core.defaultState(), name: 'Shelby' } } });
  const code = a.data.code;
  const lanePub = await call('/api/public/lane');
  assert.equal(lanePub.status, 200);
  assert.ok(lanePub.data.neighbors.length > 0 && lanePub.data.neighbors.length <= 12); // a random dozen of the public dens
  const den = await call(`/api/public/den?code=${code.toLowerCase()}`);
  assert.equal(den.status, 200);
  assert.equal(den.data.otter.name, 'Shelby');
  await call('/api/lane/public', { method: 'POST', ip: '10.9.9.9', token: a.data.token, body: { on: false } });
  assert.equal((await call(`/api/public/den?code=${code}`)).status, 403);
  assert.ok(!(await call('/api/public/lane')).data.neighbors.some((h) => h.name === 'Shelby'));
  assert.equal((await call('/api/public/den?code=OTR-ZZZZZ')).status, 404);
  const lb = await call('/api/leaderboard?game=dive');
  assert.equal(lb.status, 200);
  assert.ok(lb.data.top.every((r) => !('owner' in r)));
});

test('deleted shop items are taken back and refunded once', async () => {
  const st = { ...core.defaultState(), name: 'Refundy', pearls: 5, wallpapers: ['moss', 'cheese'], floors: ['earth', 'undersand'], furniture: { pearlbed: 1 }, doorItems: ['paint-moss', 'mat-moon'], door: { paint: 'paint-moss', mat: 'mat-moon' } };
  st.den = { ...st.den, wallpaper: 'cheese' };
  const r = await call('/api/register', { method: 'POST', ip: '10.8.8.8', body: { state: st } });
  assert.equal(r.status, 200);
  assert.equal(r.data.state.pearls, 5 + 60 + 50 + 200 + 40);
  assert.ok(!r.data.state.wallpapers.includes('cheese'));
  assert.equal(r.data.state.den.wallpaper, 'moss');
  assert.equal(r.data.state.door.mat, null);
  assert.equal((await call('/api/save', { token: r.data.token })).data.state.pearls, 355);
});

test('choosing one of two otters releases the other from friends lists and Otter Lane', async () => {
  const ip = '10.7.7.7';
  const reg = async (name) => (await call('/api/register', { method: 'POST', ip, body: { state: { ...core.defaultState(), name } } })).data;
  const befriend = async (x, y) => {
    await call('/api/friends/add', { method: 'POST', ip, token: x.token, body: { code: y.code } });
    await call('/api/friends/respond', { method: 'POST', ip, token: y.token, body: { code: x.code, accept: true } });
  };
  const friendNames = async (x) => (await call('/api/friends', { token: x.token })).data.friends.map((f) => f.name);
  const laneNames = async () => {
    const seen = new Set();
    for (let i = 0; i < 25; i++) for (const h of (await call('/api/public/lane')).data.neighbors) seen.add(h.name);
    return seen;
  };

  // 1) Keep the signed-in account's otter: the device's otter (and its friends) go.
  const keepA = await reg('KeeperA');
  const dropB = await reg('ReleasedB');
  const pal1 = await reg('PalOfA');
  const pal2 = await reg('PalOfB');
  await befriend(keepA, pal1);
  await befriend(dropB, pal2);
  assert.deepEqual(await friendNames(pal2), ['ReleasedB']);
  const m1 = await call('/api/merge', { method: 'POST', ip, token: keepA.token, body: { token: dropB.token, keep: 'this' } });
  assert.equal(m1.status, 200);
  assert.equal(m1.data.state.name, 'KeeperA');
  assert.deepEqual(await friendNames(pal2), [], 'the released otter left its friend\'s list');
  assert.deepEqual(await friendNames(pal1), ['KeeperA']);
  assert.deepEqual(await friendNames(keepA), ['PalOfA']);
  assert.ok(!(await laneNames()).has('ReleasedB'));
  assert.equal((await call(`/api/public/den?code=${dropB.code}`)).status, 404);

  // 2) Keep the device's otter: the account's old otter goes; the kept otter keeps its friends and code.
  const acct = await reg('OldAccountOtter');
  const device = await reg('DeviceOtter');
  const pal3 = await reg('PalOfOld');
  const pal4 = await reg('PalOfDevice');
  await befriend(acct, pal3);
  await befriend(device, pal4);
  await call('/api/guestbook/sign', { method: 'POST', ip, token: pal3.token, body: { code: acct.code, text: 'hi old otter' } });
  const m2 = await call('/api/merge', { method: 'POST', ip, token: acct.token, body: { token: device.token, keep: 'other' } });
  assert.equal(m2.status, 200);
  assert.equal(m2.data.state.name, 'DeviceOtter');
  assert.deepEqual(await friendNames(pal3), []);
  assert.deepEqual(await friendNames(pal4), ['DeviceOtter']);
  assert.deepEqual(await friendNames(acct), ['PalOfDevice']);
  const lane = await laneNames();
  assert.ok(!lane.has('OldAccountOtter'));
  assert.equal((await call('/api/save', { token: acct.token })).data.code, device.code, 'the kept otter keeps its friend code');
  assert.equal((await call(`/api/public/den?code=${acct.code}`)).status, 404, 'the released otter\'s code no longer leads anywhere');

  // 3) Loading a device's otter with a code, over an account that has one.
  const owner = await reg('CodeOwnerOtter');
  const pal5 = await reg('PalOfCodeOwner');
  await befriend(owner, pal5);
  const code = (await call('/api/device-code', { method: 'POST', ip, token: owner.token, body: {} })).data.code;
  const l = await call('/api/link', { method: 'POST', ip, body: { code, state: { ...core.defaultState(), name: 'NewDeviceOtter' }, keep: 'web' } });
  assert.equal(l.status, 200);
  assert.equal(l.data.state.name, 'NewDeviceOtter');
  assert.deepEqual(await friendNames(pal5), []);
});

test('museum rounds: a full museum resets a day later; lifetime totals carry on; firsts pay 20', async () => {
  const { createMuseum: make, ALL_FINDS, FIRST_PEARLS, DONATE_PEARLS, RESET_AFTER } = await import('../src/museum.js');
  const mdb = openDb(':memory:');
  const mstore = createStore(mdb);
  const msocial = createSocial(mdb, mstore);
  const mus = make(mdb, mstore);
  const ids = Object.keys(ALL_FINDS);
  const mk = (name) => msocial.register({ ...core.defaultState(), name, collection: Object.fromEntries(ids.map((id) => [id, 5])) });
  const a = mstore.byToken(mk('Curator').token).id;
  const b = mstore.byToken(mk('Helper').token).id;
  const t0 = Date.now();
  const before = mstore.get(a).state.pearls;
  const first = mus.donate(a, ids[0], t0);
  assert.equal(first.first, true);
  assert.equal(first.pearls, FIRST_PEARLS);
  assert.ok(mstore.get(a).state.pearls >= before + FIRST_PEARLS); // (achievements can add more)
  assert.equal(mus.donate(b, ids[0], t0).pearls, DONATE_PEARLS);
  // Fill every exhibit.
  for (const id of ids.slice(1)) mus.donate(id.length % 2 ? a : b, id, t0);
  let v = mus.view(a, t0 + 1000);
  assert.equal(v.pct, 100);
  assert.equal(v.round, 1);
  assert.ok(v.resetsAt >= t0 + RESET_AFTER);
  assert.equal(mus.claim(a, 100, t0 + 1000).status, 200);
  // Still full just before a day has passed…
  assert.equal(mus.view(a, t0 + RESET_AFTER - 5000).round, 1);
  // …then a new round: empty exhibits, fresh firsts and milestones, totals kept.
  v = mus.view(a, t0 + RESET_AFTER + 5000);
  assert.equal(v.round, 2);
  assert.equal(v.species, 0);
  assert.equal(v.resetsAt, null);
  assert.equal(v.donations, 0);
  assert.equal(v.allTimeDonations, ids.length + 1);
  assert.equal(v.you.donations + mus.view(b, t0 + RESET_AFTER + 5000).you.donations, ids.length + 1, 'lifetime donations carry over');
  assert.ok(v.patrons.length === 2);
  assert.equal(v.milestones.find((m) => m.pct === 100).claimed, false, 'milestones can be earned again');
  const again = mus.donate(b, ids[0], t0 + RESET_AFTER + 6000);
  assert.equal(again.first, true, 'firsts are per round');
  assert.equal(again.pearls, FIRST_PEARLS);
});
