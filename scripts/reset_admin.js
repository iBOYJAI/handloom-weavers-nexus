const pool = require('./config/db');
const bcrypt = require('bcryptjs');
async function resetAdmin() {
    try {
        const hash = await bcrypt.hash('pass123', 10);
        await pool.execute("UPDATE users SET password_hash = ?, is_suspended = 0, role = 'admin' WHERE email = 'admin@nexus.com'", [hash]);
        console.log('ADMIN_RESET_SUCCESS');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
resetAdmin();
