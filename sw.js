const CACHE_NAME = 'landslide-map-v23';
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

// Fetch Event: Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip PMTiles files (allow range requests)
    // Simple string check is safer than checking headers which might be missing/opaque
    if (event.request.url.indexOf('.pmtiles') !== -1) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});


