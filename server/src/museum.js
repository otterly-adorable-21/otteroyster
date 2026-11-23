// The community museum: players donate spare discoveries, the first donor of each
// one is credited, and community-wide milestones unlock rewards for everyone.
// It runs in rounds: a day after every exhibit is filled, the museum empties and a
// new round starts. Each player's total donations (and the top donors) carry on.
import * as core from '../../js/core.js';
import { FINDS } from '../../js/world.js';
import { EVENT_FINDS } from '../../js/events.js';

export const ALL_FINDS = { ...FINDS, ...EVENT_FINDS };
export const MILESTONES = [
  { pct: 10, pearls: 20 },
  { pct: 25, pearls: 40 },
  { pct: 50, pearls: 80, item: 'museumcase' },
  { pct: 75, pearls: 120 },
  { pct: 100, pearls: 250 },
];
export const DONATE_PEARLS = 5;
export const FIRST_PEARLS = 20; // the first donor of an exhibit (each round)
export const RESET_AFTER = 86400000; // a full museum resets one day later

export function createMuseum(db, store) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS museum (id INTEGER PRIMARY KEY AUTOINCREMENT, player_id TEXT NOT NULL, find_id TEXT NOT NULL, created INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS museum_find ON museum(find_id);
    CREATE TABLE IF NOT EXISTS museum_state (k TEXT PRIMARY KEY, v INTEGER NOT NULL);
  `);
  // Rounds were added later: donations and first-donor credits belong to a round.
  const cols = db.prepare('PRAGMA table_info(museum)').all().map((c) => c.name);
  if (!cols.includes('round')) db.exec('ALTER TABLE museum ADD COLUMN round INTEGER NOT NULL DEFAULT 1');
  const firstCols = db.prepare('PRAGMA table_info(museum_first)').all().map((c) => c.name);
  if (!firstCols.length) db.exec('CREATE TABLE museum_first (round INTEGER NOT NULL, find_id TEXT NOT NULL, player_id TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY (round, find_id))');
  else if (!firstCols.includes('round')) {
    db.exec(`CREATE TABLE museum_first2 (round INTEGER NOT NULL, find_id TEXT NOT NULL, player_id TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY (round, find_id));
      INSERT INTO museum_first2 (round, find_id, player_id, created) SELECT 1, find_id, player_id, created FROM museum_first;
      DROP TABLE museum_first; ALTER TABLE museum_first2 RENAME TO museum_first;`);
  }
  const q = {
    add: db.prepare('INSERT INTO museum (player_id, find_id, created, round) VALUES (?, ?, ?, ?)'),
    first: db.prepare('INSERT OR IGNORE INTO museum_first (round, find_id, player_id, created) VALUES (?, ?, ?, ?)'),
    counts: db.prepare('SELECT find_id, COUNT(*) AS n FROM museum WHERE round = ? GROUP BY find_id'),
    firsts: db.prepare('SELECT * FROM museum_first WHERE round = ?'),
    roundTotal: db.prepare('SELECT COUNT(*) AS n FROM museum WHERE round = ?'),
    myFirsts: db.prepare('SELECT COUNT(*) AS n FROM museum_first WHERE player_id = ?'),
    getState: db.prepare('SELECT v FROM museum_state WHERE k = ?'),
    setState: db.prepare('INSERT OR REPLACE INTO museum_state (k, v) VALUES (?, ?)'),
    delState: db.prepare('DELETE FROM museum_state WHERE k = ?'),
    patrons: db.prepare('SELECT player_id, COUNT(*) AS n FROM museum GROUP BY player_id ORDER BY n DESC LIMIT 10'),
    mine: db.prepare('SELECT COUNT(*) AS n FROM museum WHERE player_id = ?'),
    total: db.prepare('SELECT COUNT(*) AS n FROM museum'),
  };
  const nameOf = (id) => store.get(id)?.state.name || 'An otter';
  // Milestone claims are per round: "round:pct" (plain numbers are from before rounds, i.e. round 1).
  const claimed = (s, r, pct) => !!s?.museumClaims?.some((c) => c === `${r}:${pct}` || (r === 1 && c === pct));

  const round = () => q.getState.get('round')?.v || 1;
  const news = (icon, text) => { try { db.prepare('INSERT INTO world_feed (at, icon, text) VALUES (?, ?, ?)').run(Date.now(), icon, text); } catch { /* no feed table here */ } };
  const fullAt = () => q.getState.get('fullAt')?.v || null;

  function progress(r = round()) {
    const counts = Object.fromEntries(q.counts.all(r).map((x) => [x.find_id, x.n]));
    const species = Object.keys(ALL_FINDS).filter((id) => counts[id]).length;
    return { counts, species, totalSpecies: Object.keys(ALL_FINDS).length, pct: Math.floor((species / Object.keys(ALL_FINDS).length) * 100) };
  }

  // Note when the museum fills up, and start a new round a day later.
  function advance(now = Date.now()) {
    const full = fullAt();
    if (full && now >= full + RESET_AFTER) {
      q.setState.run('round', round() + 1);
      q.delState.run('fullAt');
      news('🏛️', `The Pond Museum opened round ${round()}: the halls are empty again. Who will donate first?`);
      return advance(now);
    }
    if (!full && progress().pct >= 100) {
      q.setState.run('fullAt', now);
      news('🎉', `The Pond Museum is full! Every exhibit of round ${round()} is on display. It resets tomorrow.`);
    }
    return round();
  }

  return {
    advance,
    view(meId, now = Date.now()) {
      const r = advance(now);
      const p = progress(r);
      const full = fullAt();
      const firsts = Object.fromEntries(q.firsts.all(r).map((r) => [r.find_id, { by: nameOf(r.player_id), at: r.created, mine: r.player_id === meId }]));
      const exhibits = Object.fromEntries(Object.keys(ALL_FINDS).filter((id) => p.counts[id]).map((id) => [id, { count: p.counts[id], first: firsts[id] }]));
      const me = meId ? store.get(meId)?.state : null;
      return {
        status: 200,
        exhibits,
        species: p.species,
        totalSpecies: p.totalSpecies,
        pct: p.pct,
        round: r,
        resetsAt: full ? full + RESET_AFTER : null,
        donations: q.roundTotal.get(r).n,
        allTimeDonations: q.total.get().n,
        patrons: q.patrons.all().map((x) => ({ name: nameOf(x.player_id), count: x.n })), // all rounds
        milestones: MILESTONES.map((m) => ({ ...m, reached: p.pct >= m.pct, claimed: claimed(me, r, m.pct) })),
        you: meId ? { donations: q.mine.get(meId).n, firsts: q.myFirsts.get(meId).n, firstsThisRound: Object.values(firsts).filter((f) => f.mine).length } : null,
      };
    },

    donate(meId, findId, now = Date.now()) {
      const r = advance(now);
      const f = ALL_FINDS[findId];
      if (!f) return { status: 400, error: 'Unknown discovery.' };
      let problem = null;
      let wasFirst = false;
      const res = store.mutate(meId, (s) => {
        if (!s.name) { problem = 'Adopt an otter first!'; return; }
        if ((s.collection[findId] || 0) < 2) { problem = `You can donate spare copies only. Find another ${f.name} first!`; return; }
        s.collection[findId] -= 1;
        core.addXP(s, 3);
        wasFirst = q.first.run(r, findId, meId, now).changes > 0;
        s.pearls += wasFirst ? FIRST_PEARLS : DONATE_PEARLS;
        q.add.run(meId, findId, now, r);
        core.log(s, `🏛️ Donated a ${f.name} to the museum${wasFirst ? ` (the first this round! +${FIRST_PEARLS} pearls)` : ''}.`);
        if (wasFirst) core.memory(s, '🏛️', `${s.name} gave the museum its very first ${f.name}!`);
        core.count(s, 'donations');
      });
      if (problem) return { status: 400, error: problem };
      advance(now); // this may have filled the museum
      return { status: 200, first: wasFirst, pearls: wasFirst ? FIRST_PEARLS : DONATE_PEARLS, state: res.state, version: res.version };
    },

    claim(meId, pct, now = Date.now()) {
      const r = advance(now);
      const m = MILESTONES.find((x) => x.pct === Number(pct));
      if (!m) return { status: 400, error: 'Unknown milestone.' };
      if (progress(r).pct < m.pct) return { status: 400, error: 'The community has not reached that milestone yet.' };
      let problem = null;
      const res = store.mutate(meId, (s) => {
        if (!s.name) { problem = 'Adopt an otter first!'; return; }
        s.museumClaims = s.museumClaims || [];
        if (claimed(s, r, m.pct)) { problem = 'Already claimed this round!'; return; }
        s.museumClaims.push(`${r}:${m.pct}`);
        s.pearls += m.pearls;
        if (m.item && !s.furniture[m.item]) s.furniture[m.item] = 1; // one display case is plenty
        core.log(s, `🏛️ Museum milestone ${m.pct}%: +${m.pearls} pearls${m.item ? ' and a Museum Display Case' : ''}!`);
      });
      if (problem) return { status: 400, error: problem };
      return { status: 200, state: res.state, version: res.version };
    },
  };
}
