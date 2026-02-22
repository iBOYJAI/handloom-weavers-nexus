// Offer Model
const pool = require('../config/db');

const OfferModel = {
    // Create offer
    async create(offerData) {
        const {
            title,
            description,
            type,
            value,
            startDate,
            endDate,
            isActive = true,
            categoryId = null
        } = offerData;

        const [result] = await pool.execute(
            `INSERT INTO offers 
            (title, description, type, value, start_date, end_date, is_active, category_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description || null, type, value, startDate, endDate, isActive, categoryId]
        );

        return result.insertId;
    },

    // Get offer by ID
    async findById(offerId) {
        const [rows] = await pool.execute(
            `SELECT o.*, c.name as category_name 
            FROM offers o
            LEFT JOIN saree_categories c ON o.category_id = c.id
            WHERE o.id = ?`,
            [offerId]
        );
        return rows[0] || null;
    },

    // Get all offers
    async findAll(filters = {}) {
        let query = `SELECT o.*, c.name as category_name 
                    FROM offers o
                    LEFT JOIN saree_categories c ON o.category_id = c.id
                    WHERE 1=1`;
        const params = [];

        if (filters.activeOnly) {
            query += ` AND o.is_active = TRUE AND CURDATE() BETWEEN o.start_date AND o.end_date`;
        }

        if (filters.type) {
            query += ` AND o.type = ?`;
            params.push(filters.type);
        }

        if (filters.categoryId) {
            query += ` AND (o.category_id = ? OR o.category_id IS NULL)`;
            params.push(filters.categoryId);
        }

        query += ` ORDER BY o.start_date DESC, o.created_at DESC`;

        if (filters.limit) {
            query += ` LIMIT ?`;
            params.push(filters.limit);
        }

        const [rows] = await pool.execute(query, params);
        return rows;
    },

    // Get active offers (currently valid)
    async getActiveOffers(categoryId = null) {
        let query = `SELECT o.*, c.name as category_name 
                    FROM offers o
                    LEFT JOIN saree_categories c ON o.category_id = c.id
                    WHERE o.is_active = TRUE 
                    AND CURDATE() BETWEEN o.start_date AND o.end_date`;
        const params = [];

        if (categoryId) {
            query += ` AND (o.category_id = ? OR o.category_id IS NULL)`;
            params.push(categoryId);
        }

        query += ` ORDER BY o.value DESC, o.created_at DESC`;

        const [rows] = await pool.execute(query, params);
        return rows;
    },

    // Update offer
    async update(offerId, updateData) {
        const fields = [];
        const values = [];

        if (updateData.title !== undefined) {
            fields.push('title = ?');
            values.push(updateData.title);
        }
        if (updateData.description !== undefined) {
            fields.push('description = ?');
            values.push(updateData.description);
        }
        if (updateData.type !== undefined) {
            fields.push('type = ?');
            values.push(updateData.type);
        }
        if (updateData.value !== undefined) {
            fields.push('value = ?');
            values.push(updateData.value);
        }
        if (updateData.startDate !== undefined) {
            fields.push('start_date = ?');
            values.push(updateData.startDate);
        }
        if (updateData.endDate !== undefined) {
            fields.push('end_date = ?');
            values.push(updateData.endDate);
        }
        if (updateData.isActive !== undefined) {
            fields.push('is_active = ?');
            values.push(updateData.isActive);
        }
        if (updateData.categoryId !== undefined) {
            fields.push('category_id = ?');
            values.push(updateData.categoryId);
        }

        if (fields.length === 0) {
            return false;
        }

        values.push(offerId);

        const [result] = await pool.execute(
            `UPDATE offers SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    },

    // Delete offer
    async delete(offerId) {
        const [result] = await pool.execute(
            `DELETE FROM offers WHERE id = ?`,
            [offerId]
        );
        return result.affectedRows > 0;
    },

    // Get best offer for a saree (considering category)
    async getBestOfferForSaree(sareeId, categoryId) {
        const [rows] = await pool.execute(
            `SELECT o.* 
            FROM offers o
            WHERE o.is_active = TRUE 
            AND CURDATE() BETWEEN o.start_date AND o.end_date
            AND (o.category_id = ? OR o.category_id IS NULL)
            ORDER BY 
                CASE o.type
                    WHEN 'percentage' THEN o.value
                    WHEN 'fixed' THEN o.value
                    ELSE 0
                END DESC
            LIMIT 1`,
            [categoryId]
        );
        return rows[0] || null;
    },

    // Calculate discount amount
    calculateDiscount(offer, originalPrice) {
        if (!offer) return 0;

        switch (offer.type) {
            case 'percentage':
                return (originalPrice * offer.value) / 100;
            case 'fixed':
                return Math.min(offer.value, originalPrice);
            case 'free_shipping':
                return 0; // Shipping cost handled separately
            case 'bogo':
                return originalPrice; // Buy one get one free
            default:
                return 0;
        }
    }
};

module.exports = OfferModel;

