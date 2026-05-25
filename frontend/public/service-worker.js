const CACHE_NAME = 'kouira-pwa-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })
    ))
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Sólo manejar GET
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      // Almacenar en cache resultados GET de la misma origen
      if (req.url.startsWith(self.location.origin)) {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
      }
      return res;
    }).catch(() => caches.match('/')))
  );
});

