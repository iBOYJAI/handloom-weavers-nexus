/**
 * Wishlist Utility - Centralized management of wishlist state
 * Synchronizes between API, UI, and LocalStorage for real-time updates.
 */
const wishlistUtils = {
    _wishlist: new Set(),
    _initialized: false,
    _loadingPromise: null,

    /**
     * Initialize the wishlist from API
     */
    async init() {
        if (this._initialized) return;
        if (this._loadingPromise) return this._loadingPromise;

        this._loadingPromise = (async () => {
            try {
                // First load from local for immediate UI feedback
                this._loadFromLocal();

                const res = await api.get('/api/wishlist');
                const list = res.data || [];
                this._wishlist = new Set(list.map(item => Number(item.saree_id)));
                this._saveToLocal();
                this._initialized = true;
            } catch (e) {
                console.warn('Wishlist initialization from API failed, using LocalStorage', e);
                this._loadFromLocal();
            } finally {
                this._loadingPromise = null;
            }
        })();

        return this._loadingPromise;
    },

    _saveToLocal() {
        localStorage.setItem('user_wishlist', JSON.stringify([...this._wishlist]));
    },

    _loadFromLocal() {
        try {
            const stored = localStorage.getItem('user_wishlist');
            if (stored) {
                this._wishlist = new Set(JSON.parse(stored).map(id => Number(id)));
            }
        } catch (e) {
            console.error('Failed to parse local wishlist', e);
        }
    },

    /**
     * Check if a saree is in the wishlist
     * @param {number|string} sareeId 
     * @returns {boolean}
     */
    isInWishlist(sareeId) {
        return this._wishlist.has(Number(sareeId));
    },

    /**
     * Toggle wishlist state
     * @param {number|string} sareeId 
     * @param {HTMLElement} [btnElement] Optional button to update 
     * @param {HTMLElement} [iconElement] Optional icon to update 
     * @returns {Promise<boolean>} New state (true = in wishlist)
     */
    async toggle(sareeId, btnElement, iconElement) {
        const sid = Number(sareeId);
        const isCurrentlyIn = this.isInWishlist(sid);
        const isAdding = !isCurrentlyIn;

        // 1. Optimistic UI update (Instant)
        if (isAdding) {
            this._wishlist.add(sid);
        } else {
            this._wishlist.delete(sid);
        }
        this._saveToLocal();
        this.updateElement(sid, btnElement, iconElement);

        try {
            // 2. API Sync
            const res = await api.post('/api/wishlist/toggle', { sareeId: sid });
            const serverInWishlist = res.data ? res.data.inWishlist : (res.hasOwnProperty('inWishlist') ? res.inWishlist : isAdding);

            // 3. Server Sync (if server state differs)
            if (serverInWishlist !== isAdding) {
                if (serverInWishlist) this._wishlist.add(sid);
                else this._wishlist.delete(sid);
                this._saveToLocal();
                this.updateElement(sid, btnElement, iconElement);
            }

            // 4. Force Notify other components if needed (custom event)
            window.dispatchEvent(new CustomEvent('wishlistSync', { detail: { sareeId: sid, inWishlist: serverInWishlist } }));

            // 5. Success Toast
            notifications.showToast('success', serverInWishlist ? 'Added!' : 'Removed',
                serverInWishlist ? 'Added to Wishlist' : 'Removed from Wishlist');

            return serverInWishlist;
        } catch (e) {
            // 6. Revert on error
            if (isAdding) this._wishlist.delete(sid);
            else this._wishlist.add(sid);
            this._saveToLocal();
            this.updateElement(sid, btnElement, iconElement);
            notifications.showToast('error', 'Error', e.message || 'Failed to update wishlist');
            throw e;
        }
    },

    /**
     * Update specific elements based on current set
     * @param {number|string} sareeId 
     * @param {HTMLElement} btnElement 
     * @param {HTMLElement} iconElement 
     */
    updateElement(sareeId, btnElement, iconElement) {
        const inWL = this.isInWishlist(sareeId);
        if (btnElement) {
            inWL ? btnElement.classList.add('in-wishlist') : btnElement.classList.remove('in-wishlist');
        }
        if (iconElement) {
            inWL ? iconElement.classList.add('active') : iconElement.classList.remove('active');
        }
    }
};

// Automatic initialization
(async () => {
    // Only init if user might be logged in
    const user = await auth.checkAuth(false);
    if (user) {
        await wishlistUtils.init();
    } else {
        // Clear local cache for guests
        localStorage.removeItem('user_wishlist');
    }
})();
