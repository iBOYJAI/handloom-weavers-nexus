// Buyer home page logic (now accessible to guests)
(async function () {
    // Check auth (optional - guests can view)
    const user = await auth.checkAuth(false); // Allow guest viewing

    // Hero section: guest vs logged-in - guest shows Register+Login; logged-in shows Continue Shopping
    (function initHeroForAuth() {
        const heroSection = document.getElementById('hero-section');
        const heroCta = document.getElementById('hero-cta');
        const heroSubtitle = heroSection?.querySelector('.hero-subtitle');
        if (!heroSection || !heroCta) return;
        if (user) {
            heroCta.innerHTML = '<a href="#category-showcase" class="btn btn-hero-primary">Continue Shopping</a>';
            if (heroSubtitle) heroSubtitle.textContent = 'Welcome back! Discover exquisite handloom sarees.';
        } else {
            heroCta.innerHTML = `
                <a href="/pages/register.html" class="btn btn-hero-primary">Start Shopping</a>
                <a href="/pages/login.html" class="btn btn-hero-secondary">Login</a>
            `;
            if (heroSubtitle) heroSubtitle.textContent = 'Our sarees are a reflection of your elegance. Premium handloom directly from artisan weavers.';
        }
    })();

    let currentCategory = null;
    let minPrice = null;
    let maxPrice = null;

    // Load active offers banner (marquee style with multiple offers)
    async function loadOfferBanner() {
        try {
            const response = await api.get('/api/offers/active');
            const allOffers = response.data || [];
            // Limit to max 5 offers in the banner
            const offers = allOffers.slice(0, 5);

            if (offers.length > 0) {
                const banner = document.getElementById('offer-banner');
                const offerMarqueeContent = document.getElementById('offer-marquee-content');

                if (banner && offerMarqueeContent) {
                    // Build offer text spans
                    const offerTexts = offers.map(offer => {
                        let text = `<span style="font-weight: 600; font-size: 1.05rem;">${offer.title}</span>`;
                        if (offer.type === 'percentage') {
                            text += ` <span style="color: #FFD700; font-weight: bold;">${offer.value}% OFF</span>`;
                        } else if (offer.type === 'fixed') {
                            text += ` <span style="color: #FFD700; font-weight: bold;">₹${offer.value} OFF</span>`;
                        } else if (offer.type === 'free_shipping') {
                            text += ` <span style="color: #FFD700; font-weight: bold;">FREE SHIPPING</span>`;
                        } else if (offer.type === 'bogo') {
                            text += ` <span style="color: #FFD700; font-weight: bold;">BUY 1 GET 1</span>`;
                        }
                        if (offer.description) {
                            text += ` <span style="opacity: 0.85; font-size: 0.9rem;">| ${offer.description}</span>`;
                        }
                        return text;
                    });

                    const separator = '<span style="margin: 0 2.5rem; opacity: 0.4;">✦</span>';
                    const marqueeContent = offerTexts.join(separator);

                    // Duplicate content exactly once — translateX(-50%) creates seamless loop
                    offerMarqueeContent.innerHTML = `
                        ${marqueeContent}${separator}
                        ${marqueeContent}${separator}
                    `;

                    banner.style.display = 'block';
                }

                // Update announcement bar dynamically with first offer
                const announcementBar = document.querySelector('.announcement-bar');
                if (announcementBar) {
                    const firstOffer = offers[0];
                    let announcementText = firstOffer.title;
                    if (firstOffer.type === 'percentage') announcementText += ` — ${firstOffer.value}% OFF`;
                    else if (firstOffer.type === 'fixed') announcementText += ` — ₹${firstOffer.value} OFF`;
                    else if (firstOffer.type === 'free_shipping') announcementText += ' — FREE SHIPPING';
                    else if (firstOffer.type === 'bogo') announcementText += ' — BUY 1 GET 1 FREE';
                    if (firstOffer.description) announcementText += ` | ${firstOffer.description}`;
                    announcementBar.textContent = announcementText;
                }
            }
        } catch (error) {
            // Silently fail - offers are optional
            console.log('Offers not available');
        }
    }

    // Load featured sarees
    async function loadFeaturedSarees() {
        try {
            const response = await api.get('/api/sarees?limit=6');
            const sarees = response.data || [];

            if (sarees.length > 0) {
                const section = document.getElementById('featured-section');
                const grid = document.getElementById('featured-grid');

                if (section && grid) {
                    section.style.display = 'block';
                    grid.innerHTML = renderSareeGrid(sarees.slice(0, 6));
                }
            }
        } catch (error) {
            console.error('Load featured error:', error);
        }
    }

    // Load new arrivals
    async function loadNewArrivals() {
        try {
            const response = await api.get('/api/sarees?limit=6');
            const sarees = response.data || [];

            if (sarees.length > 0) {
                const section = document.getElementById('new-arrivals-section');
                const grid = document.getElementById('new-arrivals-grid');

                if (section && grid) {
                    section.style.display = 'block';
                    // Sort by created_at desc and take first 6
                    const sorted = sarees.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    grid.innerHTML = renderSareeGrid(sorted.slice(0, 6));
                }
            }
        } catch (error) {
            console.error('Load new arrivals error:', error);
        }
    }

    // Load category showcase
    async function loadCategoryShowcase() {
        try {
            const response = await api.get('/api/categories');
            const categories = response.data || [];

            const showcase = document.getElementById('category-grid');
            if (showcase && categories.length > 0) {
                showcase.innerHTML = categories.map(cat => `
                    <a href="/pages/buyer-home.html?category=${cat.id}" style="text-decoration: none; color: inherit;">
                        <div style="background: var(--color-white); padding: 2rem; border-radius: var(--radius-lg); text-align: center; box-shadow: var(--shadow-sm); transition: transform var(--transition-base); cursor: pointer;" 
                             onmouseover="this.style.transform='translateY(-5px)'" 
                             onmouseout="this.style.transform='translateY(0)'">
                            <h3 style="font-family: var(--font-heading); color: var(--color-primary); margin: 0;">${cat.name}</h3>
                        </div>
                    </a>
                `).join('');
            }
        } catch (error) {
            console.error('Load category showcase error:', error);
        }
    }

    // Render saree grid helper
    function renderSareeGrid(sarees) {
        return sarees.map(saree => `
            <div class="saree-card" onclick="window.location.href='/pages/saree-detail.html?id=${saree.id}'" style="cursor: pointer; position: relative; ${saree.stock <= 0 ? 'opacity: 0.8;' : ''}">
                <img src="${saree.primary_image || '/assets/images/defaults/saree-placeholder.svg'}" alt="${saree.title}" class="saree-image" onerror="this.src='/assets/images/defaults/saree-placeholder.svg'">
                ${saree.stock <= 0 ? '<div style="position: absolute; top: 10px; right: 10px; background: #e74c3c; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: bold; z-index: 2;">OUT OF STOCK</div>' : ''}
                <div class="saree-info">
                    <h3 class="saree-title">${saree.title}</h3>
                    <p class="saree-weaver">By ${saree.weaver_name || 'Weaver'}</p>
                    <div class="saree-price">
                        ${saree.offer ? `
                            <span style="text-decoration: line-through; opacity: 0.6; margin-right: 0.5rem;">₹${saree.originalPrice || saree.price}</span>
                            <span style="color: var(--color-light-red); font-weight: bold;">₹${saree.finalPrice || saree.price}</span>
                            <span class="offer-badge" style="background: var(--color-light-red); color: white; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.8rem; margin-left: 0.5rem;">${saree.offer.type === 'percentage' ? saree.offer.value + '% OFF' : 'OFFER'}</span>
                        ` : `
                            <span>₹${saree.price}</span>
                        `}
                    </div>
                    <div class="saree-actions" onclick="event.stopPropagation();">
                        ${user ? `
                            <button class="btn btn-primary" ${saree.stock <= 0 ? 'disabled style="background: #ccc; cursor: not-allowed; border-color: #ccc;"' : `onclick="addToCart(${saree.id})"`}>${saree.stock <= 0 ? 'No Stock' : 'Add to Cart'}</button>
                        ` : `
                            <a href="/pages/login.html" class="btn btn-primary">Login to Buy</a>
                        `}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Load categories
    async function loadCategories() {
        try {
            const response = await api.get('/api/categories');
            const categories = response.data || [];

            const tabsContainer = document.getElementById('category-tabs');
            tabsContainer.innerHTML = `
                <button class="category-tab ${currentCategory === null ? 'active' : ''}" data-category="all">All</button>
                ${categories.map(cat => `
                    <button class="category-tab ${currentCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">${cat.name}</button>
                `).join('')}
            `;

            // Attach click handlers
            tabsContainer.querySelectorAll('.category-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    const categoryId = tab.dataset.category;
                    currentCategory = categoryId === 'all' ? null : parseInt(categoryId);
                    document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    loadSarees();
                });
            });
        } catch (error) {
            console.error('Load categories error:', error);
        }
    }

    // Load sarees
    async function loadSarees() {
        const grid = document.getElementById('saree-grid');
        const emptyState = document.getElementById('empty-state');
        grid.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading...</div>';

        try {
            const params = new URLSearchParams();
            if (currentCategory) params.append('category', currentCategory);
            if (minPrice) params.append('minPrice', minPrice);
            if (maxPrice) params.append('maxPrice', maxPrice);

            // Check for search query
            const urlParams = new URLSearchParams(window.location.search);
            const searchQuery = urlParams.get('q');
            if (searchQuery) {
                params.append('q', searchQuery);
            }

            const url = searchQuery ? `/api/sarees/search?${params}` : `/api/sarees?${params}`;
            const response = await api.get(url);
            const sarees = response.data || [];

            if (sarees.length === 0) {
                grid.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            grid.style.display = 'grid';
            emptyState.style.display = 'none';
            grid.innerHTML = renderSareeGrid(sarees);
        } catch (error) {
            console.error('Load sarees error:', error);
            grid.innerHTML = '<div style="text-align: center; padding: 2rem; color: red;">Error loading sarees</div>';
        }
    }

    // Add to cart
    window.addToCart = async function (sareeId) {
        if (!user) {
            window.location.href = '/pages/login.html';
            return;
        }
        try {
            await api.post('/api/cart/add', { sareeId, quantity: 1 });
            notifications.showToast('success', 'Success', 'Item added to cart');
        } catch (error) {
            notifications.showToast('error', 'Error', error.message || 'Failed to add to cart');
        }
    };

    // Apply filters
    document.getElementById('apply-filters').addEventListener('click', () => {
        minPrice = document.getElementById('min-price').value || null;
        maxPrice = document.getElementById('max-price').value || null;
        loadSarees();
    });

    // Initialize
    await loadOfferBanner();
    await loadCategories();
    await loadCategoryShowcase();
    await loadFeaturedSarees();
    await loadNewArrivals();
    await loadSarees();
})();

