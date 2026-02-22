// Authentication utilities
const auth = {
    async checkAuth(suppressErrors = true) {
        try {
            const response = await api.get('/api/auth/me');
            return response.data;
        } catch (error) {
            // Silently return null for guest users
            return null;
        }
    },

    async handleLogout() {
        try {
            await api.post('/api/auth/logout');
            window.location.href = '/pages/login.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect even if API call fails
            window.location.href = '/pages/login.html';
        }
    },

    redirectIfUnauthenticated() {
        this.checkAuth().then(user => {
            if (!user) {
                window.location.href = '/pages/login.html';
            }
        });
    },

    redirectIfAuthenticated() {
        this.checkAuth().then(user => {
            if (user) {
                const redirectTo = user.role === 'buyer' ? '/pages/buyer-home.html' :
                                 user.role === 'weaver' ? (user.isApproved ? '/pages/weaver-dashboard.html' : '/pages/weaver-pending.html') :
                                 '/pages/admin-dashboard.html';
                window.location.href = redirectTo;
            }
        });
    },

    // Quick login function
    async quickLogin(email, password) {
        try {
            const response = await api.post('/api/auth/login', { email, password });
            if (response.success) {
                return response.data.redirectTo;
            }
            throw new Error('Login failed');
        } catch (error) {
            throw error;
        }
    },

    // Auto-login from localStorage
    async autoLogin() {
        const rememberedEmail = localStorage.getItem('remembered_email');
        const rememberedPassword = localStorage.getItem('remembered_password');
        
        if (rememberedEmail && rememberedPassword) {
            try {
                const redirectTo = await this.quickLogin(rememberedEmail, rememberedPassword);
                if (redirectTo) {
                    window.location.href = redirectTo;
                    return true;
                }
            } catch (error) {
                // Clear invalid credentials
                localStorage.removeItem('remembered_email');
                localStorage.removeItem('remembered_password');
            }
        }
        return false;
    },

    // Get current user synchronously (from session)
    getCurrentUserSync() {
        // This is a placeholder - in production, you might store user in sessionStorage
        // For now, return null and let async checkAuth handle it
        return null;
    }
};

