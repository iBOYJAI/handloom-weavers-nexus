// Offline support with IndexedDB
const offline = {
    dbName: 'HandloomNexusDB',
    dbVersion: 1,
    db: null,

    // Initialize IndexedDB
    async initDB() {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Object stores
                if (!db.objectStoreNames.contains('sarees')) {
                    db.createObjectStore('sarees', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('cart')) {
                    db.createObjectStore('cart', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('orders')) {
                    db.createObjectStore('orders', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('pending_sync')) {
                    const syncStore = db.createObjectStore('pending_sync', { keyPath: 'id', autoIncrement: true });
                    syncStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    },

    // Get data from store
    async get(storeName, key) {
        if (!this.db) await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    },

    // Set data in store
    async set(storeName, data) {
        if (!this.db) await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    },

    // Get all data from store
    async getAll(storeName) {
        if (!this.db) await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    },

    // Delete data from store
    async delete(storeName, key) {
        if (!this.db) await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    },

    // Queue sync operation
    async queueSync(type, data) {
        await this.set('pending_sync', {
            type,
            data,
            timestamp: Date.now()
        });
    },

    // Process sync queue
    async processSyncQueue() {
        if (!navigator.onLine) return;

        const pending = await this.getAll('pending_sync');
        if (pending.length === 0) return;

        for (const item of pending) {
            try {
                await this.syncItem(item);
                await this.delete('pending_sync', item.id);
            } catch (error) {
                console.error('Sync error:', error);
                // Keep item in queue for retry
            }
        }
    },

    // Sync individual item
    async syncItem(item) {
        switch (item.type) {
            case 'order':
                await api.post('/api/orders', item.data);
                break;
            case 'saree':
                // Handle saree upload sync
                break;
            default:
                console.warn('Unknown sync type:', item.type);
        }
    },

    // Check online status
    isOnline() {
        return navigator.onLine;
    },

    // Register background sync
    async registerSync(tag) {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            const registration = await navigator.serviceWorker.ready;
            try {
                await registration.sync.register(tag);
            } catch (error) {
                console.error('Background sync registration failed:', error);
            }
        }
    },

    // Initialize offline support
    async init() {
        await this.initDB();

        // Listen for online event
        window.addEventListener('online', () => {
            if (typeof notifications !== 'undefined') {
                notifications.showToast('info', 'Back Online', 'Syncing pending operations...');
            }
            this.processSyncQueue();
        });

        // Listen for offline event
        window.addEventListener('offline', () => {
            if (typeof notifications !== 'undefined') {
                notifications.showToast('warning', 'Offline', 'You are currently offline. Changes will sync when you reconnect.');
            }
        });

        // Process queue on load if online
        if (this.isOnline()) {
            this.processSyncQueue();
        }

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js').catch(console.error);
        }
    }
};

// Initialize offline support
offline.init().catch(console.error);

