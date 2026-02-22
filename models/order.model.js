const pool = require('../config/db');

const OrderModel = {
    // Create a new order
    async create(orderData) {
        const { buyerId, totalAmount, address, paymentMethod = 'COD', offerId = null } = orderData;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Create order
            const [orderResult] = await connection.execute(
                `INSERT INTO orders (buyer_id, total_amount, status, payment_method, address, offer_id) 
                 VALUES (?, ?, 'pending', ?, ?, ?)`,
                [buyerId, totalAmount, paymentMethod, address, offerId]
            );
            const orderId = orderResult.insertId;

            await connection.commit();
            return orderId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Create order items with customizations
    async createItems(orderId, items) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            for (const item of items) {
                // Insert order item
                const [itemResult] = await connection.execute(
                    `INSERT INTO order_items (order_id, saree_id, quantity, price_at_purchase) 
                     VALUES (?, ?, ?, ?)`,
                    [orderId, item.sareeId, item.quantity, item.price]
                );
                const orderItemId = itemResult.insertId;

                // Insert customization if provided
                if (item.customization) {
                    const { blouseColor, customDesignType, customDesignText, customDesignImage } = item.customization;
                    if (blouseColor || customDesignType || customDesignText || customDesignImage) {
                        await connection.execute(
                            `INSERT INTO order_customizations 
                            (order_item_id, blouse_color, custom_design_type, custom_design_text, custom_design_image)
                            VALUES (?, ?, ?, ?, ?)`,
                            [orderItemId, blouseColor || null, customDesignType || null, customDesignText || null, customDesignImage || null]
                        );
                    }
                }
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Find order by ID with items
    async findById(id) {
        const [rows] = await pool.execute(
            `SELECT o.*, 
                    u.name as buyer_name, u.email as buyer_email, u.phone as buyer_phone,
                    off.title as offer_title, off.type as offer_type, off.value as offer_value
             FROM orders o
             LEFT JOIN users u ON o.buyer_id = u.id
             LEFT JOIN offers off ON o.offer_id = off.id
             WHERE o.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    // Get order items with customizations
    async getItems(orderId) {
        const [rows] = await pool.execute(
            `SELECT oi.*, 
                    s.title as saree_title, s.description as saree_description,
                    (SELECT file_path FROM saree_images WHERE saree_id = s.id AND is_primary = TRUE LIMIT 1) as saree_image
             FROM order_items oi
             LEFT JOIN sarees s ON oi.saree_id = s.id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        // Normalize paths and get customizations for each item
        for (const item of rows) {
            if (item.saree_image) {
                item.saree_image = item.saree_image.replace(/\\/g, '/');
            }
            const [customizations] = await pool.execute(
                `SELECT * FROM order_customizations WHERE order_item_id = ?`,
                [item.id]
            );
            item.customization = customizations[0] || null;
        }

        return rows;
    },

    // Get orders by buyer
    async findByBuyer(buyerId, limit = 50) {
        const [rows] = await pool.execute(
            `SELECT o.*, 
                    COUNT(oi.id) as item_count
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.buyer_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC
             LIMIT ?`,
            [buyerId, limit]
        );
        return rows;
    },

    // Get orders by weaver (orders containing weaver's sarees)
    async findByWeaver(weaverId, limit = 50) {
        const [rows] = await pool.execute(
            `SELECT DISTINCT o.*, 
                    u.name as buyer_name, u.email as buyer_email,
                    COUNT(DISTINCT oi.id) as item_count
             FROM orders o
             INNER JOIN order_items oi ON o.id = oi.order_id
             INNER JOIN sarees s ON oi.saree_id = s.id
             LEFT JOIN users u ON o.buyer_id = u.id
             WHERE s.weaver_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC
             LIMIT ?`,
            [weaverId, limit]
        );
        return rows;
    },

    // Get all orders (for admin)
    async findAll(filters = {}) {
        let query = `SELECT o.*, 
                            u.name as buyer_name, u.email as buyer_email,
                            COUNT(DISTINCT oi.id) as item_count
                     FROM orders o
                     LEFT JOIN users u ON o.buyer_id = u.id
                     LEFT JOIN order_items oi ON o.id = oi.order_id
                     WHERE 1=1`;
        const values = [];

        if (filters.status) {
            query += ' AND o.status = ?';
            values.push(filters.status);
        }
        if (filters.buyerId) {
            query += ' AND o.buyer_id = ?';
            values.push(filters.buyerId);
        }

        query += ' GROUP BY o.id ORDER BY o.created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            values.push(filters.limit);
            if (filters.offset) {
                query += ' OFFSET ?';
                values.push(filters.offset);
            }
        }

        const [rows] = await pool.execute(query, values);
        return rows;
    },

    // Update order status
    async updateStatus(id, status) {
        const [result] = await pool.execute(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    },

    // Get order statistics for weaver
    async getWeaverStats(weaverId) {
        const [rows] = await pool.execute(
            `SELECT 
                COUNT(DISTINCT o.id) as total_orders,
                SUM(oi.quantity * oi.price_at_purchase) as total_earnings,
                COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) as pending_orders
             FROM orders o
             INNER JOIN order_items oi ON o.id = oi.order_id
             INNER JOIN sarees s ON oi.saree_id = s.id
             WHERE s.weaver_id = ? AND o.status != 'cancelled'`,
            [weaverId]
        );
        return rows[0];
    },

    // Get platform statistics (for admin)
    async getPlatformStats() {
        const [rows] = await pool.execute(
            `SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders
             FROM orders`
        );
        return rows[0];
    }
};

module.exports = OrderModel;

