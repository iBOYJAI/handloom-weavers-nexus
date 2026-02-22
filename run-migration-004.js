const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'handloom_nexus',
        multipleStatements: true
    });

    try {
        const migrationPath = path.join(__dirname, 'database', 'migrations', '004_update_weaver_stories.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration 004...');
        await connection.query(sql);
        console.log('✅ Migration 004 completed successfully');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await connection.end();
    }
}

runMigration();
