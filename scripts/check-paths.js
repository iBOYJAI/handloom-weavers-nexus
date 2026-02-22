const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'handloom_nexus',
    waitForConnections: true,
    connectionLimit: 1
});

async function checkPaths() {
    try {
        const [rows] = await pool.execute('SELECT file_path FROM saree_images LIMIT 10');
        console.log('Sample saree_images paths:');
        rows.forEach(r => console.log(r.file_path));

        const [rowsStories] = await pool.execute('SELECT media_path, media_paths FROM weaver_stories LIMIT 5');
        console.log('\nSample weaver_stories paths:');
        rowsStories.forEach(r => {
            console.log(`media_path: ${r.media_path}`);
            console.log(`media_paths: ${r.media_paths}`);
        });
    } catch (error) {
        console.error('Error checking paths:', error);
    } finally {
        await pool.end();
    }
}

checkPaths();
