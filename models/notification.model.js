const pool = require('../config/db');

const NotificationModel = {
    // Create a new notification
    async create(notificationData) {
        const { userId, message, type } = notificationData;
        const [result] = await pool.execute(
            'INSERT INTO notifications (user_id, message, type, is_read) VALUES (?, ?, ?, FALSE)',
            [userId, message, type]
        );
        return result.insertId;
    },

    // Get unread count for a user
    async getUnreadCount(userId) {
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
        return rows[0].count;
    },

    // Get notifications for a user
    async getByUser(userId, limit = 50) {
        const [rows] = await pool.execute(
            `SELECT * FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [userId, limit]
        );
        return rows;
    },

    // Mark notification as read
    async markAsRead(notificationId, userId) {
        const [result] = await pool.execute(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
        return result.affectedRows > 0;
    },

    // Mark all notifications as read for a user
    async markAllAsRead(userId) {
        const [result] = await pool.execute(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
        return result.affectedRows;
    },

    // Delete notification
    async delete(notificationId, userId) {
        const [result] = await pool.execute(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
        return result.affectedRows > 0;
    }
};

module.exports = NotificationModel;

