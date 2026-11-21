// Social part 2: guestbooks, Shell Mail, emotes, sleepovers, pet-sitting,
// pen pals and friend score challenges. Built on top of social.js (friends).
import * as core from '../../js/core.js';
import { GAME_LIST } from '../../js/data.js';
import { FRIEND_POINTS } from '../../js/social.js';

export const MAIL_DELAY = 30 * 60 * 1000; // a seagull carries it over
export const POSTCARDS = ['pond', 'lighthouse', 'reef', 'moon'];
export const EMOTES = { wave: '👋', dance: '💃', splash: '💦', spin: '💫', love: '💖' };
const SITTER = { feed: { hunger: 20, happiness: 4, text: 'brought a snack for' }, cuddle: { happiness: 10, text: 'cuddled' }, bath: { clean: 35, happiness: 3, text: 'gave a bubble bath to' } };

// Keep messages friendly: trim, strip markup, and soften a few words.
const SOFT = /\b(stupid|idiot|dumb|hate|shut ?up|loser|ugly)\b/gi;
export const clean = (t, max) => String(t || '').replace(/<[^>]*>/g, ' ').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max).replace(SOFT, '🦦');

const err = (status, error) => ({ status, error });

export function createSocial2(db, store, social) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS guestbook (id INTEGER PRIMARY KEY AUTOINCREMENT, owner TEXT NOT NULL, author TEXT NOT NULL, text TEXT NOT NULL, created INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS guestbook_owner ON guestbook(owner, created);
    CREATE TABLE IF NOT EXISTS mail (id INTEGER PRIMARY KEY AUTOINCREMENT, from_id TEXT NOT NULL, to_id TEXT NOT NULL, design TEXT NOT NULL, text TEXT NOT NULL, sent INTEGER NOT NULL, deliver_at INTEGER NOT NULL, read INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS mail_to ON mail(to_id, deliver_at);
    CREATE TABLE IF NOT EXISTS notices (id INTEGER PRIMARY KEY AUTOINCREMENT, to_id TEXT NOT NULL, from_id TEXT, kind TEXT NOT NULL, text TEXT NOT NULL, created INTEGER NOT NULL, seen INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS notices_to ON notices(to_id, seen);
    CREATE TABLE IF NOT EXISTS sleepovers (host TEXT NOT NULL, guest TEXT NOT NULL, day TEXT NOT NULL, status TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY (host, guest, day));
    CREATE TABLE IF NOT EXISTS penpals (a TEXT NOT NULL, b TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY (a, b));
    CREATE TABLE IF NOT EXISTS penpal_queue (player_id TEXT PRIMARY KEY, created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS challenges (id INTEGER PRIMARY KEY AUTOINCREMENT, from_id TEXT NOT NULL, to_id TEXT NOT NULL, game TEXT NOT NULL, score INTEGER NOT NULL, created INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'open', result INTEGER);
  `);
  const q = {
    gbAdd: db.prepare('INSERT INTO guestbook (owner, author, text, created) VALUES (?, ?, ?, ?)'),
    gbList: db.prepare('SELECT * FROM guestbook WHERE owner = ? ORDER BY created DESC LIMIT 30'),
    gbDel: db.prepare('DELETE FROM guestbook WHERE id = ? AND (owner = ? OR author = ?)'),
    gbToday: db.prepare('SELECT COUNT(*) AS n FROM guestbook WHERE owner = ? AND author = ? AND created > ?'),
    mailAdd: db.prepare('INSERT INTO mail (from_id, to_id, design, text, sent, deliver_at) VALUES (?, ?, ?, ?, ?, ?)'),
    mailFor: db.prepare('SELECT * FROM mail WHERE to_id = ? AND deliver_at <= ? ORDER BY deliver_at DESC LIMIT 60'),
    mailSentToday: db.prepare('SELECT COUNT(*) AS n FROM mail WHERE from_id = ? AND sent > ?'),
    mailRead: db.prepare('UPDATE mail SET read = 1 WHERE id = ? AND to_id = ?'),
    mailInFlight: db.prepare('SELECT COUNT(*) AS n FROM mail WHERE to_id = ? AND deliver_at > ?'),
    noticeAdd: db.prepare('INSERT INTO notices (to_id, from_id, kind, text, created) VALUES (?, ?, ?, ?, ?)'),
    noticesFor: db.prepare('SELECT * FROM notices WHERE to_id = ? AND seen = 0 ORDER BY created DESC LIMIT 20'),
    noticesSeen: db.prepare('UPDATE notices SET seen = 1 WHERE to_id = ? AND seen = 0'),
    sleepGet: db.prepare('SELECT * FROM sleepovers WHERE host = ? AND guest = ? AND day = ?'),
    sleepAdd: db.prepare('INSERT OR REPLACE INTO sleepovers (host, guest, day, status, created) VALUES (?, ?, ?, ?, ?)'),
    sleepFor: db.prepare('SELECT * FROM sleepovers WHERE (host = ? OR guest = ?) AND day = ?'),
    palsOf: db.prepare('SELECT * FROM penpals WHERE a = ? OR b = ?'),
    palAdd: db.prepare('INSERT OR IGNORE INTO penpals (a, b, created) VALUES (?, ?, ?)'),
    palDel: db.prepare('DELETE FROM penpals WHERE (a = ? AND b = ?) OR (a = ? AND b = ?)'),
    queueAdd: db.prepare('INSERT OR REPLACE INTO penpal_queue (player_id, created) VALUES (?, ?)'),
    queueDel: db.prepare('DELETE FROM penpal_queue WHERE player_id = ?'),
    queueHas: db.prepare('SELECT 1 FROM penpal_queue WHERE player_id = ?'),
    queueOthers: db.prepare('SELECT player_id FROM penpal_queue WHERE player_id != ? ORDER BY created ASC LIMIT 20'),
    chAdd: db.prepare('INSERT INTO challenges (from_id, to_id, game, score, created) VALUES (?, ?, ?, ?, ?)'),
    chOpenFor: db.prepare("SELECT * FROM challenges WHERE to_id = ? AND status = 'open' ORDER BY created DESC LIMIT 20"),
    chSentBy: db.prepare("SELECT * FROM challenges WHERE from_id = ? AND created > ? ORDER BY created DESC LIMIT 20"),
    chGet: db.prepare("SELECT * FROM challenges WHERE id = ? AND to_id = ? AND status = 'open'"),
    chDone: db.prepare('UPDATE challenges SET status = ?, result = ? WHERE id = ?'),
  };

  const pairKey = (x, y) => (x < y ? [x, y] : [y, x]);
  const nameOf = (id) => store.get(id)?.state.name || 'An otter';
  const notify = (to, from, kind, text) => q.noticeAdd.run(to, from, kind, text, Date.now());
  const isPal = (x, y) => q.palsOf.all(x, x).some((r) => r.a === y || r.b === y);
  const canWrite = (me, other) => social.areFriends(me, other) || isPal(me, other);
  const dayStart = () => Date.now() - 24 * 3600 * 1000;
  const today = () => core.dayKey();
  const once = db.prepare('INSERT OR IGNORE INTO daily_actions (actor, target, kind, day) VALUES (?, ?, ?, ?)');
  const onceToday = (a, b, kind) => once.run(a, b, kind, today()).changes > 0;
  const addPoints = db.prepare('UPDATE friends SET points = points + ? WHERE a = ? AND b = ?');
  const friendPoints = (x, y, n) => { const [a, b] = pairKey(x, y); addPoints.run(n, a, b); };

  return {
    notify,
    // ---------- guestbook ----------
    guestbook(owner) {
      return q.gbList.all(owner).map((g) => ({ id: g.id, text: g.text, created: g.created, author: nameOf(g.author), authorCode: social.codeOf(g.author), mine: false }));
    },
    sign(me, owner, text) {
      if (!owner || !social.areFriends(me, owner)) return err(403, 'You can only sign friends\' guestbooks.');
      const t = clean(text, 140);
      if (!t) return err(400, 'Write a little note first.');
      if (q.gbToday.get(owner, me, dayStart()).n >= 3) return err(429, "You've left 3 notes today. Save some for tomorrow!");
      q.gbAdd.run(owner, me, t, Date.now());
      notify(owner, me, 'guestbook', `📖 ${nameOf(me)} signed your guestbook: “${t}”`);
      return { status: 200 };
    },
    unsign(me, id) {
      q.gbDel.run(Number(id), me, me);
      return { status: 200 };
    },

    // ---------- Shell Mail ----------
    sendMail(me, to, design, text) {
      if (!to || to === me) return err(404, 'Who is this postcard for?');
      if (!canWrite(me, to)) return err(403, 'You can send Shell Mail to friends and pen pals.');
      const t = clean(text, 280);
      if (!t) return err(400, 'Write something on your postcard first.');
      if (q.mailSentToday.get(me, dayStart()).n >= 10) return err(429, 'The seagulls are tired! You can send 10 postcards a day.');
      const now = Date.now();
      q.mailAdd.run(me, to, POSTCARDS.includes(design) ? design : 'pond', t, now, now + MAIL_DELAY);
      store.mutate(me, (s) => core.grow(s, 'social'));
      return { status: 200, arrives: now + MAIL_DELAY };
    },
    readMail(me, id) { q.mailRead.run(Number(id), me); return { status: 200 }; },

    // ---------- emotes ----------
    emote(me, to, emote) {
      if (!EMOTES[emote]) return err(400, 'Unknown emote.');
      if (!to || !social.areFriends(me, to)) return err(403, 'You can only send emotes to friends.');
      if (!onceToday(me, to, `emote:${emote}`)) return err(429, 'You already sent that one today!');
      notify(to, me, 'emote', `${EMOTES[emote]} ${nameOf(me)} ${{ wave: 'waved at you', dance: 'did a happy dance for you', splash: 'splashed you', spin: 'did a spin for you', love: 'sent you love' }[emote]}!`);
      return { status: 200 };
    },

    // ---------- pet-sitting ----------
    sit(me, to, action) {
      const a = SITTER[action];
      if (!a) return err(400, 'Unknown action.');
      if (!to || !social.areFriends(me, to)) return err(403, "You can only look after friends' otters.");
      if (!onceToday(me, to, `sit:${action}`)) return err(429, 'You already did that today. Thank you for helping!');
      let name = 'their otter';
      store.mutate(to, (s) => {
        if (!s.name) return;
        name = s.name;
        for (const k of ['hunger', 'happiness', 'clean']) if (a[k]) s.stats[k] = core.clamp(s.stats[k] + a[k]);
        core.log(s, `${nameOf(me)} ${a.text} ${s.name} while you were away. 💕`);
      });
      store.mutate(me, (s) => { core.grow(s, 'social'); core.count(s, 'care'); });
      friendPoints(me, to, 1);
      return { status: 200, msg: `💕 You ${a.text} ${name}!` };
    },

    // ---------- sleepovers ----------
    invite(me, to) {
      if (!to || !social.areFriends(me, to)) return err(403, 'You can only invite friends to a sleepover.');
      const existing = q.sleepGet.get(me, to, today());
      if (existing) return err(400, existing.status === 'accepted' ? "You're already having a sleepover tonight!" : 'Invitation already sent.');
      q.sleepAdd.run(me, to, today(), 'invited', Date.now());
      notify(to, me, 'sleepover', `🌙 ${nameOf(me)} invited you to a sleepover tonight! Answer on the Friends tab.`);
      return { status: 200 };
    },
    respondSleepover(me, host, accept) {
      const inv = host && q.sleepGet.get(host, me, today());
      if (!inv || inv.status !== 'invited') return err(404, 'No sleepover invitation from them today.');
      if (!accept) { q.sleepAdd.run(host, me, today(), 'declined', Date.now()); return { status: 200 }; }
      q.sleepAdd.run(host, me, today(), 'accepted', Date.now());
      for (const id of [host, me]) {
        store.mutate(id, (s) => {
          if (!s.name) return;
          s.stats.happiness = core.clamp(s.stats.happiness + 15);
          s.stats.energy = core.clamp(s.stats.energy + 20);
          core.grow(s, 'social', 2);
          core.log(s, `🌙 Sleepover with ${nameOf(id === host ? me : host)}! Pillow forts, stories and stargazing.`);
          core.memory(s, '🌙', `${s.name} had a sleepover with ${nameOf(id === host ? me : host)}. Pillow forts and stargazing!`);
        });
      }
      friendPoints(host, me, 5);
      notify(host, me, 'sleepover', `🌙 ${nameOf(me)} is coming to your sleepover! Check your den.`);
      return { status: 200 };
    },

    // ---------- pen pals ----------
    joinPenpals(me) {
      if (!store.get(me)?.state.name) return err(400, 'Adopt an otter first!');
      if (q.palsOf.all(me, me).length >= 3) return err(400, 'You already have 3 pen pals!');
      const mine = new Set(q.palsOf.all(me, me).map((r) => (r.a === me ? r.b : r.a)));
      const match = q.queueOthers.all(me).map((r) => r.player_id).find((id) => !mine.has(id) && !social.areFriends(me, id) && store.get(id)?.state.name);
      if (match) {
        const [a, b] = pairKey(me, match);
        q.palAdd.run(a, b, Date.now());
        q.queueDel.run(match);
        q.queueDel.run(me);
        notify(match, me, 'penpal', `✉️ You have a new pen pal: ${nameOf(me)}! Send them a postcard.`);
        return { status: 200, matched: true, pal: nameOf(match) };
      }
      q.queueAdd.run(me, Date.now());
      return { status: 200, matched: false };
    },
    leavePenpal(me, other) {
      if (other) q.palDel.run(me, other, other, me); else q.queueDel.run(me);
      return { status: 200 };
    },

    // ---------- friend challenges ----------
    challenge(me, to, game, score) {
      const g = GAME_LIST.find((x) => x.id === game);
      if (!g) return err(400, 'Unknown game.');
      if (!to || !social.areFriends(me, to)) return err(403, 'You can only challenge friends.');
      const sc = Math.round(Number(score));
      if (!Number.isFinite(sc) || sc < 0 || sc > 1e6) return err(400, 'Bad score.');
      if (!onceToday(me, to, `challenge:${game}`)) return err(429, `You already challenged them at ${g.name} today.`);
      q.chAdd.run(me, to, game, sc, Date.now());
      notify(to, me, 'challenge', `🏆 ${nameOf(me)} challenges you to beat ${sc} ${g.scoreLabel} in ${g.name}!`);
      return { status: 200 };
    },
    // Report your score for challenges you received in this game.
    answerChallenges(me, game, score) {
      const g = GAME_LIST.find((x) => x.id === game);
      if (!g) return err(400, 'Unknown game.');
      const results = [];
      for (const c of q.chOpenFor.all(me).filter((x) => x.game === game)) {
        const won = g.lowerIsBetter ? score < c.score : score > c.score;
        q.chDone.run(won ? 'won' : 'lost', Math.round(score), c.id);
        friendPoints(me, c.from_id, FRIEND_POINTS.challenge);
        notify(c.from_id, me, 'challenge', won
          ? `🏆 ${nameOf(me)} beat your ${c.score} in ${g.name} with ${Math.round(score)}! Rematch?`
          : `🏆 ${nameOf(me)} tried to beat your ${c.score} in ${g.name} but got ${Math.round(score)}. You're still the champ!`);
        results.push({ from: nameOf(c.from_id), target: c.score, won });
      }
      return { status: 200, results };
    },

    // Everything social for the Friends tab, in one call. Marks notices as seen.
    inbox(me) {
      const now = Date.now();
      // Friends celebrating today get a one-time notice.
      for (const f of social.list(me).friends || []) {
        const fid = social.idByCode(f.code);
        const st = fid && store.get(fid)?.state;
        if (st && core.celebratesBirthday(st, now) && onceToday(me, fid, 'bday')) notify(me, fid, 'birthday', `🎂 It's ${st.name}'s birthday today! Send them a postcard or a gift.`);
      }
      const notices = q.noticesFor.all(me).map((n) => ({ id: n.id, kind: n.kind, text: n.text, created: n.created }));
      q.noticesSeen.run(me);
      const mail = q.mailFor.all(me, now).map((m) => ({ id: m.id, from: nameOf(m.from_id), fromCode: social.codeOf(m.from_id), design: m.design, text: m.text, sent: m.sent, read: !!m.read }));
      const sleep = q.sleepFor.all(me, me, today()).map((r) => {
        const otherId = r.host === me ? r.guest : r.host;
        const o = store.get(otherId)?.state;
        return { hosting: r.host === me, status: r.status, name: o?.name || 'A friend', code: social.codeOf(otherId), equipped: o?.equipped || {}, created: o?.created };
      });
      const pals = q.palsOf.all(me, me).map((r) => {
        const id = r.a === me ? r.b : r.a;
        const o = store.get(id)?.state;
        return { name: o?.name || 'An otter', code: social.codeOf(id), level: o?.level || 1, trait: o ? core.traitOf(o).trait : null };
      });
      const challenges = q.chOpenFor.all(me).map((c) => {
        const g = GAME_LIST.find((x) => x.id === c.game);
        return { id: c.id, from: nameOf(c.from_id), game: c.game, gameName: g?.name, icon: g?.icon, score: c.score, label: g?.scoreLabel };
      });
      return {
        status: 200,
        notices,
        mail,
        mailUnread: mail.filter((m) => !m.read).length,
        mailInFlight: q.mailInFlight.get(me, now).n,
        guestbook: this.guestbook(me).map((g) => ({ ...g, mine: true })),
        sleepovers: sleep,
        penpals: { pals, waiting: !!q.queueHas.get(me) },
        challenges,
      };
    },
  };
}
