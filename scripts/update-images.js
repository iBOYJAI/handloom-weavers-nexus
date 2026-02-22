const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const IMAGES_DIR = path.join(__dirname, '../public/assets/images/sarees');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'handloom_nexus',
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
});

async function updateImages() {
    try {
        const files = fs.readdirSync(IMAGES_DIR).filter(f => fs.statSync(path.join(IMAGES_DIR, f)).isFile());
        console.log(`Found ${files.length} files in ${IMAGES_DIR}`);

        let count = 1;
        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) continue;

            const oldPath = path.join(IMAGES_DIR, file);
            const newFileName = `saree_${String(count).padStart(3, '0')}${ext}`;
            const newPath = path.join(IMAGES_DIR, newFileName);

            const oldDbPath = `public/assets/images/sarees/${file}`;
            const newDbPath = `public/assets/images/sarees/${newFileName}`;

            // Check if file is already named correctly to avoid infinite loop or duplicate count
            if (file === newFileName) {
                console.log(`Skipping already correct name: ${file}`);
                count++;
                continue;
            }

            console.log(`Renaming: ${file} -> ${newFileName}`);

            // Update database first to be safe
            const [result] = await pool.execute(
                'UPDATE saree_images SET file_path = ? WHERE file_path = ?',
                [newDbPath, oldDbPath]
            );

            const [resultStories] = await pool.execute(
                'UPDATE weaver_stories SET media_path = ? WHERE media_path = ?',
                [newDbPath, oldDbPath]
            );

            // Handle media_paths array in weaver_stories
            const [stories] = await pool.execute('SELECT id, media_paths FROM weaver_stories WHERE media_paths LIKE ?', [`%${oldDbPath}%`]);
            for (const story of stories) {
                let paths = JSON.parse(story.media_paths);
                paths = paths.map(p => p === oldDbPath ? newDbPath : p);
                await pool.execute('UPDATE weaver_stories SET media_paths = ? WHERE id = ?', [JSON.stringify(paths), story.id]);
            }

            console.log(`DB updated: ${result.affectedRows} images, ${resultStories.affectedRows} stories`);

            // Rename file
            fs.renameSync(oldPath, newPath);

            count++;
        }

        console.log('Successfully updated all images and database records.');
    } catch (error) {
        console.error('Error updating images:', error);
    } finally {
        await pool.end();
    }
}

updateImages();
