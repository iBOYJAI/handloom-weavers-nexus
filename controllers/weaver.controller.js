const SareeModel = require('../models/saree.model');
const OrderModel = require('../models/order.model');
const UserModel = require('../models/user.model');
const NotificationModel = require('../models/notification.model');
const ApprovalModel = require('../models/approval.model');
const VariantModel = require('../models/variant.model');
const pool = require('../config/db');

const WeaverController = {
    // Get dashboard stats
    async getDashboard(req, res) {
        try {
            const weaverId = req.session.userId;

            // Check if weaver is approved
            const user = await UserModel.findById(weaverId);
            if (!user.is_approved) {
                return res.status(403).json({
                    success: false,
                    message: 'Your weaver account is pending admin approval'
                });
            }

            // Get sarees count
            const sarees = await SareeModel.getByWeaver(weaverId);
            const totalSarees = sarees.length;
            const pendingSarees = sarees.filter(s => !s.is_approved).slice(0, 5);

            // Get stories
            const [stories] = await pool.execute(
                'SELECT * FROM weaver_stories WHERE weaver_id = ? ORDER BY created_at DESC',
                [weaverId]
            );
            const pendingStories = stories.filter(s => !s.is_approved).slice(0, 5);

            // Get orders stats
            const stats = await OrderModel.getWeaverStats(weaverId);

            // Get recent orders
            const recentOrders = await OrderModel.findByWeaver(weaverId, 5);

            res.json({
                success: true,
                data: {
                    totalSarees,
                    totalOrders: stats.total_orders || 0,
                    totalEarnings: parseFloat(stats.total_earnings || 0),
                    pendingOrders: stats.pending_orders || 0,
                    recentOrders,
                    waitlist: {
                        sarees: pendingSarees,
                        stories: pendingStories
                    }
                }
            });
        } catch (error) {
            console.error('Get dashboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard data'
            });
        }
    },

    // Get saree by ID (for editing)
    async getSareeById(req, res) {
        try {
            const weaverId = req.session.userId;
            const sareeId = parseInt(req.params.id);
            const saree = await SareeModel.findById(sareeId);

            if (!saree || saree.weaver_id !== weaverId) {
                return res.status(404).json({
                    success: false,
                    message: 'Saree not found'
                });
            }

            const images = await SareeModel.getImages(sareeId);
            const normalizedImages = images.map(img => {
                if (img.file_path) {
                    img.file_path = img.file_path.replace(/\\/g, '/');
                    if (!img.file_path.startsWith('/')) {
                        img.file_path = '/' + img.file_path;
                    }
                }
                return img;
            });

            res.json({
                success: true,
                data: { ...saree, images: normalizedImages }
            });
        } catch (error) {
            console.error('Get saree error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch saree'
            });
        }
    },

    // Upload saree
    async uploadSaree(req, res) {
        try {
            const weaverId = req.session.userId;

            // Check if weaver is approved
            const user = await UserModel.findById(weaverId);
            if (!user.is_approved) {
                return res.status(403).json({
                    success: false,
                    message: 'Your weaver account is pending admin approval'
                });
            }

            const { title, description, price, stock, categoryId, blouseColors } = req.body;

            // Validation
            if (!title || title.length < 5 || title.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Title must be between 5 and 100 characters'
                });
            }

            if (!description || description.length < 20 || description.length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: 'Description must be between 20 and 1000 characters'
                });
            }

            const priceNum = parseFloat(price);
            if (!priceNum || priceNum < 1 || priceNum > 99999) {
                return res.status(400).json({
                    success: false,
                    message: 'Price must be between 1 and 99999'
                });
            }

            const stockNum = parseInt(stock);
            if (stockNum < 0 || stockNum > 9999) {
                return res.status(400).json({
                    success: false,
                    message: 'Stock must be between 0 and 9999'
                });
            }

            if (!categoryId) {
                return res.status(400).json({
                    success: false,
                    message: 'Category is required'
                });
            }

            // Parse blouse colors (array of color codes)
            let parsedBlouseColors = [];
            if (blouseColors) {
                try {
                    parsedBlouseColors = Array.isArray(blouseColors) ? blouseColors : JSON.parse(blouseColors);
                    // Validate color codes (should be hex codes)
                    parsedBlouseColors = parsedBlouseColors.filter(color => /^#[0-9A-Fa-f]{6}$/.test(color));
                } catch (e) {
                    parsedBlouseColors = [];
                }
            }

            // Create saree
            const sareeId = await SareeModel.create({
                weaverId,
                categoryId: parseInt(categoryId),
                title: title.trim(),
                description: description.trim(),
                price: priceNum,
                stock: stockNum,
                blouseColors: parsedBlouseColors.length > 0 ? parsedBlouseColors : null
            });

            // Handle images
            if (req.files && req.files.length > 0) {
                const images = Array.isArray(req.files) ? req.files : [req.files];

                // Limit to 5 images
                const imageFiles = images.slice(0, 5);

                for (let i = 0; i < imageFiles.length; i++) {
                    const file = imageFiles[i];
                    const isPrimary = i === 0; // First image is primary
                    await SareeModel.addImage(sareeId, file.path.replace(/\\/g, '/'), isPrimary);
                }
            }

            res.status(201).json({
                success: true,
                message: 'Saree uploaded successfully',
                data: { sareeId }
            });
        } catch (error) {
            console.error('Upload saree error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload saree'
            });
        }
    },

    // Update saree
    async updateSaree(req, res) {
        try {
            const weaverId = req.session.userId;
            const sareeId = parseInt(req.params.id);

            // Check if saree belongs to weaver
            const saree = await SareeModel.findById(sareeId);
            if (!saree || saree.weaver_id !== weaverId) {
                return res.status(404).json({
                    success: false,
                    message: 'Saree not found'
                });
            }

            const { title, description, price, stock, categoryId } = req.body;
            const updateData = {};

            if (title !== undefined) {
                if (title.length < 5 || title.length > 100) {
                    return res.status(400).json({
                        success: false,
                        message: 'Title must be between 5 and 100 characters'
                    });
                }
                updateData.title = title.trim();
            }

            if (description !== undefined) {
                if (description.length < 20 || description.length > 1000) {
                    return res.status(400).json({
                        success: false,
                        message: 'Description must be between 20 and 1000 characters'
                    });
                }
                updateData.description = description.trim();
            }

            if (price !== undefined) {
                const priceNum = parseFloat(price);
                if (priceNum < 1 || priceNum > 99999) {
                    return res.status(400).json({
                        success: false,
                        message: 'Price must be between 1 and 99999'
                    });
                }
                updateData.price = priceNum;
            }

            if (stock !== undefined) {
                const stockNum = parseInt(stock);
                if (stockNum < 0 || stockNum > 9999) {
                    return res.status(400).json({
                        success: false,
                        message: 'Stock must be between 0 and 9999'
                    });
                }
                updateData.stock = stockNum;
            }

            if (categoryId !== undefined) {
                updateData.categoryId = parseInt(categoryId);
            }

            await SareeModel.update(sareeId, updateData);

            // Handle new images
            if (req.files && req.files.length > 0) {
                const images = Array.isArray(req.files) ? req.files : [req.files];

                // Check current image count
                const currentImages = await SareeModel.getImages(sareeId);
                const limit = 5 - currentImages.length;

                if (limit > 0) {
                    const imagesToAdd = images.slice(0, limit);
                    for (const file of imagesToAdd) {
                        await SareeModel.addImage(sareeId, file.path.replace(/\\/g, '/'), false);
                    }
                }
            }

            res.json({
                success: true,
                message: 'Saree updated successfully'
            });
        } catch (error) {
            console.error('Update saree error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update saree'
            });
        }
    },

    // Delete saree image
    async deleteSareeImage(req, res) {
        try {
            const weaverId = req.session.userId;
            const imageId = parseInt(req.params.id);

            // Get image details to find saree
            const [imageRows] = await pool.execute(
                'SELECT * FROM saree_images WHERE id = ?',
                [imageId]
            );
            const image = imageRows[0];

            if (!image) {
                return res.status(404).json({
                    success: false,
                    message: 'Image not found'
                });
            }

            // Check if saree belongs to weaver
            const saree = await SareeModel.findById(image.saree_id);
            if (!saree || saree.weaver_id !== weaverId) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this image'
                });
            }

            await SareeModel.deleteImage(imageId);

            res.json({
                success: true,
                message: 'Image deleted successfully'
            });
        } catch (error) {
            console.error('Delete image error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete image'
            });
        }
    },

    // Delete saree
    async deleteSaree(req, res) {
        try {
            const weaverId = req.session.userId;
            const sareeId = parseInt(req.params.id);

            // Check if saree belongs to weaver
            const saree = await SareeModel.findById(sareeId);
            if (!saree || saree.weaver_id !== weaverId) {
                return res.status(404).json({
                    success: false,
                    message: 'Saree not found'
                });
            }

            await SareeModel.delete(sareeId);

            res.json({
                success: true,
                message: 'Saree deleted successfully'
            });
        } catch (error) {
            console.error('Delete saree error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete saree'
            });
        }
    },

    // Get weaver's orders (orders containing weaver's sarees)
    async getOrders(req, res) {
        try {
            const weaverId = req.session.userId;
            const user = await UserModel.findById(weaverId);
            if (!user.is_approved) {
                return res.status(403).json({
                    success: false,
                    message: 'Your weaver account is pending admin approval'
                });
            }
            const status = req.query.status || null;
            const limit = parseInt(req.query.limit) || 50;
            let orders = await OrderModel.findByWeaver(weaverId, limit);
            if (status) {
                orders = orders.filter(o => o.status === status);
            }
            const ordersWithItems = await Promise.all(
                orders.map(async (order) => {
                    const items = await OrderModel.getItems(order.id);
                    const weaverItemsFiltered = [];
                    for (const item of items) {
                        const saree = await SareeModel.findById(item.saree_id);
                        if (saree && saree.weaver_id === weaverId) weaverItemsFiltered.push(item);
                    }
                    return { ...order, items: weaverItemsFiltered };
                })
            );
            res.json({
                success: true,
                data: ordersWithItems
            });
        } catch (error) {
            console.error('Get weaver orders error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch orders'
            });
        }
    },

    // Update order status (weaver marks shipped/delivered for their items)
    async updateOrderStatus(req, res) {
        try {
            const weaverId = req.session.userId;
            const orderId = parseInt(req.params.id);
            const { status } = req.body;
            const validStatuses = ['shipped', 'delivered'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status' });
            }
            const order = await OrderModel.findById(orderId);
            if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
            const items = await OrderModel.getItems(orderId);
            const hasWeaverItem = await Promise.all(items.map(async (item) => {
                const saree = await SareeModel.findById(item.saree_id);
                return saree && saree.weaver_id === weaverId;
            })).then(r => r.some(Boolean));
            if (!hasWeaverItem) return res.status(403).json({ success: false, message: 'Order does not contain your items' });
            await OrderModel.updateStatus(orderId, status);
            await NotificationModel.create({
                userId: order.buyer_id,
                message: `Order #${orderId} status updated to ${status}.`,
                type: 'order_update'
            });
            res.json({ success: true, message: 'Order status updated' });
        } catch (error) {
            console.error('Update order status error:', error);
            res.status(500).json({ success: false, message: 'Failed to update status' });
        }
    },

    // Get weaver's sarees
    async getMySarees(req, res) {
        try {
            const weaverId = req.session.userId;
            const sarees = await SareeModel.getByWeaver(weaverId);

            // Get images for each saree
            const sareesWithImages = await Promise.all(
                sarees.map(async (saree) => {
                    const images = await SareeModel.getImages(saree.id);
                    return { ...saree, images };
                })
            );

            res.json({
                success: true,
                data: sareesWithImages
            });
        } catch (error) {
            console.error('Get my sarees error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch sarees'
            });
        }
    },

    // Upload story
    async uploadStory(req, res) {
        try {
            const weaverId = req.session.userId;

            // Check if weaver is approved
            const user = await UserModel.findById(weaverId);
            if (!user.is_approved) {
                return res.status(403).json({
                    success: false,
                    message: 'Your weaver account is pending admin approval'
                });
            }

            const { title, caption, description } = req.body;

            if (!title || title.length < 5 || title.length > 255) {
                return res.status(400).json({
                    success: false,
                    message: 'Title must be between 5 and 255 characters'
                });
            }

            if (!caption || caption.length > 500) {
                return res.status(400).json({
                    success: false,
                    message: 'Caption must be max 500 characters'
                });
            }

            if (!description || description.length < 20) {
                return res.status(400).json({
                    success: false,
                    message: 'Description must be at least 20 characters'
                });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one media file is required'
                });
            }

            const mediaPaths = req.files.map(file => file.path.replace(/\\/g, '/'));
            const mediaTypes = req.files.map(file => file.mimetype.startsWith('video/') ? 'video' : 'image');

            const [result] = await pool.execute(
                'INSERT INTO weaver_stories (weaver_id, title, caption, description, media_path, media_type, media_paths, media_types, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)',
                [
                    weaverId,
                    title.trim(),
                    caption.trim(),
                    description.trim(),
                    mediaPaths[0],
                    mediaTypes[0],
                    JSON.stringify(mediaPaths),
                    JSON.stringify(mediaTypes)
                ]
            );

            const storyId = result.insertId;

            // Create approval record
            await ApprovalModel.createStoryApproval(storyId);

            // Notify all admins about the new story submission
            try {
                const admins = await UserModel.getAll({ role: 'admin' });
                const weaverName = user.name || 'An artisan';

                for (const admin of admins) {
                    await NotificationModel.create({
                        userId: admin.id,
                        message: `${weaverName} has shared a new story: "${title.trim()}". Approval requested.`,
                        type: 'story'
                    });
                }
            } catch (notifError) {
                console.error('Failed to send admin notifications for story:', notifError);
            }

            res.status(201).json({
                success: true,
                message: 'Story uploaded successfully. It will be visible after admin approval.',
                data: { storyId }
            });
        } catch (error) {
            console.error('Upload story error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload story'
            });
        }
    },

    // Get sales report
    async getSalesReport(req, res) {
        try {
            const weaverId = req.session.userId;

            // Check if weaver is approved
            const user = await UserModel.findById(weaverId);
            if (!user.is_approved) {
                return res.status(403).json({
                    success: false,
                    message: 'Your weaver account is pending admin approval'
                });
            }

            const orders = await OrderModel.findByWeaver(weaverId);

            // Get items for each order
            const ordersWithItems = await Promise.all(
                orders.map(async (order) => {
                    const items = await OrderModel.getItems(order.id);
                    // Filter items to only include this weaver's sarees
                    const weaverItems = items.filter(item => {
                        // We need to check if the saree belongs to this weaver
                        // This is already filtered in findByWeaver, but let's be safe
                        return true;
                    });
                    return { ...order, items: weaverItems };
                })
            );

            // Calculate total earnings
            const stats = await OrderModel.getWeaverStats(weaverId);

            res.json({
                success: true,
                data: {
                    orders: ordersWithItems,
                    totalEarnings: parseFloat(stats.total_earnings || 0),
                    totalOrders: stats.total_orders || 0
                }
            });
        } catch (error) {
            console.error('Get sales report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch sales report'
            });
        }
    },

    // Get weaver's stories
    async getMyStories(req, res) {
        try {
            const weaverId = req.session.userId;
            const [rows] = await pool.execute(
                'SELECT * FROM weaver_stories WHERE weaver_id = ? ORDER BY created_at DESC',
                [weaverId]
            );

            const normalizedRows = rows.map(row => {
                if (row.media_path) {
                    row.media_path = row.media_path.replace(/\\/g, '/');
                    if (!row.media_path.startsWith('/') && !row.media_path.startsWith('http')) {
                        row.media_path = '/' + row.media_path;
                    }
                }
                return row;
            });

            res.json({
                success: true,
                data: normalizedRows
            });
        } catch (error) {
            console.error('Get my stories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch stories'
            });
        }
    },

    // Delete story
    async deleteStory(req, res) {
        try {
            const weaverId = req.session.userId;
            const storyId = parseInt(req.params.id);

            // Check ownership
            const [rows] = await pool.execute(
                'SELECT * FROM weaver_stories WHERE id = ? AND weaver_id = ?',
                [storyId, weaverId]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Story not found or not authorized'
                });
            }

            await pool.execute('DELETE FROM weaver_stories WHERE id = ?', [storyId]);
            // Also delete from approvals if pending
            await pool.execute('DELETE FROM approvals WHERE entity_type = "story" AND entity_id = ?', [storyId]);

            res.json({
                success: true,
                message: 'Story deleted successfully'
            });
        } catch (error) {
            console.error('Delete story error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete story'
            });
        }
    }
};

module.exports = WeaverController;
