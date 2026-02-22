// Notification utilities
const notifications = {
    // Get unread count (works for all users, including guests)
    async getUnreadCount() {
        try {
            const response = await api.get('/api/notifications/unread-count');
            return response.data?.count || 0;
        } catch (error) {
            // Silently return 0 for any errors (401, 403, network errors, etc.)
            // This route should work for everyone, but if it fails, just return 0
            return 0;
        }
    },

    // Load notifications
    async loadNotifications() {
        try {
            const response = await api.get('/api/notifications?limit=20');
            return response.data || [];
        } catch (error) {
            return [];
        }
    },

    // Mark notification as read
    async markAsRead(notificationId) {
        try {
            await api.patch(`/api/notifications/${notificationId}/read`);
            return true;
        } catch (error) {
            return false;
        }
    },

    // Show toast notification
    showToast(type, title, message, duration = 3000) {
        const container = this.getToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = this.getToastIcon(type);

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Close">×</button>
        `;

        container.appendChild(toast);

        // Auto remove
        const timeout = setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        // Manual close
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(timeout);
            this.removeToast(toast);
        });

        return toast;
    },

    // Get toast container
    getToastContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    },

    // Get toast icon
    getToastIcon(type) {
        const icons = {
            success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            error: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
            info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
            warning: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        };
        return icons[type] || icons.info;
    },

    // Remove toast
    removeToast(toast) {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            toast.remove();
        }, 300);
    },

    // Toggle notification dropdown
    async toggleDropdown() {
        const dropdown = document.getElementById('notification-dropdown');
        if (!dropdown) {
            const btn = document.getElementById('notification-btn');
            if (!btn) return;

            const newDropdown = document.createElement('div');
            newDropdown.id = 'notification-dropdown';
            newDropdown.className = 'dropdown-menu';
            btn.parentElement.appendChild(newDropdown);

            // Load notifications
            const notifs = await this.loadNotifications();

            let html = `
                <div class="notif-header">
                    <h3>Notifications</h3>
                    <button class="btn-text" style="font-size: 0.75rem; color: var(--color-primary); background: none; border: none; cursor: pointer;" onclick="notifications.markAllRead()">Mark all as read</button>
                </div>
            `;

            if (notifs.length === 0) {
                html += '<div class="notif-empty">No notifications yet</div>';
            } else {
                html += notifs.map(notif => `
                    <div class="notif-item ${notif.is_read ? '' : 'unread'}" data-id="${notif.id}">
                        <div class="notif-content">
                            <div class="notif-message">${notif.message}</div>
                            <div class="notif-time">${this.formatDate(notif.created_at)}</div>
                        </div>
                    </div>
                `).join('');
            }

            newDropdown.innerHTML = html;

            // Handle notification clicks
            newDropdown.querySelectorAll('.notif-item').forEach(item => {
                item.addEventListener('click', async (e) => {
                    // Check auth first
                    const user = await auth.checkAuth();
                    if (!user) {
                        window.location.href = '/pages/login.html';
                        return;
                    }

                    const id = parseInt(item.dataset.id);
                    const message = item.querySelector('.notif-message').textContent.toLowerCase();

                    // Mark as read first
                    await this.markAsRead(id);
                    item.classList.remove('unread');
                    await this.updateBadge();

                    // Determine where to navigate based on role and message
                    const isWeaver = user.role === 'weaver';

                    if (message.includes('order') || message.includes('purchase')) {
                        window.location.href = isWeaver ? '/pages/weaver-orders.html' : '/pages/order-history.html';
                    } else if (message.includes('story') || message.includes('artisan')) {
                        window.location.href = isWeaver ? '/pages/weaver-manage-stories.html' : '/pages/story.html';
                    } else if (message.includes('saree') || message.includes('approval') || message.includes('creation')) {
                        window.location.href = isWeaver ? '/pages/weaver-sarees.html' : '/pages/buyer-home.html';
                    } else if (message.includes('offer') || message.includes('discount')) {
                        window.location.href = '/pages/buyer-home.html';
                    } else if (message.includes('cart')) {
                        window.location.href = '/pages/cart.html';
                    } else if (message.includes('profile') || message.includes('account')) {
                        window.location.href = '/pages/profile.html';
                    } else {
                        // Default fallback
                        window.location.href = isWeaver ? '/pages/weaver-dashboard.html' : '/pages/buyer-home.html';
                    }
                });
            });

            newDropdown.classList.add('show');
        } else {
            dropdown.classList.toggle('show');
        }
    },

    // Mark all as read
    async markAllRead() {
        try {
            await api.patch('/api/notifications/read-all');
            const items = document.querySelectorAll('.notif-item');
            items.forEach(item => item.classList.remove('unread'));
            await this.updateBadge();
            this.showToast('success', 'Success', 'All notifications marked as read');
        } catch (error) {
            console.error('Mark all read error:', error);
        }
    },

    // Update notification badge
    async updateBadge() {
        const count = await this.getUnreadCount();
        const badge = document.querySelector('.notification-badge');
        if (count > 0) {
            if (!badge) {
                const btn = document.getElementById('notification-btn');
                if (btn) {
                    const newBadge = document.createElement('span');
                    newBadge.className = 'notification-badge';
                    newBadge.textContent = count;
                    btn.appendChild(newBadge);
                }
            } else {
                badge.textContent = count;
            }
        } else {
            if (badge) badge.remove();
        }
    },

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    },

    // Initialize
    async init() {
        await this.updateBadge();
        // Update badge every 30 seconds
        setInterval(() => this.updateBadge(), 30000);
    }
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => notifications.init());
} else {
    notifications.init();
}

