// Saree Detail Page Logic
(async function() {
    // Allow guest viewing
    const user = await auth.checkAuth(false);

    const params = new URLSearchParams(window.location.search);
    const sareeId = params.get('id');
    if (!sareeId) {
        window.location.href = '/pages/buyer-home.html';
        return;
    }

    let saree = null;
    let selectedVariant = null;

    // Load saree details
    async function loadSareeDetail() {
        const container = document.getElementById('saree-detail-container');
        container.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading...</div>';
        
        try {
            const response = await api.get(`/api/sarees/${sareeId}`);
            saree = response.data;
            
            if (!saree) {
                container.innerHTML = `
                    <div class="empty-state" style="text-align: center; padding: 3rem;">
                        <p style="font-size: 1.2rem; color: var(--color-dark); opacity: 0.7;">Saree not found</p>
                    </div>
                `;
                return;
            }
            
            renderSareeDetail();
        } catch (error) {
            console.error('Load saree detail error:', error);
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem;">
                    <p style="font-size: 1.2rem; color: var(--color-light-red); margin-bottom: 1rem;">Error loading saree details</p>
                    <p style="color: var(--color-dark); opacity: 0.6;">${error.message || 'Please try again later'}</p>
                </div>
            `;
        }
    }

    // Render saree detail
    function renderSareeDetail() {
        const container = document.getElementById('saree-detail-container');
        const mainImage = saree.images && saree.images.length > 0 ? saree.images[0].file_path : '/assets/images/no-image.jpg';
        
        container.innerHTML = `
            <div class="saree-detail">
                <div class="saree-gallery">
                    <img src="${mainImage}" alt="${saree.title}" class="saree-main-image" id="main-image" onerror="this.src='/assets/images/no-image.jpg'">
                    ${saree.images && saree.images.length > 1 ? `
                        <div class="saree-thumbnails">
                            ${saree.images.map(img => `
                                <img src="${img.file_path}" alt="Thumbnail" class="saree-thumbnail" onclick="document.getElementById('main-image').src='${img.file_path}'" onerror="this.src='/assets/images/no-image.jpg'">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="saree-detail-info">
                    <h1 class="saree-detail-title">${saree.title}</h1>
                    
                    ${saree.offer ? `
                        <div style="background: var(--color-light-red); color: white; padding: 0.75rem 1rem; border-radius: var(--radius-md); margin-bottom: 1rem; display: inline-block;">
                            <strong>${saree.offer.title}</strong> - ${saree.offer.type === 'percentage' ? saree.offer.value + '% OFF' : saree.offer.type === 'fixed' ? '₹' + saree.offer.value + ' OFF' : 'Special Offer'}
                        </div>
                    ` : ''}
                    
                    <div class="saree-detail-price" style="margin-bottom: 1rem;">
                        ${saree.offer ? `
                            <span style="text-decoration: line-through; opacity: 0.6; margin-right: 1rem; font-size: 1.2rem;">₹${saree.originalPrice || saree.price}</span>
                            <span style="color: var(--color-light-red); font-size: 1.5rem; font-weight: bold;">₹${saree.finalPrice || saree.price}</span>
                        ` : `
                            <span style="font-size: 1.5rem; font-weight: bold;">₹${saree.price}</span>
                        `}
                    </div>
                    
                    <div class="saree-detail-description">
                        <p>${saree.description}</p>
                    </div>
                    
                    <div class="saree-detail-meta">
                        <div class="saree-meta-item">
                            <strong>Category:</strong> ${saree.category_name}
                        </div>
                        <div class="saree-meta-item">
                            <strong>Weaver:</strong> ${saree.weaver_name}
                        </div>
                        <div class="saree-meta-item">
                            <strong>Stock:</strong> ${saree.stock > 0 ? saree.stock + ' available' : 'Out of stock'}
                        </div>
                    </div>

                    ${saree.variants && saree.variants.length > 0 ? `
                        <div class="variant-selector" style="margin: 2rem 0; padding: 1.5rem; background: var(--color-white); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);">
                            <h3 style="margin-bottom: 1rem; font-family: var(--font-heading);">Select Variant</h3>
                            
                            <div class="form-group" style="margin-bottom: 1rem;">
                                <label class="form-label">Color:</label>
                                <div id="color-selector" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;"></div>
                            </div>
                            
                            <div class="form-group" style="margin-bottom: 1rem;">
                                <label class="form-label">Design:</label>
                                <select id="design-selector" class="form-input" style="margin-top: 0.5rem;">
                                    <option value="">Select Design</option>
                                </select>
                            </div>
                            
                            <div id="selected-variant-info" style="display: none; padding: 1rem; background: var(--color-surface); border-radius: var(--radius-md); margin-top: 1rem;">
                                <p><strong>Selected Variant:</strong> <span id="variant-name"></span></p>
                                <p><strong>Price Adjustment:</strong> <span id="variant-price-adjustment"></span></p>
                                <p><strong>Stock:</strong> <span id="variant-stock"></span></p>
                            </div>
                        </div>
                    ` : ''}

                    <div class="customization-form" style="margin: 2rem 0; padding: 1.5rem; background: var(--color-white); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);">
                        <h3 style="margin-bottom: 1rem; font-family: var(--font-heading);">Customization Options</h3>
                        
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label" for="blouse-color">Blouse Color:</label>
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <input type="color" id="blouse-color" class="form-input" value="#C0392B" style="width: 100px; height: 40px; cursor: pointer; padding: 0;">
                                <span id="blouse-color-text" style="font-weight: 500;">#C0392B</span>
                            </div>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label" for="custom-design-type">Custom Design Type:</label>
                            <select id="custom-design-type" class="form-input">
                                <option value="">None</option>
                                <option value="peacock">Peacock</option>
                                <option value="temple">Temple</option>
                                <option value="name">Name/Initials</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        
                        <div class="form-group" id="custom-design-text-group" style="margin-bottom: 1rem; display: none;">
                            <label class="form-label" for="custom-design-text">Custom Design Details:</label>
                            <textarea id="custom-design-text" class="form-input" rows="3" maxlength="500" placeholder="Describe your custom design (e.g., 'Peacock design on border', 'Temple pattern on pallu', 'Name: Priya')"></textarea>
                            <small style="color: var(--color-dark); opacity: 0.6;"><span id="char-count">0</span>/500 characters</small>
                        </div>
                        
                        <div class="form-group" id="custom-design-image-group" style="margin-bottom: 1rem; display: none;">
                            <label class="form-label" for="custom-design-image">Upload Design Image (Optional):</label>
                            <input type="file" id="custom-design-image" accept="image/*" class="form-input">
                            <div id="design-image-preview" style="margin-top: 0.5rem; display: none;">
                                <img id="preview-img" src="" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
                            </div>
                        </div>
                    </div>
                    
                    ${saree.stock > 0 ? `
                        ${user ? `
                            <button class="btn btn-primary btn-lg" onclick="addToCart()" style="width: 100%;">Add to Cart</button>
                        ` : `
                            <a href="/pages/login.html" class="btn btn-primary btn-lg" style="width: 100%; display: block; text-align: center;">Login to Add to Cart</a>
                        `}
                    ` : '<p style="color: var(--color-light-red); font-weight: 500;">Out of stock</p>'}
                </div>
            </div>
        `;

        // Initialize variant selection if variants exist
        if (saree.variants && saree.variants.length > 0) {
            initializeVariantSelection();
        }

        // Initialize customization form
        initializeCustomizationForm();
    }

    // Initialize variant selection
    function initializeVariantSelection() {
        const variants = saree.variants;
        
        // Get unique colors
        const colors = [...new Map(variants.map(v => [v.color_name, { name: v.color_name, code: v.color_code }])).values()];
        const colorSelector = document.getElementById('color-selector');
        
        colors.forEach(color => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'color-btn';
            btn.style.cssText = `width: 50px; height: 50px; border-radius: 50%; background: ${color.code}; border: 3px solid transparent; cursor: pointer; transition: all var(--transition-base);`;
            btn.dataset.color = color.name;
            btn.title = color.name;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-btn').forEach(b => b.style.borderColor = 'transparent');
                btn.style.borderColor = 'var(--color-primary)';
                updateVariantSelection();
            });
            colorSelector.appendChild(btn);
        });
        
        // Get unique designs
        const designs = [...new Set(variants.map(v => v.design_name))];
        const designSelector = document.getElementById('design-selector');
        designs.forEach(design => {
            const option = document.createElement('option');
            option.value = design;
            option.textContent = design;
            designSelector.appendChild(option);
        });
        
        designSelector.addEventListener('change', updateVariantSelection);
    }

    // Update variant selection
    function updateVariantSelection() {
        const selectedColor = document.querySelector('.color-btn[style*="border-color: var(--color-primary)"]')?.dataset.color;
        const designSelector = document.getElementById('design-selector');
        const selectedDesign = designSelector.value;
        
        if (selectedColor && selectedDesign) {
            selectedVariant = saree.variants.find(v => v.color_name === selectedColor && v.design_name === selectedDesign);
            
            if (selectedVariant) {
                const infoDiv = document.getElementById('selected-variant-info');
                infoDiv.style.display = 'block';
                document.getElementById('variant-name').textContent = `${selectedVariant.color_name} - ${selectedVariant.design_name}`;
                const adjustment = selectedVariant.price_adjustment || 0;
                document.getElementById('variant-price-adjustment').textContent = adjustment > 0 ? `+₹${adjustment}` : adjustment < 0 ? `-₹${Math.abs(adjustment)}` : 'No change';
                document.getElementById('variant-stock').textContent = selectedVariant.stock > 0 ? selectedVariant.stock + ' available' : 'Out of stock';
                
                // Update main image if variant has image
                if (selectedVariant.image_path) {
                    document.getElementById('main-image').src = selectedVariant.image_path;
                }
            }
        } else {
            document.getElementById('selected-variant-info').style.display = 'none';
            selectedVariant = null;
        }
    }

    // Initialize customization form
    function initializeCustomizationForm() {
        const designTypeSelect = document.getElementById('custom-design-type');
        const designTextGroup = document.getElementById('custom-design-text-group');
        const designImageGroup = document.getElementById('custom-design-image-group');
        const designText = document.getElementById('custom-design-text');
        const charCount = document.getElementById('char-count');
        const blouseColorInput = document.getElementById('blouse-color');
        const blouseColorText = document.getElementById('blouse-color-text');
        
        if (!designTypeSelect) return; // Form not rendered yet
        
        designTypeSelect.addEventListener('change', () => {
            const value = designTypeSelect.value;
            if (value) {
                designTextGroup.style.display = 'block';
                designImageGroup.style.display = 'block';
            } else {
                designTextGroup.style.display = 'none';
                designImageGroup.style.display = 'none';
            }
        });
        
        designText.addEventListener('input', () => {
            charCount.textContent = designText.value.length;
        });
        
        blouseColorInput.addEventListener('input', () => {
            blouseColorText.textContent = blouseColorInput.value;
        });
        
        // Image preview
        const designImageInput = document.getElementById('custom-design-image');
        designImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5242880) {
                    notifications.showToast('error', 'Error', 'Image size must be less than 5MB');
                    e.target.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('preview-img').src = event.target.result;
                    document.getElementById('design-image-preview').style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Add to cart
    window.addToCart = async function() {
        if (!user) {
            window.location.href = '/pages/login.html';
            return;
        }
        
        // Collect customization data
        const blouseColorInput = document.getElementById('blouse-color');
        const designTypeSelect = document.getElementById('custom-design-type');
        const designText = document.getElementById('custom-design-text');
        
        const customization = {
            blouseColor: blouseColorInput ? blouseColorInput.value : null,
            customDesignType: designTypeSelect && designTypeSelect.value ? designTypeSelect.value : null,
            customDesignText: designText && designText.value.trim() ? designText.value.trim() : null,
            customDesignImage: null // Will be handled separately if needed
        };
        
        // If variant selected, use variant price
        let finalPrice = saree.finalPrice || saree.price;
        if (selectedVariant) {
            finalPrice = saree.price + (selectedVariant.price_adjustment || 0);
            if (saree.offer) {
                const discount = (finalPrice * saree.offer.value) / 100;
                finalPrice = finalPrice - discount;
            }
        }
        
        try {
            await api.post('/api/cart/add', { 
                sareeId: saree.id, 
                quantity: 1,
                variantId: selectedVariant ? selectedVariant.id : null,
                customization: customization.customDesignType || customization.customDesignText ? customization : null
            });
            notifications.showToast('success', 'Success', 'Item added to cart');
        } catch (error) {
            notifications.showToast('error', 'Error', error.message);
        }
    };

    // Initialize
    await loadSareeDetail();
})();

