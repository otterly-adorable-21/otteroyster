// The community museum: players donate spare discoveries, the first donor of each
// one is credited, and community-wide milestones unlock rewards for everyone.
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

export function createMuseum(db, store) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS museum (id INTEGER PRIMARY KEY AUTOINCREMENT, player_id TEXT NOT NULL, find_id TEXT NOT NULL, created INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS museum_find ON museum(find_id);
    CREATE TABLE IF NOT EXISTS museum_first (find_id TEXT PRIMARY KEY, player_id TEXT NOT NULL, created INTEGER NOT NULL);
  `);
  const q = {
    add: db.prepare('INSERT INTO museum (player_id, find_id, created) VALUES (?, ?, ?)'),
    first: db.prepare('INSERT OR IGNORE INTO museum_first (find_id, player_id, created) VALUES (?, ?, ?)'),
    counts: db.prepare('SELECT find_id, COUNT(*) AS n FROM museum GROUP BY find_id'),
    firsts: db.prepare('SELECT * FROM museum_first'),
    patrons: db.prepare('SELECT player_id, COUNT(*) AS n FROM museum GROUP BY player_id ORDER BY n DESC LIMIT 10'),
    mine: db.prepare('SELECT COUNT(*) AS n FROM museum WHERE player_id = ?'),
    total: db.prepare('SELECT COUNT(*) AS n FROM museum'),
  };
  const nameOf = (id) => store.get(id)?.state.name || 'An otter';

  function progress() {
    const counts = Object.fromEntries(q.counts.all().map((r) => [r.find_id, r.n]));
    const species = Object.keys(ALL_FINDS).filter((id) => counts[id]).length;
    return { counts, species, totalSpecies: Object.keys(ALL_FINDS).length, pct: Math.floor((species / Object.keys(ALL_FINDS).length) * 100) };
  }

  return {
    view(meId) {
      const p = progress();
      const firsts = Object.fromEntries(q.firsts.all().map((r) => [r.find_id, { by: nameOf(r.player_id), at: r.created, mine: r.player_id === meId }]));
      const exhibits = Object.fromEntries(Object.keys(ALL_FINDS).filter((id) => p.counts[id]).map((id) => [id, { count: p.counts[id], first: firsts[id] }]));
      const me = meId ? store.get(meId)?.state : null;
      return {
        status: 200,
        exhibits,
        species: p.species,
        totalSpecies: p.totalSpecies,
        pct: p.pct,
        donations: q.total.get().n,
        patrons: q.patrons.all().map((r) => ({ name: nameOf(r.player_id), count: r.n })),
        milestones: MILESTONES.map((m) => ({ ...m, reached: p.pct >= m.pct, claimed: !!me?.museumClaims?.includes(m.pct) })),
        you: meId ? { donations: q.mine.get(meId).n, firsts: Object.values(firsts).filter((f) => f.mine).length } : null,
      };
    },

    donate(meId, findId) {
      const f = ALL_FINDS[findId];
      if (!f) return { status: 400, error: 'Unknown discovery.' };
      let problem = null;
      let wasFirst = false;
      const res = store.mutate(meId, (s) => {
        if (!s.name) { problem = 'Adopt an otter first!'; return; }
        if ((s.collection[findId] || 0) < 2) { problem = `You can donate spare copies only. Find another ${f.name} first!`; return; }
        s.collection[findId] -= 1;
        s.pearls += 5;
        core.addXP(s, 3);
        wasFirst = q.first.run(findId, meId, Date.now()).changes > 0;
        q.add.run(meId, findId, Date.now());
        core.log(s, `🏛️ Donated a ${f.name} to the museum${wasFirst ? ' (first ever!)' : ''}.`);
        if (wasFirst) core.memory(s, '🏛️', `${s.name} gave the museum its very first ${f.name}!`);
        core.count(s, 'donations');
      });
      if (problem) return { status: 400, error: problem };
      return { status: 200, first: wasFirst, state: res.state, version: res.version };
    },

    claim(meId, pct) {
      const m = MILESTONES.find((x) => x.pct === Number(pct));
      if (!m) return { status: 400, error: 'Unknown milestone.' };
      if (progress().pct < m.pct) return { status: 400, error: 'The community has not reached that milestone yet.' };
      let problem = null;
      const res = store.mutate(meId, (s) => {
        if (!s.name) { problem = 'Adopt an otter first!'; return; }
        s.museumClaims = s.museumClaims || [];
        if (s.museumClaims.includes(m.pct)) { problem = 'Already claimed!'; return; }
        s.museumClaims.push(m.pct);
        s.pearls += m.pearls;
        if (m.item) s.furniture[m.item] = (s.furniture[m.item] || 0) + 1;
        core.log(s, `🏛️ Museum milestone ${m.pct}%: +${m.pearls} pearls${m.item ? ' and a Museum Display Case' : ''}!`);
      });
      if (problem) return { status: 400, error: problem };
      return { status: 200, state: res.state, version: res.version };
    },
  };
}
