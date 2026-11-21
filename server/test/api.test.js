import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { openDb } from '../src/db.js';
import { createStore } from '../src/players.js';
import { createSocial } from '../src/social.js';
import { createSocial2 } from '../src/social2.js';
import { startHttp } from '../src/http.js';
import * as core from '../../js/core.js';

const db = openDb(':memory:');
const store = createStore(db);
const social = createSocial(db, store);
const social2 = createSocial2(db, store, social);
const server = startHttp({ store, social, social2, port: 0, siteRoot: resolve(import.meta.dirname, '..', '..'), allowedOrigins: [], info: () => ({ invite: null }) });
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

// Runs last: it deliberately uses up the link rate limit.
test('link endpoint is rate limited', async () => {
  let limited = false;
  for (let k = 0; k < 15; k++) if ((await call('/api/link', { method: 'POST', body: { code: 'XXXXXX' } })).status === 429) limited = true;
  assert.ok(limited);
});
