(async function () {
    const user = await auth.checkAuth();
    // Allow both buyer and admin to checkout
    if (!user || (user.role !== 'buyer' && user.role !== 'admin')) {
        window.location.href = '/pages/login.html';
        return;
    }

    // Auto-fill address if available
    const addressInput = document.getElementById('address');
    if (addressInput && user.address) {
        addressInput.value = user.address;
    }

    async function loadCart() {
        try {
            const response = await api.get('/api/cart');
            const cart = response.data;
            const summary = document.getElementById('order-summary');

            summary.innerHTML = `
                <div class="card">
                    <h3 style="margin-bottom: 1rem;">Order Summary</h3>
                    ${cart.items.map(item => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>${item.title} x${item.quantity}</span>
                            <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                    <div style="border-top: 1px solid #E0D0CC; margin-top: 1rem; padding-top: 1rem; display: flex; justify-content: space-between; font-weight: bold;">
                        <span>Total:</span>
                        <span>₹${cart.total.toFixed(2)}</span>
                    </div>
                    <p style="margin-top: 1rem; font-size: 0.875rem; color: #666;">Payment: Cash on Delivery (COD)</p>
                </div>
            `;
        } catch (error) {
            console.error('Load cart error:', error);
        }
    }

    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const address = document.getElementById('address').value.trim();

        if (address.length < 10) {
            notifications.showToast('error', 'Incomplete Address', 'Please provide a full delivery address (Min 10 chars).');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying Authenticity...';

        try {
            // Final stock check before ordering
            const cartResponse = await api.get('/api/cart');
            const cart = cartResponse.data;

            const hasStockIssues = cart.items.some(i => i.quantity > (i.stock || 0) || (i.stock || 0) <= 0);

            if (hasStockIssues) {
                notifications.showToast('error', 'Stock Conflict', 'Some items in your bag are no longer available in the requested quantity. Please update your bag.');
                setTimeout(() => window.location.href = '/pages/cart.html', 2000);
                return;
            }

            const response = await api.post('/api/orders', { address });
            if (response.success) {
                notifications.showToast('success', 'Masterpiece Secured', 'Your order has been placed successfully!');
                setTimeout(() => {
                    window.location.href = '/pages/order-history.html';
                }, 1500);
            }
        } catch (error) {
            notifications.showToast('error', 'Order Failed', error.message || 'Failed to place order');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirm Order';
        }
    });

    await loadCart();
})();

