// ⚠️ DEPLOY-1: When bumping version, also update APP_VERSION in index.html (line 7) and style.css?v= in index.html
const CACHE_NAME = 'landslide-map-v88';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './pmtiles.js',
    './maplibre-gl.js',
    './maplibre-gl.css'
];

// Install Event: Cache core assets
self.addEventListener('install', (event) => {
    // Force this new service worker to become the active one, avoiding "waiting" state
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Event: Clean up old caches and take control cleanly
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            clients.claim(),
            caches.keys().then((keyList) => Promise.all(
                keyList.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
            ))
        ])
    );
});

// Fetch Event: Network First for active development (Seamless Updates)
self.addEventListener('fetch', (event) => {
    // Skip remote PMTiles / Cloudflare R2 fetching completely (don't cache heavy tiles here)
    if (event.request.url.indexOf('.pmtiles') !== -1 || event.request.url.indexOf('r2.dev') !== -1) {
        return;
    }

    // Skip large GeoJSON files and live Open-Meteo API calls (cached in IndexedDB)
    if (event.request.url.indexOf('.geojson') !== -1 || event.request.url.indexOf('api.open-meteo.com') !== -1) {
        return;
    }
    
    // Skip non-HTTP/HTTPS requests (like chrome-extension://)
    if (!event.request.url.startsWith('http')) {
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
                return caches.match(event.request, { ignoreSearch: true });
            })
    );
});
