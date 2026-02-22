const UserModel = require('../models/user.model');
const SareeModel = require('../models/saree.model');
const OrderModel = require('../models/order.model');
const NotificationModel = require('../models/notification.model');
const ApprovalModel = require('../models/approval.model');
const OfferModel = require('../models/offer.model');
const pool = require('../config/db');

const AdminController = {
    // Get dashboard stats
    async getDashboard(req, res) {
        try {
            const totalUsers = await UserModel.getCountByRole('buyer') + await UserModel.getCountByRole('weaver');
            const totalWeavers = await UserModel.getCountByRole('weaver');
            const totalBuyers = await UserModel.getCountByRole('buyer');
            const pendingWeavers = await UserModel.getPendingWeaversCount();
            const totalSarees = await SareeModel.getTotalCount(false); // All sarees
            const platformStats = await OrderModel.getPlatformStats();
            
            // Get pending approvals count
            const pendingSarees = await ApprovalModel.getPendingSarees();
            const pendingStories = await ApprovalModel.getPendingStories();

            res.json({
                success: true,
                data: {
                    totalUsers,
                    totalWeavers,
                    totalBuyers,
                    totalSarees,
                    totalOrders: platformStats.total_orders || 0,
                    totalRevenue: parseFloat(platformStats.total_revenue || 0),
                    pendingOrders: platformStats.pending_orders || 0,
                    pendingWeaverApprovals: pendingWeavers,
                    pendingSareeApprovals: pendingSarees.length,
                    pendingStoryApprovals: pendingStories.length
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

    // Get all users
    async getUsers(req, res) {
        try {
            const filters = {
                role: req.query.role || null,
                search: req.query.search || null,
                limit: req.query.limit ? parseInt(req.query.limit) : 100,
                offset: req.query.offset ? parseInt(req.query.offset) : 0
            };

            const users = await UserModel.getAll(filters);
            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch users'
            });
        }
    },

    // Approve weaver
    async approveWeaver(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const user = await UserModel.findById(userId);

            if (!user || user.role !== 'weaver') {
                return res.status(404).json({
                    success: false,
                    message: 'Weaver not found'
                });
            }

            await UserModel.updateApproval(userId, true);

            // Create notification for weaver
            await NotificationModel.create({
                userId,
                message: 'Your weaver account has been approved! You can now upload sarees.',
                type: 'approval'
            });

            res.json({
                success: true,
                message: 'Weaver approved successfully'
            });
        } catch (error) {
            console.error('Approve weaver error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to approve weaver'
            });
        }
    },

    // Reject weaver
    async rejectWeaver(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const user = await UserModel.findById(userId);

            if (!user || user.role !== 'weaver') {
                return res.status(404).json({
                    success: false,
                    message: 'Weaver not found'
                });
            }

            // Create notification before potentially deleting
            await NotificationModel.create({
                userId,
                message: 'Your weaver account application has been rejected. Please contact support for more information.',
                type: 'rejection'
            });

            // Optionally delete the user or just keep them as buyer
            // For now, we'll just mark as not approved
            await UserModel.updateApproval(userId, false);

            res.json({
                success: true,
                message: 'Weaver rejected'
            });
        } catch (error) {
            console.error('Reject weaver error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject weaver'
            });
        }
    },

    // Suspend user
    async suspendUser(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            if (user.role === 'admin') {
                return res.status(403).json({ success: false, message: 'Cannot suspend admin' });
            }
            await UserModel.setSuspended(userId, true);
            await NotificationModel.create({
                userId,
                message: 'Your account has been suspended. Contact support for assistance.',
                type: 'suspension'
            });
            res.json({ success: true, message: 'User suspended' });
        } catch (error) {
            console.error('Suspend user error:', error);
            res.status(500).json({ success: false, message: 'Failed to suspend user' });
        }
    },

    // Reactivate suspended user
    async reactivateUser(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            await UserModel.setSuspended(userId, false);
            await NotificationModel.create({
                userId,
                message: 'Your account has been reactivated. Welcome back!',
                type: 'reactivation'
            });
            res.json({ success: true, message: 'User reactivated' });
        } catch (error) {
            console.error('Reactivate user error:', error);
            res.status(500).json({ success: false, message: 'Failed to reactivate user' });
        }
    },

    // Update user (admin edit)
    async updateUser(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const { name, email, phone, region } = req.body;
            const updateData = {};
            if (name !== undefined && name.trim().length >= 3 && name.length <= 60) updateData.name = name.trim();
            if (phone !== undefined) updateData.phone = phone ? String(phone).trim().slice(0, 20) : null;
            if (region !== undefined) updateData.region = region ? String(region).trim().slice(0, 100) : null;
            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ success: false, message: 'No valid fields to update' });
            }
            await UserModel.update(userId, updateData);
            const updated = await UserModel.findById(userId);
            res.json({
                success: true,
                message: 'User updated',
                data: {
                    id: updated.id,
                    name: updated.name,
                    email: updated.email,
                    role: updated.role,
                    region: updated.region,
                    phone: updated.phone,
                    is_approved: updated.is_approved,
                    is_suspended: updated.is_suspended
                }
            });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ success: false, message: 'Failed to update user' });
        }
    },

    // Get all sarees (admin can see all, including unapproved)
    async getSarees(req, res) {
        try {
            const filters = {
                categoryId: req.query.category ? parseInt(req.query.category) : null,
                weaverId: req.query.weaver ? parseInt(req.query.weaver) : null,
                limit: req.query.limit ? parseInt(req.query.limit) : 100,
                offset: req.query.offset ? parseInt(req.query.offset) : 0,
                approvedOnly: false // Admin can see all sarees
            };

            const sarees = await SareeModel.findAll(filters);
            res.json({
                success: true,
                data: sarees
            });
        } catch (error) {
            console.error('Get sarees error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch sarees'
            });
        }
    },

    // Deactivate saree
    async deactivateSaree(req, res) {
        try {
            const sareeId = parseInt(req.params.id);
            await SareeModel.update(sareeId, { isActive: false });
            res.json({ success: true, message: 'Saree deactivated' });
        } catch (error) {
            console.error('Deactivate saree error:', error);
            res.status(500).json({ success: false, message: 'Failed to deactivate saree' });
        }
    },

    // Activate (reactivate) saree
    async activateSaree(req, res) {
        try {
            const sareeId = parseInt(req.params.id);
            await SareeModel.update(sareeId, { isActive: true });
            res.json({ success: true, message: 'Saree activated' });
        } catch (error) {
            console.error('Activate saree error:', error);
            res.status(500).json({ success: false, message: 'Failed to activate saree' });
        }
    },

    // Delete saree
    async deleteSaree(req, res) {
        try {
            const sareeId = parseInt(req.params.id);
            await SareeModel.delete(sareeId);

            res.json({
                success: true,
                message: 'Saree deleted'
            });
        } catch (error) {
            console.error('Delete saree error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete saree'
            });
        }
    },

    // Get all orders
    async getOrders(req, res) {
        try {
            const filters = {
                status: req.query.status || null,
                buyerId: req.query.buyer ? parseInt(req.query.buyer) : null,
                limit: req.query.limit ? parseInt(req.query.limit) : 100,
                offset: req.query.offset ? parseInt(req.query.offset) : 0
            };

            const orders = await OrderModel.findAll(filters);

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

    // Update order status
    async updateOrderStatus(req, res) {
        try {
            const orderId = parseInt(req.params.id);
            const { status } = req.body;

            const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status'
                });
            }

            await OrderModel.updateStatus(orderId, status);

            // Get order to notify buyer
            const order = await OrderModel.findById(orderId);
            if (order) {
                await NotificationModel.create({
                    userId: order.buyer_id,
                    message: `Your order #${orderId} status has been updated to ${status}.`,
                    type: 'order_update'
                });
            }

            res.json({
                success: true,
                message: 'Order status updated'
            });
        } catch (error) {
            console.error('Update order status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update order status'
            });
        }
    },

    // Get categories
    async getCategories(req, res) {
        try {
            const [categories] = await pool.execute(
                'SELECT * FROM saree_categories ORDER BY name ASC'
            );
            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch categories'
            });
        }
    },

    // Create category
    async createCategory(req, res) {
        try {
            const { name } = req.body;

            if (!name || name.length < 2 || name.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Category name must be between 2 and 100 characters'
                });
            }

            const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            await pool.execute(
                'INSERT INTO saree_categories (name, slug) VALUES (?, ?)',
                [name.trim(), slug]
            );

            res.status(201).json({
                success: true,
                message: 'Category created'
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    success: false,
                    message: 'Category already exists'
                });
            }
            console.error('Create category error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create category'
            });
        }
    },

    // Update category
    async updateCategory(req, res) {
        try {
            const categoryId = parseInt(req.params.id);
            const { name } = req.body;

            if (!name || name.length < 2 || name.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Category name must be between 2 and 100 characters'
                });
            }

            const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            await pool.execute(
                'UPDATE saree_categories SET name = ?, slug = ? WHERE id = ?',
                [name.trim(), slug, categoryId]
            );

            res.json({
                success: true,
                message: 'Category updated'
            });
        } catch (error) {
            console.error('Update category error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update category'
            });
        }
    },

    // Get analytics
    async getAnalytics(req, res) {
        try {
            // Category breakdown
            const [categoryStats] = await pool.execute(
                `SELECT c.name, c.slug, COUNT(s.id) as saree_count, 
                        SUM(CASE WHEN oi.id IS NOT NULL THEN oi.quantity * oi.price_at_purchase ELSE 0 END) as revenue
                 FROM saree_categories c
                 LEFT JOIN sarees s ON c.id = s.category_id AND s.is_active = TRUE
                 LEFT JOIN order_items oi ON s.id = oi.saree_id
                 GROUP BY c.id
                 ORDER BY saree_count DESC`
            );

            // Top weavers by sales
            const [topWeavers] = await pool.execute(
                `SELECT u.id, u.name, u.email, u.region,
                        COUNT(DISTINCT o.id) as order_count,
                        SUM(oi.quantity * oi.price_at_purchase) as total_earnings
                 FROM users u
                 INNER JOIN sarees s ON u.id = s.weaver_id
                 INNER JOIN order_items oi ON s.id = oi.saree_id
                 INNER JOIN orders o ON oi.order_id = o.id
                 WHERE u.role = 'weaver' AND o.status != 'cancelled'
                 GROUP BY u.id
                 ORDER BY total_earnings DESC
                 LIMIT 10`
            );

            // Recent activity (recent orders)
            const recentOrders = await OrderModel.findAll({ limit: 10 });

            res.json({
                success: true,
                data: {
                    categoryBreakdown: categoryStats,
                    topWeavers,
                    recentActivity: recentOrders
                }
            });
        } catch (error) {
            console.error('Get analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch analytics'
            });
        }
    },

    // Get report data (weekly, monthly, yearly)
    async getReport(req, res) {
        try {
            const { period = 'monthly' } = req.query; // weekly, monthly, yearly
            
            let startDate, endDate, periodLabel;
            const now = new Date();
            
            switch(period) {
                case 'weekly':
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - 7);
                    periodLabel = 'Last 7 Days';
                    break;
                case 'monthly':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    periodLabel = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
                    break;
                case 'yearly':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31);
                    periodLabel = now.getFullYear().toString();
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    periodLabel = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
            }
            
            // Get orders in period
            const [orders] = await pool.execute(
                `SELECT o.*, u.name as buyer_name, 
                        COUNT(oi.id) as item_count,
                        SUM(oi.quantity * oi.price_at_purchase) as total_amount
                 FROM orders o
                 LEFT JOIN users u ON o.buyer_id = u.id
                 LEFT JOIN order_items oi ON o.id = oi.order_id
                 WHERE o.created_at >= ? AND o.created_at <= ?
                 GROUP BY o.id
                 ORDER BY o.created_at DESC`,
                [startDate, endDate || now]
            );
            
            // Get revenue stats
            const [revenueStats] = await pool.execute(
                `SELECT 
                    COUNT(DISTINCT o.id) as total_orders,
                    SUM(oi.quantity * oi.price_at_purchase) as total_revenue,
                    COUNT(DISTINCT o.buyer_id) as unique_buyers,
                    AVG(oi.quantity * oi.price_at_purchase) as avg_order_value
                 FROM orders o
                 INNER JOIN order_items oi ON o.id = oi.order_id
                 WHERE o.created_at >= ? AND o.created_at <= ? AND o.status != 'cancelled'`,
                [startDate, endDate || now]
            );
            
            // Get top products
            const [topProducts] = await pool.execute(
                `SELECT s.id, s.title, s.price, c.name as category_name,
                        SUM(oi.quantity) as units_sold,
                        SUM(oi.quantity * oi.price_at_purchase) as revenue
                 FROM sarees s
                 INNER JOIN order_items oi ON s.id = oi.saree_id
                 INNER JOIN orders o ON oi.order_id = o.id
                 INNER JOIN saree_categories c ON s.category_id = c.id
                 WHERE o.created_at >= ? AND o.created_at <= ? AND o.status != 'cancelled'
                 GROUP BY s.id
                 ORDER BY revenue DESC
                 LIMIT 10`,
                [startDate, endDate || now]
            );
            
            // Get user growth
            const [userGrowth] = await pool.execute(
                `SELECT 
                    COUNT(CASE WHEN role = 'buyer' AND created_at >= ? AND created_at <= ? THEN 1 END) as new_buyers,
                    COUNT(CASE WHEN role = 'weaver' AND created_at >= ? AND created_at <= ? THEN 1 END) as new_weavers
                 FROM users`,
                [startDate, endDate || now, startDate, endDate || now]
            );
            
            res.json({
                success: true,
                data: {
                    period,
                    periodLabel,
                    startDate: startDate.toISOString(),
                    endDate: (endDate || now).toISOString(),
                    revenue: revenueStats[0] || {},
                    orders: orders || [],
                    topProducts: topProducts || [],
                    userGrowth: userGrowth[0] || {},
                    generatedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Get report error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate report'
            });
        }
    },

    // Get pending approvals (sarees and stories)
    async getPendingApprovals(req, res) {
        try {
            const pendingSarees = await ApprovalModel.getPendingSarees();
            const pendingStories = await ApprovalModel.getPendingStories();

            res.json({
                success: true,
                data: {
                    sarees: pendingSarees,
                    stories: pendingStories
                }
            });
        } catch (error) {
            console.error('Get pending approvals error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch pending approvals'
            });
        }
    },

    // Approve saree
    async approveSaree(req, res) {
        try {
            const { id } = req.params;
            const adminId = req.session.userId;
            const sareeId = parseInt(id);

            await ApprovalModel.approveSaree(sareeId, adminId);

            // Get saree and notify weaver
            const saree = await SareeModel.findById(sareeId);
            if (saree && saree.weaver_id) {
                await NotificationModel.create({
                    userId: saree.weaver_id,
                    message: `Your saree "${saree.title}" has been approved and is now visible to buyers.`,
                    type: 'approval'
                });
            }

            res.json({
                success: true,
                message: 'Saree approved successfully'
            });
        } catch (error) {
            console.error('Approve saree error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to approve saree'
            });
        }
    },

    // Reject saree
    async rejectSaree(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const adminId = req.session.userId;
            const sareeId = parseInt(id);

            if (!reason || reason.trim().length < 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required (min 5 characters)'
                });
            }

            await ApprovalModel.rejectSaree(sareeId, adminId, reason.trim());

            // Get saree and notify weaver
            const saree = await SareeModel.findById(sareeId);
            if (saree && saree.weaver_id) {
                await NotificationModel.create({
                    userId: saree.weaver_id,
                    message: `Your saree "${saree.title}" has been rejected. Reason: ${reason}`,
                    type: 'rejection'
                });
            }

            res.json({
                success: true,
                message: 'Saree rejected'
            });
        } catch (error) {
            console.error('Reject saree error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject saree'
            });
        }
    },

    // Approve story
    async approveStory(req, res) {
        try {
            const { id } = req.params;
            const adminId = req.session.userId;
            const storyId = parseInt(id);

            await ApprovalModel.approveStory(storyId, adminId);

            // Get story and notify weaver
            const [stories] = await pool.execute(
                'SELECT * FROM weaver_stories WHERE id = ?',
                [storyId]
            );
            if (stories.length > 0) {
                await NotificationModel.create({
                    userId: stories[0].weaver_id,
                    message: 'Your story has been approved and is now visible.',
                    type: 'approval'
                });
            }

            res.json({
                success: true,
                message: 'Story approved successfully'
            });
        } catch (error) {
            console.error('Approve story error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to approve story'
            });
        }
    },

    // Reject story
    async rejectStory(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const adminId = req.session.userId;
            const storyId = parseInt(id);

            if (!reason || reason.trim().length < 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required (min 5 characters)'
                });
            }

            await ApprovalModel.rejectStory(storyId, adminId, reason.trim());

            // Get story and notify weaver
            const [stories] = await pool.execute(
                'SELECT * FROM weaver_stories WHERE id = ?',
                [storyId]
            );
            if (stories.length > 0) {
                await NotificationModel.create({
                    userId: stories[0].weaver_id,
                    message: `Your story has been rejected. Reason: ${reason}`,
                    type: 'rejection'
                });
            }

            res.json({
                success: true,
                message: 'Story rejected'
            });
        } catch (error) {
            console.error('Reject story error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject story'
            });
        }
    },

    // Bulk approve sarees
    async bulkApproveSarees(req, res) {
        try {
            const { sareeIds } = req.body;
            const adminId = req.session.userId;

            if (!Array.isArray(sareeIds) || sareeIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Saree IDs array is required'
                });
            }

            const count = await ApprovalModel.bulkApproveSarees(sareeIds, adminId);

            // Notify weavers
            for (const sareeId of sareeIds) {
                const saree = await SareeModel.findById(sareeId);
                if (saree && saree.weaver_id) {
                    await NotificationModel.create({
                        userId: saree.weaver_id,
                        message: `Your saree "${saree.title}" has been approved.`,
                        type: 'approval'
                    });
                }
            }

            res.json({
                success: true,
                message: `${count} saree(s) approved successfully`
            });
        } catch (error) {
            console.error('Bulk approve sarees error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to approve sarees'
            });
        }
    }
};

module.exports = AdminController;

