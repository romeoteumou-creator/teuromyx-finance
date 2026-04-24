const CACHE_NAME = 'teuromyx-v2';
const ASSETS = [
  '/teuromyx-finance/',
  '/teuromyx-finance/index.html',
  '/teuromyx-finance/manifest.json',
  '/teuromyx-finance/icon-192.png',
  '/teuromyx-finance/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // APIs externes → Network first
  if(url.hostname.includes('supabase.co') ||
     url.hostname.includes('googleapis.com') ||
     url.hostname.includes('cdnjs.cloudflare.com')){
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // App → Cache first + update en arrière-plan
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(resp => {
        if(resp && resp.status === 200 && resp.type !== 'opaque'){
          caches.open(CACHE_NAME).then(c => c.put(e.request, resp.clone()));
        }
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
