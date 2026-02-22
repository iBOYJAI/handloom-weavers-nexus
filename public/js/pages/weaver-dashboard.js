(async function () {
    const user = await auth.checkAuth();
    if (!user || user.role !== 'weaver') {
        window.location.href = '/pages/login.html';
        return;
    }

    const weaverNameEl = document.getElementById('weaver-name');
    if (weaverNameEl) weaverNameEl.textContent = user.name || 'Weaver';

    const CACHE_KEY = 'weaver_sales_chart_cache';
    const CACHE_MAX_AGE = 1000 * 60 * 60; // 1 hour

    function renderOfflineChart(cached) {
        const container = document.getElementById('chart-bars');
        const msgEl = document.getElementById('chart-offline-msg');
        if (!container) return;

        const rows = cached.rows || [];
        if (rows.length === 0) {
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #999;">
                    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📊</div>
                    <p>No sales data captured yet.</p>
                </div>`;
            if (msgEl) msgEl.style.display = 'none';
            return;
        }

        const byDate = {};
        rows.forEach(r => {
            const d = (r.created_at || '').slice(0, 10);
            if (!byDate[d]) byDate[d] = 0;
            byDate[d] += (r.price || 0) * (r.quantity || 1);
        });

        const sorted = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
        const maxVal = Math.max(1, ...sorted.map(([, v]) => v));

        container.innerHTML = sorted.map(([date, val]) => {
            const pct = (val / maxVal) * 100;
            const label = new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            return `
                <div class="chart-bar-premium">
                    <span class="chart-bar-label">${label}</span>
                    <div class="chart-bar-container">
                        <div class="chart-bar-fill" style="width: ${pct}%"></div>
                    </div>
                    <span class="chart-bar-value">₹${Math.round(val).toLocaleString()}</span>
                </div>`;
        }).join('');

        if (msgEl) msgEl.style.display = !navigator.onLine ? 'inline-block' : 'none';
    }

    try {
        const response = await api.get('/api/weaver/dashboard');
        const data = response.data;

        // Stats with glass cards
        document.getElementById('stats-grid').innerHTML = `
            <div class="glass-card">
                <div class="dashboard-card-icon">S</div>
                <div class="dashboard-card-title">Live Sarees</div>
                <div class="dashboard-card-value">${data.totalSarees}</div>
                <div class="dashboard-card-change" style="color: #666;">In your collection</div>
            </div>
            <div class="glass-card">
                <div class="dashboard-card-icon" style="color: #3498db;">O</div>
                <div class="dashboard-card-title">Total Orders</div>
                <div class="dashboard-card-value">${data.totalOrders}</div>
                <div class="dashboard-card-change" style="color: #666;">Sales volume</div>
            </div>
            <div class="glass-card">
                <div class="dashboard-card-icon" style="color: #27ae60;">E</div>
                <div class="dashboard-card-title">Total Revenue</div>
                <div class="dashboard-card-value">₹${Math.round(data.totalEarnings || 0).toLocaleString('en-IN')}</div>
                <div class="dashboard-card-change" style="color: #27ae60;">Lifetime success</div>
            </div>
            <div class="glass-card">
                <div class="dashboard-card-icon" style="color: #e67e22;">P</div>
                <div class="dashboard-card-title">Pending</div>
                <div class="dashboard-card-value">${data.pendingOrders}</div>
                <div class="dashboard-card-change" style="color: ${data.pendingOrders > 0 ? '#e67e22' : '#666'};">
                    ${data.pendingOrders > 0 ? 'Requires attention' : 'Awaiting new orders'}
                </div>
            </div>
        `;

        // Chart data
        try {
            const reportRes = await api.get('/api/weaver/sales-report?status=all&days=30');
            const raw = reportRes.data;
            const orders = (raw && raw.orders) || (Array.isArray(raw) ? raw : []);

            const rows = [];
            (Array.isArray(orders) ? orders : []).forEach(o => {
                (o.items || []).forEach(item => {
                    rows.push({
                        created_at: o.created_at,
                        price: parseFloat(item.price_at_purchase || item.price || 0),
                        quantity: parseInt(item.quantity || 1, 10)
                    });
                });
            });

            const cached = { rows, fetchedAt: Date.now() };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
            renderOfflineChart(cached);
        } catch (e) {
            const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            renderOfflineChart(cached);
        }

        // Recent orders
        const ordersHtml = (data.recentOrders && data.recentOrders.length > 0)
            ? data.recentOrders.map(order => `
                <div class="order-card-aesthetic" style="border: none; border-bottom: 1px solid #f0f0f0; border-radius: 0; padding: 1rem 0; margin: 0;">
                    <div class="order-info-aesthetic">
                        <h4 style="font-weight: 600;">#ORD-${order.id}</h4>
                        <p style="font-size: 0.8rem;">₹${order.total_amount.toLocaleString('en-IN')}</p>
                    </div>
                    <span class="status-chip ${order.status}">${order.status}</span>
                </div>
            `).join('')
            : '<p style="color: #999; text-align: center; padding: 2rem;">No new orders.</p>';

        document.getElementById('recent-orders').innerHTML = ordersHtml;

    } catch (error) {
        if (error.message && error.message.includes('pending admin approval')) {
            window.location.href = '/pages/weaver-pending.html';
        } else {
            console.error('Dashboard error:', error);
            document.getElementById('stats-grid').innerHTML = '<div class="glass-card"><p>Failed to sync data.</p></div>';
        }
    }
})();
