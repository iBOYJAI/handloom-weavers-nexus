const pool = require('../config/db');
const VariantModel = require('./variant.model');

const SareeModel = {
    // Create a new saree
    async create(sareeData) {
        const { weaverId, categoryId, title, description, price, stock, blouseColors } = sareeData;
        const blouseColorsJson = blouseColors && Array.isArray(blouseColors) ? JSON.stringify(blouseColors) : null;
        const [result] = await pool.execute(
            `INSERT INTO sarees (weaver_id, category_id, title, description, price, stock, blouse_colors, is_active, is_approved) 
             VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, FALSE)`,
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
        const [rows] = await pool.execute(
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

        // Parse blouse_colors JSON if present
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
    async findAll(filters = {}) {
        let query = `SELECT s.*, 
                            u.name as weaver_name, u.region as weaver_region,
                            c.name as category_name, c.slug as category_slug,
                            (SELECT file_path FROM saree_images WHERE saree_id = s.id AND is_primary = TRUE LIMIT 1) as primary_image
                     FROM sarees s
                     LEFT JOIN users u ON s.weaver_id = u.id
                     LEFT JOIN saree_categories c ON s.category_id = c.id
                     WHERE s.is_active = TRUE`;
        const values = [];

        if (filters.approvedOnly !== false) {
            query += ' AND s.is_approved = TRUE';
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
        if (filters.inStock !== undefined) {
            if (filters.inStock) {
                query += ' AND s.stock > 0';
            } else {
                query += ' AND s.stock = 0';
            }
        }

        query += ' ORDER BY s.created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            values.push(filters.limit);
            if (filters.offset) {
                query += ' OFFSET ?';
                values.push(filters.offset);
            }
        }

        const [rows] = await pool.execute(query, values);
        return rows.map(row => {
            if (row.primary_image) {
                row.primary_image = row.primary_image.replace(/\\/g, '/');
            }
            return row;
        });
    },

    // Search sarees
    async search(searchTerm, filters = {}) {
        let query = `SELECT s.*, 
                            u.name as weaver_name, u.region as weaver_region,
                            c.name as category_name, c.slug as category_slug,
                            (SELECT file_path FROM saree_images WHERE saree_id = s.id AND is_primary = TRUE LIMIT 1) as primary_image
                     FROM sarees s
                     LEFT JOIN users u ON s.weaver_id = u.id
                     LEFT JOIN saree_categories c ON s.category_id = c.id
                     WHERE s.is_active = TRUE`;

        if (filters.approvedOnly !== false) {
            query += ' AND s.is_approved = TRUE';
        }

        query += ` AND (MATCH(s.title, s.description) AGAINST(? IN NATURAL LANGUAGE MODE) 
                          OR s.title LIKE ? OR s.description LIKE ?)`;
        const values = [`${searchTerm}`, `%${searchTerm}%`, `%${searchTerm}%`];

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

        const [rows] = await pool.execute(query, values);
        return rows.map(row => {
            if (row.primary_image) {
                row.primary_image = row.primary_image.replace(/\\/g, '/');
            }
            return row;
        });
    },

    // Update saree
    async update(id, updateData) {
        const { title, description, price, stock, categoryId, isActive, blouseColors } = updateData;
        const updates = [];
        const values = [];

        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (price !== undefined) {
            updates.push('price = ?');
            values.push(price);
        }
        if (stock !== undefined) {
            updates.push('stock = ?');
            values.push(stock);
        }
        if (categoryId !== undefined) {
            updates.push('category_id = ?');
            values.push(categoryId);
        }
        if (isActive !== undefined) {
            updates.push('is_active = ?');
            values.push(isActive);
        }
        if (blouseColors !== undefined) {
            updates.push('blouse_colors = ?');
            const blouseColorsJson = blouseColors && Array.isArray(blouseColors) ? JSON.stringify(blouseColors) : null;
            values.push(blouseColorsJson);
        }

        if (updates.length === 0) return null;

        values.push(id);
        const [result] = await pool.execute(
            `UPDATE sarees SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        return result.affectedRows > 0;
    },

    // Delete saree
    async delete(id) {
        const [result] = await pool.execute(
            'DELETE FROM sarees WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    },

    // Get sarees by weaver
    async getByWeaver(weaverId) {
        const [rows] = await pool.execute(
            `SELECT s.*, c.name as category_name, c.slug as category_slug,
                    (SELECT file_path FROM saree_images WHERE saree_id = s.id AND is_primary = TRUE LIMIT 1) as primary_image
             FROM sarees s
             LEFT JOIN saree_categories c ON s.category_id = c.id
             WHERE s.weaver_id = ?
             ORDER BY s.created_at DESC`,
            [weaverId]
        );
        return rows.map(row => {
            if (row.primary_image) {
                row.primary_image = row.primary_image.replace(/\\/g, '/');
            }
            return row;
        });
    },

    // Get sarees by category
    async getByCategory(categoryId, limit = 20, approvedOnly = true) {
        let query = `SELECT s.*, 
                    u.name as weaver_name, u.region as weaver_region,
                    (SELECT file_path FROM saree_images WHERE saree_id = s.id AND is_primary = TRUE LIMIT 1) as primary_image
             FROM sarees s
             LEFT JOIN users u ON s.weaver_id = u.id
             WHERE s.category_id = ? AND s.is_active = TRUE`;

        if (approvedOnly) {
            query += ' AND s.is_approved = TRUE';
        }

        query += ` ORDER BY s.created_at DESC LIMIT ?`;

        const [rows] = await pool.execute(query, [categoryId, limit]);
        return rows.map(row => {
            if (row.primary_image) {
                row.primary_image = row.primary_image.replace(/\\/g, '/');
            }
            return row;
        });
    },

    // Get saree images
    async getImages(sareeId) {
        const [rows] = await pool.execute(
            'SELECT * FROM saree_images WHERE saree_id = ? ORDER BY is_primary DESC, id ASC',
            [sareeId]
        );
        return rows.map(row => {
            if (row.file_path) {
                row.file_path = row.file_path.replace(/\\/g, '/');
            }
            return row;
        });
    },

    // Add saree image
    async addImage(sareeId, filePath, isPrimary = false) {
        if (isPrimary) {
            await pool.execute(
                'UPDATE saree_images SET is_primary = FALSE WHERE saree_id = ?',
                [sareeId]
            );
        }
        const [result] = await pool.execute(
            'INSERT INTO saree_images (saree_id, file_path, is_primary) VALUES (?, ?, ?)',
            [sareeId, filePath, isPrimary]
        );
        return result.insertId;
    },

    // Delete saree image
    async deleteImage(imageId) {
        const [result] = await pool.execute(
            'DELETE FROM saree_images WHERE id = ?',
            [imageId]
        );
        return result.affectedRows > 0;
    },

    // Get total saree count
    async getTotalCount(approvedOnly = false) {
        let query = 'SELECT COUNT(*) as count FROM sarees WHERE is_active = TRUE';
        if (approvedOnly) {
            query += ' AND is_approved = TRUE';
        }
        const [rows] = await pool.execute(query);
        return rows[0].count;
    },

    // Get variants for saree
    async getVariants(sareeId) {
        return await VariantModel.findBySareeId(sareeId, true);
    }
};

module.exports = SareeModel;
