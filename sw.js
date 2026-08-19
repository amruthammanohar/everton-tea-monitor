// Mano202 Power Monitor — service worker
// Bump CACHE_NAME (and version.json / the app-version meta tag) every time you publish
// an edit. A new CACHE_NAME makes the browser fetch fresh files and fire 'updatefound',
// which the dashboard's checkForUpdate() logic turns into the "Reload now" banner.
const CACHE_NAME = 'mano202-v2.3.0';
const CORE_FILES = [
  './mano202_dashboard.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_FILES).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first for the HTML shell (always try to get the latest file when online),
// falling back to cache when offline — so the app still opens on a factory floor
// with no signal, but prefers the live version whenever it can reach the server.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
