/**
 * Buyer Home — single source of truth for home page logic.
 * Load order: auth → hero → offers → categories → tab products → stories → all sarees.
 */
(function () {
    const FEATURED_LIMIT = 12;
    const TAB_SIZE = 8;
    const STORIES_LIMIT = 3;

    let user = null;
    let currentCategory = null;
    let minPrice = null;
    let maxPrice = null;

    const LOCAL_IMGS = [
        '/assets/images/sarees/saree_001.jpeg', '/assets/images/sarees/saree_002.jpg',
        '/assets/images/sarees/saree_003.jpg', '/assets/images/sarees/saree_004.jpg',
        '/assets/images/sarees/saree_005.jpg', '/assets/images/sarees/saree_006.jpg',
        '/assets/images/sarees/saree_007.jpg', '/assets/images/sarees/saree_008.jpg',
        '/assets/images/sarees/saree_009.jpg', '/assets/images/sarees/saree_010.jpg',
        '/assets/images/sarees/saree_012.jpg', '/assets/images/sarees/saree_013.jpg',
        '/assets/images/sarees/saree_014.jpg', '/assets/images/sarees/saree_015.jpeg',
        '/assets/images/sarees/saree_018.jpeg', '/assets/images/sarees/saree_021.jpeg',
        '/assets/images/sarees/saree_025.jpeg', '/assets/images/sarees/saree_027.jpeg',
        '/assets/images/sarees/saree_029.jpg',
    ];
    const CATEGORY_IMGS = LOCAL_IMGS.filter((_, i) => i % 2 === 0).slice(0, 8);

    function el(id) { return document.getElementById(id); }

    /** Fetch sarees from API; returns array (empty on error or non-JSON). */
    async function fetchSarees(urlPath) {
        try {
            const res = await api.get(urlPath);
            const list = res && (res.data != null ? res.data : res.sarees);
            return Array.isArray(list) ? list : [];
        } catch (e) {
            if (e.status !== 401) console.warn('fetchSarees failed', urlPath, e);
            return [];
        }
    }

    function normalizeImg(img, index) {
        if (!img) return LOCAL_IMGS[index % LOCAL_IMGS.length];
        if (/^https?:\/\//.test(img)) return img;
        // Single leading slash only (//assets/... would resolve to http://assets/... and fail)
        const path = (img.startsWith('/') ? img : '/' + img).replace(/^\/+/, '/');
        return path;
    }

    function renderCard(saree, index, options = {}) {
        const img = normalizeImg(saree.primary_image, index);
        const price = saree.finalPrice != null ? saree.finalPrice : saree.price;
        const originalPrice = saree.originalPrice != null ? saree.originalPrice : saree.price;
        const showOffer = saree.offer && price !== originalPrice;
        const badge = saree.is_new ? 'New' : (index === 0 ? 'Popular' : '');
        const addBtn = user
            ? `<button class="btn btn-primary product-card-sm-btn" onclick="window.buyerHomeAddToCart(${saree.id},event)">Add Cart</button>`
            : `<a href="/pages/login.html" class="btn btn-secondary product-card-sm-btn">Login</a>`;
        return `
        <div class="product-card-sm" onclick="window.location.href='/pages/saree-detail.html?id=${saree.id}'">
            ${badge ? `<span class="product-card-sm-badge">${badge}</span>` : ''}
            <img class="product-card-sm-img" src="${img}" alt="${(saree.title || '').replace(/"/g, '&quot;')}" onerror="this.src='${LOCAL_IMGS[0]}'">
            <div class="product-card-sm-body">
                <div class="product-card-sm-cat">${(saree.category_name || 'Saree').replace(/</g, '&lt;')}</div>
                <div class="product-card-sm-title">${(saree.title || '').replace(/</g, '&lt;')}</div>
                <div class="product-card-sm-weaver">By ${(saree.weaver_name || 'Artisan Weaver').replace(/</g, '&lt;')}</div>
            </div>
            <div class="product-card-sm-footer">
                ${showOffer
                    ? `<span style="text-decoration:line-through;opacity:0.6;margin-right:0.35rem;">₹${Number(originalPrice).toLocaleString('en-IN')}</span><span class="product-card-sm-price">₹${Number(price).toLocaleString('en-IN')}</span>`
                    : `<span class="product-card-sm-price">₹${Number(price).toLocaleString('en-IN')}</span>`
                }
                ${addBtn}
            </div>
        </div>`;
    }

    function renderGrid(sarees, containerId, startIndex = 0) {
        const elm = el(containerId);
        if (!elm) return;
        if (!sarees.length) {
            elm.innerHTML = `<div style="text-align:center;padding:3rem;grid-column:1/-1;color:#666;"><p style="margin-bottom:0.5rem;">No products in this section yet.</p><p style="font-size:0.9rem;color:#999;">Browse categories above or check back soon for new arrivals.</p></div>`;
            return;
        }
        elm.innerHTML = sarees.map((s, i) => renderCard(s, startIndex + i)).join('');
    }

    function setLoading(containerId, message = 'Loading…') {
        const elm = el(containerId);
        if (elm) elm.innerHTML = `<div style="text-align:center;padding:3rem;grid-column:1/-1;color:#999;">${message}</div>`;
    }

    function setError(containerId, message, onRetry) {
        const elm = el(containerId);
        if (!elm) return;
        elm.innerHTML = `<div style="text-align:center;padding:3rem;grid-column:1/-1;color:#c0392b;"><p>${message}</p>${onRetry ? `<button type="button" class="btn btn-primary" onclick="(${onRetry})()" style="margin-top:1rem;border-radius:var(--radius-full);">Retry</button>` : ''}</div>`;
    }

    async function initAuthAndHero() {
        user = await auth.checkAuth(false);
        const heroCta = el('hero-cta');
        const heroSub = el('hero-subtitle');
        if (heroCta) {
            heroCta.innerHTML = user
                ? '<a href="#all-sarees" class="btn btn-primary" style="border-radius:var(--radius-full);padding:0.75rem 2rem;">Continue Shopping</a>'
                : '<a href="/pages/register.html" class="btn btn-primary" style="border-radius:var(--radius-full);padding:0.75rem 2rem;">Start Shopping</a><a href="/pages/login.html" class="btn btn-secondary" style="border-radius:var(--radius-full);padding:0.75rem 2rem;">Login</a>';
        }
        if (heroSub) heroSub.textContent = user ? 'Welcome back! Discover exquisite handloom sarees.' : 'Our sarees are a reflection of your elegance. Premium handloom directly from artisan weavers across India.';
    }

    async function loadOffers() {
        try {
            const res = await api.get('/api/offers/active');
            const offers = (res.data || []).slice(0, 5);
            if (!offers.length) return;
            const bar = el('offer-marquee-bar');
            const track = el('marquee-track');
            if (!bar || !track) return;
            const sep = '<span class="marquee-sep" style="margin:0 2rem;"> ✦ </span>';
            const texts = offers.map(o => {
                let t = `<span class="marquee-item">${(o.title || '').replace(/</g, '&lt;')}`;
                if (o.type === 'percentage') t += ` <strong>${o.value}% OFF</strong>`;
                else if (o.type === 'fixed') t += ` <strong>₹${o.value} OFF</strong>`;
                else if (o.type === 'free_shipping') t += ` <strong>FREE SHIPPING</strong>`;
                t += '</span>';
                return t;
            }).join(sep);
            track.innerHTML = texts + sep + texts + sep;
            bar.classList.add('visible');
            const ann = el('announcement-bar');
            if (ann && offers[0]) ann.textContent = offers[0].description || `${offers[0].title} — Limited Time Offer`;
        } catch (_) { }
    }

    async function loadCategoryShowcase() {
        try {
            const res = await api.get('/api/categories');
            const cats = res.data || [];
            const grid = el('category-grid');
            if (!grid) return;
            if (!cats.length) {
                grid.innerHTML = '<div class="cat-card" style="opacity:0.6;"><span class="cat-name">No categories yet</span></div>';
                return;
            }
            grid.innerHTML = cats.map((c, i) => `
                <div class="cat-card" onclick="window.buyerHomeFilterByCategory(${c.id})" style="cursor:pointer;">
                    <div class="cat-icon-wrap"><img src="${CATEGORY_IMGS[i % CATEGORY_IMGS.length]}" alt="${(c.name || '').replace(/"/g, '&quot;')}"></div>
                    <span class="cat-name">${(c.name || '').replace(/</g, '&lt;')}</span>
                    <span class="cat-count">${c.saree_count != null ? c.saree_count : 0} items</span>
                </div>
            `).join('');
        } catch (e) {
            console.error('loadCategoryShowcase', e);
            const grid = el('category-grid');
            if (grid) grid.innerHTML = '<div class="cat-card" style="opacity:0.6;"><span class="cat-name">Could not load categories</span></div>';
        }
    }

    async function loadFilterTabs() {
        try {
            const res = await api.get('/api/categories');
            const cats = res.data || [];
            const tabs = el('category-tabs');
            if (!tabs) return;
            tabs.innerHTML = '<button class="filter-tab active" data-category="all">All</button>' +
                cats.map(c => `<button class="filter-tab" data-category="${c.id}">${(c.name || '').replace(/</g, '&lt;')}</button>`).join('');
            tabs.querySelectorAll('.filter-tab').forEach(btn => {
                btn.addEventListener('click', () => {
                    tabs.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentCategory = btn.dataset.category === 'all' ? null : parseInt(btn.dataset.category, 10);
                    loadSarees();
                });
            });
            const urlParams = new URLSearchParams(window.location.search);
            const catParam = urlParams.get('category');
            if (catParam) {
                currentCategory = parseInt(catParam, 10);
                const target = tabs.querySelector(`[data-category="${catParam}"]`);
                if (target) {
                    tabs.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
                    target.classList.add('active');
                }
            }
        } catch (e) {
            console.error('loadFilterTabs', e);
        }
    }

    async function loadTabSarees() {
        const featuredEl = el('featured-grid');
        setLoading('featured-grid', 'Loading products…');
        setLoading('new-arrivals-grid', 'Loading…');
        setLoading('bestseller-grid', 'Loading…');
        try {
            const sarees = await fetchSarees(`/api/sarees?limit=${FEATURED_LIMIT}`);
            if (!sarees.length) {
                renderGrid([], 'featured-grid');
                renderGrid([], 'new-arrivals-grid');
                renderGrid([], 'bestseller-grid');
                return;
            }
            renderGrid(sarees.slice(0, TAB_SIZE), 'featured-grid');
            const byDate = [...sarees].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            renderGrid(byDate.slice(0, TAB_SIZE), 'new-arrivals-grid', TAB_SIZE);
            const byPrice = [...sarees].sort((a, b) => (b.price || 0) - (a.price || 0));
            renderGrid(byPrice.slice(0, TAB_SIZE), 'bestseller-grid', TAB_SIZE * 2);
        } catch (e) {
            console.error('loadTabSarees', e);
            setError('featured-grid', 'Could not load products. Make sure the server is running and try again.', 'window.buyerHomeLoadTabSarees');
        }
    }

    async function loadStories() {
        try {
            const res = await api.get(`/api/stories?limit=${STORIES_LIMIT}`);
            const stories = res.data || [];
            const grid = el('stories-grid');
            if (!grid) return;
            if (!stories.length) {
                grid.innerHTML = '<p style="text-align:center;color:#999;grid-column:1/-1;">No stories available yet.</p>';
                return;
            }
            grid.innerHTML = stories.map(s => {
                const path = (s.media_path || '').startsWith('http') ? s.media_path : '/' + (s.media_path || '').replace(/^\/+/, '');
                return `
                <div class="story-card" onclick="window.location.href='/pages/story-detail.html?id=${s.id}'" style="cursor:pointer;background:white;border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-sm);transition:transform 0.2s;">
                    <div style="height:200px;overflow:hidden;position:relative;">
                        <img src="${path}" alt="${(s.title || '').replace(/"/g, '&quot;')}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='/assets/images/defaults/story-placeholder.svg'">
                        <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.8));padding:1.25rem;color:white;">
                            <h3 style="margin:0;font-size:1.1rem;font-family:var(--font-heading);color:var(--color-white);">${(s.title || '').replace(/</g, '&lt;')}</h3>
                        </div>
                    </div>
                    <div style="padding:1.25rem;">
                        <p style="font-size:0.9rem;color:#666;margin-bottom:1rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${(s.caption || s.description || '').replace(/</g, '&lt;')}</p>
                        <span style="color:var(--color-primary);font-weight:600;font-size:0.85rem;">Read legacy →</span>
                    </div>
                </div>`;
            }).join('');
        } catch (e) {
            console.error('loadStories', e);
            const grid = el('stories-grid');
            if (grid) grid.innerHTML = '<p style="text-align:center;color:#999;grid-column:1/-1;">Could not load stories.</p>';
        }
    }

    async function loadSarees() {
        const grid = el('saree-grid');
        const empty = el('empty-state');
        if (!grid) return;
        setLoading('saree-grid', 'Loading sarees…');
        grid.style.display = 'grid';
        if (empty) empty.style.display = 'none';
        try {
            const params = new URLSearchParams();
            if (currentCategory) params.append('category', currentCategory);
            if (minPrice) params.append('minPrice', minPrice);
            if (maxPrice) params.append('maxPrice', maxPrice);
            const urlParams = new URLSearchParams(window.location.search);
            const q = urlParams.get('q');
            if (q) params.append('q', q);
            const path = q ? `/api/sarees/search?${params}` : `/api/sarees?${params}`;
            const list = await fetchSarees(path);
            if (!list.length) {
                grid.style.display = 'none';
                if (empty) empty.style.display = 'block';
                return;
            }
            renderGrid(list, 'saree-grid');
        } catch (e) {
            console.error('loadSarees', e);
            setError('saree-grid', 'Could not load sarees. Make sure the server is running.', 'window.buyerHomeLoadSarees');
        }
    }

    window.buyerHomeFilterByCategory = function (id) {
        currentCategory = id || null;
        const url = new URL(window.location);
        if (id) url.searchParams.set('category', id);
        else url.searchParams.delete('category');
        window.history.pushState({}, '', url);
        const tabs = el('category-tabs');
        if (tabs) {
            tabs.querySelectorAll('.filter-tab').forEach(b => {
                b.classList.remove('active');
                if (String(b.dataset.category) === String(id) || (id == null && b.dataset.category === 'all')) b.classList.add('active');
            });
        }
        const section = el('all-sarees');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
        loadSarees();
    };

    window.buyerHomeAddToCart = async function (sareeId, evt) {
        if (evt) evt.stopPropagation();
        if (!user) {
            window.location.href = '/pages/login.html';
            return;
        }
        try {
            await api.post('/api/cart/add', { sareeId, quantity: 1 });
            if (typeof notifications !== 'undefined') notifications.showToast('success', 'Added!', 'Item added to cart');
        } catch (e) {
            if (typeof notifications !== 'undefined') notifications.showToast('error', 'Error', e.message || 'Failed to add');
        }
    };

    window.buyerHomeLoadTabSarees = loadTabSarees;
    window.buyerHomeLoadSarees = loadSarees;

    async function run() {
        await initAuthAndHero();
        await loadOffers();
        await loadCategoryShowcase();
        await loadFilterTabs();
        await loadTabSarees();
        await loadStories();
        await loadSarees();

        const tabBtns = el('product-tab-btns');
        if (tabBtns) {
            tabBtns.addEventListener('click', e => {
                const btn = e.target.closest('.prod-tab');
                if (!btn) return;
                tabBtns.querySelectorAll('.prod-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                const panel = el('tab-' + btn.dataset.tab);
                if (panel) panel.classList.add('active');
            });
        }

        const applyBtn = el('apply-filters');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const minEl = el('min-price');
                const maxEl = el('max-price');
                minPrice = (minEl && minEl.value.trim()) ? minEl.value : null;
                maxPrice = (maxEl && maxEl.value.trim()) ? maxEl.value : null;
                loadSarees();
            });
        }

        const whatsappForm = el('whatsapp-form');
        if (whatsappForm) {
            whatsappForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const nameEl = document.getElementById('userName');
                const name = nameEl ? nameEl.value.trim() : '';
                const phoneNumber = '919876543210';
                const message = 'Hi, my name is ' + name + '. I want to know more about your products.';
                const whatsappURL = 'https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message);
                const link = el('whatsappLink');
                const box = el('whatsappBox');
                if (link) link.href = whatsappURL;
                if (box) box.style.display = 'block';
                if (typeof notifications !== 'undefined') notifications.showToast('success', 'Connected!', 'Our team will reach out to you soon!');
            });
        }
    }

    run();
})();
