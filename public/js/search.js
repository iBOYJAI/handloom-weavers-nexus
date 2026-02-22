// Search utilities with debounce
const search = {
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Initialize search
    initSearchInput(inputId, callback) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const debouncedSearch = this.debounce(async (query) => {
            if (query.length > 100) {
                notifications.showToast('error', 'Error', 'Search query too long (max 100 characters)');
                return;
            }
            await callback(query);
        }, 300);

        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            debouncedSearch(query);
        });

        // Handle Enter key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.trim();
                debouncedSearch(query);
            }
        });
    },

    // Global search handler
    initGlobalSearch() {
        const input = document.getElementById('global-search');
        if (!input) return;

        const debouncedSearch = this.debounce(async (query) => {
            if (query.length === 0) return;
            if (query.length > 100) {
                notifications.showToast('error', 'Error', 'Search query too long');
                return;
            }
            // Redirect to buyer home with search query
            window.location.href = `/pages/buyer-home.html?q=${encodeURIComponent(query)}`;
        }, 300);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.trim();
                if (query) {
                    debouncedSearch(query);
                }
            }
        });
    }
};

// Initialize global search on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => search.initGlobalSearch());
} else {
    search.initGlobalSearch();
}

