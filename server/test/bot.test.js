// Plays every bot command and game against fake Discord interactions.
// Payloads go through discord.js's own validation, so malformed messages fail here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../src/db.js';
import { createStore } from '../src/players.js';
import { createBot } from '../src/bot/index.js';

const store = createStore(openDb(':memory:'));
const { handle } = createBot({ store, siteUrl: 'https://otteroyster.online' });

const errors = [];
const origError = console.error;
console.error = (...a) => { errors.push(a.map(String).join(' ')); origError(...a); };

const users = {
  ana: { id: '100', username: 'ana', displayName: 'Ana', bot: false },
  bo: { id: '200', username: 'bo', displayName: 'Bo', bot: false },
  cy: { id: '300', username: 'cy', displayName: 'Cy', bot: false },
};

// Serialize like discord.js would (triggers builder validation).
const ser = (p) => {
  if (!p || typeof p !== 'object' || p.toJSON) return p?.toJSON ? p.toJSON() : p;
  return JSON.parse(JSON.stringify({ ...p, files: undefined }));
};

function interaction(user, opts) {
  const i = {
    user,
    client: { users: { fetch: async (id) => Object.values(users).find((u) => u.id === id) } },
    commandName: opts.command,
    customId: opts.customId,
    values: opts.values,
    replied: false,
    deferred: false,
    out: [],
    isChatInputCommand: () => !!opts.command,
    isButton: () => !!opts.customId && !opts.values && !opts.fields,
    isStringSelectMenu: () => !!opts.values,
    isModalSubmit: () => !!opts.fields,
    options: { getString: (k) => opts.options?.[k] ?? null, getUser: (k) => opts.options?.[k] ?? null },
    fields: { getTextInputValue: () => opts.fields?.answer },
    async reply(p) { this.replied = true; this.out.push(['reply', ser(p)]); },
    async update(p) { this.replied = true; this.out.push(['update', ser(p)]); },
    async deferUpdate() { this.deferred = true; this.out.push(['defer']); },
    async followUp(p) { this.out.push(['followUp', ser(p)]); },
    async editReply(p) { this.out.push(['edit', ser(p)]); },
    async showModal(m) { this.out.push(['modal', m.toJSON()]); },
  };
  return i;
}

// Track the "message" each interaction chain is looking at.
let screen = null;
async function run(user, opts) {
  const i = interaction(user, opts);
  await handle(i);
  for (const [kind, p] of i.out) if ((kind === 'reply' || kind === 'update' || kind === 'edit') && p && !(p.flags & 64)) screen = p;
  return i;
}
const cmd = (user, command, options) => run(user, { command, options });
const click = (user, customId) => run(user, { customId });
const choose = (user, customId, value) => run(user, { customId, values: [value] });
const submit = (user, customId, answer) => run(user, { customId, fields: { answer } });

function comps(p = screen) {
  return (p?.components || []).flatMap((r) => r.components);
}
function findId(pred, p = screen) {
  const c = comps(p).find((x) => x.custom_id && pred(x.custom_id, x));
  return c?.custom_id;
}
const text = (p = screen) => JSON.stringify(p?.embeds || []);
const lastOut = (i) => i.out[i.out.length - 1];

