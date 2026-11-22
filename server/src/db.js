// SQLite storage using Node's built-in driver (no native build step).
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function openDb(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      discord_id TEXT UNIQUE,
      discord_name TEXT,
      state TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      created INTEGER NOT NULL,
      updated INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tokens (
      hash TEXT PRIMARY KEY,
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      created INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS link_codes (
      code TEXT PRIMARY KEY,
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS scores (
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      game TEXT NOT NULL,
      score INTEGER NOT NULL,
      updated INTEGER NOT NULL,
      PRIMARY KEY (player_id, game)
    );
    CREATE INDEX IF NOT EXISTS scores_game ON scores(game, score);
    CREATE TABLE IF NOT EXISTS friends (
      a TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      b TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      status TEXT NOT NULL,            -- 'pending' | 'accepted'
      requester TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      created INTEGER NOT NULL,
      PRIMARY KEY (a, b)
    );
    CREATE TABLE IF NOT EXISTS daily_actions (
      actor TEXT NOT NULL, target TEXT NOT NULL, kind TEXT NOT NULL, day TEXT NOT NULL,
      PRIMARY KEY (actor, target, kind, day)
    );
    CREATE TABLE IF NOT EXISTS gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_id TEXT NOT NULL, to_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      kind TEXT NOT NULL, item TEXT, amount INTEGER NOT NULL DEFAULT 0, note TEXT,
      created INTEGER NOT NULL, claimed INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS gifts_to ON gifts(to_id, claimed);
    CREATE TABLE IF NOT EXISTS world_feed (
      id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, icon TEXT, text TEXT NOT NULL
    );
  `);
  // Columns added after launch.
  const cols = db.prepare('PRAGMA table_info(players)').all().map((c) => c.name);
  if (!cols.includes('friend_code')) {
    db.exec('ALTER TABLE players ADD COLUMN friend_code TEXT');
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS players_code ON players(friend_code)');
  }
  if (!cols.includes('username')) {
    db.exec('ALTER TABLE players ADD COLUMN username TEXT');
    db.exec('ALTER TABLE players ADD COLUMN pass_hash TEXT');
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS players_username ON players(username)');
  }
  return db;
}
