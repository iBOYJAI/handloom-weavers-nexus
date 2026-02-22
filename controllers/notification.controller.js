const NotificationModel = require('../models/notification.model');

const NotificationController = {
    // Get unread count - Public route, works for all users (guests get 0)
    async getUnreadCount(req, res) {
        try {
            // Check if user is authenticated - if not, return 0 (guest user)
            if (!req.session || !req.session.userId) {
                return res.json({
                    success: true,
                    data: { count: 0 }
                });
            }

            // User is authenticated, get their unread count
            const userId = req.session.userId;
            const count = await NotificationModel.getUnreadCount(userId);
            res.json({
                success: true,
                data: { count: count || 0 }
            });
        } catch (error) {
            // Always return success with count 0 on any error
            // This ensures the route never fails, even if there's a DB error
            res.json({
                success: true,
                data: { count: 0 }
            });
        }
    },

    // Get notifications
    async getNotifications(req, res) {
        try {
            const userId = req.session.userId;
            const limit = parseInt(req.query.limit) || 50;
            const notifications = await NotificationModel.getByUser(userId, limit);
            res.json({
                success: true,
                data: notifications
            });
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notifications'
            });
        }
    },

    // Mark as read
    async markAsRead(req, res) {
        try {
            const userId = req.session.userId;
            const notificationId = parseInt(req.params.id);
            const success = await NotificationModel.markAsRead(notificationId, userId);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            res.json({
                success: true,
                message: 'Notification marked as read'
            });
        } catch (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as read'
            });
        }
    },

    // Mark all as read
    async markAllRead(req, res) {
        try {
            const userId = req.session.userId;
            await NotificationModel.markAllAsRead(userId);
            res.json({
                success: true,
                message: 'All notifications marked as read'
            });
        } catch (error) {
            console.error('Mark all read error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark all notifications as read'
            });
        }
    }
};

module.exports = NotificationController;

