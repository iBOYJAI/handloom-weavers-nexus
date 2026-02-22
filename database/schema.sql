-- Handloom Weavers Nexus Database Schema
-- MySQL 8.0+

-- Create database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS handloom_nexus;
-- USE handloom_nexus;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('buyer', 'weaver', 'admin') NOT NULL DEFAULT 'buyer',
    region VARCHAR(100),
    phone VARCHAR(20),
    avatar VARCHAR(500),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saree categories table
CREATE TABLE IF NOT EXISTS saree_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sarees table
CREATE TABLE IF NOT EXISTS sarees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    weaver_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (weaver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES saree_categories(id) ON DELETE RESTRICT,
    INDEX idx_weaver_id (weaver_id),
    INDEX idx_category_id (category_id),
    INDEX idx_is_active (is_active),
    INDEX idx_is_approved (is_approved),
    FULLTEXT idx_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saree images table
CREATE TABLE IF NOT EXISTS saree_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    saree_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (saree_id) REFERENCES sarees(id) ON DELETE CASCADE,
    INDEX idx_saree_id (saree_id),
    INDEX idx_is_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount > 0),
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(10) NOT NULL DEFAULT 'COD',
    address TEXT NOT NULL,
    offer_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_offer_id (offer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    saree_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10, 2) NOT NULL CHECK (price_at_purchase > 0),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (saree_id) REFERENCES sarees(id) ON DELETE RESTRICT,
    INDEX idx_order_id (order_id),
    INDEX idx_saree_id (saree_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    saree_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (saree_id) REFERENCES sarees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_saree (user_id, saree_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Weaver stories table
CREATE TABLE IF NOT EXISTS weaver_stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    weaver_id INT NOT NULL,
    title VARCHAR(255),
    caption VARCHAR(500) NOT NULL,
    description TEXT,
    media_path VARCHAR(500) NOT NULL,
    media_type ENUM('image', 'video') NOT NULL,
    media_paths TEXT,
    media_types TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (weaver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_weaver_id (weaver_id),
    INDEX idx_is_approved (is_approved),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    saree_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (saree_id) REFERENCES sarees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_buyer_saree (buyer_id, saree_id),
    INDEX idx_saree_id (saree_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wishlist table
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


-- Saree variants table
CREATE TABLE IF NOT EXISTS saree_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    saree_id INT NOT NULL,
    color_name VARCHAR(50) NOT NULL,
    color_code VARCHAR(7) NOT NULL,
    design_name VARCHAR(100) NOT NULL,
    design_description TEXT,
    image_path VARCHAR(500) NOT NULL,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    price_adjustment DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (saree_id) REFERENCES sarees(id) ON DELETE CASCADE,
    INDEX idx_saree_id (saree_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type ENUM('percentage', 'fixed', 'free_shipping', 'bogo') NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    category_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES saree_categories(id) ON DELETE SET NULL,
    INDEX idx_is_active (is_active),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_category_id (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order customizations table
CREATE TABLE IF NOT EXISTS order_customizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_item_id INT NOT NULL,
    blouse_color VARCHAR(50),
    custom_design_type ENUM('peacock', 'temple', 'name', 'other') NULL,
    custom_design_text VARCHAR(500),
    custom_design_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
    INDEX idx_order_item_id (order_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saree approvals table
CREATE TABLE IF NOT EXISTS saree_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    saree_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    admin_id INT NULL,
    rejection_reason TEXT,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (saree_id) REFERENCES sarees(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_saree_id (saree_id),
    INDEX idx_status (status),
    INDEX idx_admin_id (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Story approvals table
CREATE TABLE IF NOT EXISTS story_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    admin_id INT NULL,
    rejection_reason TEXT,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES weaver_stories(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_story_id (story_id),
    INDEX idx_status (status),
    INDEX idx_admin_id (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data: Saree categories
INSERT INTO saree_categories (name, slug) VALUES
('Kanchipuram Silk', 'kanchipuram-silk'),
('Banarasi', 'banarasi'),
('Tussar Silk', 'tussar-silk'),
('Chettinadu Cotton', 'chettinadu-cotton'),
('Half Sarees', 'half-sarees'),
('Tissue Sarees', 'tissue-sarees')
ON DUPLICATE KEY UPDATE name=name;

-- Seed data: Default admin user
-- Password: Admin@123
INSERT INTO users (name, email, password_hash, role, is_approved) VALUES
('Admin User', 'admin@nexus.com', '$2a$10$VPkzcIzuk3.srSee7nLeMOYUw2VDyIex1p73QwIPcsrKBI3HTQS3q', 'admin', TRUE)
ON DUPLICATE KEY UPDATE email=email;

-- Demo Users (Password for all: Demo@123)
-- Buyer Demo Users
INSERT INTO users (name, email, password_hash, role, region, phone, is_approved) VALUES
('Demo Buyer 1', 'buyer1@demo.com', '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'buyer', 'Tamil Nadu', '9876543210', TRUE),
('Demo Buyer 2', 'buyer2@demo.com', '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'buyer', 'Karnataka', '9876543211', TRUE),
('Demo Buyer 3', 'buyer3@demo.com', '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'buyer', 'West Bengal', '9876543212', TRUE)
ON DUPLICATE KEY UPDATE email=email;

-- Weaver Demo Users (Approved)
INSERT INTO users (name, email, password_hash, role, region, phone, is_approved) VALUES
('Demo Weaver 1', 'weaver1@demo.com', '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'weaver', 'Tamil Nadu', '9876543220', TRUE),
('Demo Weaver 2', 'weaver2@demo.com', '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'weaver', 'Uttar Pradesh', '9876543221', TRUE),
('Demo Weaver 3', 'weaver3@demo.com', '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'weaver', 'West Bengal', '9876543222', TRUE)
ON DUPLICATE KEY UPDATE email=email;

-- Note: All demo users password is 'Demo@123'
-- Admin password is 'Admin@123'

-- Add foreign key for offer_id in orders table (after offers table is created)
ALTER TABLE orders ADD CONSTRAINT fk_orders_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL;

-- Seed Data: Sample Sarees (5-10 per category, 48 total)
-- Note: Image paths will be generated by download-sample-images.js script
-- Weaver IDs: 4=weaver1, 5=weaver2, 6=weaver3

-- Kanchipuram Silk Sarees (8 sarees)
INSERT INTO sarees (weaver_id, category_id, title, description, price, stock, is_active, is_approved) VALUES
(4, 1, 'Traditional Kanchipuram Silk Saree - Red', 'Exquisite handwoven Kanchipuram silk saree with intricate zari work. Perfect for weddings and special occasions.', 15000.00, 5, TRUE, TRUE),
(4, 1, 'Premium Kanchipuram Silk - Gold Border', 'Luxurious Kanchipuram silk with rich gold borders and traditional motifs. Heritage craftsmanship.', 18000.00, 3, TRUE, TRUE),
(5, 1, 'Designer Kanchipuram Silk Saree', 'Modern design Kanchipuram silk with contemporary patterns. Blends tradition with style.', 12000.00, 8, TRUE, TRUE),
(5, 1, 'Classic Kanchipuram - Maroon', 'Classic maroon Kanchipuram silk with traditional temple borders. Timeless elegance.', 16000.00, 4, TRUE, TRUE),
(6, 1, 'Heavy Kanchipuram Silk Saree', 'Heavy weight Kanchipuram silk with extensive zari work. Grand appearance.', 22000.00, 2, TRUE, TRUE),
(6, 1, 'Lightweight Kanchipuram Silk', 'Lightweight Kanchipuram silk perfect for daily wear. Comfortable yet elegant.', 8000.00, 10, TRUE, TRUE),
(4, 1, 'Bridal Kanchipuram Silk Saree', 'Special bridal collection Kanchipuram silk with elaborate designs. Made for special moments.', 25000.00, 1, TRUE, TRUE),
(5, 1, 'Festival Kanchipuram Silk', 'Vibrant Kanchipuram silk perfect for festivals. Bright colors and traditional patterns.', 14000.00, 6, TRUE, TRUE)
ON DUPLICATE KEY UPDATE title=title;

-- Banarasi Sarees (8 sarees)
INSERT INTO sarees (weaver_id, category_id, title, description, price, stock, is_active, is_approved) VALUES
(4, 2, 'Authentic Banarasi Silk Saree', 'Pure Banarasi silk with intricate brocade work. Traditional Varanasi craftsmanship.', 20000.00, 4, TRUE, TRUE),
(5, 2, 'Banarasi Silk - Red & Gold', 'Stunning red Banarasi silk with gold zari patterns. Rich and luxurious.', 18000.00, 5, TRUE, TRUE),
(6, 2, 'Designer Banarasi Saree', 'Contemporary Banarasi design with modern color combinations. Unique style.', 15000.00, 7, TRUE, TRUE),
(4, 2, 'Heavy Banarasi Silk Saree', 'Heavy weight Banarasi silk with extensive brocade. Grand appearance.', 25000.00, 2, TRUE, TRUE),
(5, 2, 'Light Banarasi Silk', 'Lightweight Banarasi silk for comfortable wear. Elegant and graceful.', 12000.00, 9, TRUE, TRUE),
(6, 2, 'Banarasi Silk - Green', 'Beautiful green Banarasi silk with traditional motifs. Perfect for occasions.', 17000.00, 6, TRUE, TRUE),
(4, 2, 'Bridal Banarasi Collection', 'Exclusive bridal Banarasi silk with elaborate designs. Made for weddings.', 30000.00, 1, TRUE, TRUE),
(5, 2, 'Festival Banarasi Silk', 'Vibrant Banarasi silk for festive occasions. Bright and beautiful.', 16000.00, 8, TRUE, TRUE)
ON DUPLICATE KEY UPDATE title=title;

-- Tussar Silk Sarees (8 sarees)
INSERT INTO sarees (weaver_id, category_id, title, description, price, stock, is_active, is_approved) VALUES
(6, 3, 'Pure Tussar Silk Saree', 'Natural Tussar silk with organic texture. Eco-friendly and elegant.', 10000.00, 10, TRUE, TRUE),
(4, 3, 'Tussar Silk - Printed', 'Printed Tussar silk with beautiful patterns. Comfortable and stylish.', 8500.00, 12, TRUE, TRUE),
(5, 3, 'Designer Tussar Silk', 'Contemporary Tussar silk design. Modern and trendy.', 9500.00, 8, TRUE, TRUE),
(6, 3, 'Tussar Silk - Embroidered', 'Embroidered Tussar silk with handwork. Delicate and beautiful.', 11000.00, 7, TRUE, TRUE),
(4, 3, 'Tussar Silk - Traditional', 'Traditional Tussar silk with classic patterns. Timeless appeal.', 9000.00, 9, TRUE, TRUE),
(5, 3, 'Light Tussar Silk Saree', 'Lightweight Tussar silk for daily wear. Comfortable and elegant.', 7500.00, 15, TRUE, TRUE),
(6, 3, 'Tussar Silk - Party Wear', 'Party wear Tussar silk with modern designs. Perfect for events.', 12000.00, 5, TRUE, TRUE),
(4, 3, 'Tussar Silk - Office Wear', 'Professional Tussar silk suitable for office. Elegant and formal.', 8000.00, 11, TRUE, TRUE)
ON DUPLICATE KEY UPDATE title=title;

-- Chettinadu Cotton Sarees (8 sarees)
INSERT INTO sarees (weaver_id, category_id, title, description, price, stock, is_active, is_approved) VALUES
(5, 4, 'Traditional Chettinadu Cotton', 'Authentic Chettinadu cotton with traditional checks. Comfortable and classic.', 3500.00, 20, TRUE, TRUE),
(6, 4, 'Chettinadu Cotton - Modern', 'Modern Chettinadu cotton with contemporary patterns. Stylish and comfortable.', 4000.00, 18, TRUE, TRUE),
(4, 4, 'Chettinadu Cotton - Daily Wear', 'Perfect for daily wear. Soft cotton with traditional designs.', 3000.00, 25, TRUE, TRUE),
(5, 4, 'Designer Chettinadu Cotton', 'Designer Chettinadu cotton with unique patterns. Modern twist on tradition.', 4500.00, 15, TRUE, TRUE),
(6, 4, 'Chettinadu Cotton - Festive', 'Festive Chettinadu cotton with bright colors. Perfect for celebrations.', 3800.00, 22, TRUE, TRUE),
(4, 4, 'Light Chettinadu Cotton', 'Lightweight Chettinadu cotton. Comfortable for all seasons.', 3200.00, 20, TRUE, TRUE),
(5, 4, 'Chettinadu Cotton - Office', 'Professional Chettinadu cotton for office wear. Elegant and comfortable.', 4200.00, 16, TRUE, TRUE),
(6, 4, 'Classic Chettinadu Cotton', 'Classic Chettinadu cotton with traditional checks. Timeless style.', 3600.00, 19, TRUE, TRUE)
ON DUPLICATE KEY UPDATE title=title;

-- Half Sarees (8 sarees)
INSERT INTO sarees (weaver_id, category_id, title, description, price, stock, is_active, is_approved) VALUES
(4, 5, 'Traditional Half Saree Set', 'Complete half saree set with blouse and petticoat. Traditional design.', 6000.00, 12, TRUE, TRUE),
(5, 5, 'Designer Half Saree', 'Modern half saree with contemporary designs. Perfect for young women.', 5500.00, 14, TRUE, TRUE),
(6, 5, 'Festival Half Saree', 'Vibrant half saree for festivals. Bright colors and patterns.', 5800.00, 13, TRUE, TRUE),
(4, 5, 'Party Half Saree Set', 'Elegant half saree for parties. Stylish and comfortable.', 6500.00, 10, TRUE, TRUE),
(5, 5, 'Traditional Half Saree - Silk', 'Silk half saree with traditional motifs. Luxurious and elegant.', 8000.00, 8, TRUE, TRUE),
(6, 5, 'Cotton Half Saree', 'Cotton half saree for daily wear. Comfortable and practical.', 4500.00, 16, TRUE, TRUE),
(4, 5, 'Bridal Half Saree Set', 'Special bridal half saree collection. Elaborate designs.', 12000.00, 3, TRUE, TRUE),
(5, 5, 'Casual Half Saree', 'Casual half saree for everyday occasions. Simple and elegant.', 5000.00, 15, TRUE, TRUE)
ON DUPLICATE KEY UPDATE title=title;

-- Tissue Sarees (8 sarees)
INSERT INTO sarees (weaver_id, category_id, title, description, price, stock, is_active, is_approved) VALUES
(6, 6, 'Premium Tissue Saree', 'High quality tissue saree with shimmer effect. Elegant and graceful.', 7000.00, 11, TRUE, TRUE),
(4, 6, 'Tissue Saree - Party Wear', 'Party wear tissue saree with modern designs. Perfect for events.', 7500.00, 9, TRUE, TRUE),
(5, 6, 'Designer Tissue Saree', 'Designer tissue saree with unique patterns. Contemporary style.', 7200.00, 10, TRUE, TRUE),
(6, 6, 'Traditional Tissue Saree', 'Traditional tissue saree with classic designs. Timeless elegance.', 6800.00, 12, TRUE, TRUE),
(4, 6, 'Tissue Saree - Festive', 'Festive tissue saree with bright colors. Perfect for celebrations.', 7100.00, 10, TRUE, TRUE),
(5, 6, 'Light Tissue Saree', 'Lightweight tissue saree for comfortable wear. Elegant and airy.', 6500.00, 13, TRUE, TRUE),
(6, 6, 'Bridal Tissue Saree', 'Special bridal tissue saree with elaborate work. Made for special moments.', 10000.00, 4, TRUE, TRUE),
(4, 6, 'Office Tissue Saree', 'Professional tissue saree for office. Formal and elegant.', 6900.00, 11, TRUE, TRUE)
ON DUPLICATE KEY UPDATE title=title;

-- Seed Data: Sample Offers (Festival and Season offers)
INSERT INTO offers (title, description, type, value, start_date, end_date, is_active, category_id) VALUES
('Diwali Festival Offer', 'Special Diwali discount on all sarees. Celebrate with style!', 'percentage', 20.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), TRUE, NULL),
('Pongal Special', 'Pongal festival special offer on traditional sarees.', 'percentage', 15.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 15 DAY), TRUE, NULL),
('Summer Sale', 'Summer season sale - cool and comfortable sarees at discounted prices.', 'percentage', 25.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 60 DAY), TRUE, NULL),
('Winter Collection', 'Winter special offer on warm and cozy sarees.', 'fixed', 1000.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90 DAY), TRUE, NULL),
('Free Shipping', 'Free shipping on all orders above ₹5000. Shop now!', 'free_shipping', 0.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 365 DAY), TRUE, NULL),
('Kanchipuram Special', 'Special offer on Kanchipuram silk sarees. Limited time!', 'percentage', 18.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 20 DAY), TRUE, 1),
('Banarasi Discount', 'Exclusive discount on Banarasi silk collection.', 'percentage', 22.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 25 DAY), TRUE, 2),
('Buy One Get One', 'Buy one saree, get one free on selected items!', 'bogo', 0.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 10 DAY), TRUE, NULL),
('New Year Sale', 'Start the new year with amazing discounts! Up to 30% off on all sarees.', 'percentage', 30.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 45 DAY), TRUE, NULL),
('Holi Special', 'Colorful Holi celebration offer! Special discounts on vibrant sarees.', 'percentage', 20.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 20 DAY), TRUE, NULL),
('Eid Mubarak Offer', 'Eid special offer on elegant and premium sarees.', 'percentage', 15.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 25 DAY), TRUE, NULL),
('Onam Festival', 'Onam special offer on traditional Kerala sarees.', 'percentage', 18.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), TRUE, NULL),
('Dussehra Celebration', 'Dussehra special discounts on all traditional sarees.', 'percentage', 22.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 20 DAY), TRUE, NULL),
('Tussar Silk Special', 'Exclusive offer on Tussar silk sarees. Natural and elegant!', 'percentage', 20.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), TRUE, 3),
('Cotton Comfort', 'Special offer on Chettinadu cotton sarees. Perfect for daily wear!', 'percentage', 15.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 40 DAY), TRUE, 4),
('Half Saree Collection', 'Special discount on half sarees. Traditional and modern styles!', 'percentage', 18.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 25 DAY), TRUE, 5),
('Tissue Saree Offer', 'Elegant tissue sarees at discounted prices. Light and beautiful!', 'percentage', 20.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), TRUE, 6),
('Monsoon Sale', 'Monsoon special - Stay dry and stylish with our premium collection!', 'percentage', 25.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 60 DAY), TRUE, NULL),
('Wedding Season', 'Wedding season special offer! Perfect sarees for your special day.', 'fixed', 2000.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90 DAY), TRUE, NULL),
('Grandmother Special', 'Special offer on traditional sarees. Celebrate timeless elegance!', 'percentage', 15.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 50 DAY), TRUE, NULL)
ON DUPLICATE KEY UPDATE title=title;

