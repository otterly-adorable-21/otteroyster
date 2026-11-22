// Otter Lane: a street of player dens you can stroll past and peek into.
// Shows friends first, then a rotating set of public neighbors. Only otter names,
// levels and dens are shown (never Discord names). Players can hide their den.
import * as core from '../../js/core.js';
import { WALLPAPERS } from '../../js/den-data.js';
import { stageOf } from '../../js/growth.js';

const ACTIVE_DAYS = 30;

export function createNeighborhood(db, store, social, social2 = null) {
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
      door: s.door,
      species: s.species,
      title: core.displayTitle(s),
      companion: s.companions?.active || null,
      companionLook: s.companions?.active ? core.companionLook(s.companions.owned[s.companions.active]) : null,
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
        otter: { name: s.name, species: s.species, title: core.displayTitle(s), level: s.level, stats: s.stats, equipped: s.equipped, sleeping: s.sleeping, mission: s.mission ? { id: s.mission.id } : null, den: s.den, persona: s.persona, created: s.created, sets: s.sets, collection: s.collection },
      };
    },

    // For anyone, signed in or not: the public dens on the lane.
    publicLane() {
      const ids = q.recent.all(Date.now() - ACTIVE_DAYS * 86400000).map((r) => r.id)
        .filter((id) => store.get(id)?.state.publicDen !== false).slice(0, 12);
      return { status: 200, you: null, friends: [], neighbors: ids.map((id) => house(id)).filter(Boolean) };
    },

    // A shared den link (#den=CODE): anyone can look if the den is public.
    publicPeek(otherId) {
      const p = otherId && store.get(otherId);
      if (!p?.state.name) return { status: 404, error: 'That house is empty.' };
      if (p.state.publicDen === false) return { status: 403, error: 'This den is private.' };
      const s = p.state;
      return {
        status: 200,
        friend: false,
        code: social.codeOf(otherId),
        otter: { name: s.name, species: s.species, title: core.displayTitle(s), level: s.level, stats: s.stats, equipped: s.equipped, sleeping: s.sleeping, mission: s.mission ? { id: s.mission.id } : null, den: s.den, persona: s.persona, created: s.created, sets: s.sets, collection: s.collection },
      };
    },

    // Water a friend's dry garden plots. Their harvest gets a bonus; you get a few pearls.
    waterFriend(meId, otherId) {
      if (!otherId || !social.areFriends(meId, otherId)) return { status: 403, error: 'You can only water friends\' gardens.' };
      let n = 0;
      let owner = '';
      store.mutate(otherId, (s) => {
        owner = s.name;
        const now = Date.now();
        s.garden.plots.forEach((p, k) => { if (p && !p.wateredAt && core.water(s, k, now, { friend: true }).ok) n += 1; });
      });
      if (!n) return { status: 409, error: 'Their garden is already watered. 🌱' };
      const me = store.mutate(meId, (s) => { s.pearls += 3; core.grow(s, 'social'); });
      social2?.notify(otherId, meId, 'garden', `💧 ${me.state.name || 'A friend'} watered ${n} plant${n === 1 ? '' : 's'} in your garden! They'll grow a bigger harvest.`);
      return { status: 200, msg: `💧 You watered ${n} plant${n === 1 ? '' : 's'} in ${owner}'s garden! +3 pearls`, state: me.state, version: me.version };
    },

    setPublic(meId, on) {
      const res = store.mutate(meId, (s) => { s.publicDen = !!on; });
      return { status: 200, publicDen: !!on, state: res.state, version: res.version };
    },
  };
}
