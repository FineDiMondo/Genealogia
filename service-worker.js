self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open('gn370-static-v1');
    await cache.addAll([
      './',
      './index.html',
      './assets/gn370.css',
      './assets/gn370.js',
      './src/copybook/copybook_parser.js',
      './src/copybook/record_parser.js',
      './src/copybook/record_renderer_370.js',
      './version.json',
      './manifest.webmanifest'
    ]);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== 'gn370-static-v1').map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;

  if (url.pathname.includes('/data/current/')) {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open('gn370-static-v1');
    const cached = await cache.match(req);
    if (cached) return cached;
    const network = await fetch(req);
    if (network && network.ok && url.origin === self.location.origin) {
      cache.put(req, network.clone()).catch(() => {});
    }
    return network;
  })());
});
