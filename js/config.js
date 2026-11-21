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

export const API_BASE = readOverride() || location.origin;
