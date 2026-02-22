// Service Worker for Handloom Weavers Nexus
const CACHE_NAME = 'handloom-nexus-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/pages/buyer-home.html',
    '/pages/login.html',
    '/pages/register.html',
    '/css/variables.css',
    '/css/base.css',
    '/css/components.css',
    '/css/layout.css',
    '/css/pages.css',
    '/js/api.js',
    '/js/auth.js',
    '/js/components.js',
    '/js/notifications.js',
    '/js/search.js',
    '/js/profile.js',
    '/js/offline.js',
    '/assets/images/favicon.svg'
];

// Install event - Pre-cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Cache-first for static, network-first for API
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Static assets - Cache-first strategy
    if (
        url.pathname.endsWith('.html') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.ttf') ||
        url.pathname.endsWith('.woff')
    ) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then((response) => {
                    if (response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // API requests - Network-first with IndexedDB fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Network failed - try cache
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Return offline response
                        return new Response(
                            JSON.stringify({
                                success: false,
                                message: 'You are offline. Please check your connection.'
                            }),
                            {
                                status: 503,
                                headers: { 'Content-Type': 'application/json' }
                            }
                        );
                    });
                })
        );
        return;
    }

    // Default - try network, fallback to cache
    event.respondWith(
        fetch(request)
            .then((response) => {
                return response;
            })
            .catch(() => {
                return caches.match(request);
            })
    );
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOrders());
    }
});

async function syncOrders() {
    // This would sync pending orders from IndexedDB
    // Implementation depends on offline.js
    console.log('Syncing orders...');
}

