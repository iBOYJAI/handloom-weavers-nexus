const pool = require('./config/db');
async function findAdmin() {
    try {
        const [rows] = await pool.execute("SELECT email FROM users WHERE role = 'admin' LIMIT 1");
        if (rows.length > 0) {
            console.log('ADMIN_EMAIL:' + rows[0].email);
        } else {
            console.log('NO_ADMIN_FOUND');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
findAdmin();