test('pet care, adoption, daily chest, missions', async () => {
  let i = await cmd(users.ana, 'pet');
  assert.match(text(), /No otter yet/);
  i = await click(users.ana, findId((id) => id.startsWith('adopt:')));
  assert.equal(lastOut(i)[0], 'modal');
  await submit(users.ana, 'adoptname:100', 'Pebble');
  assert.match(text(), /Welcome to the family/);
  assert.equal(store.getByDiscord('100').state.name, 'Pebble');

  await choose(users.ana, 'pet:100:feed', 'kelp');
  await click(users.ana, 'pet:100:cuddle');
  await click(users.ana, 'pet:100:bath');
  i = await click(users.bo, 'pet:100:cuddle');
  assert.match(JSON.stringify(i.out), /belongs to someone else/);

  await cmd(users.ana, 'daily');
  await click(users.ana, 'chest:100:1');
  assert.match(text(), /Treasure/);
  i = await cmd(users.ana, 'daily');
  assert.match(JSON.stringify(i.out), /already opened/);

  await cmd(users.ana, 'mission');
  await choose(users.ana, 'mis:100:go', 'kelp');
  assert.ok(store.getByDiscord('100').state.mission);
  // fast-forward the mission and check the report shows up
  store.mutate(store.getByDiscord('100').id, (s) => { s.mission.endsAt = Date.now() - 1; });
  await cmd(users.ana, 'pet');
  assert.match(text(), /is back from Kelp Forest Patrol/);

  await cmd(users.ana, 'den');
  assert.match(text(), /Pebble's Den/);
  assert.match(text(), /Coziness/);

  await cmd(users.bo, 'adopt', { name: 'Biscuit' });
  await cmd(users.ana, 'visit', { friend: users.bo });
  assert.match(text(), /Visiting Biscuit's Den/);
  i = await cmd(users.ana, 'visit', { friend: { id: '999', username: 'nobody' } });
  assert.match(JSON.stringify(i.out), /hasn't adopted/);
  await cmd(users.cy, 'adopt', { name: 'Clamsy' });
  await cmd(users.cy, 'explore', { place: 'tidepools' });
  assert.match(text(), /Exploring Tide Pools/);
  i = await cmd(users.cy, 'explore', { place: 'tidepools' });
  assert.match(JSON.stringify(i.out), /just explored here/);
  i = await cmd(users.cy, 'explore', { place: 'trench' });
  assert.match(JSON.stringify(i.out), /Reach level 5/);
  await cmd(users.ana, 'collection', { user: users.cy });
  assert.match(text(), /Clamsy's collection journal/);
  await cmd(users.ana, 'profile');
  await cmd(users.ana, 'help');
  i = await cmd(users.ana, 'link');
  assert.match(JSON.stringify(i.out), /[A-Z2-9]{6}/);
});

test('solo games: every game starts and plays to the end', async () => {
  const before = store.getByDiscord('100').state.pearls;

  // trivia + emoji: answer 5 then results
  for (const g of ['trivia', 'emoji']) {
    await cmd(users.ana, 'play', { game: g });
    for (let k = 0; k < 5; k++) {
      await click(users.ana, findId((id) => id.includes(':a:')));
      await click(users.ana, findId((id) => id.includes(':next:')));
    }
    assert.match(text(), /complete/);
  }

  // scramble: skip all
  await cmd(users.ana, 'play', { game: 'scramble' });
  await click(users.ana, findId((id) => id.includes(':hint:')));
  const sAnswer = findId((id) => id.includes(':answer:'));
  const i = await click(users.ana, sAnswer);
  assert.equal(lastOut(i)[0], 'modal');
  await submit(users.ana, sAnswer.replace(':answer:', ':guess:'), 'nope');
  for (let k = 0; k < 5; k++) await click(users.ana, findId((id) => id.includes(':skip:')));
  assert.match(text(), /Scramble complete/);

  // hangman: guess letters until over
  await cmd(users.ana, 'play', { game: 'hangman' });
  for (const c of 'EAOTRNSLIUCDHPMBGKWY') {
    const sel = comps().find((x) => x.custom_id?.includes(':l:') && x.options?.some((o) => o.value === c));
    if (!sel) break;
    await choose(users.ana, sel.custom_id, c);
  }
  assert.match(text(), /saved the otter|Splash/);

  // number hunt: binary search
  await cmd(users.ana, 'play', { game: 'numberhunt' });
  let lo = 1; let hi = 100;
  for (let k = 0; k < 7; k++) {
    const g = Math.floor((lo + hi) / 2);
    const btnId = findId((id) => id.includes(':guess:'));
    if (!btnId) break;
    await submit(users.ana, btnId.replace(':guess:', ':num:'), String(g));
    const t = text();
    if (/Found it/.test(t)) break;
    if (t.includes(`${String(g).padStart(3)}\` `) && /higher/.test(t.split(`${String(g).padStart(3)}`).pop().split('\\n')[0])) lo = g + 1; else hi = g - 1;
  }
  assert.match(text(), /Found it|Out of tries/);

  // higher/lower: play until loss or 3 wins then cash
  await cmd(users.ana, 'play', { game: 'higherlower' });
  for (let k = 0; k < 20; k++) {
    const cash = comps().find((x) => x.custom_id?.includes(':cash:'));
    if (!cash) break;
    if (!cash.disabled && k > 3) { await click(users.ana, cash.custom_id); break; }
    await click(users.ana, findId((id) => id.includes(':hi:')));
  }
  assert.match(text(), /Cashed out|Oh no/);

  // rps vs bot
  await cmd(users.ana, 'play', { game: 'rps' });
  for (let k = 0; k < 30 && findId((id) => id.includes(':p:')); k++) await click(users.ana, findId((id) => id.endsWith(':rock')));
  assert.match(text(), /You win|Otto wins/);

  // minesweeper: click tiles until win or boom
  await cmd(users.ana, 'play', { game: 'minesweeper' });
  await click(users.ana, findId((id) => id.includes(':mode:')));
  await click(users.ana, findId((id, c) => id.includes(':c:') && !c.disabled));
  await click(users.ana, findId((id) => id.includes(':mode:')));
  for (let k = 0; k < 25; k++) {
    const cell = comps().find((x) => x.custom_id?.includes(':c:') && !x.disabled && x.emoji?.name === '🟦');
    if (!cell) break;
    await click(users.ana, cell.custom_id);
  }
  assert.match(text(), /cleared the beach|urchin/);

  // fishing: reel too early three times
  await cmd(users.ana, 'play', { game: 'fishing' });
  for (let k = 0; k < 3; k++) {
    await click(users.ana, findId((id) => id.includes(':cast:')));
    await click(users.ana, findId((id) => id.includes(':reel:')));
  }
  assert.match(text(), /Gone fishing/);

  // someone else can't press your buttons
  await cmd(users.ana, 'play', { game: 'trivia' });
  const j = await click(users.bo, findId((id) => id.includes(':a:')));
  assert.match(JSON.stringify(j.out), /someone else's game/);

  assert.ok(store.getByDiscord('100').state.pearls >= before);
});

test('challenges: connect four, tic-tac-toe, rock paper scissors', async () => {
  // connect four: ana stacks column 1, bo column 2 → ana wins vertically
  await cmd(users.ana, 'challenge', { friend: users.bo, game: 'connect4' });
  let i = await click(users.cy, findId((id) => id.includes(':accept:')));
  assert.match(JSON.stringify(i.out), /Only the challenged player/);
  await click(users.bo, findId((id) => id.includes(':accept:')));
  for (let k = 0; k < 4; k++) {
    await click(users.ana, findId((id) => id.endsWith(':drop:0')));
    if (k < 3) await click(users.bo, findId((id) => id.endsWith(':drop:1')));
  }
  assert.match(text(), /Ana\*\* wins/);
  assert.ok(findId((id) => id.startsWith('rematch:')));

  // tic-tac-toe: ana takes the top row
  await cmd(users.ana, 'challenge', { friend: users.bo, game: 'tictactoe' });
  await click(users.bo, findId((id) => id.includes(':accept:')));
  for (const [u, k] of [[users.ana, 0], [users.bo, 3], [users.ana, 1], [users.bo, 4], [users.ana, 2]]) {
    i = await click(u, findId((id) => id.endsWith(`:m:${k}`)));
  }
  assert.match(text(), /wins/);

  // rps duel
  await cmd(users.bo, 'challenge', { friend: users.ana, game: 'rps' });
  await click(users.ana, findId((id) => id.includes(':accept:')));
  for (let k = 0; k < 3; k++) {
    i = await click(users.bo, findId((id) => id.endsWith(':rock')));
    assert.ok(i.out.some(([kind]) => kind === 'followUp'));
    await click(users.ana, findId((id) => id.endsWith(':paper')));
    if (/Match over/.test(text())) break;
  }
  assert.match(text(), /Match over/);

  i = await cmd(users.ana, 'challenge', { friend: users.ana, game: 'rps' });
  assert.match(JSON.stringify(i.out), /challenge yourself/);
});

async function lobby(game) {
  await cmd(users.ana, 'party', { game });
  await click(users.bo, findId((id) => id.includes(':join:')));
  await click(users.cy, findId((id) => id.includes(':join:')));
  await click(users.ana, findId((id) => id.includes(':start:')));
}

test('party games: impostor, trivia battle, hot potato, would you rather, forbidden word', async () => {
  // impostor
  await lobby('impostor');
  let i = await click(users.bo, findId((id) => id.includes(':word:')));
  assert.match(JSON.stringify(i.out), /Your secret word/);
  await click(users.ana, findId((id) => id.includes(':vote:')));
  const voteSel = findId((id) => id.includes(':pick:'));
  for (const u of [users.ana, users.bo]) await choose(u, voteSel, users.cy.id);
  i = await choose(users.cy, voteSel, users.ana.id);
  assert.ok(i.out.some(([k, p]) => k === 'edit' && /reveal/.test(JSON.stringify(p))));

  // trivia battle: all three answer the first question
  await lobby('trivia');
  for (const u of Object.values(users)) i = await click(u, findId((id) => id.includes(':a:')));
  assert.ok(i.out.some(([k, p]) => k === 'edit' && /Correct|Nobody/.test(JSON.stringify(p))));

  // hot potato: pass twice then someone calls it
  await lobby('hotpotato');
  const holderOf = () => Object.values(users).find((u) => JSON.stringify(screen.content || '').includes(u.id));
  await click(holderOf(), findId((id) => id.includes(':pass:')));
  await click(holderOf(), findId((id) => id.includes(':pass:')));
  const others = Object.values(users).filter((u) => u !== holderOf());
  await click(others[0], findId((id) => id.includes(':boo:')));
  const holder2 = holderOf();
  const others2 = Object.values(users).filter((u) => u !== holder2);
  await click(others2[0], findId((id) => id.includes(':boo:')));
  assert.match(text(), /Last otter standing/);

  // would you rather: 5 rounds
  await lobby('wyr');
  for (let k = 0; k < 5; k++) {
    for (const u of Object.values(users)) await click(u, findId((id) => id.includes(':v:')));
    await click(users.ana, findId((id) => id.includes(':next:')));
  }
  assert.match(text(), /Thanks for playing/);

  // forbidden word
  await lobby('forbidden');
  const order = [];
  const descName = () => text().match(/🎙️ \*\*(\w+)\*\* is describing/)[1];
  const byName = (n) => Object.values(users).find((u) => u.displayName === n);
  const d = byName(descName());
  order.push(d);
  i = await click(d, findId((id) => id.includes(':card:')));
  assert.match(JSON.stringify(i.out), /Your word/);
  i = await click(Object.values(users).find((u) => u !== d), findId((id) => id.includes(':card:')));
  assert.match(JSON.stringify(i.out), /No peeking/);
  await click(d, findId((id) => id.includes(':got:')));
  await choose(d, findId((id) => id.includes(':who:')), Object.values(users).find((u) => u !== d).id);
  await click(d, findId((id) => id.includes(':skip:')));
  await click(Object.values(users).find((u) => u !== d), findId((id) => id.includes(':buzz:')));
  assert.match(text(), /buzzed/);

  await cmd(users.ana, 'leaderboard', { game: 'd-wins' });
  assert.match(text(), /Ana|Pebble|Biscuit/);
});

test('no handler errors were logged', () => {
  assert.deepEqual(errors, []);
});
