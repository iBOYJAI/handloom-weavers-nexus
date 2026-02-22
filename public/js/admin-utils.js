// Admin utility functions for search, filter, and bulk operations
const adminUtils = {
    // Initialize search and filter
    initSearchFilter(containerId, data, renderFunction, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const searchInput = container.querySelector('.admin-search-input');
        const filterSelects = container.querySelectorAll('.admin-filter-select');
        const selectedItems = new Set();

        // Search handler
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.applyFilters(data, renderFunction, container, options);
                }, 300);
            });
        }

        // Filter handlers
        filterSelects.forEach(select => {
            select.addEventListener('change', () => {
                this.applyFilters(data, renderFunction, container, options);
            });
        });

        // Store original data
        container._originalData = data;
        container._renderFunction = renderFunction;
        container._options = options;
    },

    // Apply filters and search
    applyFilters(data, renderFunction, container, options) {
        const searchInput = container.querySelector('.admin-search-input');
        const filterSelects = container.querySelectorAll('.admin-filter-select');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        let filtered = [...data];

        // Apply search
        if (searchTerm && options.searchFields) {
            filtered = filtered.filter(item => {
                return options.searchFields.some(field => {
                    const value = this.getNestedValue(item, field);
                    return value && value.toString().toLowerCase().includes(searchTerm);
                });
            });
        }

        // Apply filters
        filterSelects.forEach(select => {
            const filterKey = select.dataset.filter;
            const filterValue = select.value;
            
            if (filterValue && filterValue !== 'all') {
                filtered = filtered.filter(item => {
                    const value = this.getNestedValue(item, filterKey);
                    if (options.filterTransform && options.filterTransform[filterKey]) {
                        return options.filterTransform[filterKey](value, filterValue);
                    }
                    return value == filterValue;
                });
            }
        });

        // Render filtered results
        if (renderFunction) {
            renderFunction(filtered, container);
        }
    },

    // Get nested object value
    getNestedValue(obj, path) {
        return path.split('.').reduce((o, p) => o && o[p], obj);
    },

    // Initialize bulk select
    initBulkSelect(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const selectAllCheckbox = container.querySelector('.bulk-select-all');
        const itemCheckboxes = container.querySelectorAll('.bulk-select-item');
        const bulkActionsBar = container.querySelector('.bulk-actions-bar');

        // Select all handler
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                itemCheckboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                });
                this.updateBulkActions(container, options);
            });
        }

        // Individual checkbox handlers
        itemCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                this.updateBulkActions(container, options);
                if (selectAllCheckbox) {
                    const allChecked = Array.from(itemCheckboxes).every(c => c.checked);
                    const someChecked = Array.from(itemCheckboxes).some(c => c.checked);
                    selectAllCheckbox.checked = allChecked;
                    selectAllCheckbox.indeterminate = someChecked && !allChecked;
                }
            });
        });

        // Bulk action handlers
        if (bulkActionsBar) {
            const actionButtons = bulkActionsBar.querySelectorAll('[data-bulk-action]');
            actionButtons.forEach(btn => {
                btn.addEventListener('click', async () => {
                    const action = btn.dataset.bulkAction;
                    const selectedIds = this.getSelectedIds(container);
                    
                    if (selectedIds.length === 0) {
                        if (window.notifications) {
                            window.notifications.showToast('warning', 'No Selection', 'Please select items first');
                        } else {
                            alert('Please select items first');
                        }
                        return;
                    }

                    if (options.bulkActions && options.bulkActions[action]) {
                        await options.bulkActions[action](selectedIds, container);
                    }
                });
            });
        }
    },

    // Get selected IDs
    getSelectedIds(container) {
        const checkboxes = container.querySelectorAll('.bulk-select-item:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));
    },

    // Update bulk actions bar visibility
    updateBulkActions(container, options) {
        const bulkActionsBar = container.querySelector('.bulk-actions-bar');
        const selectedCount = this.getSelectedIds(container).length;

        if (bulkActionsBar) {
            if (selectedCount > 0) {
                bulkActionsBar.style.display = 'flex';
                const countSpan = bulkActionsBar.querySelector('.selected-count');
                if (countSpan) {
                    countSpan.textContent = selectedCount;
                }
            } else {
                bulkActionsBar.style.display = 'none';
            }
        }
    },

    // Create search and filter UI
    createSearchFilterUI(filters = [], searchPlaceholder = 'Search...') {
        return `
            <div class="admin-toolbar" style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center;">
                <div style="flex: 1; min-width: 250px;">
                    <input type="search" class="admin-search-input form-input" placeholder="${searchPlaceholder}" style="width: 100%;">
                </div>
                ${filters.map(filter => `
                    <select class="admin-filter-select form-input" data-filter="${filter.key}" style="min-width: 150px;">
                        <option value="all">All ${filter.label}</option>
                        ${filter.options.map(opt => `
                            <option value="${opt.value}">${opt.label}</option>
                        `).join('')}
                    </select>
                `).join('')}
            </div>
        `;
    },

    // Create bulk select UI
    createBulkSelectUI(hasActions = true) {
        return `
            <div class="bulk-actions-bar" style="display: none; align-items: center; gap: 1rem; padding: 1rem; background: var(--color-surface); border-radius: var(--radius-md); margin-bottom: 1rem;">
                <span style="font-weight: 600;"><span class="selected-count">0</span> selected</span>
                ${hasActions ? `
                    <div style="display: flex; gap: 0.5rem; margin-left: auto;">
                        <button class="btn btn-primary btn-sm" data-bulk-action="edit">Edit</button>
                        <button class="btn btn-danger btn-sm" data-bulk-action="delete">Delete</button>
                    </div>
                ` : ''}
            </div>
        `;
    }
};

