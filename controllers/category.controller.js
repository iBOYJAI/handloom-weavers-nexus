const pool = require('../config/db');

const CategoryController = {
    // Get all categories (public route)
    async getCategories(req, res) {
        try {
            const [categories] = await pool.execute(
                `SELECT c.*, COUNT(s.id) as saree_count 
                 FROM saree_categories c 
                 LEFT JOIN sarees s ON c.id = s.category_id AND s.is_active = 1 AND s.is_approved = 1
                 GROUP BY c.id 
                 ORDER BY c.name ASC`
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
    }
};

module.exports = CategoryController;

