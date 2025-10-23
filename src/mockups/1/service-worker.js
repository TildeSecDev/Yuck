const CACHE = 'yuck-m1-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // HTML navigations: network-first with offline fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static assets in scope: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req)
          .then((resp) => {
            const copy = resp.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
            return resp;
          })
          .catch(() => cached)
      );
    })
  );
});
