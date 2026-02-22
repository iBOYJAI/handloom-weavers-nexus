/**
 * One-time script: confirm saree approval state and set is_approved = 1 for active sarees.
 * Run from project root: node scripts/approve-sarees.js
 * Use this when buyer-home shows "No products" because GET /api/sarees returns 0 (approvedOnly: true).
 */
require('dotenv').config();
const pool = require('../config/db');

async function run() {
    try {
        // 1. Confirm what's in the database
        const [rows] = await pool.execute(
            `SELECT is_approved, is_active, COUNT(*) AS cnt FROM sarees GROUP BY is_approved, is_active`
        );
        console.log('Sarees by is_approved, is_active:', rows);

        const total = rows.reduce((sum, r) => sum + Number(r.cnt), 0);
        if (total === 0) {
            console.log('No sarees in database. Run schema seed first (e.g. scripts/setup-db.js or database/schema.sql).');
            process.exit(0);
            return;
        }

        // 2. Set is_approved = 1 for all active sarees
        const [result] = await pool.execute(
            'UPDATE sarees SET is_approved = 1 WHERE is_active = 1'
        );
        const affected = result.affectedRows ?? 0;
        console.log('Updated is_approved = 1 for active sarees. Rows affected:', affected);

        // 3. Show state after update
        const [after] = await pool.execute(
            `SELECT is_approved, is_active, COUNT(*) AS cnt FROM sarees GROUP BY is_approved, is_active`
        );
        console.log('Sarees after update:', after);
        console.log('Done. Restart the server and reload buyer-home to see products.');
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
