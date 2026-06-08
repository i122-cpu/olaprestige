const CACHE_NAME = 'olaprestige-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  '/manifest.json',
  '/logo.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request)
    )
  );
});
