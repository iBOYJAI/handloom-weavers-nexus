const pool = require('../config/db');

const WishlistModel = {
    // Toggle wishlist status
    async toggle(userId, sareeId) {
        const [existing] = await pool.execute(
            'SELECT * FROM wishlist WHERE user_id = ? AND saree_id = ?',
            [userId, sareeId]
        );

        if (existing.length > 0) {
            await pool.execute(
                'DELETE FROM wishlist WHERE user_id = ? AND saree_id = ?',
                [userId, sareeId]
            );
            return { action: 'removed', isWishlisted: false };
        } else {
            await pool.execute(
                'INSERT INTO wishlist (user_id, saree_id) VALUES (?, ?)',
                [userId, sareeId]
            );
            return { action: 'added', isWishlisted: true };
        }
    },

    // Get user's wishlist
    async findByUser(userId) {
        const [rows] = await pool.execute(
            `SELECT w.*, s.title, s.price, s.description, s.stock,
                    (SELECT file_path FROM saree_images WHERE saree_id = s.id AND is_primary = TRUE LIMIT 1) as primary_image
             FROM wishlist w
             JOIN sarees s ON w.saree_id = s.id
             WHERE w.user_id = ?
             ORDER BY w.created_at DESC`,
            [userId]
        );
        return rows.map(row => {
            if (row.primary_image) {
                row.primary_image = row.primary_image.replace(/\\/g, '/');
                if (!row.primary_image.startsWith('/')) {
                    row.primary_image = '/' + row.primary_image;
                }
            }
            return row;
        });
    },

    // Check if item is wishlisted by user
    async isWishlisted(userId, sareeId) {
        const [rows] = await pool.execute(
            'SELECT id FROM wishlist WHERE user_id = ? AND saree_id = ?',
            [userId, sareeId]
        );
        return rows.length > 0;
    }
};

module.exports = WishlistModel;
