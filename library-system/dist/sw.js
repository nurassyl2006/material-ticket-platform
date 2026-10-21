const CACHE_NAME = 'athenaeum-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Always fetch fresh network copies for HTML, API, and assets
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