-- Seed Data: Saree Images (Primary + secondary images using local assets)
-- All 29 local images: saree_001.jpeg through saree_029.jpg
INSERT INTO saree_images (saree_id, file_path, is_primary) VALUES
-- Kanchipuram Silk (saree IDs 1-8)
(1, 'assets/images/sarees/saree_001.jpeg', TRUE),
(2, 'assets/images/sarees/saree_002.jpg', TRUE),
(3, 'assets/images/sarees/saree_003.jpg', TRUE),
(4, 'assets/images/sarees/saree_004.jpg', TRUE),
(5, 'assets/images/sarees/saree_005.jpg', TRUE),
(6, 'assets/images/sarees/saree_006.jpg', TRUE),
(7, 'assets/images/sarees/saree_007.jpg', TRUE),
(8, 'assets/images/sarees/saree_008.jpg', TRUE),
-- Banarasi (saree IDs 9-16)
(9, 'assets/images/sarees/saree_009.jpg', TRUE),
(10, 'assets/images/sarees/saree_010.jpg', TRUE),
(11, 'assets/images/sarees/saree_011.avif', TRUE),
(12, 'assets/images/sarees/saree_012.jpg', TRUE),
(13, 'assets/images/sarees/saree_013.jpg', TRUE),
(14, 'assets/images/sarees/saree_014.jpg', TRUE),
(15, 'assets/images/sarees/saree_015.jpeg', TRUE),
(16, 'assets/images/sarees/saree_016.jpeg', TRUE),
-- Tussar Silk (saree IDs 17-24)
(17, 'assets/images/sarees/saree_017.jpeg', TRUE),
(18, 'assets/images/sarees/saree_018.jpeg', TRUE),
(19, 'assets/images/sarees/saree_019.jpeg', TRUE),
(20, 'assets/images/sarees/saree_020.jpeg', TRUE),
(21, 'assets/images/sarees/saree_021.jpeg', TRUE),
(22, 'assets/images/sarees/saree_022.jpeg', TRUE),
(23, 'assets/images/sarees/saree_023.jpeg', TRUE),
(24, 'assets/images/sarees/saree_024.jpeg', TRUE),
-- Chettinadu Cotton (saree IDs 25-32)
(25, 'assets/images/sarees/saree_025.jpeg', TRUE),
(26, 'assets/images/sarees/saree_026.jpeg', TRUE),
(27, 'assets/images/sarees/saree_027.jpeg', TRUE),
(28, 'assets/images/sarees/saree_028.jpeg', TRUE),
(29, 'assets/images/sarees/saree_029.jpg', TRUE),
(30, 'assets/images/sarees/saree_001.jpeg', TRUE),
(31, 'assets/images/sarees/saree_002.jpg', TRUE),
(32, 'assets/images/sarees/saree_003.jpg', TRUE),
-- Half Sarees (saree IDs 33-40)
(33, 'assets/images/sarees/saree_004.jpg', TRUE),
(34, 'assets/images/sarees/saree_005.jpg', TRUE),
(35, 'assets/images/sarees/saree_006.jpg', TRUE),
(36, 'assets/images/sarees/saree_007.jpg', TRUE),
(37, 'assets/images/sarees/saree_008.jpg', TRUE),
(38, 'assets/images/sarees/saree_009.jpg', TRUE),
(39, 'assets/images/sarees/saree_010.jpg', TRUE),
(40, 'assets/images/sarees/saree_011.avif', TRUE),
-- Tissue Sarees (saree IDs 41-48)
(41, 'assets/images/sarees/saree_012.jpg', TRUE),
(42, 'assets/images/sarees/saree_013.jpg', TRUE),
(43, 'assets/images/sarees/saree_014.jpg', TRUE),
(44, 'assets/images/sarees/saree_015.jpeg', TRUE),
(45, 'assets/images/sarees/saree_016.jpeg', TRUE),
(46, 'assets/images/sarees/saree_017.jpeg', TRUE),
(47, 'assets/images/sarees/saree_018.jpeg', TRUE),
(48, 'assets/images/sarees/saree_019.jpeg', TRUE),
-- Secondary images for variety
(1, 'assets/images/sarees/saree_020.jpeg', FALSE),
(9, 'assets/images/sarees/saree_021.jpeg', FALSE),
(17, 'assets/images/sarees/saree_022.jpeg', FALSE),
(25, 'assets/images/sarees/saree_023.jpeg', FALSE)
ON DUPLICATE KEY UPDATE file_path=VALUES(file_path);

