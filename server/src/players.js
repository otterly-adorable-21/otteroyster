// Player accounts, linking and scores. All game rules come from ../../js/core.js,
// the same file the website runs, so both sides always agree.
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import * as core from '../../js/core.js';
import { GAME_LIST } from '../../js/data.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_TTL = 10 * 60 * 1000;
export const BOT_DAILY_CAP = 300;

// Discord-only games that also have leaderboards.
export const BOT_BOARDS = {
  'd-trivia': { name: 'Discord Trivia', scoreLabel: 'correct' },
  'd-higherlower': { name: 'Higher or Lower', scoreLabel: 'streak' },
  'd-fishing': { name: 'Discord Fishing', scoreLabel: 'pts' },
  'd-wins': { name: 'Challenge Wins', scoreLabel: 'wins' },
};

const hash = (t) => createHash('sha256').update(t).digest('hex');

export function createStore(db) {
  const q = {
    byId: db.prepare('SELECT * FROM players WHERE id = ?'),
    byDiscord: db.prepare('SELECT * FROM players WHERE discord_id = ?'),
    insert: db.prepare('INSERT INTO players (id, discord_id, discord_name, state, version, created, updated) VALUES (?, ?, ?, ?, 1, ?, ?)'),
    save: db.prepare('UPDATE players SET state = ?, version = version + 1, updated = ? WHERE id = ?'),
    setName: db.prepare('UPDATE players SET discord_name = ? WHERE id = ?'),
    tokenInsert: db.prepare('INSERT INTO tokens (hash, player_id, created) VALUES (?, ?, ?)'),
    tokenFind: db.prepare('SELECT player_id FROM tokens WHERE hash = ?'),
    codeInsert: db.prepare('INSERT OR REPLACE INTO link_codes (code, player_id, expires) VALUES (?, ?, ?)'),
    codeFind: db.prepare('SELECT * FROM link_codes WHERE code = ?'),
    codeDelete: db.prepare('DELETE FROM link_codes WHERE code = ?'),
    codeDeleteFor: db.prepare('DELETE FROM link_codes WHERE player_id = ?'),
    codePurge: db.prepare('DELETE FROM link_codes WHERE expires < ?'),
    scoreGet: db.prepare('SELECT score FROM scores WHERE player_id = ? AND game = ?'),
    scoreSet: db.prepare('INSERT OR REPLACE INTO scores (player_id, game, score, updated) VALUES (?, ?, ?, ?)'),
    boardDesc: db.prepare(`SELECT s.score, p.state, p.discord_name FROM scores s JOIN players p ON p.id = s.player_id
      WHERE s.game = ? ORDER BY s.score DESC, s.updated ASC LIMIT ?`),
    boardAsc: db.prepare(`SELECT s.score, p.state, p.discord_name FROM scores s JOIN players p ON p.id = s.player_id
      WHERE s.game = ? ORDER BY s.score ASC, s.updated ASC LIMIT ?`),
  };

  function row(r) {
    if (!r) return null;
    return { id: r.id, discordId: r.discord_id, discordName: r.discord_name, version: r.version, state: core.normalize(JSON.parse(r.state)) };
  }

  const store = {
    get: (id) => row(q.byId.get(id)),
    getByDiscord: (discordId) => row(q.byDiscord.get(discordId)),

    // Find or create the player for a Discord user.
    forDiscord(user) {
      let p = q.byDiscord.get(user.id);
      if (!p) {
        const id = randomUUID();
        const now = Date.now();
        q.insert.run(id, user.id, user.username ?? null, JSON.stringify(core.defaultState(now)), now, now);
        p = q.byId.get(id);
      } else if (user.username && p.discord_name !== user.username) {
        q.setName.run(user.username, p.id);
      }
      return row(p);
    },

    // Load → tick → fn(state, events) → save. Synchronous, so it is atomic.
    mutate(id, fn) {
      const p = row(q.byId.get(id));
      if (!p) throw new Error('no such player');
      const events = core.tick(p.state);
      const result = fn(p.state, events);
      core.checkAchievements(p.state);
      q.save.run(JSON.stringify(p.state), Date.now(), id);
      return { state: p.state, result, events, version: p.version + 1 };
    },

    // Website save with optimistic concurrency.
    putSave(id, state, version) {
      const p = q.byId.get(id);
      if (!p) return { status: 404 };
      if (p.version !== version) return { status: 409, state: JSON.parse(p.state), version: p.version };
      q.save.run(JSON.stringify(core.normalize(state)), Date.now(), id);
      return { status: 200, version: p.version + 1 };
    },

    makeLinkCode(playerId) {
      q.codePurge.run(Date.now());
      q.codeDeleteFor.run(playerId);
      const bytes = randomBytes(6);
      const code = [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
      q.codeInsert.run(code, playerId, Date.now() + CODE_TTL);
      return code;
    },

    // Redeem a /link code from the website.
    link(code, webState, keep) {
      const c = q.codeFind.get(String(code || '').toUpperCase());
      if (!c || c.expires < Date.now()) return { status: 400, error: 'That code is invalid or expired. Run /link again in Discord.' };
      const p = row(q.byId.get(c.player_id));
      const web = webState && webState.name ? core.normalize(webState) : null;
      if (web && p.state.name && !keep) {
        return { status: 409, conflict: true, server: { name: p.state.name, level: p.state.level } };
      }
      let { version } = p;
      if (web && (keep === 'web' || !p.state.name)) {
        web.lastTick = Math.min(web.lastTick, Date.now());
        q.save.run(JSON.stringify(web), Date.now(), p.id);
        version += 1;
      }
      q.codeDelete.run(c.code);
      const token = randomBytes(32).toString('hex');
      q.tokenInsert.run(hash(token), p.id, Date.now());
      const fresh = row(q.byId.get(p.id));
      return { status: 200, token, state: fresh.state, version: fresh.version, discordName: fresh.discordName };
    },

    // Use up a /link code and return the Discord player's id (or null).
    redeemCode(code) {
      const c = q.codeFind.get(String(code || '').toUpperCase());
      if (!c || c.expires < Date.now()) return null;
      return c.player_id;
    },
    consumeCode(code) { q.codeDelete.run(String(code || '').toUpperCase()); },

    byToken(token) {
      if (!token) return null;
      const t = q.tokenFind.get(hash(token));
      return t ? row(q.byId.get(t.player_id)) : null;
    },

    // Record a score if it's a personal best. Returns true if improved.
    recordScore(playerId, game, score) {
      const meta = GAME_LIST.find((g) => g.id === game);
      if (!meta && !BOT_BOARDS[game]) return false;
      const s = Math.round(Number(score));
      if (!Number.isFinite(s) || s < 0 || s > 1e6) return false;
      const prev = q.scoreGet.get(playerId, game);
      const lower = !!meta?.lowerIsBetter;
      if (prev && (lower ? s >= prev.score : s <= prev.score)) return false;
      if (lower && s === 0) return false;
      q.scoreSet.run(playerId, game, s, Date.now());
      return true;
    },

    addToScore(playerId, game, n) {
      const prev = q.scoreGet.get(playerId, game);
      q.scoreSet.run(playerId, game, (prev?.score || 0) + n, Date.now());
    },

    leaderboard(game, limit = 10) {
      const meta = GAME_LIST.find((g) => g.id === game);
      const rows = (meta?.lowerIsBetter ? q.boardAsc : q.boardDesc).all(game, limit);
      return rows.map((r) => {
        const st = JSON.parse(r.state);
        return { name: st.name || r.discord_name || 'An otter', owner: r.discord_name, score: r.score };
      });
    },

    // Pearls from Discord games, limited per day so the economy stays fair.
    award(playerId, pearls, reason) {
      return store.mutate(playerId, (s) => {
        if (!s.name) return 0;
        const day = core.dayKey();
        if (!s.botEarn || s.botEarn.day !== day) s.botEarn = { day, amount: 0 };
        const room = Math.max(0, BOT_DAILY_CAP - s.botEarn.amount);
        const p = Math.min(room, Math.max(0, Math.round(pearls)));
        s.botEarn.amount += p;
        core.grantPearls(s, p, p ? reason : null);
        core.trackQuest(s, 'dgame');
        return p;
      }).result;
    },
  };
  return store;
}
