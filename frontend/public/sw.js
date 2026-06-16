const CACHE_NAME = 'nexcart-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/images/chronos_elite.jpg',
  '/images/aura_headphones.jpg',
  '/images/aria_crossbody.jpg',
  '/images/modern_essential.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and ignore internal Next.js hot-reloads/webpack endpoints
  if (event.request.method !== 'GET' || event.request.url.includes('_next') || event.request.url.includes('webpack')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // Cache successful responses for assets/images
          if (response && response.status === 200 && (event.request.url.includes('/images/') || event.request.url.endsWith('.js') || event.request.url.endsWith('.css'))) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails and request is for an HTML page, we can fall back to the root cache
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }
        });
    })
  );
});