-- Seed Data: Saree Variants (2-4 variants per saree with different colors and designs)
-- Color variants: Red, Blue, Green, Gold, Maroon, Pink, Purple, Orange
-- Design variants: Traditional, Modern, Embroidered, Printed, Zari Work
INSERT INTO saree_variants (saree_id, color_name, color_code, design_name, design_description, image_path, stock, price_adjustment, is_active) VALUES
-- Saree 1 variants
(1, 'Red', '#C0392B', 'Traditional', 'Classic traditional design with zari work', '/uploads/sarees/saree-kanchipuram-silk-1-variant-1-red.jpg', 2, 0.00, TRUE),
(1, 'Maroon', '#800000', 'Modern', 'Modern twist on traditional design', '/uploads/sarees/saree-kanchipuram-silk-1-variant-2-maroon.jpg', 3, 500.00, TRUE),
(1, 'Gold', '#FFD700', 'Embroidered', 'Heavy embroidery with gold thread', '/uploads/sarees/saree-kanchipuram-silk-1-variant-3-gold.jpg', 0, 2000.00, TRUE),
-- Saree 2 variants
(2, 'Blue', '#0000FF', 'Traditional', 'Traditional blue with gold borders', '/uploads/sarees/saree-kanchipuram-silk-2-variant-1-blue.jpg', 1, 0.00, TRUE),
(2, 'Green', '#008000', 'Zari Work', 'Extensive zari work in green', '/uploads/sarees/saree-kanchipuram-silk-2-variant-2-green.jpg', 2, 1000.00, TRUE),
-- Saree 3 variants (sample - adding for first few, will add more)
(3, 'Pink', '#FFC0CB', 'Modern', 'Modern pink design', '/uploads/sarees/saree-kanchipuram-silk-3-variant-1-pink.jpg', 4, 0.00, TRUE),
(3, 'Purple', '#800080', 'Printed', 'Printed purple variant', '/uploads/sarees/saree-kanchipuram-silk-3-variant-2-purple.jpg', 4, -500.00, TRUE),
(3, 'Orange', '#FFA500', 'Embroidered', 'Orange with embroidery', '/uploads/sarees/saree-kanchipuram-silk-3-variant-3-orange.jpg', 0, 800.00, TRUE)
ON DUPLICATE KEY UPDATE color_name=color_name;

-- Note: More variants will be added for remaining sarees in production
-- For now, adding sample variants for demonstration
-- In production, run a script to generate variants for all 48 sarees
