// Otter Lane: a street of player dens you can stroll past and peek into.
// Shows friends first, then a rotating set of public neighbors. Only otter names,
// levels and dens are shown (never Discord names). Players can hide their den.
import * as core from '../../js/core.js';
import { WALLPAPERS } from '../../js/den-data.js';
import { stageOf } from '../../js/growth.js';

const ACTIVE_DAYS = 30;

export function createNeighborhood(db, store, social) {
  const q = {
    recent: db.prepare('SELECT id FROM players WHERE updated > ? ORDER BY random() LIMIT 60'),
  };

  function house(id, { friend = false } = {}) {
    const p = store.get(id);
    if (!p?.state.name) return null;
    const s = p.state;
    return {
      code: social.codeOf(id),
      name: s.name,
      level: s.level,
      stage: stageOf(s.level).icon,
      trait: core.traitOf(s).trait,
      color: WALLPAPERS[s.den?.wallpaper]?.swatch || '#4f6b4a',
      cozy: core.coziness(s),
      equipped: s.equipped,
      home: !s.mission,
      sleeping: !!s.sleeping,
      birthday: core.celebratesBirthday(s),
      friend,
    };
  }

  return {
    lane(meId) {
      const friends = social.list(meId).friends.map((f) => social.idByCode(f.code)).filter(Boolean);
      const friendSet = new Set(friends);
      const neighbors = q.recent.all(Date.now() - ACTIVE_DAYS * 86400000).map((r) => r.id)
        .filter((id) => id !== meId && !friendSet.has(id))
        .filter((id) => store.get(id)?.state.publicDen !== false)
        .slice(0, 12);
      return {
        status: 200,
        you: house(meId),
        friends: friends.map((id) => house(id, { friend: true })).filter(Boolean),
        neighbors: neighbors.map((id) => house(id)).filter(Boolean),
      };
    },

    // Peek into a den on the lane (friends always; others if their den is public).
    peek(meId, otherId) {
      if (!otherId) return { status: 404, error: 'That house is empty.' };
      const p = store.get(otherId);
      if (!p?.state.name) return { status: 404, error: 'That house is empty.' };
      const friend = social.areFriends(meId, otherId);
      if (!friend && otherId !== meId && p.state.publicDen === false) return { status: 403, error: 'This den is private.' };
      const s = store.mutate(otherId, () => null).state;
      if (otherId !== meId) {
        store.mutate(meId, (m) => {
          if (!m.counters.visited.includes(otherId)) m.counters.visited = [...m.counters.visited, otherId].slice(-100);
        });
      }
      return {
        status: 200,
        friend,
        code: social.codeOf(otherId),
        otter: { name: s.name, level: s.level, stats: s.stats, equipped: s.equipped, sleeping: s.sleeping, mission: s.mission ? { id: s.mission.id } : null, den: s.den, persona: s.persona, created: s.created, sets: s.sets, collection: s.collection },
      };
    },

    setPublic(meId, on) {
      const res = store.mutate(meId, (s) => { s.publicDen = !!on; });
      return { status: 200, publicDen: !!on, state: res.state, version: res.version };
    },
  };
}
