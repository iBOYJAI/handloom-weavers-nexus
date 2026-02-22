const pool = require('../config/db');

const WishlistController = {
    // Get user's wishlist
    async getWishlist(req, res) {
        try {
            const userId = req.session.userId;
            const [items] = await pool.execute(
                `SELECT w.id, w.saree_id, w.created_at,
                        s.title, s.price, s.stock, s.is_active,
                        c.name AS category_name,
                        u.name AS weaver_name,
                        (SELECT file_path FROM saree_images WHERE saree_id = s.id AND is_primary = TRUE LIMIT 1) AS primary_image
                 FROM wishlist w
                 LEFT JOIN sarees s ON w.saree_id = s.id
                 LEFT JOIN saree_categories c ON s.category_id = c.id
                 LEFT JOIN users u ON s.weaver_id = u.id
                 WHERE w.user_id = ?
                 ORDER BY w.created_at DESC`,
                [userId]
            );

            res.json({ success: true, data: items });
        } catch (error) {
            console.error('Get wishlist error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
        }
    },

    // Add to wishlist
    async addToWishlist(req, res) {
        try {
            const userId = req.session.userId;
            const { sareeId } = req.body;

            if (!sareeId) {
                return res.status(400).json({ success: false, message: 'Saree ID required' });
            }

            // Check saree exists
            const [sarees] = await pool.execute('SELECT id FROM sarees WHERE id = ? AND is_active = TRUE', [sareeId]);
            if (sarees.length === 0) {
                return res.status(404).json({ success: false, message: 'Saree not found' });
            }

            await pool.execute(
                'INSERT IGNORE INTO wishlist (user_id, saree_id) VALUES (?, ?)',
                [userId, sareeId]
            );

            res.json({ success: true, message: 'Added to wishlist', inWishlist: true });
        } catch (error) {
            console.error('Add to wishlist error:', error);
            res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
        }
    },

    // Remove from wishlist
    async removeFromWishlist(req, res) {
        try {
            const userId = req.session.userId;
            const sareeId = parseInt(req.params.sareeId);

            await pool.execute(
                'DELETE FROM wishlist WHERE user_id = ? AND saree_id = ?',
                [userId, sareeId]
            );

            res.json({ success: true, message: 'Removed from wishlist', inWishlist: false });
        } catch (error) {
            console.error('Remove from wishlist error:', error);
            res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
        }
    },

    // Toggle wishlist (add if not exists, remove if exists)
    async toggleWishlist(req, res) {
        try {
            const userId = req.session.userId;
            const { sareeId } = req.body;

            if (!sareeId) {
                return res.status(400).json({ success: false, message: 'Saree ID required' });
            }

            const [existing] = await pool.execute(
                'SELECT id FROM wishlist WHERE user_id = ? AND saree_id = ?',
                [userId, sareeId]
            );

            if (existing.length > 0) {
                await pool.execute(
                    'DELETE FROM wishlist WHERE user_id = ? AND saree_id = ?',
                    [userId, sareeId]
                );
                res.json({ success: true, message: 'Removed from wishlist', inWishlist: false });
            } else {
                await pool.execute(
                    'INSERT INTO wishlist (user_id, saree_id) VALUES (?, ?)',
                    [userId, sareeId]
                );
                res.json({ success: true, message: 'Added to wishlist', inWishlist: true });
            }
        } catch (error) {
            console.error('Toggle wishlist error:', error);
            res.status(500).json({ success: false, message: 'Failed to update wishlist' });
        }
    },

    // Check if saree is in wishlist
    async checkWishlist(req, res) {
        try {
            const userId = req.session.userId;
            const sareeId = parseInt(req.params.sareeId);

            const [existing] = await pool.execute(
                'SELECT id FROM wishlist WHERE user_id = ? AND saree_id = ?',
                [userId, sareeId]
            );

            res.json({ success: true, inWishlist: existing.length > 0 });
        } catch (error) {
            console.error('Check wishlist error:', error);
            res.status(500).json({ success: false, message: 'Failed to check wishlist' });
        }
    }
};

module.exports = WishlistController;
