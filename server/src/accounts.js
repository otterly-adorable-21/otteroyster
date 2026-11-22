// Sign-in names and passwords, so players without Discord can get back into
// their otter from any device. Passwords are stored only as scrypt hashes.
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

const NAME_RE = /^[a-z0-9_.-]{3,20}$/;
const hashToken = (t) => createHash('sha256').update(t).digest('hex');
const hashPass = (pw, salt = randomBytes(16).toString('hex')) => ['scrypt', salt, scryptSync(pw, salt, 32).toString('hex')].join(':');
const DUMMY = hashPass('not-a-real-password');
function checkPass(pw, stored) {
  const [kind, salt, h] = String(stored || '').split(':');
  if (kind !== 'scrypt' || !salt || !h) return false;
  const a = Buffer.from(h, 'hex');
  const b = scryptSync(pw, salt, 32);
  return a.length === b.length && timingSafeEqual(a, b);
}
const err = (status, error) => ({ status, error });

export function createAccounts(db) {
  const q = {
    get: db.prepare('SELECT username, pass_hash FROM players WHERE id = ?'),
    byName: db.prepare('SELECT id, pass_hash FROM players WHERE username = ?'),
    set: db.prepare('UPDATE players SET username = ?, pass_hash = ? WHERE id = ?'),
    tokenInsert: db.prepare('INSERT INTO tokens (hash, player_id, created) VALUES (?, ?, ?)'),
  };
  return {
    nameOf(id) { return q.get.get(id)?.username || null; },

    // Set or change the sign-in name and password. Changing them needs the current password.
    set(id, { username, password, current } = {}) {
      const name = String(username || '').trim().toLowerCase();
      const pw = String(password || '');
      if (!NAME_RE.test(name)) return err(400, 'Pick a sign-in name of 3–20 letters, numbers, dots, dashes or underscores.');
      if (pw.length < 8 || pw.length > 200) return err(400, 'Use a password of at least 8 characters.');
      if (pw.toLowerCase().includes(name)) return err(400, 'Your password shouldn\'t contain your sign-in name.');
      const mine = q.get.get(id);
      if (!mine) return err(404, 'No such player.');
      if (mine.pass_hash && !checkPass(String(current || ''), mine.pass_hash)) return err(403, 'Your current password isn\'t right.');
      const taken = q.byName.get(name);
      if (taken && taken.id !== id) return err(409, 'That sign-in name is taken. Try another!');
      q.set.run(name, hashPass(pw), id);
      return { status: 200, username: name };
    },

    // Returns a new token for the account, or an error.
    login({ username, password } = {}) {
      const name = String(username || '').trim().toLowerCase();
      const row = NAME_RE.test(name) ? q.byName.get(name) : null;
      // Check a password either way, so a wrong name takes as long as a wrong password.
      const ok = checkPass(String(password || ''), row?.pass_hash || DUMMY);
      if (!row || !ok) return err(401, 'That sign-in name and password don\'t match.');
      const token = randomBytes(32).toString('hex');
      q.tokenInsert.run(hashToken(token), row.id, Date.now());
      return { status: 200, token };
    },

    // When two accounts merge, keep the sign-in name from whichever had one.
    carry(keepId, dropId) {
      const k = q.get.get(keepId);
      const d = q.get.get(dropId);
      if (k?.username || !d?.username) return;
      q.set.run(null, null, dropId);
      q.set.run(d.username, d.pass_hash, keepId);
    },
  };
}
