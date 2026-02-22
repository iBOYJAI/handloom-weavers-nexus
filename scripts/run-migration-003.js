/**
 * Run migration 003: Fix images paths + add wishlist table
 * node scripts/run-migration-003.js
 */
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('Running migration 003: Fix images + wishlist table...');
    try {
        // Create wishlist table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS wishlist (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                saree_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (saree_id) REFERENCES sarees(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_saree_wishlist (user_id, saree_id),
                INDEX idx_user_id (user_id),
                INDEX idx_saree_id_wl (saree_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Wishlist table created/verified');

        // Delete old images
        await pool.execute('DELETE FROM saree_images');
        console.log('✅ Cleared old image records');

        // Define all 29 local images
        const images = [
            '/assets/images/sarees/saree_001.jpeg',
            '/assets/images/sarees/saree_002.jpg',
            '/assets/images/sarees/saree_003.jpg',
            '/assets/images/sarees/saree_004.jpg',
            '/assets/images/sarees/saree_005.jpg',
            '/assets/images/sarees/saree_006.jpg',
            '/assets/images/sarees/saree_007.jpg',
            '/assets/images/sarees/saree_008.jpg',
            '/assets/images/sarees/saree_009.jpg',
            '/assets/images/sarees/saree_010.jpg',
            '/assets/images/sarees/saree_011.avif',
            '/assets/images/sarees/saree_012.jpg',
            '/assets/images/sarees/saree_013.jpg',
            '/assets/images/sarees/saree_014.jpg',
            '/assets/images/sarees/saree_015.jpeg',
            '/assets/images/sarees/saree_016.jpeg',
            '/assets/images/sarees/saree_017.jpeg',
            '/assets/images/sarees/saree_018.jpeg',
            '/assets/images/sarees/saree_019.jpeg',
            '/assets/images/sarees/saree_020.jpeg',
            '/assets/images/sarees/saree_021.jpeg',
            '/assets/images/sarees/saree_022.jpeg',
            '/assets/images/sarees/saree_023.jpeg',
            '/assets/images/sarees/saree_024.jpeg',
            '/assets/images/sarees/saree_025.jpeg',
            '/assets/images/sarees/saree_026.jpeg',
            '/assets/images/sarees/saree_027.jpeg',
            '/assets/images/sarees/saree_028.jpeg',
            '/assets/images/sarees/saree_029.jpg',
        ];

        // Assign primary images to sarees 1-48 (cycling through 29 images)
        const primaryInserts = [];
        for (let sareeId = 1; sareeId <= 48; sareeId++) {
            const img = images[(sareeId - 1) % images.length];
            primaryInserts.push([sareeId, img, true]);
        }
        for (const [sareeId, path, isPrimary] of primaryInserts) {
            await pool.execute(
                'INSERT INTO saree_images (saree_id, file_path, is_primary) VALUES (?, ?, ?)',
                [sareeId, path, isPrimary]
            );
        }
        console.log(`✅ Inserted ${primaryInserts.length} primary images`);

        // Add secondary images for sarees 1-29 (second angle)
        const secondaryOffset = 5; // offset by 5 for variety
        for (let sareeId = 1; sareeId <= 29; sareeId++) {
            const img = images[(sareeId - 1 + secondaryOffset) % images.length];
            await pool.execute(
                'INSERT INTO saree_images (saree_id, file_path, is_primary) VALUES (?, ?, FALSE)',
                [sareeId, img]
            );
        }
        console.log('✅ Inserted secondary images');

        console.log('\n✅ Migration 003 completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

runMigration();
