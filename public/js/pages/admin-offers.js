// Admin Offers Page Logic
(async function() {
    const user = await auth.checkAuth();
    if (!user || user.role !== 'admin') {
        window.location.href = '/pages/login.html';
        return;
    }

    let currentOfferId = null;
    let categories = [];

    // Load categories
    async function loadCategories() {
        try {
            const response = await api.get('/api/categories');
            categories = response.data || [];
            
            const categorySelect = document.getElementById('offer-category');
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Load categories error:', error);
        }
    }

    // Load offers
    async function loadOffers() {
        try {
            const response = await api.get('/api/offers');
            const offers = response.data || [];
            const container = document.getElementById('offers-list-container');
            
            if (offers.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="text-align: center; padding: 3rem;">
                        <p style="font-size: 1.2rem; color: var(--color-dark); opacity: 0.7;">No offers created</p>
                        <p style="color: var(--color-dark); opacity: 0.6;">Create your first offer to get started.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Value</th>
                            <th>Category</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${offers.map(offer => {
                            const today = new Date();
                            const startDate = new Date(offer.start_date);
                            const endDate = new Date(offer.end_date);
                            const isActive = offer.is_active && today >= startDate && today <= endDate;
                            
                            return `
                                <tr>
                                    <td>${offer.title}</td>
                                    <td>${offer.type.replace('_', ' ')}</td>
                                    <td>${offer.type === 'percentage' ? offer.value + '%' : offer.type === 'fixed' ? '₹' + offer.value : '-'}</td>
                                    <td>${offer.category_name || 'All'}</td>
                                    <td>${new Date(offer.start_date).toLocaleDateString()}</td>
                                    <td>${new Date(offer.end_date).toLocaleDateString()}</td>
                                    <td>
                                        <span class="status-badge ${isActive ? 'status-confirmed' : 'status-pending'}">
                                            ${isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-primary btn-sm" onclick="editOffer(${offer.id})">Edit</button>
                                        <button class="btn btn-danger btn-sm" onclick="deleteOffer(${offer.id})">Delete</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Load offers error:', error);
            notifications.showToast('error', 'Error', 'Failed to load offers');
        }
    }

    // Open create offer modal
    document.getElementById('create-offer-btn').addEventListener('click', () => {
        currentOfferId = null;
        document.getElementById('modal-title').textContent = 'Create Offer';
        document.getElementById('offer-form').reset();
        document.getElementById('offer-modal').style.display = 'flex';
    });

    // Close modal
    window.closeOfferModal = function() {
        document.getElementById('offer-modal').style.display = 'none';
        currentOfferId = null;
        document.getElementById('offer-form').reset();
    };

    // Edit offer
    window.editOffer = async function(offerId) {
        try {
            const response = await api.get(`/api/offers/${offerId}`);
            const offer = response.data;
            
            currentOfferId = offerId;
            document.getElementById('modal-title').textContent = 'Edit Offer';
            document.getElementById('offer-title').value = offer.title;
            document.getElementById('offer-description').value = offer.description || '';
            document.getElementById('offer-type').value = offer.type;
            document.getElementById('offer-value').value = offer.value;
            document.getElementById('offer-start-date').value = offer.start_date;
            document.getElementById('offer-end-date').value = offer.end_date;
            document.getElementById('offer-category').value = offer.category_id || '';
            document.getElementById('offer-modal').style.display = 'flex';
        } catch (error) {
            notifications.showToast('error', 'Error', 'Failed to load offer details');
        }
    };

    // Delete offer
    window.deleteOffer = async function(offerId) {
        if (!confirm('Are you sure you want to delete this offer?')) return;
        
        try {
            await api.delete(`/api/offers/${offerId}`);
            notifications.showToast('success', 'Success', 'Offer deleted successfully');
            await loadOffers();
        } catch (error) {
            notifications.showToast('error', 'Error', error.message);
        }
    };

    // Handle form submit
    document.getElementById('offer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            title: document.getElementById('offer-title').value.trim(),
            description: document.getElementById('offer-description').value.trim(),
            type: document.getElementById('offer-type').value,
            value: parseFloat(document.getElementById('offer-value').value),
            startDate: document.getElementById('offer-start-date').value,
            endDate: document.getElementById('offer-end-date').value,
            categoryId: document.getElementById('offer-category').value || null
        };

        // Validation
        if (data.value < 0) {
            notifications.showToast('error', 'Error', 'Value must be positive');
            return;
        }

        if (data.type === 'percentage' && data.value > 100) {
            notifications.showToast('error', 'Error', 'Percentage cannot exceed 100%');
            return;
        }

        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        if (endDate < startDate) {
            notifications.showToast('error', 'Error', 'End date must be after start date');
            return;
        }

        try {
            if (currentOfferId) {
                await api.put(`/api/offers/${currentOfferId}`, data);
                notifications.showToast('success', 'Success', 'Offer updated successfully');
            } else {
                await api.post('/api/offers', data);
                notifications.showToast('success', 'Success', 'Offer created successfully');
            }
            closeOfferModal();
            await loadOffers();
        } catch (error) {
            notifications.showToast('error', 'Error', error.message);
        }
    });

    // Initialize
    await loadCategories();
    await loadOffers();
})();

