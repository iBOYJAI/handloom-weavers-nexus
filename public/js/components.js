// Component injection for header, sidebar, and footer
const components = {
    // Get current user role
    async getCurrentUser() {
        try {
            const response = await api.get('/api/auth/me');
            return response.data;
        } catch (error) {
            // Silently return null for unauthenticated users (expected for guests)
            return null;
        }
    },

    // Inject header
    // Inject header
    async injectHeader() {
        const placeholder = document.getElementById('header-placeholder');
        if (!placeholder) return;

        const user = await this.getCurrentUser();
        const unreadCount = await notifications.getUnreadCount();

        // Determine home link
        const isAdmin = user && user.role === 'admin';
        const homeLink = isAdmin ? '/pages/admin-dashboard.html' : '/pages/buyer-home.html';
        const searchPlaceholder = isAdmin ? 'Search...' : 'Search for weaves, regions, or styles...';

        const headerHTML = `
            <header class="header" id="main-header" style="height: 60px; padding: 0 4%; background: #ffffff; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; position: fixed; top: 0; left: 0; right: 0; width: 100% !important; z-index: 1001; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <!-- Logo -->
                <div style="flex: 0 0 auto;">
                    <a href="${homeLink}" class="header-logo" style="font-family: var(--font-heading); font-size: 1.75rem; color: var(--color-primary); text-decoration: none; font-weight: 800; letter-spacing: -1px; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="background: var(--color-primary); color: white; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 1.25rem;">H</span>
                        Handloom<span style="color: var(--color-dark); font-weight: 400;">Nexus</span>
                    </a>
                </div>

                <!-- Nav Links -->
                <nav style="display: flex; gap: 2rem; margin-right: 2rem;">
                    <a href="/pages/story.html" style="color: var(--color-dark); text-decoration: none; font-weight: 500; font-size: 0.95rem;">Stories</a>
                </nav>

                <!-- Search (Centered-ish) -->
                <div style="flex: 1; max-width: 500px; margin-right: 3rem; position: relative;">
                    <div style="position: relative; display: flex; align-items: center;">
                        <svg style="position: absolute; left: 1rem; color: #999;" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="search" id="global-search" placeholder="${searchPlaceholder}" style="width: 100%; padding: 0.85rem 1rem 0.85rem 3rem; border: 1.5px solid #f0f0f0; border-radius: 100px; font-size: 0.95rem; background: #fcfcfc; transition: all 0.3s;" onfocus="this.style.background='#fff'; this.style.borderColor='var(--color-primary)'; this.style.boxShadow='0 0 0 4px rgba(192, 57, 43, 0.1)'" onblur="this.style.background='#fcfcfc'; this.style.borderColor='#f0f0f0'; this.style.boxShadow='none'" autocomplete="off" />
                    </div>
                    <!-- Suggestions Dropdown -->
                    <div id="search-suggestions" style="position: absolute; top: calc(100% + 10px); left: 0; right: 0; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #eee; display: none; overflow: hidden; z-index: 1000;"></div>
                </div>

                <!-- Actions -->
                <div style="flex: 0 0 auto; display: flex; align-items: center; gap: 1.5rem;">
                    ${user && !isAdmin ? `
                        <a href="/pages/cart.html" class="header-icon-btn" aria-label="Cart" style="position: relative; color: var(--color-dark); transition: color 0.3s;" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='var(--color-dark)'">
                            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM20 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                        </a>
                    ` : ''}
                    
                    ${user ? `
                        <div style="display: flex; align-items: center; gap: 1rem; border-left: 1px solid #eee; padding-left: 1.5rem;">
                            <button class="header-icon-btn" id="notification-btn" aria-label="Notifications" style="position: relative; color: var(--color-dark); transition: color 0.3s;" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='var(--color-dark)'">
                                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                                ${unreadCount > 0 ? `<span style="position: absolute; top: -5px; right: -5px; background: var(--color-primary); color: white; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center;">${unreadCount}</span>` : ''}
                            </button>
                            
                            <div class="dropdown" style="position: relative;">
                                <button class="header-icon-btn" id="profile-btn" style="display: flex; align-items: center; gap: 0.5rem; background: none; border: none; cursor: pointer;">
                                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-cream); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; border: 2px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1); overflow: hidden;">
                                        ${user.avatar ? `<img src="${user.avatar}" style="width:100%; height:100%; object-fit:cover;">` : (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                                    </div>
                                    <div style="text-align: left; line-height: 1.2; display: none; @media (min-width: 1024px) { display: block; }">
                                        <div style="font-size: 0.85rem; font-weight: 700; color: var(--color-dark);">${user.name}</div>
                                        <div style="font-size: 0.75rem; color: #999; text-transform: capitalize;">${user.role}</div>
                                    </div>
                                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-top: 2px; color: #999;"><path d="M6 9l6 6 6-6"></path></svg>
                                </button>
                                <div class="dropdown-menu" id="profile-dropdown" style="position: absolute; top: calc(100% + 0.75rem); right: 0; width: 240px; background: white; border-radius: 16px; box-shadow: 0 15px 40px rgba(0,0,0,0.12); border: 1px solid #f0f0f0; display: none; padding: 0.5rem; z-index: 9999;">
                                    <div style="padding: 1rem; border-bottom: 1px solid #f9f9f9;">
                                        <div style="font-size: 0.9rem; font-weight: 700;">${user.name}</div>
                                        <div style="font-size: 0.8rem; color: #999;">${user.email}</div>
                                    </div>
                                    <a href="/pages/profile.html" class="dropdown-item" style="display: block; padding: 0.75rem 1rem; font-size: 0.9rem; color: var(--color-dark); text-decoration: none; border-radius: 8px; transition: background 0.2s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='transparent'">My Profile</a>
                                    ${isAdmin ? `<a href="/pages/admin-dashboard.html" class="dropdown-item" style="display: block; padding: 0.75rem 1rem; font-size: 0.9rem; color: var(--color-dark); text-decoration: none; border-radius: 8px; transition: background 0.2s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='transparent'">Admin Dashboard</a>` : ''}
                                    ${user.role === 'weaver' ? `<a href="/pages/weaver-dashboard.html" class="dropdown-item" style="display: block; padding: 0.75rem 1rem; font-size: 0.9rem; color: var(--color-dark); text-decoration: none; border-radius: 8px; transition: background 0.2s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='transparent'">Weaver Dashboard</a>` : ''}
                                    <div style="height: 1px; background: #f0f0f0; margin: 0.5rem 0;"></div>
                                    <a href="#" class="dropdown-item" id="logout-btn" style="display: block; padding: 0.75rem 1rem; font-size: 0.9rem; color: var(--color-primary); text-decoration: none; border-radius: 8px; transition: background 0.2s;" onmouseover="this.style.background='#fff0f0'" onmouseout="this.style.background='transparent'">Logout</a>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <a href="/pages/login.html" style="text-decoration: none; color: var(--color-dark); font-weight: 500; font-size: 0.95rem; padding: 0.5rem 1rem;">Login</a>
                            <a href="/pages/register.html" class="btn btn-primary" style="border-radius: 100px; padding: 0.6rem 1.75rem; font-size: 0.95rem; font-weight: 600; box-shadow: 0 4px 15px rgba(192, 57, 43, 0.2);">Get Started</a>
                        </div>
                    `}
                </div>
            </header>
        `;

        placeholder.innerHTML = headerHTML;

        // Attach event listeners
        if (user) {
            const notificationBtn = document.getElementById('notification-btn');
            const profileBtn = document.getElementById('profile-btn');
            const profileDropdown = document.getElementById('profile-dropdown');
            const logoutBtn = document.getElementById('logout-btn');

            if (notificationBtn) {
                notificationBtn.addEventListener('click', () => {
                    notifications.toggleDropdown();
                });
            }

            if (profileBtn && profileDropdown) {
                profileBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const isVisible = profileDropdown.style.display === 'block';
                    profileDropdown.style.display = isVisible ? 'none' : 'block';
                });
            }

            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    auth.handleLogout();
                });
            }

            // Close dropdowns when clicking outside
            document.addEventListener('click', (e) => {
                if (profileDropdown && profileDropdown.style.display === 'block') {
                    if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                        profileDropdown.style.display = 'none';
                    }
                }
            });
        }

        // Global Search Functionality with Suggestions
        const searchInput = document.getElementById('global-search');
        const suggestionsDiv = document.getElementById('search-suggestions');
        let suggestionTimeout;

        if (searchInput && suggestionsDiv) {
            searchInput.addEventListener('input', () => {
                clearTimeout(suggestionTimeout);
                const query = searchInput.value.trim();
                if (query.length < 2) {
                    suggestionsDiv.style.display = 'none';
                    return;
                }

                suggestionTimeout = setTimeout(async () => {
                    try {
                        const response = await api.get(`/api/sarees/search?q=${encodeURIComponent(query)}&limit=5`);
                        const suggestions = response.data || [];
                        if (suggestions.length > 0) {
                            suggestionsDiv.innerHTML = suggestions.map(s => `
                                <div class="suggestion-item" style="padding: 0.75rem 1rem; cursor: pointer; display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid #f9f9f9;" onclick="window.location.href='/pages/saree-detail.html?id=${s.id}'" onmouseover="this.style.background='#fcfcfc'" onmouseout="this.style.background='white'">
                                    <img src="${s.primary_image ? '/' + s.primary_image : '/assets/images/defaults/saree-placeholder.svg'}" style="width: 32px; height: 40px; border-radius: 4px; object-fit: cover;">
                                    <div>
                                        <div style="font-size: 0.9rem; font-weight: 600; color: var(--color-dark);">${s.title}</div>
                                        <div style="font-size: 0.75rem; color: #999;">₹${s.price} · By ${s.weaver_name}</div>
                                    </div>
                                </div>
                            `).join('') + `
                                <div style="padding: 0.75rem 1rem; text-align: center; background: #fdfdfd; cursor: pointer;" onclick="window.location.href='/pages/buyer-home.html?q=${encodeURIComponent(query)}'">
                                    <span style="font-size: 0.85rem; color: var(--color-primary); font-weight: 600;">View all results for "${query}"</span>
                                </div>
                            `;
                            suggestionsDiv.style.display = 'block';
                        } else {
                            suggestionsDiv.style.display = 'none';
                        }
                    } catch (err) {
                        suggestionsDiv.style.display = 'none';
                    }
                }, 300);
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim();
                    if (query) {
                        window.location.href = `/pages/buyer-home.html?q=${encodeURIComponent(query)}`;
                    }
                }
            });

            // Close suggestions on click outside
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
                    suggestionsDiv.style.display = 'none';
                }
            });
        }
    },

    // Inject sidebar (only for logged-in users; guests get no sidebar)
    async injectSidebar() {
        const placeholder = document.getElementById('sidebar-placeholder');
        if (!placeholder) return;

        const user = await this.getCurrentUser();
        const currentPath = window.location.pathname;

        // Guests: no sidebar – expand main content to full width
        if (!user) {
            placeholder.innerHTML = '';
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.classList.add('no-sidebar');
            }
            return;
        }

        let sidebarItems = [];

        if (!user) {
            // (unreachable, kept for safety)
            sidebarItems = [];
        } else {
            // Role-based sidebar
            switch (user.role) {
                case 'buyer':
                    sidebarItems = [
                        { href: '/pages/buyer-home.html', icon: 'house', text: 'Home' },
                        { href: '/pages/wishlist.html', icon: 'heart', text: 'Wishlist' },
                        { href: '/pages/cart.html', icon: 'shopping-cart', text: 'Cart' },
                        { href: '/pages/order-history.html', icon: 'list-check', text: 'Orders' },
                        { href: '/pages/profile.html', icon: 'user', text: 'Profile' }
                    ];
                    break;
                case 'weaver':
                    if (!user.isApproved) {
                        sidebarItems = [
                            { href: '/pages/weaver-pending.html', icon: 'gauge', text: 'Pending Approval' },
                            { href: '/pages/buyer-home.html', icon: 'house', text: 'Browse Sarees' },
                            { href: '/pages/profile.html', icon: 'user', text: 'Profile' }
                        ];
                    } else {
                        sidebarItems = [
                            { href: '/pages/weaver-dashboard.html', icon: 'gauge', text: 'Dashboard' },
                            { href: '/pages/weaver-sarees.html', icon: 'list', text: 'My Sarees' },
                            { href: '/pages/weaver-upload.html', icon: 'file-upload', text: 'Upload Saree' },
                            { href: '/pages/weaver-orders.html', icon: 'clipboard-check', text: 'My Orders' },
                            { href: '/pages/weaver-manage-stories.html', icon: 'file-text', text: 'Stories' },
                            { href: '/pages/weaver-sales-report.html', icon: 'clipboard-check', text: 'Sales Report' },
                            { href: '/pages/profile.html', icon: 'user', text: 'Profile' }
                        ];
                    }
                    break;
                case 'admin':
                    sidebarItems = [
                        { href: '/pages/admin-dashboard.html', icon: 'gauge', text: 'Dashboard' },
                        { href: '/pages/admin-approvals.html', icon: 'clipboard-check', text: 'Approvals' },
                        { href: '/pages/admin-users.html', icon: 'users', text: 'Users' },
                        { href: '/pages/admin-sarees.html', icon: 'list', text: 'Sarees' },
                        { href: '/pages/admin-orders.html', icon: 'clipboard-check', text: 'Orders' },
                        { href: '/pages/admin-categories.html', icon: 'folder', text: 'Categories' },
                        { href: '/pages/admin-analytics.html', icon: 'square-poll', text: 'Analytics' },
                        { href: '/pages/admin-report.html', icon: 'file-text', text: 'Reports' }
                    ];
                    break;
            }
        }

        const sidebarHTML = `
            <aside class="sidebar" id="sidebar">
                <nav class="sidebar-menu">
                    ${sidebarItems.map(item => {
            const isActive = currentPath.includes(item.href);
            const iconUrl = this.getIconUrl(item.icon);
            return `
                            <a href="${item.href}" class="sidebar-item ${isActive ? 'active' : ''}">
                                <img src="${iconUrl}" class="sidebar-item-icon" style="width: 20px; height: 20px; ${isActive ? 'filter: brightness(0) invert(1);' : ''}">
                                <span class="sidebar-item-text">${item.text}</span>
                            </a>
                        `;
        }).join('')}
                </nav>
            </aside>
            <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Toggle sidebar">
                <img src="/assets/icons/Notion-Icons/Regular/svg/ni-sidebar.svg" style="width: 20px; height: 20px;">
            </button>
        `;

        placeholder.innerHTML = sidebarHTML;

        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.remove('no-sidebar');
        }

        this.initSidebarToggle();
    },

    // Get icon URL from Notion-Icons
    getIconUrl(iconName) {
        const icons = {
            house: 'ni-house',
            'shopping-cart': 'ni-shopping-cart',
            'list-check': 'ni-list-check',
            user: 'ni-user',
            gauge: 'ni-gauge',
            'file-upload': 'ni-file-upload',
            'file-text': 'ni-file-text',
            'clipboard-check': 'ni-clipboard-check',
            users: 'ni-users',
            list: 'ni-list',
            folder: 'ni-folder',
            'square-poll': 'ni-square-poll',
            heart: 'ni-butterfly',
        };
        const fileName = icons[iconName] || 'ni-file';
        return `/assets/icons/Notion-Icons/Regular/svg/${fileName}.svg`;
    },

    // Initialize sidebar toggle
    initSidebarToggle() {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebar-toggle');
        const mainContent = document.querySelector('.main-content');

        if (!sidebar || !toggle) return;

        // Check initial state for toggle icon rotation
        if (sidebar.classList.contains('sidebar--collapsed')) {
            toggle.style.transform = 'rotate(180deg)';
        }

        // Check if mobile
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // Mobile: toggle sidebar overlay
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('show');
                // Create backdrop
                let backdrop = document.querySelector('.sidebar-backdrop');
                if (!backdrop) {
                    backdrop = document.createElement('div');
                    backdrop.className = 'sidebar-backdrop';
                    document.body.appendChild(backdrop);
                }
                backdrop.classList.toggle('show');
            });

            // Close sidebar when clicking backdrop
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('sidebar-backdrop')) {
                    sidebar.classList.remove('show');
                    e.target.classList.remove('show');
                }
            });
        } else {
            // Desktop: toggle collapsed state
            toggle.addEventListener('click', () => {
                const collapsed = sidebar.classList.toggle('sidebar--collapsed');
                if (mainContent) {
                    mainContent.classList.toggle('sidebar-collapsed', collapsed);
                }

                // Rotate toggle icon
                toggle.style.transform = collapsed ? 'rotate(180deg)' : 'rotate(0deg)';

                // Persist state
                localStorage.setItem('sidebar-collapsed', collapsed);

                const shell = document.querySelector('.app-shell');
                if (shell) shell.classList.toggle('sidebar-collapsed', collapsed);
            });
        }
    },

    // Inject footer
    injectFooter() {
        const placeholder = document.getElementById('footer-placeholder');
        if (!placeholder) return;

        const footerHTML = `
            <footer class="footer" style="background: var(--color-border); border-top: 1px solid var(--color-border); padding: 5rem 2rem 2rem; margin-top: 4rem;">
                <div style="max-width: 1400px; margin: 0 auto;">
                    <!-- Footer Main Content -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 3rem; margin-bottom: 5rem;">
                        <!-- Column 1: About -->
                        <div>
                            <h4 style="font-family: var(--font-heading); font-size: 1.25rem; margin-bottom: 1.5rem; color: var(--color-dark);">About Handloom Nexus</h4>
                            <p style="color: #666; line-height: 1.8; font-size: 0.95rem; margin-bottom: 2rem;">
                                Connecting India's finest artisans with a global audience. We celebrate authentic craftsmanship, sustainable fashion, and the timeless beauty of handloom sarees.
                            </p>
                            <!-- Social Links -->
                            <div style="display: flex; gap: 1rem;">
                                <a href="#" style="color: var(--color-dark); opacity: 0.6; transition: opacity 0.3s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">
                                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                                </a>
                                <a href="#" style="color: var(--color-dark); opacity: 0.6; transition: opacity 0.3s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">
                                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                                </a>
                                <a href="#" style="color: var(--color-dark); opacity: 0.6; transition: opacity 0.3s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">
                                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                                </a>
                            </div>
                        </div>

                        <!-- Column 2: Collections -->
                        <div style="padding-left: 2rem;">
                            <h4 style="font-family: var(--font-heading); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2rem; color: var(--color-primary);">Collections</h4>
                            <ul style="list-style: none; padding: 0;">
                                <li style="margin-bottom: 1rem;"><a href="/pages/buyer-home.html#all-sarees" style="color: var(--color-maroon); text-decoration: none; font-size: 0.95rem; transition: color 0.3s;" onmouseover="this.style.color='var(--color-white)'" onmouseout="this.style.color='var(--color-maroon)'">All Sarees</a></li>
                                <li style="margin-bottom: 1rem;"><a href="/pages/buyer-home.html#featured-sarees" style="color: var(--color-maroon); text-decoration: none; font-size: 0.95rem; transition: color 0.3s;" onmouseover="this.style.color='var(--color-white)'" onmouseout="this.style.color='var(--color-maroon)'">Special Collections</a></li>
                            </ul>
                        </div>

                        <!-- Column 3: Company -->
                        <div style="padding-left: 2rem;">
                            <h4 style="font-family: var(--font-heading); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2rem; color: var(--color-primary);">Company</h4>
                            <ul style="list-style: none; padding: 0;">
                                <li style="margin-bottom: 1rem;"><a href="/pages/story.html" style="color: var(--color-maroon); text-decoration: none; font-size: 0.95rem; transition: color 0.3s;" onmouseover="this.style.color='var(--color-white)'" onmouseout="this.style.color='var(--color-maroon)'">Stories</a></li>
                                <li style="margin-bottom: 1rem;"><a href="/pages/join-weaver.html" style="color: var(--color-maroon); text-decoration: none; font-size: 0.95rem; transition: color 0.3s;" onmouseover="this.style.color='var(--color-white)'" onmouseout="this.style.color='var(--color-maroon)'">Join as Weaver</a></li>
                                <li style="margin-bottom: 1rem;"><a href="/pages/sustainability.html" style="color: var(--color-maroon); text-decoration: none; font-size: 0.95rem; transition: color 0.3s;" onmouseover="this.style.color='var(--color-white)'" onmouseout="this.style.color='var(--color-maroon)'">Sustainability</a></li>
                                <li style="margin-bottom: 1rem;"><a href="/pages/impact.html" style="color: var(--color-maroon); text-decoration: none; font-size: 0.95rem; transition: color 0.3s;" onmouseover="this.style.color='var(--color-white)'" onmouseout="this.style.color='var(--color-maroon)'">Impact Report</a></li>
                            </ul>
                        </div>

                        <!-- Column 4: Support -->
                        <div style="padding-left: 2rem;">
                            <h4 style="font-family: var(--font-heading); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2rem; color: var(--color-primary);">Support</h4>
                            <ul style="list-style: none; padding: 0;">
                                <li style="margin-bottom: 1rem;"><a href="/pages/contact.html" style="color: var(--color-maroon); text-decoration: none; font-size: 0.95rem; transition: color 0.3s;" onmouseover="this.style.color='var(--color-white)'" onmouseout="this.style.color='var(--color-maroon)'">Contact Us</a></li>
                                <li style="margin-bottom: 1rem;"><a href="/pages/shipping.html" style="color: var(--color-maroon); text-decoration: none; font-size: 0.95rem; transition: color 0.3s;" onmouseover="this.style.color='var(--color-white)'" onmouseout="this.style.color='var(--color-maroon)'">Shipping Policy</a></li>
                                <li style="margin-bottom: 1rem;"><a href="/pages/returns.html" style="color: var(--color-maroon); text-decoration: none; font-size: 0.95rem; transition: color 0.3s;" onmouseover="this.style.color='var(--color-white)'" onmouseout="this.style.color='var(--color-maroon)'">Returns & Exchanges</a></li>
                                <li style="margin-bottom: 1rem;"><a href="/pages/faq.html" style="color: var(--color-maroon); text-decoration: none; font-size: 0.95rem; transition: color 0.3s;" onmouseover="this.style.color='var(--color-white)'" onmouseout="this.style.color='var(--color-maroon)'">FAQs</a></li>
                            </ul>
                        </div>
                    </div>

                    <!-- Footer Large Brand Typography -->
                    <div style="border-top: 1px solid var(--color-border); padding-top: 4rem; text-align: center;">
                        <h2 style="font-family: var(--font-heading); font-size: clamp(3rem, 10vw, 8rem); color: var(--color-dark); letter-spacing: -2px; line-height: 1; margin: 0; text-transform: uppercase;">
                            Handloom<span style="color: var(--color-primary);">Nexus</span>
                        </h2>
                    </div>

                    <!-- Copyright & Bottom Links -->
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 3rem; margin-top: 2.5rem; border-top: 1px solid rgba(255,255,255,0.1); flex-wrap: wrap; gap: 1.5rem;">
                        <p style="color: var(--color-primary); font-size: 0.85rem;">
                            &copy; ${new Date().getFullYear()} Handloom Weavers Nexus. Crafted with pride.
                        </p>
                        <div style="display: flex; gap: 2rem;">
                            <a href="/pages/terms.html" style="color: var(--color-primary); text-decoration: none; font-size: 0.85rem; transition: color 0.3s;" onmouseover="this.style.color='var(--color-white)'" onmouseout="this.style.color='var(--color-primary)'">Terms</a>
                            <a href="/pages/privacy.html" style="color: var(--color-primary); text-decoration: none; font-size: 0.85rem; transition: color 0.3s;" onmouseover="this.style.color='var(--color-white)'" onmouseout="this.style.color='var(--color-primary)'">Privacy</a>
                        </div>
                    </div>
                </div>
            </footer>
        `;

        placeholder.innerHTML = footerHTML;
    },

    // Initialize all components
    async init() {
        await this.injectHeader();
        await this.injectSidebar();
        this.injectFooter();
    }
};

// Initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => components.init());
} else {
    components.init();
}

