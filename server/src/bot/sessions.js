// In-memory game sessions for Discord games. A session ends after 20 idle minutes
// (Discord interaction tokens only last 15 minutes anyway).
import { randomBytes } from 'node:crypto';

const sessions = new Map();
const IDLE = 20 * 60 * 1000;

export function createSession(game, owner, data = {}) {
  const id = randomBytes(5).toString('hex');
  const s = { id, game, owner, players: [], data, timers: new Set(), touched: Date.now(), hook: null, ended: false };
  sessions.set(id, s);
  return s;
}

export function getSession(id) {
  const s = sessions.get(id);
  if (s) s.touched = Date.now();
  return s;
}

export function endSession(s) {
  s.ended = true;
  for (const t of s.timers) clearTimeout(t);
  s.timers.clear();
  sessions.delete(s.id);
}

// setTimeout tied to a session; cleared when it ends.
export function later(s, ms, fn) {
  const t = setTimeout(async () => {
    s.timers.delete(t);
    if (s.ended) return;
    try { await fn(); } catch (err) { console.error(`[${s.game}] timer error`, err); }
  }, ms);
  t.unref?.();
  s.timers.add(t);
  return t;
}

export function clearTimers(s) {
  for (const t of s.timers) clearTimeout(t);
  s.timers.clear();
}

// Edit the game message from a timer, using the latest interaction's webhook.
export async function refresh(s, payload) {
  if (!s.hook) return;
  try { await s.hook.editReply(payload); } catch (err) { console.warn(`[${s.game}] could not edit message:`, err.message); }
}

export const sid = (s, action, arg = '') => `s:${s.id}:${action}:${arg}`.slice(0, 100);

setInterval(() => {
  const now = Date.now();
  for (const s of sessions.values()) if (now - s.touched > IDLE) endSession(s);
}, 60_000).unref();

export const sessionCount = () => sessions.size;
