const CACHE_NAME = 'landslide-map-v31';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './maplibre-gl.css',
    './maplibre-gl.js',
    './pmtiles.js'
];

// Install Event: Cache core assets
self.addEventListener('install', (event) => {
    // Force this new service worker to become the active one, avoiding "waiting" state
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all: app shell and content');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
    // Take control of all open pages immediately
    event.waitUntil(clients.claim());
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
});

// Fetch Event: Network First for active development (Seamless Updates)
self.addEventListener('fetch', (event) => {
    // Skip remote PMTiles / Cloudflare R2 fetching completely (don't cache heavy tiles here)
    if (event.request.url.indexOf('.pmtiles') !== -1 || event.request.url.indexOf('r2.dev') !== -1) {
        return;
    }

    // Network-First Strategy for HTML/JS/CSS to guarantee live updates!
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // If network fetch succeeds, transparently update the cache in the background!
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // If offline or network fails, gracefully fallback to the cached version
                return caches.match(event.request);
            })
    );
});
