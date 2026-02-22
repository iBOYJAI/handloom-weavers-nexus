// Approval Model for Sarees and Stories
const pool = require('../config/db');

const ApprovalModel = {
    // Create saree approval record
    async createSareeApproval(sareeId, adminId = null) {
        const [result] = await pool.execute(
            `INSERT INTO saree_approvals (saree_id, status, admin_id)
            VALUES (?, 'pending', ?)`,
            [sareeId, adminId]
        );
        return result.insertId;
    },

    // Create story approval record
    async createStoryApproval(storyId, adminId = null) {
        const [result] = await pool.execute(
            `INSERT INTO story_approvals (story_id, status, admin_id)
            VALUES (?, 'pending', ?)`,
            [storyId, adminId]
        );
        return result.insertId;
    },

    // Approve saree
    async approveSaree(sareeId, adminId, rejectionReason = null) {
        // Update approval record
        const [approvalResult] = await pool.execute(
            `UPDATE saree_approvals 
            SET status = 'approved', admin_id = ?, reviewed_at = NOW()
            WHERE saree_id = ?`,
            [adminId, sareeId]
        );

        // Update saree approval status
        const [sareeResult] = await pool.execute(
            `UPDATE sarees SET is_approved = TRUE WHERE id = ?`,
            [sareeId]
        );

        return sareeResult.affectedRows > 0;
    },

    // Reject saree
    async rejectSaree(sareeId, adminId, rejectionReason) {
        // Update approval record
        const [approvalResult] = await pool.execute(
            `UPDATE saree_approvals 
            SET status = 'rejected', admin_id = ?, rejection_reason = ?, reviewed_at = NOW()
            WHERE saree_id = ?`,
            [adminId, rejectionReason, sareeId]
        );

        // Update saree approval status
        const [sareeResult] = await pool.execute(
            `UPDATE sarees SET is_approved = FALSE WHERE id = ?`,
            [sareeId]
        );

        return sareeResult.affectedRows > 0;
    },

    // Approve story
    async approveStory(storyId, adminId, rejectionReason = null) {
        // Update approval record
        const [approvalResult] = await pool.execute(
            `UPDATE story_approvals 
            SET status = 'approved', admin_id = ?, reviewed_at = NOW()
            WHERE story_id = ?`,
            [adminId, storyId]
        );

        // Update story approval status
        const [storyResult] = await pool.execute(
            `UPDATE weaver_stories SET is_approved = TRUE WHERE id = ?`,
            [storyId]
        );

        return storyResult.affectedRows > 0;
    },

    // Reject story
    async rejectStory(storyId, adminId, rejectionReason) {
        // Update approval record
        const [approvalResult] = await pool.execute(
            `UPDATE story_approvals 
            SET status = 'rejected', admin_id = ?, rejection_reason = ?, reviewed_at = NOW()
            WHERE story_id = ?`,
            [adminId, rejectionReason, storyId]
        );

        // Update story approval status
        const [storyResult] = await pool.execute(
            `UPDATE weaver_stories SET is_approved = FALSE WHERE id = ?`,
            [storyId]
        );

        return storyResult.affectedRows > 0;
    },

    // Get pending sarees
    async getPendingSarees() {
        const [rows] = await pool.execute(
            `SELECT s.*, u.name as weaver_name, c.name as category_name,
                    sa.id as approval_id, sa.created_at as approval_created_at,
                    (SELECT file_path FROM saree_images WHERE saree_id = s.id AND is_primary = TRUE LIMIT 1) as primary_image
            FROM sarees s
            LEFT JOIN users u ON s.weaver_id = u.id
            LEFT JOIN saree_categories c ON s.category_id = c.id
            LEFT JOIN saree_approvals sa ON s.id = sa.saree_id
            WHERE s.is_approved = FALSE
            ORDER BY s.created_at DESC`
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

    // Get pending stories
    async getPendingStories() {
        const [rows] = await pool.execute(
            `SELECT ws.*, u.name as weaver_name,
                    sta.id as approval_id, sta.created_at as approval_created_at
            FROM weaver_stories ws
            LEFT JOIN users u ON ws.weaver_id = u.id
            LEFT JOIN story_approvals sta ON ws.id = sta.story_id
            WHERE ws.is_approved = FALSE
            ORDER BY ws.created_at DESC`
        );
        return rows.map(row => {
            if (row.media_path) {
                row.media_path = row.media_path.replace(/\\/g, '/');
                if (!row.media_path.startsWith('/') && !row.media_path.startsWith('http')) {
                    row.media_path = '/' + row.media_path;
                }
            }
            if (row.media_paths) {
                try {
                    let paths = JSON.parse(row.media_paths);
                    paths = paths.map(p => {
                        p = p.replace(/\\/g, '/');
                        return (!p.startsWith('/') && !p.startsWith('http')) ? '/' + p : p;
                    });
                    row.media_paths = JSON.stringify(paths);
                } catch (e) { }
            }
            return row;
        });
    },

    // Get approval history for saree
    async getSareeApprovalHistory(sareeId) {
        const [rows] = await pool.execute(
            `SELECT sa.*, u.name as admin_name
            FROM saree_approvals sa
            LEFT JOIN users u ON sa.admin_id = u.id
            WHERE sa.saree_id = ?
            ORDER BY sa.created_at DESC`,
            [sareeId]
        );
        return rows;
    },

    // Get approval history for story
    async getStoryApprovalHistory(storyId) {
        const [rows] = await pool.execute(
            `SELECT sta.*, u.name as admin_name
            FROM story_approvals sta
            LEFT JOIN users u ON sta.admin_id = u.id
            WHERE sta.story_id = ?
            ORDER BY sta.created_at DESC`,
            [storyId]
        );
        return rows;
    },

    // Bulk approve sarees
    async bulkApproveSarees(sareeIds, adminId) {
        if (!Array.isArray(sareeIds) || sareeIds.length === 0) {
            return false;
        }

        const placeholders = sareeIds.map(() => '?').join(',');

        // Update approval records
        await pool.execute(
            `UPDATE saree_approvals 
            SET status = 'approved', admin_id = ?, reviewed_at = NOW()
            WHERE saree_id IN (${placeholders})`,
            [adminId, ...sareeIds]
        );

        // Update sarees
        const [result] = await pool.execute(
            `UPDATE sarees SET is_approved = TRUE WHERE id IN (${placeholders})`,
            sareeIds
        );

        return result.affectedRows;
    },

    // Bulk reject sarees
    async bulkRejectSarees(sareeIds, adminId, rejectionReason) {
        if (!Array.isArray(sareeIds) || sareeIds.length === 0) {
            return false;
        }

        const placeholders = sareeIds.map(() => '?').join(',');

        // Update approval records
        await pool.execute(
            `UPDATE saree_approvals 
            SET status = 'rejected', admin_id = ?, rejection_reason = ?, reviewed_at = NOW()
            WHERE saree_id IN (${placeholders})`,
            [adminId, rejectionReason, ...sareeIds]
        );

        // Update sarees
        const [result] = await pool.execute(
            `UPDATE sarees SET is_approved = FALSE WHERE id IN (${placeholders})`,
            sareeIds
        );

        return result.affectedRows;
    }
};

module.exports = ApprovalModel;

