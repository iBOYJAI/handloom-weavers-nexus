// Main app initialization
// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                // Service Worker registered successfully
            })
            .catch((error) => {
                // Service Worker registration failed (non-critical)
            });
    });
}

// Add manifest link
if (!document.querySelector('link[rel="manifest"]')) {
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    document.head.appendChild(manifestLink);
}

