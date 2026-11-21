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
  `);
  return db;
}
