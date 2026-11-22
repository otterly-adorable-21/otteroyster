// Friends, visits, hugs and gifts. Works for website accounts and Discord users alike.
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { createAccounts } from './accounts.js';
import * as core from '../../js/core.js';
import { FURNITURE } from '../../js/den-data.js';
import { FRIEND_POINTS, HUG_HAPPINESS, GIFT_PEARLS_PER_DAY, MAX_FRIENDS, friendLevel } from '../../js/social.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const hash = (t) => createHash('sha256').update(t).digest('hex');
const pair = (x, y) => (x < y ? [x, y] : [y, x]);
const err = (status, error) => ({ status, error });

export function createSocial(db, store) {
  const accounts = createAccounts(db);
  const q = {
    setCode: db.prepare('UPDATE players SET friend_code = ? WHERE id = ?'),
    getCode: db.prepare('SELECT friend_code FROM players WHERE id = ?'),
    byCode: db.prepare('SELECT id FROM players WHERE friend_code = ?'),
    insertPlayer: db.prepare('INSERT INTO players (id, discord_id, discord_name, state, version, created, updated) VALUES (?, NULL, NULL, ?, 1, ?, ?)'),
    tokenInsert: db.prepare('INSERT INTO tokens (hash, player_id, created) VALUES (?, ?, ?)'),
    friendGet: db.prepare('SELECT * FROM friends WHERE a = ? AND b = ?'),
    friendInsert: db.prepare('INSERT INTO friends (a, b, status, requester, points, created) VALUES (?, ?, ?, ?, 0, ?)'),
    friendAccept: db.prepare("UPDATE friends SET status = 'accepted' WHERE a = ? AND b = ?"),
    friendDelete: db.prepare('DELETE FROM friends WHERE a = ? AND b = ?'),
    friendPoints: db.prepare('UPDATE friends SET points = points + ? WHERE a = ? AND b = ?'),
    friendsOf: db.prepare('SELECT * FROM friends WHERE a = ? OR b = ?'),
    friendCount: db.prepare("SELECT COUNT(*) AS n FROM friends WHERE (a = ? OR b = ?) AND status = 'accepted'"),
    dailyTry: db.prepare('INSERT OR IGNORE INTO daily_actions (actor, target, kind, day) VALUES (?, ?, ?, ?)'),
    dailyHas: db.prepare('SELECT 1 FROM daily_actions WHERE actor = ? AND target = ? AND kind = ? AND day = ?'),
    giftInsert: db.prepare('INSERT INTO gifts (from_id, to_id, kind, item, amount, note, created) VALUES (?, ?, ?, ?, ?, ?, ?)'),
    giftsFor: db.prepare('SELECT * FROM gifts WHERE to_id = ? AND claimed = 0 ORDER BY created DESC LIMIT 50'),
    giftGet: db.prepare('SELECT * FROM gifts WHERE id = ? AND to_id = ? AND claimed = 0'),
    giftClaim: db.prepare('UPDATE gifts SET claimed = 1 WHERE id = ?'),
    // merging two accounts
    mvTokens: db.prepare('UPDATE tokens SET player_id = ? WHERE player_id = ?'),
    mvGiftsTo: db.prepare('UPDATE gifts SET to_id = ? WHERE to_id = ?'),
    mvGiftsFrom: db.prepare('UPDATE gifts SET from_id = ? WHERE from_id = ?'),
    scoresOf: db.prepare('SELECT * FROM scores WHERE player_id = ?'),
    delPlayer: db.prepare('DELETE FROM players WHERE id = ?'),
    setDiscord: db.prepare('UPDATE players SET discord_id = ?, discord_name = ? WHERE id = ?'),
  };

  function codeOf(playerId) {
    const row = q.getCode.get(playerId);
    if (row?.friend_code) return row.friend_code;
    for (;;) {
      const c = `OTR-${[...randomBytes(5)].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')}`;
      try { q.setCode.run(c, playerId); return c; } catch { /* collision, try again */ }
    }
  }
  const idByCode = (code) => q.byCode.get(String(code || '').trim().toUpperCase())?.id || null;
  const today = () => core.dayKey();
  const relation = (x, y) => { const [a, b] = pair(x, y); return q.friendGet.get(a, b); };
  const areFriends = (x, y) => relation(x, y)?.status === 'accepted';
  const addPoints = (x, y, n) => { const [a, b] = pair(x, y); q.friendPoints.run(n, a, b); };
  const onceToday = (actor, target, kind) => q.dailyTry.run(actor, target, kind, today()).changes > 0;
  const doneToday = (actor, target, kind) => !!q.dailyHas.get(actor, target, kind, today());

  function card(id, rel) {
    const p = store.get(id);
    const s = p.state;
    return {
      code: codeOf(id),
      name: s.name || 'An otter',
      owner: p.discordName || null,
      level: s.level,
      mood: core.mood(s),
      away: !!s.mission,
      sleeping: !!s.sleeping,
      equipped: s.equipped,
      species: s.species,
      title: core.displayTitle(s),
      trait: core.traitOf(s).trait,
      points: rel?.points || 0,
      friendship: friendLevel(rel?.points || 0).name,
    };
  }

  // Keep each player's friend count in their save (for achievements).
  const syncFriendCount = (id) => {
    const n = q.friendCount.get(id, id).n;
    store.mutate(id, (s) => { s.counters.friends = n; });
  };

  const social = {
    accounts,
    codeOf,
    idByCode,
    areFriends,

    // Website-only account (no Discord needed).
    register(webState) {
      if (!webState?.name) return err(400, 'Adopt an otter first!');
      const id = randomUUID();
      const now = Date.now();
      const st = core.normalize(webState);
      st.lastTick = Math.min(st.lastTick, now);
      q.insertPlayer.run(id, JSON.stringify(st), now, now);
      const token = randomBytes(32).toString('hex');
      q.tokenInsert.run(hash(token), id, now);
      const p = store.get(id);
      return { status: 200, token, state: p.state, version: p.version, code: codeOf(id) };
    },

    list(me) {
      const out = { code: codeOf(me), friends: [], incoming: [], outgoing: [] };
      for (const r of q.friendsOf.all(me, me)) {
        const other = r.a === me ? r.b : r.a;
        if (!store.get(other)) continue;
        const c = card(other, r);
        if (r.status === 'accepted') out.friends.push(c);
        else if (r.requester === me) out.outgoing.push(c);
        else out.incoming.push(c);
      }
      out.friends.sort((x, y) => y.points - x.points || x.name.localeCompare(y.name));
      out.gifts = q.giftsFor.all(me).length;
      return { status: 200, ...out };
    },

    request(me, otherId) {
      if (!otherId) return err(404, "Couldn't find an otter with that friend code.");
      if (otherId === me) return err(400, "That's your own code, silly otter!");
      if (q.friendCount.get(me, me).n >= MAX_FRIENDS) return err(400, `You can have up to ${MAX_FRIENDS} friends.`);
      const rel = relation(me, otherId);
      const [a, b] = pair(me, otherId);
      if (rel?.status === 'accepted') return err(400, "You're already friends!");
      if (rel && rel.requester !== me) {
        q.friendAccept.run(a, b);
        syncFriendCount(me); syncFriendCount(otherId);
        return { status: 200, accepted: true, friend: card(otherId, relation(me, otherId)) };
      }
      if (rel) return err(400, 'Friend request already sent. Waiting for them to accept.');
      q.friendInsert.run(a, b, 'pending', me, Date.now());
      return { status: 200, accepted: false, friend: card(otherId, relation(me, otherId)) };
    },

    respond(me, otherId, accept) {
      const rel = otherId && relation(me, otherId);
      if (!rel || rel.status !== 'pending' || rel.requester === me) return err(404, 'No friend request from them.');
      const [a, b] = pair(me, otherId);
      if (accept) { q.friendAccept.run(a, b); syncFriendCount(me); syncFriendCount(otherId); } else q.friendDelete.run(a, b);
      return { status: 200, accepted: !!accept };
    },

    remove(me, otherId) {
      if (!otherId) return err(404, 'Not found.');
      const [a, b] = pair(me, otherId);
      q.friendDelete.run(a, b);
      return { status: 200 };
    },

    // A friend's public otter + den. Visiting once a day grows friendship.
    visit(me, otherId) {
      if (!otherId || !areFriends(me, otherId)) return err(403, 'You can only visit friends.');
      if (onceToday(me, otherId, 'visit')) {
        addPoints(me, otherId, FRIEND_POINTS.visit);
        store.mutate(me, (s) => {
          core.grow(s, 'social');
          if (!s.counters.visited.includes(otherId)) s.counters.visited = [...s.counters.visited, otherId].slice(-100);
        });
      }
      const { state } = store.mutate(otherId, () => null);
      const rel = relation(me, otherId);
      return {
        status: 200,
        friend: card(otherId, rel),
        otter: { name: state.name, species: state.species, title: core.displayTitle(state), level: state.level, stats: state.stats, equipped: state.equipped, persona: state.persona, created: state.created, sleeping: state.sleeping, mission: state.mission ? { id: state.mission.id } : null, den: state.den, collection: state.collection, sets: state.sets, best: state.best },
        huggedToday: doneToday(me, otherId, 'hug'),
        garden: { dry: (state.garden?.plots || []).filter((p) => p && !p.wateredAt).length },
        door: state.door,
        companion: state.companions?.active || null,
      };
    },

    hug(me, otherId, myName = 'A friend') {
      if (!otherId || !areFriends(me, otherId)) return err(403, 'You can only hug friends\' otters.');
      if (!onceToday(me, otherId, 'hug')) return err(429, "You've already hugged their otter today. Come back tomorrow!");
      addPoints(me, otherId, FRIEND_POINTS.hug);
      store.mutate(me, (s) => { core.trackQuest(s, 'hug'); core.grow(s, 'social', 2); });
      let amount = HUG_HAPPINESS;
      const { state } = store.mutate(otherId, (s) => {
        if (!s.name) return;
        if (core.hasTrait(s, 'social')) amount = Math.round(HUG_HAPPINESS * 1.5);
        s.stats.happiness = core.clamp(s.stats.happiness + amount);
        core.log(s, `${myName} stopped by and gave ${s.name} a big hug! 🤗`);
      });
      return { status: 200, msg: `🤗 You gave ${state.name} a big hug! (+${amount} happiness${amount > HUG_HAPPINESS ? ', they love hugs 💞' : ''})` };
    },

    // kind: 'pearls' (amount) | 'furniture' (item from your storage)
    gift(me, otherId, { kind, item, amount, note } = {}) {
      if (!otherId || !areFriends(me, otherId)) return err(403, 'You can only send gifts to friends.');
      const cleanNote = String(note || '').replace(/[<>]/g, '').slice(0, 80);
      let problem = null;
      let sent = null;
      const res = store.mutate(me, (s) => {
        if (!s.name) { problem = 'Adopt an otter first!'; return; }
        if (kind === 'pearls') {
          const n = Math.round(Number(amount));
          if (!Number.isFinite(n) || n < 1) { problem = 'Pick how many pearls to send.'; return; }
          const day = core.dayKey();
          if (!s.giftDay || s.giftDay.day !== day) s.giftDay = { day, amount: 0 };
          if (s.giftDay.amount + n > GIFT_PEARLS_PER_DAY) { problem = `You can gift up to ${GIFT_PEARLS_PER_DAY} pearls a day (${GIFT_PEARLS_PER_DAY - s.giftDay.amount} left today).`; return; }
          if (s.pearls < n) { problem = 'Not enough pearls.'; return; }
          s.pearls -= n;
          s.giftDay.amount += n;
          sent = { kind, item: null, amount: n };
        } else if (kind === 'furniture') {
          if (!FURNITURE[item]) { problem = 'Unknown item.'; return; }
          if (core.inStorage(s, item) < 1) { problem = 'Put it in storage first (take it out of your den), then you can gift it.'; return; }
          s.furniture[item] -= 1;
          sent = { kind, item, amount: 1 };
        } else { problem = 'Unknown gift.'; return; }
        core.log(s, `Sent a gift to a friend. 🎁`);
        core.grow(s, 'social', 2);
      });
      if (problem) return err(400, problem);
      q.giftInsert.run(me, otherId, sent.kind, sent.item, sent.amount, cleanNote || null, Date.now());
      addPoints(me, otherId, FRIEND_POINTS.gift);
      return { status: 200, state: res.state, version: res.version };
    },

    inbox(me) {
      return {
        status: 200,
        gifts: q.giftsFor.all(me).map((g) => {
          const from = store.get(g.from_id);
          return { id: g.id, kind: g.kind, item: g.item, amount: g.amount, note: g.note, created: g.created, from: from?.state.name || 'A friend', fromOwner: from?.discordName || null };
        }),
      };
    },

    claim(me, giftId) {
      const gifts = giftId === 'all' ? q.giftsFor.all(me) : [q.giftGet.get(Number(giftId), me)].filter(Boolean);
      if (!gifts.length) return err(404, 'No gift to open.');
      const got = [];
      const res = store.mutate(me, (s) => {
        for (const g of gifts) {
          const from = store.get(g.from_id)?.state.name || 'a friend';
          if (g.kind === 'pearls') { s.pearls += g.amount; got.push(`${g.amount} pearls from ${from}`); }
          if (g.kind === 'furniture' && FURNITURE[g.item]) { s.furniture[g.item] = (s.furniture[g.item] || 0) + 1; got.push(`a ${FURNITURE[g.item].name} from ${from}`); }
          core.log(s, `Opened a gift: ${got[got.length - 1]}. 🎁`);
          q.giftClaim.run(g.id);
        }
      });
      return { status: 200, opened: got, state: res.state, version: res.version };
    },

    addChallengePoints(x, y) { if (areFriends(x, y)) addPoints(x, y, FRIEND_POINTS.challenge); },

    // Merge account `drop` into `keep` (used when a website account links Discord).
    merge(keepId, dropId, state) {
      if (keepId === dropId) return;
      db.exec('BEGIN');
      try {
        q.mvTokens.run(keepId, dropId);
        q.mvGiftsTo.run(keepId, dropId);
        q.mvGiftsFrom.run(keepId, dropId);
        for (const sc of q.scoresOf.all(dropId)) store.recordScore(keepId, sc.game, sc.score);
        for (const r of q.friendsOf.all(dropId, dropId)) {
          const other = r.a === dropId ? r.b : r.a;
          if (other === keepId) continue;
          const [a, b] = pair(keepId, other);
          const existing = q.friendGet.get(a, b);
          if (!existing) {
            q.friendInsert.run(a, b, r.status, r.requester === dropId ? keepId : r.requester, Date.now());
            q.friendPoints.run(r.points, a, b);
          } else if (r.status === 'accepted') {
            q.friendAccept.run(a, b);
            q.friendPoints.run(r.points, a, b);
          }
        }
        accounts.carry(keepId, dropId);
        const dropCode = q.getCode.get(dropId)?.friend_code;
        q.delPlayer.run(dropId);
        if (dropCode && !q.getCode.get(keepId)?.friend_code) q.setCode.run(dropCode, keepId);
        if (state) store.mutate(keepId, (s) => { Object.assign(s, core.normalize(state)); });
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return social;
}
