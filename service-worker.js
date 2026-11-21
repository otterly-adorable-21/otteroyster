// Clean-up service worker. An earlier website on this domain installed a
// service worker that kept showing its old pages. Browsers re-check this file,
// get this version, and it removes itself and its saved copies, then reloads
// open tabs so they show the current site. Otter & Oyster itself needs no
// service worker.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    const tabs = await self.clients.matchAll({ type: 'window' });
    for (const tab of tabs) tab.navigate(tab.url);
  })());
});
