// API wrapper for centralized fetch handling
const API_BASE_URL = '';

const api = {
    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for session
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {}),
            },
            // ALWAYS include credentials - critical for session cookies
            // This ensures session cookies are sent even if options tries to override
            credentials: 'include',
        };

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, mergedOptions);

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // If not JSON (likely HTML error page), handle gracefully
                if (!response.ok) {
                    const authError = response.status === 401 || response.status === 403;
                    const error = new Error(
                        response.status === 401
                            ? 'Not authenticated'
                            : response.status === 403
                                ? 'Insufficient permissions'
                                : `Request failed with status ${response.status}`
                    );
                    error.status = response.status;
                    if (!authError) {
                        console.error('API Error:', error);
                    }
                    throw error;
                }
                // If OK but not JSON, return empty object
                return { success: true, data: null };
            }

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || 'Request failed');
                error.status = response.status;
                // Suppress console errors for expected auth failures (guest users)
                const isAuthEndpoint = url.includes('/api/auth/me');
                const isNotificationEndpoint = url.includes('/api/notifications');
                const isOrderEndpoint = url.includes('/api/orders');
                const isCartEndpoint = url.includes('/api/cart');

                // Suppress expected errors for guest users or permission issues
                // These are handled gracefully in the code
                const isWeaverEndpoint = url.includes('/api/weaver');
                const isAdminEndpoint = url.includes('/api/admin');
                const isUserEndpoint = url.includes('/api/users');

                const shouldSuppress = (
                    (response.status === 401 && (isAuthEndpoint || isNotificationEndpoint || isOrderEndpoint || isCartEndpoint)) ||
                    (response.status === 403 && (isNotificationEndpoint || isOrderEndpoint || isCartEndpoint || isWeaverEndpoint || isAdminEndpoint || isUserEndpoint))
                );


                if (!shouldSuppress && response.status !== 401 && response.status !== 403) {
                    console.error('API Error:', error);
                }
                throw error;
            }

            return data;
        } catch (error) {
            // Suppress console errors for expected auth failures
            const isAuthEndpoint = url.includes('/api/auth/me');
            if (error.status === 401 && isAuthEndpoint) {
                // Expected for guest users - silently fail
                throw error;
            } else if (error.status === 401 || error.status === 403) {
                // Other auth errors - might be unexpected
                throw error;
            }
            console.error('API Error:', error);
            throw error;
        }
    },

    get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    },

    post(url, body, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    put(url, body, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },

    patch(url, body, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    },

    delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    },

    // File upload
    async upload(url, formData, options = {}) {
        const defaultOptions = {
            credentials: 'include',
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
        };

        // Remove Content-Type header to let browser set it with boundary
        delete mergedOptions.headers?.['Content-Type'];

        const method = (mergedOptions.method || 'POST').toUpperCase();
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                ...mergedOptions,
                method,
                body: formData,
                // ALWAYS include credentials - critical for session cookies
                credentials: 'include',
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                if (!response.ok) {
                    throw new Error(`Upload failed with status ${response.status}`);
                }
                return { success: true, data: null };
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            return data;
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    },
};

