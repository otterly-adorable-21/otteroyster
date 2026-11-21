// Where the Otter & Oyster server (API + Discord bot) lives.
// The server hosts the website itself, so the API is on the same address the
// page was loaded from (e.g. https://otteroyster.online/api/...).
// If the site is ever served without the server (a plain static host), API
// calls simply fail and the game runs offline on this device.
// Override for testing with ?api=https://example.com (remembered in localStorage).
function readOverride() {
  try {
    const q = new URLSearchParams(location.search).get('api');
    if (q) localStorage.setItem('otteroyster.api', q);
    return localStorage.getItem('otteroyster.api');
  } catch {
    return null;
  }
}

// Optional: the server's own address (e.g. your Railway "….up.railway.app" URL).
// Used as a fallback when the site is served by a plain static host (like GitHub
// Pages) that has no /api of its own. Leave empty if the server hosts the site.
export const SERVER_FALLBACK = '';

export const API_BASE = readOverride() || location.origin;

// Addresses to try, in order.
export const API_CANDIDATES = [...new Set([readOverride(), location.origin, SERVER_FALLBACK].filter(Boolean).map((u) => u.replace(/\/$/, '')))];
