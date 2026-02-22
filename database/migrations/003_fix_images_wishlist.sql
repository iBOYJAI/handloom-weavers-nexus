-- Migration 003: Fix saree image paths to use local assets + add wishlist table
-- Run this against the live database to fix existing image records
-- Date: 2026-02-22

-- Step 1: Create wishlist table if it doesn't exist
CREATE TABLE IF NOT EXISTS wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    saree_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (saree_id) REFERENCES sarees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_saree_wishlist (user_id, saree_id),
    INDEX idx_user_id (user_id),
    INDEX idx_saree_id (saree_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Delete ALL existing saree_images records (they used wrong /uploads/sarees/ paths)
DELETE FROM saree_images;

-- Step 3: Reset auto increment
ALTER TABLE saree_images AUTO_INCREMENT = 1;

-- Step 4: Insert correct primary images (using actual /assets/images/sarees/ files)
INSERT INTO saree_images (saree_id, file_path, is_primary) VALUES
(1, '/assets/images/sarees/saree_001.jpeg', TRUE),
(2, '/assets/images/sarees/saree_002.jpg', TRUE),
(3, '/assets/images/sarees/saree_003.jpg', TRUE),
(4, '/assets/images/sarees/saree_004.jpg', TRUE),
(5, '/assets/images/sarees/saree_005.jpg', TRUE),
(6, '/assets/images/sarees/saree_006.jpg', TRUE),
(7, '/assets/images/sarees/saree_007.jpg', TRUE),
(8, '/assets/images/sarees/saree_008.jpg', TRUE),
(9, '/assets/images/sarees/saree_009.jpg', TRUE),
(10, '/assets/images/sarees/saree_010.jpg', TRUE),
(11, '/assets/images/sarees/saree_011.avif', TRUE),
(12, '/assets/images/sarees/saree_012.jpg', TRUE),
(13, '/assets/images/sarees/saree_013.jpg', TRUE),
(14, '/assets/images/sarees/saree_014.jpg', TRUE),
(15, '/assets/images/sarees/saree_015.jpeg', TRUE),
(16, '/assets/images/sarees/saree_016.jpeg', TRUE),
(17, '/assets/images/sarees/saree_017.jpeg', TRUE),
(18, '/assets/images/sarees/saree_018.jpeg', TRUE),
(19, '/assets/images/sarees/saree_019.jpeg', TRUE),
(20, '/assets/images/sarees/saree_020.jpeg', TRUE),
(21, '/assets/images/sarees/saree_021.jpeg', TRUE),
(22, '/assets/images/sarees/saree_022.jpeg', TRUE),
(23, '/assets/images/sarees/saree_023.jpeg', TRUE),
(24, '/assets/images/sarees/saree_024.jpeg', TRUE),
(25, '/assets/images/sarees/saree_025.jpeg', TRUE),
(26, '/assets/images/sarees/saree_026.jpeg', TRUE),
(27, '/assets/images/sarees/saree_027.jpeg', TRUE),
(28, '/assets/images/sarees/saree_028.jpeg', TRUE),
(29, '/assets/images/sarees/saree_029.jpg', TRUE),
(30, '/assets/images/sarees/saree_001.jpeg', TRUE),
(31, '/assets/images/sarees/saree_002.jpg', TRUE),
(32, '/assets/images/sarees/saree_003.jpg', TRUE),
(33, '/assets/images/sarees/saree_004.jpg', TRUE),
(34, '/assets/images/sarees/saree_005.jpg', TRUE),
(35, '/assets/images/sarees/saree_006.jpg', TRUE),
(36, '/assets/images/sarees/saree_007.jpg', TRUE),
(37, '/assets/images/sarees/saree_008.jpg', TRUE),
(38, '/assets/images/sarees/saree_009.jpg', TRUE),
(39, '/assets/images/sarees/saree_010.jpg', TRUE),
(40, '/assets/images/sarees/saree_011.avif', TRUE),
(41, '/assets/images/sarees/saree_012.jpg', TRUE),
(42, '/assets/images/sarees/saree_013.jpg', TRUE),
(43, '/assets/images/sarees/saree_014.jpg', TRUE),
(44, '/assets/images/sarees/saree_015.jpeg', TRUE),
(45, '/assets/images/sarees/saree_016.jpeg', TRUE),
(46, '/assets/images/sarees/saree_017.jpeg', TRUE),
(47, '/assets/images/sarees/saree_018.jpeg', TRUE),
(48, '/assets/images/sarees/saree_019.jpeg', TRUE);

-- Step 5: Add secondary images to maximize image usage
INSERT INTO saree_images (saree_id, file_path, is_primary) VALUES
(1, '/assets/images/sarees/saree_020.jpeg', FALSE),
(1, '/assets/images/sarees/saree_021.jpeg', FALSE),
(2, '/assets/images/sarees/saree_022.jpeg', FALSE),
(2, '/assets/images/sarees/saree_023.jpeg', FALSE),
(3, '/assets/images/sarees/saree_024.jpeg', FALSE),
(3, '/assets/images/sarees/saree_025.jpeg', FALSE),
(4, '/assets/images/sarees/saree_026.jpeg', FALSE),
(4, '/assets/images/sarees/saree_027.jpeg', FALSE),
(5, '/assets/images/sarees/saree_028.jpeg', FALSE),
(5, '/assets/images/sarees/saree_029.jpg', FALSE),
(6, '/assets/images/sarees/saree_001.jpeg', FALSE),
(7, '/assets/images/sarees/saree_002.jpg', FALSE),
(8, '/assets/images/sarees/saree_003.jpg', FALSE),
(9, '/assets/images/sarees/saree_004.jpg', FALSE),
(9, '/assets/images/sarees/saree_005.jpg', FALSE),
(10, '/assets/images/sarees/saree_006.jpg', FALSE),
(11, '/assets/images/sarees/saree_007.jpg', FALSE),
(12, '/assets/images/sarees/saree_008.jpg', FALSE),
(13, '/assets/images/sarees/saree_009.jpg', FALSE),
(14, '/assets/images/sarees/saree_010.jpg', FALSE),
(15, '/assets/images/sarees/saree_011.avif', FALSE),
(16, '/assets/images/sarees/saree_012.jpg', FALSE),
(17, '/assets/images/sarees/saree_013.jpg', FALSE),
(18, '/assets/images/sarees/saree_014.jpg', FALSE),
(19, '/assets/images/sarees/saree_015.jpeg', FALSE),
(20, '/assets/images/sarees/saree_016.jpeg', FALSE),
(21, '/assets/images/sarees/saree_017.jpeg', FALSE),
(22, '/assets/images/sarees/saree_018.jpeg', FALSE),
(23, '/assets/images/sarees/saree_019.jpeg', FALSE),
(24, '/assets/images/sarees/saree_020.jpeg', FALSE),
(25, '/assets/images/sarees/saree_021.jpeg', FALSE),
(26, '/assets/images/sarees/saree_022.jpeg', FALSE),
(27, '/assets/images/sarees/saree_023.jpeg', FALSE),
(28, '/assets/images/sarees/saree_024.jpeg', FALSE),
(29, '/assets/images/sarees/saree_025.jpeg', FALSE);

SELECT 'Migration 003 completed successfully' AS status;
