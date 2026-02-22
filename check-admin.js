// Quick diagnostic script to check admin user and session setup
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAdmin() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'handloom_nexus'
        });

        console.log('🔍 Checking admin user...\n');

        // Check admin user
        const [users] = await connection.execute(
            "SELECT id, name, email, role, is_approved FROM users WHERE role = 'admin' OR email LIKE '%admin%'"
        );

        if (users.length === 0) {
            console.log('❌ No admin user found!');
            console.log('   Run: npm run setup-db to create admin user');
        } else {
            console.log('✅ Admin users found:');
            users.forEach(user => {
                console.log(`   - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Approved: ${user.is_approved}`);
            });
        }

        console.log('\n🔍 Checking sessions table...\n');

        // Check if sessions table exists
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'sessions'"
        );

        if (tables.length === 0) {
            console.log('❌ Sessions table does not exist!');
            console.log('   The express-mysql-session package should create it automatically.');
            console.log('   Try restarting the server - it will create the table on first use.');
        } else {
            console.log('✅ Sessions table exists');

            // Check session count
            const [sessions] = await connection.execute(
                "SELECT COUNT(*) as count FROM sessions"
            );
            console.log(`   Active sessions: ${sessions[0].count}`);
        }

        console.log('\n📋 Quick Fix Commands:\n');
        console.log('If admin role is wrong, run this SQL:');
        console.log("   UPDATE users SET role = 'admin', is_approved = TRUE WHERE email = 'admin@nexus.com';\n");

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Check your .env file - DB_PASSWORD might be wrong');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\n💡 Database does not exist. Run: npm run setup-db');
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkAdmin();

