const pool = require('../config/db');

const UserModel = {
    // Create a new user
    async create(userData) {
        const { name, email, passwordHash, role, region, phone, avatar } = userData;
        const [result] = await pool.execute(
            `INSERT INTO users (name, email, password_hash, role, region, phone, avatar, is_approved) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email, passwordHash, role || 'buyer', region || null, phone || null, avatar || null, role === 'admin']
        );
        return result.insertId;
    },

    // Find user by email
    async findByEmail(email) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0] || null;
    },

    // Find user by ID
    async findById(id) {
        const [rows] = await pool.execute(
            'SELECT id, name, email, role, region, phone, avatar, address, is_approved, is_suspended, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    },

    // Find user by ID with password hash (for auth)
    async findByIdWithPassword(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    },

    // Update user
    async update(id, updateData) {
        const { name, region, phone, avatar, address } = updateData;
        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (region !== undefined) {
            updates.push('region = ?');
            values.push(region);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            values.push(phone);
        }
        if (avatar !== undefined) {
            updates.push('avatar = ?');
            values.push(avatar);
        }
        if (address !== undefined) {
            updates.push('address = ?');
            values.push(address);
        }

        if (updates.length === 0) return null;

        values.push(id);
        const [result] = await pool.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        return result.affectedRows > 0;
    },

    // Update weaver approval status
    async updateApproval(id, isApproved) {
        const [result] = await pool.execute(
            'UPDATE users SET is_approved = ? WHERE id = ?',
            [isApproved, id]
        );
        return result.affectedRows > 0;
    },

    // Set user suspended state (admin only)
    async setSuspended(id, suspended) {
        const [result] = await pool.execute(
            'UPDATE users SET is_suspended = ? WHERE id = ?',
            [suspended ? 1 : 0, id]
        );
        return result.affectedRows > 0;
    },

    // Get all users (for admin)
    async getAll(filters = {}) {
        let query = 'SELECT id, name, email, role, region, phone, avatar, is_approved, is_suspended, created_at FROM users WHERE 1=1';
        const values = [];

        if (filters.role) {
            query += ' AND role = ?';
            values.push(filters.role);
        }
        if (filters.search) {
            query += ' AND (name LIKE ? OR email LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            values.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY created_at DESC';

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

    // Get user count by role
    async getCountByRole(role) {
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM users WHERE role = ?',
            [role]
        );
        return rows[0].count;
    },

    // Get pending weaver approvals count
    async getPendingWeaversCount() {
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM users WHERE role = ? AND is_approved = FALSE',
            ['weaver']
        );
        return rows[0].count;
    }
};

module.exports = UserModel;

