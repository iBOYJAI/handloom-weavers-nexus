// Admin Approvals Page Logic
(async function () {
    const user = await auth.checkAuth();
    if (!user || user.role !== 'admin') {
        window.location.href = '/pages/login.html';
        return;
    }

    let pendingSarees = [];
    let pendingStories = [];
    let selectedSarees = new Set();
    let currentRejectAction = null; // { type: 'saree'|'story', id: number }

    // Load pending approvals
    async function loadPendingApprovals() {
        try {
            const response = await api.get('/api/admin/approvals');
            pendingSarees = response.data.sarees || [];
            pendingStories = response.data.stories || [];

            document.getElementById('saree-count').textContent = pendingSarees.length;
            document.getElementById('story-count').textContent = pendingStories.length;

            renderSarees();
            renderStories();
        } catch (error) {
            console.error('Load approvals error:', error);
            notifications.showToast('error', 'Error', 'Failed to load pending approvals');
        }
    }

    // Render pending sarees
    function renderSarees() {
        const container = document.getElementById('pending-sarees-container');

        if (pendingSarees.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem; background: #fafafa; border-radius: 20px; border: 2px dashed #eee;">
                    <p style="font-size: 1.25rem; color: #999; font-family: var(--font-heading);">No reels of silk to review</p>
                    <p style="color: #bbb; font-size: 0.95rem;">All sarees have been processed.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = pendingSarees.map(saree => {
            const imagePath = saree.primary_image ? '/' + saree.primary_image.replace(/^\/+/, '') : '/assets/images/defaults/saree-placeholder.svg';
            return `
            <div class="approval-card">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <input type="checkbox" class="saree-checkbox" data-id="${saree.id}" ${selectedSarees.has(saree.id) ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--color-primary);">
                    <div class="media-preview" onclick="openSareePreview('${imagePath}', '${String(saree.title).replace(/'/g, "\\'")}', '${String(saree.weaver_name || '').replace(/'/g, "\\'")}', ${Number(saree.price) || 0}, ${Number(saree.stock) || 0})" style="cursor: zoom-in;">
                        <img src="${imagePath}" alt="${saree.title}" onerror="this.src='/assets/images/defaults/saree-placeholder.svg'">
                    </div>
                </div>
                <div class="approval-info">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                        <h3 style="font-family: var(--font-heading); font-size: 1.25rem; margin: 0; color: var(--color-dark);">${saree.title}</h3>
                        <span style="background: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; color: #666;">#${saree.id}</span>
                    </div>
                    <p style="margin: 0; color: #666; font-size: 0.95rem; margin-bottom: 0.5rem;">
                        By <span style="font-weight: 600; color: var(--color-dark);">${saree.weaver_name}</span> · ${saree.category_name}
                    </p>
                    <div style="display: flex; gap: 1.5rem; font-size: 0.9rem;">
                        <span style="color: var(--color-primary); font-weight: 700;">₹${saree.price}</span>
                        <span style="color: #888;">Stock: <strong>${saree.stock}</strong></span>
                        <span style="color: #888;">Created: ${new Date(saree.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="action-btns">
                    <button class="btn btn-secondary btn-sm" style="border-radius: 100px; padding: 0.6rem 1.25rem;" onclick="window.location.href='/pages/saree-detail.html?id=${saree.id}'">Open Page</button>
                    <button class="btn btn-primary btn-sm" style="border-radius: 100px; padding: 0.6rem 1.25rem;" onclick="approveSaree(${saree.id})">Approve</button>
                    <button class="btn btn-danger btn-sm" style="border-radius: 100px; padding: 0.6rem 1.25rem;" onclick="rejectSaree(${saree.id})">Reject</button>
                </div>
            </div>
        `;
        }).join('');

        // Attach checkbox handlers
        document.querySelectorAll('.saree-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    selectedSarees.add(id);
                } else {
                    selectedSarees.delete(id);
                }
                updateBulkButtons();
            });
        });
    }

    // Render pending stories
    function renderStories() {
        const container = document.getElementById('pending-stories-container');

        if (pendingStories.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem; background: #fafafa; border-radius: 20px; border: 2px dashed #eee;">
                    <p style="font-size: 1.25rem; color: #999; font-family: var(--font-heading);">No Artisan Stories to review</p>
                    <p style="color: #bbb; font-size: 0.95rem;">All stories have been processed.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = pendingStories.map(story => {
            const mediaPath = story.media_url ? '/' + story.media_url.replace(/^\/+/, '') : '/assets/images/defaults/story-placeholder.svg';
            const safeCaption = String(story.caption || '').replace(/'/g, "\\'");
            const safeWeaver = String(story.weaver_name || '').replace(/'/g, "\\'");
            const isVideo = story.media_type === 'video';
            return `
            <div class="approval-card">
                <div class="media-preview" onclick="openStoryPreview('${story.media_type}', '${mediaPath}', '${safeCaption}', '${safeWeaver}')" style="cursor: zoom-in;">
                    ${isVideo
                    ? `<div style="width: 100%; height: 100%; background: #000; display: flex; align-items: center; justify-content: center; color: white;">
                               <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                           </div>`
                    : `<img src="${mediaPath}" alt="Story" onerror="this.src='/assets/images/defaults/story-placeholder.svg'">`
                }
                </div>
                <div class="approval-info">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                        <h3 style="font-family: var(--font-heading); font-size: 1.25rem; margin: 0; color: var(--color-dark);">${story.title || 'Story'} by ${story.weaver_name}</h3>
                        <span style="background: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; color: #666;">#${story.id}</span>
                    </div>
                    <p style="margin: 0; color: #666; font-size: 1.05rem; font-weight: 600; margin-bottom: 0.25rem;">
                        ${story.caption}
                    </p>
                    <p style="margin: 0; color: #888; font-size: 0.9rem; line-height: 1.4; margin-bottom: 0.75rem;">
                        ${story.description ? story.description.substring(0, 100) + (story.description.length > 100 ? '...' : '') : ''}
                    </p>
                    <div style="display: flex; gap: 1.5rem; font-size: 0.85rem; color: #aaa;">
                        <span>Type: <strong style="text-transform: uppercase;">${story.media_type}</strong></span>
                        <span>Created: ${new Date(story.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="action-btns">
                    <button class="btn btn-secondary btn-sm" style="border-radius: 100px; padding: 0.6rem 1.25rem;" onclick="window.location.href='/pages/story-detail.html?id=${story.id}&preview=true'">Open Page</button>
                    <button class="btn btn-primary btn-sm" style="border-radius: 100px; padding: 0.6rem 1.25rem;" onclick="approveStory(${story.id})">Approve</button>
                    <button class="btn btn-danger btn-sm" style="border-radius: 100px; padding: 0.6rem 1.25rem;" onclick="rejectStory(${story.id})">Reject</button>
                </div>
            </div>`;
        }).join('');
    }

    // Update bulk action buttons visibility
    function updateBulkButtons() {
        const bulkApprove = document.getElementById('bulk-approve-btn');
        if (selectedSarees.size > 0) {
            bulkApprove.style.display = 'inline-block';
            bulkApprove.textContent = `Approve ${selectedSarees.size} Selected`;
        } else {
            bulkApprove.style.display = 'none';
        }
    }

    // Approve saree
    window.approveSaree = async function (sareeId) {
        try {
            await api.put(`/ api / admin / sarees / ${sareeId}/approve`);
            notifications.showToast('success', 'Success', 'Saree approved successfully');
            await loadPendingApprovals();
            selectedSarees.delete(sareeId);
            updateBulkButtons();
        } catch (error) {
            notifications.showToast('error', 'Error', error.message);
        }
    };

    // Reject saree
    window.rejectSaree = function (sareeId) {
        currentRejectAction = { type: 'saree', id: sareeId };
        document.getElementById('rejection-modal').style.display = 'flex';
        document.getElementById('rejection-reason').value = '';
    };

    // Approve story
    window.approveStory = async function (storyId) {
        try {
            await api.put(`/api/admin/stories/${storyId}/approve`);
            notifications.showToast('success', 'Success', 'Story approved successfully');
            await loadPendingApprovals();
        } catch (error) {
            notifications.showToast('error', 'Error', error.message);
        }
    };

    // Reject story
    window.rejectStory = function (storyId) {
        currentRejectAction = { type: 'story', id: storyId };
        document.getElementById('rejection-modal').style.display = 'flex';
        document.getElementById('rejection-reason').value = '';
    };

    // Close rejection modal
    window.closeRejectionModal = function () {
        document.getElementById('rejection-modal').style.display = 'none';
        currentRejectAction = null;
    };

    // Media preview modal helpers
    window.openSareePreview = function (imageUrl, title, weaverName, price, stock) {
        const modal = document.getElementById('media-preview-modal');
        if (!modal) return;
        const img = document.getElementById('preview-image');
        const video = document.getElementById('preview-video');
        const titleEl = document.getElementById('preview-title');
        const metaEl = document.getElementById('preview-meta');

        video.style.display = 'none';
        video.pause();
        img.style.display = 'block';
        img.src = imageUrl || '/assets/images/defaults/saree-placeholder.svg';

        titleEl.textContent = title || 'Saree Preview';
        metaEl.textContent = `${weaverName || ''}${price ? ` • ₹${Number(price).toFixed(2)}` : ''}${stock || stock === 0 ? ` • Stock: ${stock}` : ''}`;

        modal.style.display = 'flex';
    };

    window.openStoryPreview = function (mediaType, mediaUrl, caption, weaverName) {
        const modal = document.getElementById('media-preview-modal');
        if (!modal) return;
        const img = document.getElementById('preview-image');
        const video = document.getElementById('preview-video');
        const titleEl = document.getElementById('preview-title');
        const metaEl = document.getElementById('preview-meta');

        if (mediaType === 'video') {
            img.style.display = 'none';
            video.style.display = 'block';
            video.src = mediaUrl;
            video.play().catch(() => { });
        } else {
            video.pause();
            video.style.display = 'none';
            img.style.display = 'block';
            img.src = mediaUrl || '/assets/images/defaults/story-placeholder.svg';
        }

        titleEl.textContent = weaverName ? `Story by ${weaverName}` : 'Story Preview';
        metaEl.textContent = caption || '';

        modal.style.display = 'flex';
    };

    window.closeMediaPreview = function () {
        const modal = document.getElementById('media-preview-modal');
        if (!modal) return;
        const video = document.getElementById('preview-video');
        if (video) {
            video.pause();
            video.currentTime = 0;
        }
        modal.style.display = 'none';
    };

    // Confirm rejection
    document.getElementById('confirm-reject-btn').addEventListener('click', async () => {
        if (!currentRejectAction) return;

        const reason = document.getElementById('rejection-reason').value.trim();
        if (reason.length < 5) {
            notifications.showToast('error', 'Error', 'Rejection reason must be at least 5 characters');
            return;
        }

        try {
            if (currentRejectAction.type === 'saree') {
                await api.put(`/api/admin/sarees/${currentRejectAction.id}/reject`, { reason });
            } else {
                await api.put(`/api/admin/stories/${currentRejectAction.id}/reject`, { reason });
            }
            notifications.showToast('success', 'Success', 'Item rejected');
            closeRejectionModal();
            await loadPendingApprovals();
        } catch (error) {
            notifications.showToast('error', 'Error', error.message);
        }
    });

    // Bulk approve
    document.getElementById('bulk-approve-btn').addEventListener('click', async () => {
        if (selectedSarees.size === 0) return;

        try {
            await api.post('/api/admin/sarees/bulk-approve', { sareeIds: Array.from(selectedSarees) });
            notifications.showToast('success', 'Success', `${selectedSarees.size} saree(s) approved`);
            selectedSarees.clear();
            updateBulkButtons();
            await loadPendingApprovals();
        } catch (error) {
            notifications.showToast('error', 'Error', error.message);
        }
    });

    // Tab switching
    document.querySelectorAll('.tab-premium').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;

            document.querySelectorAll('.tab-premium').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.getElementById('sarees-tab').style.display = tab === 'sarees' ? 'block' : 'none';
            document.getElementById('stories-tab').style.display = tab === 'stories' ? 'block' : 'none';
        });
    });

    // Initialize
    await loadPendingApprovals();
})();
