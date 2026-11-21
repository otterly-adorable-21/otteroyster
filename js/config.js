// Where the OtterOyster server (API + Discord bot) lives.
// - On otteroyster.online the site is static (GitHub Pages) and talks to api.otteroyster.online.
// - When the server itself serves the site (local dev or self-hosting), use the same origin.
// - Override for testing with ?api=https://example.com (remembered in localStorage).
function readOverride() {
  try {
    const q = new URLSearchParams(location.search).get('api');
    if (q) localStorage.setItem('otteroyster.api', q);
    return localStorage.getItem('otteroyster.api');
  } catch {
    return null;
  }
}

const override = readOverride();
export const API_BASE = override
  || (location.hostname.endsWith('otteroyster.online') ? 'https://api.otteroyster.online' : location.origin);
