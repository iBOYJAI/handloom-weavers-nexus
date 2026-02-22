(function () {
    async function loadCart() {
        const container = document.getElementById('cart-items-container');
        const subtotalEl = document.getElementById('subtotal');
        const totalEl = document.getElementById('total-amount');
        const checkoutBtn = document.getElementById('checkout-btn');

        try {
            const response = await api.get('/api/cart');
            const cart = response.data;

            if (!cart || !cart.items || cart.items.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 6rem 2rem; background: #fff; border-radius: 30px; border: 1px dashed #ddd;">
                        <div style="width: 80px; height: 80px; background: #fdf2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem;">
                            <svg width="40" height="40" color="#c0392b" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                        </div>
                        <h3 style="font-family: var(--font-heading); font-size: 1.75rem; color: var(--color-dark); margin-bottom: 1rem;">Your bag is empty</h3>
                        <p style="color: #888; margin-bottom: 2rem;">It seems you haven't discovered your perfect weave yet.</p>
                        <a href="/pages/buyer-home.html" class="btn btn-primary" style="padding: 1rem 2.5rem; border-radius: 100px;">Start Exploring</a>
                    </div>
                `;
                subtotalEl.textContent = '₹0.00';
                totalEl.textContent = '₹0.00';
                checkoutBtn.disabled = true;
                checkoutBtn.style.opacity = '0.5';
                return;
            }

            container.innerHTML = cart.items.map(item => {
                const img = item.image ? (item.image.startsWith('/') ? item.image : '/' + item.image) : '/assets/images/defaults/saree-placeholder.svg';
                const isOverStock = item.quantity > (item.stock || 0);
                const isOutOfStock = (item.stock || 0) <= 0;

                return `
                    <div class="cart-item-card">
                        <div class="cart-img-wrapper" onclick="window.location.href='/pages/saree-detail.html?id=${item.saree_id}'" style="cursor: pointer;">
                            <img src="${img}" alt="${item.title}" onerror="this.src='/assets/images/defaults/saree-placeholder.svg'">
                        </div>
                        <div style="flex: 1;">
                            ${isOutOfStock ? '<span class="out-of-stock-badge">Sold Out</span>' : ''}
                            <h3 style="font-family: var(--font-heading); font-size: 1.35rem; margin: 0 0 0.5rem; color: var(--color-dark);">${item.title}</h3>
                            <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem;">
                                <div class="quantity-control">
                                    <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">
                                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M5 12h14"></path></svg>
                                    </button>
                                    <input type="text" class="qty-input" value="${item.quantity}" readonly>
                                    <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})" ${(item.stock && item.quantity >= item.stock) ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>
                                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
                                    </button>
                                </div>
                                <button onclick="removeItem(${item.id})" style="background:none; border:none; color:#e74c3c; font-weight:700; font-size:0.85rem; cursor:pointer; text-transform:uppercase; letter-spacing:0.5px;">Remove</button>
                            </div>
                            <div style="font-size: 0.85rem; color: ${isOverStock ? '#e67e22' : '#888'}; font-weight: ${isOverStock ? '700' : '400'};">
                                ${isOutOfStock ? 'This item is no longer available.' : `In Stock: ${item.stock} unit(s)${isOverStock ? ' - Please reduce quantity' : ''}`}
                            </div>
                        </div>
                        <div style="text-align: right; min-width: 150px;">
                            <div style="font-size: 0.85rem; color: #999; margin-bottom: 0.25rem;">Unit Price</div>
                            <div style="font-size: 1.1rem; color: #666; margin-bottom: 1rem;">₹${parseFloat(item.price).toLocaleString()}</div>
                            <div style="font-size: 0.85rem; color: #999; margin-bottom: 0.25rem;">Subtotal</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-primary); letter-spacing: -0.5px;">₹${(item.price * item.quantity).toLocaleString()}</div>
                        </div>
                    </div>
                `;
            }).join('');

            subtotalEl.textContent = `₹${parseFloat(cart.total).toLocaleString()}`;
            totalEl.textContent = `₹${parseFloat(cart.total).toLocaleString()}`;

            const hasIssues = cart.items.some(i => i.quantity > (i.stock || 0) || (i.stock || 0) <= 0);
            if (hasIssues) {
                checkoutBtn.disabled = true;
                checkoutBtn.style.opacity = '0.5';
                checkoutBtn.style.cursor = 'not-allowed';
                checkoutBtn.title = 'Adjust quantities to continue';
            } else {
                checkoutBtn.disabled = false;
                checkoutBtn.style.opacity = '1';
                checkoutBtn.style.cursor = 'pointer';
                checkoutBtn.onclick = () => window.location.href = '/pages/checkout.html';
            }

        } catch (error) {
            console.error('Load cart error:', error);
            container.innerHTML = '<div class="glass-card"><p>Failed to sync your bag.</p></div>';
        }
    }

    window.updateQuantity = async function (id, quantity) {
        if (quantity < 1) return;
        try {
            await api.put(`/api/cart/${id}`, { quantity });
            loadCart();
        } catch (error) {
            notifications.showToast('error', 'Update Failed', error.message);
        }
    }

    window.removeItem = async function (id) {
        if (!confirm('Remove this masterpiece from your bag?')) return;
        try {
            await api.delete(`/api/cart/${id}`);
            loadCart();
        } catch (error) {
            notifications.showToast('error', 'Removal Failed', 'Please try again.');
        }
    }

    document.addEventListener('DOMContentLoaded', loadCart);
    window.loadCart = loadCart; // Export to window for global access
})();
