const SareeModel = require('../models/saree.model');
const OrderModel = require('../models/order.model');
const OfferModel = require('../models/offer.model');
const VariantModel = require('../models/variant.model');
const UserModel = require('../models/user.model');
const NotificationModel = require('../models/notification.model');
const WishlistModel = require('../models/wishlist.model');
const pool = require('../config/db');
const BuyerController = {
    // Get all sarees with filters (only approved)
    async getSarees(req, res) {
        try {
            // TEMPORARY DIAGNOSTIC: which DB and how many approved sarees
            const [dbCheck] = await pool.execute(
                'SELECT DATABASE() as db, COUNT(*) as cnt FROM sarees WHERE is_active = 1 AND is_approved = 1'
            );
            console.log('🔍 DB CHECK:', dbCheck[0]);
            // END DIAGNOSTIC

            const filters = {
                categoryId: req.query.category ? parseInt(req.query.category) : null,
                minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
                maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
                region: req.query.region || null,
                inStock: req.query.inStock === 'true' ? true : null,
                limit: req.query.limit ? parseInt(req.query.limit) : 50,
                offset: req.query.offset ? parseInt(req.query.offset) : 0,
                approvedOnly: true // Only show approved sarees to buyers
            };

            const sarees = await SareeModel.findAll(filters);

            // Get active offers and apply to prices (optional; don't fail sarees if offers error)
            let activeOffers = [];
            try {
                activeOffers = await OfferModel.getActiveOffers();
            } catch (offerErr) {
                console.warn('getSarees: offers failed, continuing without', offerErr.message);
            }

            // Helper function to calculate discount
            const calculateDiscount = (offer, price) => {
                if (!offer) return 0;
                if (offer.type === 'percentage') {
                    return (price * offer.value) / 100;
                } else if (offer.type === 'fixed') {
                    return Math.min(offer.value, price);
                }
                return 0;
            };

            // Helper function to get best offer for saree
            const getBestOfferForSaree = (saree) => {
                let bestOffer = null;
                let maxDiscount = 0;

                for (const offer of activeOffers) {
                    // Check if offer applies to this saree
                    if (offer.category_id && offer.category_id !== saree.category_id) {
                        continue;
                    }

                    const discount = calculateDiscount(offer, saree.price);
                    if (discount > maxDiscount) {
                        maxDiscount = discount;
                        bestOffer = offer;
                    }
                }

                return bestOffer;
            };

            // Apply offers to sarees
            const sareesWithOffers = sarees.map(saree => {
                const bestOffer = getBestOfferForSaree(saree);
                const discount = bestOffer ? calculateDiscount(bestOffer, saree.price) : 0;
                const finalPrice = Math.max(0, saree.price - discount);

                return {
                    ...saree,
                    originalPrice: saree.price,
                    discount: discount,
                    finalPrice: finalPrice,
                    offer: bestOffer ? {
                        title: bestOffer.title,
                        type: bestOffer.type,
                        value: bestOffer.value
                    } : null
                };
            });

            if (process.env.NODE_ENV !== 'production') {
                console.log('getSarees: returning', sareesWithOffers.length, 'sarees');
            }
            res.json({
                success: true,
                data: sareesWithOffers
            });
        } catch (error) {
            console.error('Get sarees error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch sarees'
            });
        }
    },

    // Search sarees (only approved)
    async searchSarees(req, res) {
        try {
            const searchTerm = req.query.q || '';
            if (searchTerm.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query too long (max 100 characters)'
                });
            }

            const filters = {
                categoryId: req.query.category ? parseInt(req.query.category) : null,
                minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
                maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
                region: req.query.region || null,
                approvedOnly: true // Only show approved sarees
            };

            const sarees = searchTerm ? await SareeModel.search(searchTerm, filters) : await SareeModel.findAll(filters);

            // Get active offers and apply to prices (optional)
            let activeOffers = [];
            try {
                activeOffers = await OfferModel.getActiveOffers();
            } catch (offerErr) {
                console.warn('searchSarees: offers failed, continuing without', offerErr.message);
            }

            // Helper function to calculate discount
            const calculateDiscount = (offer, price) => {
                if (!offer) return 0;
                if (offer.type === 'percentage') {
                    return (price * offer.value) / 100;
                } else if (offer.type === 'fixed') {
                    return Math.min(offer.value, price);
                }
                return 0;
            };

            // Helper function to get best offer for saree
            const getBestOfferForSaree = (saree) => {
                let bestOffer = null;
                let maxDiscount = 0;

                for (const offer of activeOffers) {
                    // Check if offer applies to this saree
                    if (offer.category_id && offer.category_id !== saree.category_id) {
                        continue;
                    }

                    const discount = calculateDiscount(offer, saree.price);
                    if (discount > maxDiscount) {
                        maxDiscount = discount;
                        bestOffer = offer;
                    }
                }

                return bestOffer;
            };

            // Apply offers
            const sareesWithOffers = sarees.map(saree => {
                const bestOffer = getBestOfferForSaree(saree);
                const discount = bestOffer ? calculateDiscount(bestOffer, saree.price) : 0;
                const finalPrice = Math.max(0, saree.price - discount);

                return {
                    ...saree,
                    originalPrice: saree.price,
                    discount: discount,
                    finalPrice: finalPrice,
                    offer: bestOffer ? {
                        title: bestOffer.title,
                        type: bestOffer.type,
                        value: bestOffer.value
                    } : null
                };
            });

            res.json({
                success: true,
                data: sareesWithOffers
            });
        } catch (error) {
            console.error('Search sarees error:', error);
            res.status(500).json({
                success: false,
                message: 'Search failed'
            });
        }
    },

    // Get saree detail with variants and offers
    async getSareeDetail(req, res) {
        try {
            const sareeId = parseInt(req.params.id);
            const saree = await SareeModel.findById(sareeId, true); // Include variants

            if (!saree) {
                return res.status(404).json({
                    success: false,
                    message: 'Saree not found'
                });
            }

            // Check if approved (buyers can only see approved sarees)
            if (!saree.is_approved) {
                return res.status(404).json({
                    success: false,
                    message: 'Saree not found'
                });
            }

            const images = await SareeModel.getImages(sareeId);
            const variants = await VariantModel.findBySareeId(sareeId, true);

            // Get best offer for this saree
            const bestOffer = await OfferModel.getBestOfferForSaree(sareeId, saree.category_id);
            const discount = bestOffer ? OfferModel.calculateDiscount(bestOffer, saree.price) : 0;
            const finalPrice = saree.price - discount;

            res.json({
                success: true,
                data: {
                    ...saree,
                    images,
                    variants,
                    originalPrice: saree.price,
                    discount: discount,
                    finalPrice: finalPrice,
                    offer: bestOffer ? {
                        id: bestOffer.id,
                        title: bestOffer.title,
                        type: bestOffer.type,
                        value: bestOffer.value,
                        description: bestOffer.description
                    } : null
                }
            });
        } catch (error) {
            console.error('Get saree detail error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch saree details'
            });
        }
    },

    // Add to cart
    async addToCart(req, res) {
        try {
            const userId = req.session.userId;
            const { sareeId, quantity } = req.body;

            if (!sareeId || !quantity || quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid saree ID and quantity required'
                });
            }

            // Check if saree exists and is in stock
            const saree = await SareeModel.findById(sareeId);
            if (!saree || !saree.is_active) {
                return res.status(404).json({
                    success: false,
                    message: 'Saree not found or unavailable'
                });
            }

            if (!saree.stock || saree.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${saree.title}`
                });
            }

            // Check if item already in cart
            const [existing] = await pool.execute(
                'SELECT * FROM cart_items WHERE user_id = ? AND saree_id = ?',
                [userId, sareeId]
            );

            if (existing.length > 0) {
                // Prevent total quantity from exceeding available stock
                const currentQty = existing[0].quantity || 0;
                const newTotalQty = currentQty + quantity;

                if (!saree.stock || newTotalQty > saree.stock) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for ${saree.title}`
                    });
                }

                // Update quantity
                await pool.execute(
                    'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND saree_id = ?',
                    [quantity, userId, sareeId]
                );
            } else {
                // Add new item
                await pool.execute(
                    'INSERT INTO cart_items (user_id, saree_id, quantity) VALUES (?, ?, ?)',
                    [userId, sareeId, quantity]
                );
            }

            res.json({
                success: true,
                message: 'Item added to cart'
            });
        } catch (error) {
            console.error('Add to cart error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add item to cart'
            });
        }
    },

    // Get cart
    async getCart(req, res) {
        try {
            const userId = req.session.userId;
            const [items] = await pool.execute(
                `SELECT ci.*, 
                        s.title, s.price, s.stock, s.is_active,
                        (SELECT file_path FROM saree_images WHERE saree_id = s.id AND is_primary = TRUE LIMIT 1) as image
                 FROM cart_items ci
                 LEFT JOIN sarees s ON ci.saree_id = s.id
                 WHERE ci.user_id = ?
                 ORDER BY ci.created_at DESC`,
                [userId]
            );

            // Normalize paths and calculate total for available items only
            items.forEach(item => {
                if (item.image) {
                    item.image = item.image.replace(/\\/g, '/');
                    if (!item.image.startsWith('/')) {
                        item.image = '/' + item.image;
                    }
                }
            });

            const inStockItems = items.filter(item => item.is_active && item.stock > 0);
            const total = inStockItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            res.json({
                success: true,
                data: {
                    items: items, // Return all items so UI can show "Out of Stock"
                    total
                }
            });
        } catch (error) {
            console.error('Get cart error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch cart'
            });
        }
    },

    // Update cart item
    async updateCart(req, res) {
        try {
            const userId = req.session.userId;
            const cartItemId = parseInt(req.params.id);
            const { quantity } = req.body;

            if (!quantity || quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid quantity required'
                });
            }

            // Get cart item
            const [items] = await pool.execute(
                'SELECT * FROM cart_items WHERE id = ? AND user_id = ?',
                [cartItemId, userId]
            );

            if (items.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart item not found'
                });
            }

            // Check stock
            const [sarees] = await pool.execute(
                'SELECT stock FROM sarees WHERE id = ?',
                [items[0].saree_id]
            );

            if (sarees.length === 0 || sarees[0].stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient stock'
                });
            }

            await pool.execute(
                'UPDATE cart_items SET quantity = ? WHERE id = ?',
                [quantity, cartItemId]
            );

            res.json({
                success: true,
                message: 'Cart updated'
            });
        } catch (error) {
            console.error('Update cart error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update cart'
            });
        }
    },

    // Remove from cart
    async removeFromCart(req, res) {
        try {
            const userId = req.session.userId;
            const cartItemId = parseInt(req.params.id);

            const [result] = await pool.execute(
                'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
                [cartItemId, userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart item not found'
                });
            }

            res.json({
                success: true,
                message: 'Item removed from cart'
            });
        } catch (error) {
            console.error('Remove from cart error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove item from cart'
            });
        }
    },

    // Create order with customizations and offers
    async createOrder(req, res) {
        try {
            const userId = req.session.userId;
            const { address, items, offerId } = req.body;

            if (!address || address.trim().length < 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid delivery address required (min 10 characters)'
                });
            }

            // Get cart items if items not provided directly
            let cartItems;
            if (items && Array.isArray(items)) {
                // Items provided directly (from checkout page with customizations)
                cartItems = items;
            } else {
                // Get from cart
                const [cartItemsResult] = await pool.execute(
                    `SELECT ci.*, s.price, s.stock, s.title, s.category_id, s.weaver_id
                     FROM cart_items ci
                     LEFT JOIN sarees s ON ci.saree_id = s.id
                     WHERE ci.user_id = ?`,
                    [userId]
                );
                cartItems = cartItemsResult;
            }

            if (cartItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cart is empty'
                });
            }

            // Validate stock and calculate total
            let totalAmount = 0;
            const orderItems = [];
            let appliedOffer = null;

            // Get offer if provided
            if (offerId) {
                appliedOffer = await OfferModel.findById(offerId);
            }

            for (const item of cartItems) {
                const sareeId = item.saree_id || item.sareeId;
                const quantity = item.quantity;
                const price = item.price;

                // Get saree to check stock
                const saree = await SareeModel.findById(sareeId);
                if (!saree || !saree.is_approved) {
                    return res.status(400).json({
                        success: false,
                        message: `Saree ${sareeId} not available`
                    });
                }

                if (!saree.stock || saree.stock < quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for ${saree.title}`
                    });
                }

                // Calculate item price (with variant adjustment if applicable)
                let itemPrice = price;
                if (item.variantId) {
                    const variant = await VariantModel.findById(item.variantId);
                    if (variant) {
                        itemPrice = price + (variant.price_adjustment || 0);
                    }
                }

                // Apply offer discount if applicable
                let itemDiscount = 0;
                if (appliedOffer) {
                    itemDiscount = OfferModel.calculateDiscount(appliedOffer, itemPrice);
                } else {
                    // Try to get best offer for this saree
                    const bestOffer = await OfferModel.getBestOfferForSaree(sareeId, saree.category_id);
                    if (bestOffer) {
                        itemDiscount = OfferModel.calculateDiscount(bestOffer, itemPrice);
                        if (!appliedOffer) {
                            appliedOffer = bestOffer;
                        }
                    }
                }

                const finalItemPrice = itemPrice - itemDiscount;
                totalAmount += finalItemPrice * quantity;

                orderItems.push({
                    sareeId: sareeId,
                    quantity: quantity,
                    price: finalItemPrice,
                    customization: item.customization || null
                });
            }

            // Create order with offer
            const orderId = await OrderModel.create({
                buyerId: userId,
                totalAmount,
                offerId: appliedOffer ? appliedOffer.id : null,
                address: address.trim(),
                paymentMethod: 'COD'
            });

            // Create order items
            await OrderModel.createItems(orderId, orderItems);

            // Update stock
            for (const item of cartItems) {
                await pool.execute(
                    'UPDATE sarees SET stock = stock - ? WHERE id = ?',
                    [item.quantity, item.saree_id]
                );
            }

            // Clear cart
            await pool.execute(
                'DELETE FROM cart_items WHERE user_id = ?',
                [userId]
            );

            // Save address to user profile if it was empty
            const user = await UserModel.findById(userId);
            if (user && !user.address) {
                await UserModel.update(userId, { address: address.trim() });
            }

            // Notify weavers
            try {
                // Get unique weavers for this order
                const weaverIds = [...new Set(cartItems.map(item => item.weaver_id || item.weaverId).filter(id => id))];

                // If weaver_id not in cartItems, we need to fetch it (sometimes it's missing from cart join)
                if (weaverIds.length === 0) {
                    for (const item of cartItems) {
                        const saree = await SareeModel.findById(item.saree_id || item.sareeId);
                        if (saree && saree.weaver_id) {
                            weaverIds.push(saree.weaver_id);
                        }
                    }
                }

                for (const weaverId of [...new Set(weaverIds)]) {
                    await NotificationModel.create({
                        userId: weaverId,
                        message: `New order #${orderId} received for your artisan products!`,
                        type: 'order'
                    });
                }
            } catch (notifError) {
                console.error('Failed to send weaver notifications:', notifError);
                // Don't fail the whole order if notification fails
            }

            res.status(201).json({
                success: true,
                message: 'Order placed successfully',
                data: { orderId }
            });
        } catch (error) {
            console.error('Create order error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create order'
            });
        }
    },

    // Get orders
    async getOrders(req, res) {
        try {
            const userId = req.session.userId;
            const orders = await OrderModel.findByBuyer(userId);

            // Get items for each order
            const ordersWithItems = await Promise.all(
                orders.map(async (order) => {
                    const items = await OrderModel.getItems(order.id);
                    return { ...order, items };
                })
            );

            res.json({
                success: true,
                data: ordersWithItems
            });
        } catch (error) {
            console.error('Get orders error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch orders'
            });
        }
    },

    // Get approved stories
    async getApprovedStories(req, res) {
        try {
            const [rows] = await pool.execute(
                `SELECT ws.*, u.name as weaver_name, u.region as weaver_region
                 FROM weaver_stories ws
                 JOIN users u ON ws.weaver_id = u.id
                 WHERE ws.is_approved = TRUE 
                 ORDER BY ws.created_at DESC`
            );

            const sanitizedRows = rows.map(row => {
                if (row.media_path) {
                    row.media_path = row.media_path.replace(/\\/g, '/');
                    if (!row.media_path.startsWith('/') && !row.media_path.startsWith('http')) {
                        row.media_path = '/' + row.media_path;
                    }
                }
                if (row.media_paths) {
                    try {
                        let paths = JSON.parse(row.media_paths);
                        paths = paths.map(p => {
                            p = p.replace(/\\/g, '/');
                            return (!p.startsWith('/') && !p.startsWith('http')) ? '/' + p : p;
                        });
                        row.media_paths = JSON.stringify(paths);
                    } catch (e) {
                        // Not JSON or empty
                    }
                }
                return row;
            });

            res.json({
                success: true,
                data: sanitizedRows
            });
        } catch (error) {
            console.error('Get approved stories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch stories'
            });
        }
    },

    // Get story detail (approved or for admin preview)
    async getStoryDetail(req, res) {
        try {
            const storyId = parseInt(req.params.id);
            const [rows] = await pool.execute(
                `SELECT ws.*, u.name as weaver_name, u.region as weaver_region
                 FROM weaver_stories ws
                 JOIN users u ON ws.weaver_id = u.id
                 WHERE ws.id = ?`,
                [storyId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Story not found' });
            }

            const story = rows[0];

            // If not approved, only admin can view
            if (!story.is_approved && (!req.session || req.session.role !== 'admin')) {
                return res.status(403).json({ success: false, message: 'Story pending approval' });
            }

            if (story.media_path) {
                story.media_path = story.media_path.replace(/\\/g, '/');
                if (!story.media_path.startsWith('/') && !story.media_path.startsWith('http')) {
                    story.media_path = '/' + story.media_path;
                }
            }
            if (story.media_paths) {
                try {
                    let paths = JSON.parse(story.media_paths);
                    paths = paths.map(p => {
                        p = p.replace(/\\/g, '/');
                        return (!p.startsWith('/') && !p.startsWith('http')) ? '/' + p : p;
                    });
                    story.media_paths = JSON.stringify(paths);
                } catch (e) {
                    // Not JSON or empty
                }
            }

            res.json({
                success: true,
                data: story
            });
        } catch (error) {
            console.error('Get story detail error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch story details' });
        }
    },

    // Toggle wishlist
    async toggleWishlist(req, res) {
        try {
            const userId = req.session.userId;
            const { sareeId } = req.body;
            const result = await WishlistModel.toggle(userId, sareeId);
            res.json({ success: true, ...result, message: `Product ${result.action} wishlist` });
        } catch (error) {
            console.error('Toggle wishlist error:', error);
            res.status(500).json({ success: false, message: 'Failed to update wishlist' });
        }
    },

    // Get wishlist
    async getWishlist(req, res) {
        try {
            const userId = req.session.userId;
            const items = await WishlistModel.findByUser(userId);
            res.json({ success: true, data: items });
        } catch (error) {
            console.error('Get wishlist error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
        }
    }
};

module.exports = BuyerController;

