const pool = require('./config/db');
const bcrypt = require('bcryptjs');

async function fixPasswords() {
    try {
        console.log('Starting password restoration...');

        // Admin
        const adminHash = await bcrypt.hash('Admin@123', 10);
        await pool.execute("UPDATE users SET password_hash = ?, is_suspended = 0, role = 'admin' WHERE email = 'admin@nexus.com'", [adminHash]);
        console.log('Admin password restored to Admin@123');

        // Others
        const demoHash = await bcrypt.hash('Demo@123', 10);
        await pool.execute("UPDATE users SET password_hash = ? WHERE email LIKE '%@demo.com'", [demoHash]);
        console.log('Demo account passwords restored to Demo@123');

        process.exit(0);
    } catch (err) {
        console.error('Restoration failed:', err);
        process.exit(1);
    }
}

fixPasswords();
