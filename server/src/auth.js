// "Sign in with Discord" for the website (Discord OAuth2, identify scope only).
//
// Flow: /auth/discord -> Discord asks the player to approve -> /auth/discord/callback
// -> we look up (or create) their account and send them back to the website with a
// sign-in token in the URL fragment (#login=...), which the page stores and removes.
import { randomBytes, createHash } from 'node:crypto';

const STATE_TTL = 10 * 60 * 1000;
const hash = (t) => createHash('sha256').update(t).digest('hex');

export function createAuth({ store, db, clientId, clientSecret, publicUrl, siteUrl, fetchImpl = fetch }) {
  const enabled = !!(clientId && clientSecret);
  const redirectUri = `${publicUrl.replace(/\/$/, '')}/auth/discord/callback`;
  const pending = new Map(); // state -> expires
  setInterval(() => { const now = Date.now(); for (const [k, v] of pending) if (v < now) pending.delete(k); }, 60_000).unref();
  const tokenInsert = db.prepare('INSERT INTO tokens (hash, player_id, created) VALUES (?, ?, ?)');

  const back = (fragment) => `${siteUrl.replace(/\/$/, '')}/#${fragment}`;

  return {
    enabled,
    redirectUri,

    // Step 1: send the player to Discord.
    start() {
      if (!enabled) return { status: 302, location: back('login-error=Discord+sign-in+is+not+set+up+yet') };
      const state = randomBytes(16).toString('hex');
      pending.set(state, Date.now() + STATE_TTL);
      const q = new URLSearchParams({ client_id: clientId, response_type: 'code', scope: 'identify', redirect_uri: redirectUri, state, prompt: 'none' });
      return { status: 302, location: `https://discord.com/oauth2/authorize?${q}` };
    },

    // Step 2: Discord sends them back here.
    async callback(params) {
      const fail = (why) => ({ status: 302, location: back(`login-error=${encodeURIComponent(why)}`) });
      if (!enabled) return fail('Discord sign-in is not set up yet');
      if (params.get('error')) return fail('Sign-in was cancelled');
      const state = params.get('state');
      if (!state || !pending.has(state) || pending.get(state) < Date.now()) return fail('That sign-in link expired. Please try again');
      pending.delete(state);
      const code = params.get('code');
      if (!code) return fail('Sign-in failed. Please try again');
      try {
        const tok = await fetchImpl('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
        });
        if (!tok.ok) return fail('Discord did not accept the sign-in. Please try again');
        const { access_token: accessToken } = await tok.json();
        const me = await fetchImpl('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!me.ok) return fail('Could not read your Discord profile');
        const user = await me.json();
        const player = store.forDiscord({ id: user.id, username: user.username });
        const token = randomBytes(32).toString('hex');
        tokenInsert.run(hash(token), player.id, Date.now());
        return { status: 302, location: back(`login=${token}`) };
      } catch (err) {
        console.error('[auth] Discord sign-in failed', err.message);
        return fail('Sign-in failed. Please try again');
      }
    },
  };
}
