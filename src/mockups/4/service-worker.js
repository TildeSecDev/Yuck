const CACHE = 'yuck-single-shell-v6';
const OFFLINE = [
  './',
  './index.html',
  './index.css',
  './index.js',
  './manifest.json',
  '/assets/images/powder-explosion.png',
  '/assets/images/background-image.png',
  '/assets/images/plasticbag.png',
  '/assets/images/background-image-title-cutout.png',
  '/assets/images/background-image-title-cutout-large.png',
  '/assets/videos/Natural%20Supplement%20Clip.gif',
  '/assets/yuck-demo-supplement/Supplement.png',
  '/assets/yuck-demo-supplement/MultipleSupplement.png',
  '/assets/yuck-demo-supplement/SourSupplement.png',
  '/assets/yuck-demo-supplement/SourMultipleSupplement.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(OFFLINE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then(found => {
      if(found) return found;
      return fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
