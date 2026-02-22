// Saree Variant Model
const pool = require('../config/db');

const VariantModel = {
    // Create variant
    async create(variantData) {
        const {
            sareeId,
            colorName,
            colorCode,
            designName,
            designDescription,
            imagePath,
            stock,
            priceAdjustment,
            isActive = true
        } = variantData;

        const [result] = await pool.execute(
            `INSERT INTO saree_variants 
            (saree_id, color_name, color_code, design_name, design_description, image_path, stock, price_adjustment, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [sareeId, colorName, colorCode, designName, designDescription || null, imagePath, stock || 0, priceAdjustment || 0, isActive]
        );

        return result.insertId;
    },

    // Get variant by ID
    async findById(variantId) {
        const [rows] = await pool.execute(
            `SELECT * FROM saree_variants WHERE id = ?`,
            [variantId]
        );
        return rows[0] || null;
    },

    // Get all variants for a saree
    async findBySareeId(sareeId, activeOnly = false) {
        let query = `SELECT * FROM saree_variants WHERE saree_id = ?`;
        const params = [sareeId];

        if (activeOnly) {
            query += ` AND is_active = TRUE`;
        }

        query += ` ORDER BY color_name, design_name`;

        const [rows] = await pool.execute(query, params);
        return rows;
    },

    // Update variant
    async update(variantId, updateData) {
        const fields = [];
        const values = [];

        if (updateData.colorName !== undefined) {
            fields.push('color_name = ?');
            values.push(updateData.colorName);
        }
        if (updateData.colorCode !== undefined) {
            fields.push('color_code = ?');
            values.push(updateData.colorCode);
        }
        if (updateData.designName !== undefined) {
            fields.push('design_name = ?');
            values.push(updateData.designName);
        }
        if (updateData.designDescription !== undefined) {
            fields.push('design_description = ?');
            values.push(updateData.designDescription);
        }
        if (updateData.imagePath !== undefined) {
            fields.push('image_path = ?');
            values.push(updateData.imagePath);
        }
        if (updateData.stock !== undefined) {
            fields.push('stock = ?');
            values.push(updateData.stock);
        }
        if (updateData.priceAdjustment !== undefined) {
            fields.push('price_adjustment = ?');
            values.push(updateData.priceAdjustment);
        }
        if (updateData.isActive !== undefined) {
            fields.push('is_active = ?');
            values.push(updateData.isActive);
        }

        if (fields.length === 0) {
            return false;
        }

        values.push(variantId);

        const [result] = await pool.execute(
            `UPDATE saree_variants SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows > 0;
    },

    // Delete variant
    async delete(variantId) {
        const [result] = await pool.execute(
            `DELETE FROM saree_variants WHERE id = ?`,
            [variantId]
        );
        return result.affectedRows > 0;
    },

    // Get available colors for a saree
    async getAvailableColors(sareeId) {
        const [rows] = await pool.execute(
            `SELECT DISTINCT color_name, color_code 
            FROM saree_variants 
            WHERE saree_id = ? AND is_active = TRUE AND stock > 0
            ORDER BY color_name`,
            [sareeId]
        );
        return rows;
    },

    // Get available designs for a saree
    async getAvailableDesigns(sareeId) {
        const [rows] = await pool.execute(
            `SELECT DISTINCT design_name, design_description 
            FROM saree_variants 
            WHERE saree_id = ? AND is_active = TRUE AND stock > 0
            ORDER BY design_name`,
            [sareeId]
        );
        return rows;
    },

    // Get variant by saree, color, and design
    async findBySareeColorDesign(sareeId, colorName, designName) {
        const [rows] = await pool.execute(
            `SELECT * FROM saree_variants 
            WHERE saree_id = ? AND color_name = ? AND design_name = ? AND is_active = TRUE`,
            [sareeId, colorName, designName]
        );
        return rows[0] || null;
    }
};

module.exports = VariantModel;

