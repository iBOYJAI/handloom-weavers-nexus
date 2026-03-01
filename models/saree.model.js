const pool = require('../config/db');
const VariantModel = require('./variant.model');

const SareeModel = {
    // Create a new saree
    async create(sareeData) {
        const { weaverId, categoryId, title, description, price, stock, blouseColors } = sareeData;
        const blouseColorsJson = blouseColors && Array.isArray(blouseColors) ? JSON.stringify(blouseColors) : null;
        const [result] = await pool.query(
            `INSERT INTO sarees (weaver_id, category_id, title, description, price, stock, blouse_colors, is_active, is_approved) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)`,
            [weaverId, categoryId, title, description, price, stock, blouseColorsJson]
        );
        const sareeId = result.insertId;

        // Create approval record
        const ApprovalModel = require('./approval.model');
        await ApprovalModel.createSareeApproval(sareeId);

        return sareeId;
    },

    // Find saree by ID with images and weaver info
    async findById(id, includeVariants = false) {
        const [rows] = await pool.query(
            `SELECT s.*, 
                    u.name as weaver_name, u.region as weaver_region, u.avatar as weaver_avatar,
                    c.name as category_name, c.slug as category_slug
             FROM sarees s
             LEFT JOIN users u ON s.weaver_id = u.id
             LEFT JOIN saree_categories c ON s.category_id = c.id
             WHERE s.id = ?`,
            [id]
        );

        const saree = rows[0] || null;

        if (saree && saree.blouse_colors) {
            try {
                saree.blouse_colors = JSON.parse(saree.blouse_colors);
            } catch (e) {
                saree.blouse_colors = [];
            }
        } else if (saree) {
            saree.blouse_colors = [];
        }

        if (saree && includeVariants) {
            saree.variants = await VariantModel.findBySareeId(id, true);
        }

        return saree;
    },

    // Get all sarees with filters
    // FIX: Replaced correlated subquery (SELECT ... LIMIT 1) with LEFT JOIN for MariaDB 10.4 compatibility.
    // Correlated subqueries with LIMIT inside SELECT clause cause MariaDB optimizer to return 0 rows
    // even when data exists.
    async findAll(filters = {}) {
        try {
            let query = `
                SELECT s.*,
                       u.name AS weaver_name, u.region AS weaver_region,
                       c.name AS category_name, c.slug AS category_slug,
                       si.file_path AS primary_image
                FROM sarees s
                LEFT JOIN users u ON s.weaver_id = u.id
                LEFT JOIN saree_categories c ON s.category_id = c.id
                LEFT JOIN saree_images si ON si.saree_id = s.id AND si.is_primary = 1
                WHERE s.is_active = 1`;

            const values = [];

            if (filters.approvedOnly !== false) {
                query += ' AND s.is_approved = 1';
            }
            if (filters.categoryId) {
                query += ' AND s.category_id = ?';
                values.push(filters.categoryId);
            }
            if (filters.weaverId) {
                query += ' AND s.weaver_id = ?';
                values.push(filters.weaverId);
            }
            if (filters.minPrice) {
                query += ' AND s.price >= ?';
                values.push(filters.minPrice);
            }
            if (filters.maxPrice) {
                query += ' AND s.price <= ?';
                values.push(filters.maxPrice);
            }
            if (filters.region) {
                query += ' AND u.region = ?';
                values.push(filters.region);
            }
            if (filters.inStock !== undefined && filters.inStock !== null) {
                query += filters.inStock ? ' AND s.stock > 0' : ' AND s.stock = 0';
            }

            // GROUP BY to prevent duplicate rows when multiple images exist
            query += ' GROUP BY s.id ORDER BY s.created_at DESC';

            const limit = Math.max(0, parseInt(filters.limit, 10) || 0);
            const offset = Math.max(0, parseInt(filters.offset, 10) || 0);
            if (limit > 0) {
                query += ` LIMIT ${limit}`;
                if (offset > 0) query += ` OFFSET ${offset}`;
            }

            const [rows] = await pool.query(query, values);

            return rows.map(row => {
                if (row.primary_image) {
                    row.primary_image = row.primary_image.replace(/\\/g, '/').replace(/^public\//, '');
                    if (!row.primary_image.startsWith('http')) {
                        row.primary_image = '/' + row.primary_image.replace(/^\/+/, '');
                    }
                }
                return row;
            });
        } catch (err) {
            console.error('SareeModel.findAll ERROR:', err.message, err.sqlMessage || '');
            throw err;
        }
    },

    // Search sarees
    async search(searchTerm, filters = {}) {
        try {
            let query = `
                SELECT s.*,
                       u.name AS weaver_name, u.region AS weaver_region,
                       c.name AS category_name, c.slug AS category_slug,
                       si.file_path AS primary_image
                FROM sarees s
                LEFT JOIN users u ON s.weaver_id = u.id
                LEFT JOIN saree_categories c ON s.category_id = c.id
                LEFT JOIN saree_images si ON si.saree_id = s.id AND si.is_primary = 1
                WHERE s.is_active = 1`;

            if (filters.approvedOnly !== false) {
                query += ' AND s.is_approved = 1';
            }

            const values = [];

            if (searchTerm) {
                query += ` AND (s.title LIKE ? OR s.description LIKE ?)`;
                values.push(`%${searchTerm}%`, `%${searchTerm}%`);
            }

            if (filters.categoryId) {
                query += ' AND s.category_id = ?';
                values.push(filters.categoryId);
            }
            if (filters.minPrice) {
                query += ' AND s.price >= ?';
                values.push(filters.minPrice);
            }
            if (filters.maxPrice) {
                query += ' AND s.price <= ?';
                values.push(filters.maxPrice);
            }

            query += ' GROUP BY s.id ORDER BY s.created_at DESC';

            const [rows] = await pool.query(query, values);

            return rows.map(row => {
                if (row.primary_image) {
                    row.primary_image = row.primary_image.replace(/\\/g, '/').replace(/^public\//, '');
                    if (!row.primary_image.startsWith('http')) {
                        row.primary_image = '/' + row.primary_image.replace(/^\/+/, '');
                    }
                }
                return row;
            });
        } catch (err) {
            console.error('SareeModel.search ERROR:', err.message, err.sqlMessage || '');
            throw err;
        }
    },

    // Update saree
    async update(id, updateData) {
        const { title, description, price, stock, categoryId, isActive, blouseColors } = updateData;
        const updates = [];
        const values = [];

        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (price !== undefined) { updates.push('price = ?'); values.push(price); }
        if (stock !== undefined) { updates.push('stock = ?'); values.push(stock); }
        if (categoryId !== undefined) { updates.push('category_id = ?'); values.push(categoryId); }
        if (isActive !== undefined) { updates.push('is_active = ?'); values.push(isActive); }
        if (blouseColors !== undefined) {
            updates.push('blouse_colors = ?');
            values.push(blouseColors && Array.isArray(blouseColors) ? JSON.stringify(blouseColors) : null);
        }

        if (updates.length === 0) return null;

        values.push(id);
        const [result] = await pool.query(
            `UPDATE sarees SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        return result.affectedRows > 0;
    },

    // Delete saree
    async delete(id) {
        const [result] = await pool.query('DELETE FROM sarees WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },

    // Get sarees by weaver
    async getByWeaver(weaverId) {
        const [rows] = await pool.query(
            `SELECT s.*,
                    c.name AS category_name, c.slug AS category_slug,
                    si.file_path AS primary_image
             FROM sarees s
             LEFT JOIN saree_categories c ON s.category_id = c.id
             LEFT JOIN saree_images si ON si.saree_id = s.id AND si.is_primary = 1
             WHERE s.weaver_id = ?
             GROUP BY s.id
             ORDER BY s.created_at DESC`,
            [weaverId]
        );
        return rows.map(row => {
            if (row.primary_image) {
                row.primary_image = row.primary_image.replace(/\\/g, '/').replace(/^public\//, '');
                if (!row.primary_image.startsWith('http')) {
                    row.primary_image = '/' + row.primary_image.replace(/^\/+/, '');
                }
            }
            return row;
        });
    },

    // Get sarees by category
    async getByCategory(categoryId, limit = 20, approvedOnly = true) {
        let query = `
            SELECT s.*,
                   u.name AS weaver_name, u.region AS weaver_region,
                   si.file_path AS primary_image
            FROM sarees s
            LEFT JOIN users u ON s.weaver_id = u.id
            LEFT JOIN saree_images si ON si.saree_id = s.id AND si.is_primary = 1
            WHERE s.category_id = ? AND s.is_active = 1`;

        if (approvedOnly) {
            query += ' AND s.is_approved = 1';
        }

        query += ` GROUP BY s.id ORDER BY s.created_at DESC LIMIT ${parseInt(limit, 10) || 20}`;

        const [rows] = await pool.query(query, [categoryId]);
        return rows.map(row => {
            if (row.primary_image) {
                row.primary_image = row.primary_image.replace(/\\/g, '/').replace(/^public\//, '');
                if (!row.primary_image.startsWith('http')) {
                    row.primary_image = '/' + row.primary_image.replace(/^\/+/, '');
                }
            }
            return row;
        });
    },

    // Get saree images
    async getImages(sareeId) {
        const [rows] = await pool.query(
            'SELECT * FROM saree_images WHERE saree_id = ? ORDER BY is_primary DESC, id ASC',
            [sareeId]
        );
        return rows.map(row => {
            if (row.file_path) {
                row.file_path = row.file_path.replace(/\\/g, '/').replace(/^public\//, '');
                if (!row.file_path.startsWith('/') && !row.file_path.startsWith('http')) {
                    row.file_path = '/' + row.file_path;
                }
            }
            return row;
        });
    },

    // Add saree image
    async addImage(sareeId, filePath, isPrimary = false) {
        if (isPrimary) {
            await pool.query('UPDATE saree_images SET is_primary = 0 WHERE saree_id = ?', [sareeId]);
        }
        const [result] = await pool.query(
            'INSERT INTO saree_images (saree_id, file_path, is_primary) VALUES (?, ?, ?)',
            [sareeId, filePath, isPrimary ? 1 : 0]
        );
        return result.insertId;
    },

    // Delete saree image
    async deleteImage(imageId) {
        const [result] = await pool.query('DELETE FROM saree_images WHERE id = ?', [imageId]);
        return result.affectedRows > 0;
    },

    // Get total saree count
    async getTotalCount(approvedOnly = false) {
        let query = 'SELECT COUNT(*) as count FROM sarees WHERE is_active = 1';
        if (approvedOnly) query += ' AND is_approved = 1';
        const [rows] = await pool.query(query);
        return rows[0].count;
    },

    // Get variants for saree
    async getVariants(sareeId) {
        return await VariantModel.findBySareeId(sareeId, true);
    }
};

module.exports = SareeModel;