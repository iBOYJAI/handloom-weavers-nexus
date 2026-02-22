-- ============================================================
-- Handloom Weavers Nexus — COMPLETE DATABASE SCHEMA + SEED
-- MariaDB 10.4 / MySQL 8.0 Compatible
-- Includes: Schema, Users, Categories, Sarees, Images,
--           Variants, Offers, Stories, Sessions tables
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- ============================================================
-- CREATE DATABASE
-- ============================================================
CREATE DATABASE IF NOT EXISTS handloom_nexus
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE handloom_nexus;

-- ============================================================
-- DROP TABLES (safe re-run order — children first)
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS order_customizations;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS saree_approvals;
DROP TABLE IF EXISTS story_approvals;
DROP TABLE IF EXISTS saree_variants;
DROP TABLE IF EXISTS saree_images;
DROP TABLE IF EXISTS sarees;
DROP TABLE IF EXISTS saree_categories;
DROP TABLE IF EXISTS weaver_stories;
DROP TABLE IF EXISTS wishlist;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS offers;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- TABLES
-- ============================================================

-- Users
CREATE TABLE users (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    email        VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role         ENUM('buyer','weaver','admin') NOT NULL DEFAULT 'buyer',
    region       VARCHAR(100),
    phone        VARCHAR(20),
    avatar       VARCHAR(500),
    address      TEXT,
    is_approved  TINYINT(1) DEFAULT 0,
    is_suspended TINYINT(1) DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email      (email),
    INDEX idx_role       (role),
    INDEX idx_is_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions (express-mysql-session)
CREATE TABLE sessions (
    session_id VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    expires    INT(11) UNSIGNED NOT NULL,
    data       MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    PRIMARY KEY (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saree Categories
CREATE TABLE saree_categories (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    slug       VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Offers
CREATE TABLE offers (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    type        ENUM('percentage','fixed','free_shipping','bogo') NOT NULL,
    value       DECIMAL(10,2) NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    is_active   TINYINT(1) DEFAULT 1,
    category_id INT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES saree_categories(id) ON DELETE SET NULL,
    INDEX idx_is_active  (is_active),
    INDEX idx_dates      (start_date, end_date),
    INDEX idx_category_id (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sarees
CREATE TABLE sarees (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    weaver_id   INT NOT NULL,
    category_id INT NOT NULL,
    title       VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price       DECIMAL(10,2) NOT NULL CHECK (price > 0),
    stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    blouse_colors JSON,
    is_active   TINYINT(1) DEFAULT 1,
    is_approved TINYINT(1) DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (weaver_id)   REFERENCES users(id)             ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES saree_categories(id)  ON DELETE RESTRICT,
    INDEX idx_weaver_id   (weaver_id),
    INDEX idx_category_id (category_id),
    INDEX idx_is_active   (is_active),
    INDEX idx_is_approved (is_approved),
    FULLTEXT idx_search   (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saree Images
CREATE TABLE saree_images (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    saree_id   INT NOT NULL,
    file_path  VARCHAR(500) NOT NULL,
    is_primary TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (saree_id) REFERENCES sarees(id) ON DELETE CASCADE,
    INDEX idx_saree_id  (saree_id),
    INDEX idx_is_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saree Variants
CREATE TABLE saree_variants (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    saree_id            INT NOT NULL,
    color_name          VARCHAR(50) NOT NULL,
    color_code          VARCHAR(7)  NOT NULL,
    design_name         VARCHAR(100) NOT NULL,
    design_description  TEXT,
    image_path          VARCHAR(500) NOT NULL,
    stock               INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    price_adjustment    DECIMAL(10,2) DEFAULT 0,
    is_active           TINYINT(1) DEFAULT 1,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (saree_id) REFERENCES sarees(id) ON DELETE CASCADE,
    INDEX idx_saree_id (saree_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saree Approvals
CREATE TABLE saree_approvals (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    saree_id         INT NOT NULL,
    status           ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    admin_id         INT NULL,
    rejection_reason TEXT,
    reviewed_at      TIMESTAMP NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (saree_id)  REFERENCES sarees(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id)  REFERENCES users(id)  ON DELETE SET NULL,
    INDEX idx_saree_id (saree_id),
    INDEX idx_status   (status),
    INDEX idx_admin_id (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders
CREATE TABLE orders (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id       INT NOT NULL,
    total_amount   DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    status         ENUM('pending','confirmed','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(10) NOT NULL DEFAULT 'COD',
    address        TEXT NOT NULL,
    offer_id       INT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id)  ON DELETE RESTRICT,
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL,
    INDEX idx_buyer_id   (buyer_id),
    INDEX idx_status     (status),
    INDEX idx_created_at (created_at),
    INDEX idx_offer_id   (offer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Items
CREATE TABLE order_items (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    order_id          INT NOT NULL,
    saree_id          INT NOT NULL,
    quantity          INT NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10,2) NOT NULL CHECK (price_at_purchase > 0),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (saree_id) REFERENCES sarees(id) ON DELETE RESTRICT,
    INDEX idx_order_id (order_id),
    INDEX idx_saree_id (saree_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Customizations
CREATE TABLE order_customizations (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    order_item_id       INT NOT NULL,
    blouse_color        VARCHAR(50),
    custom_design_type  ENUM('peacock','temple','name','other') NULL,
    custom_design_text  VARCHAR(500),
    custom_design_image VARCHAR(500),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
    INDEX idx_order_item_id (order_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cart Items
CREATE TABLE cart_items (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    saree_id   INT NOT NULL,
    quantity   INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (saree_id) REFERENCES sarees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_saree (user_id, saree_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Weaver Stories
CREATE TABLE weaver_stories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    weaver_id   INT NOT NULL,
    title       VARCHAR(255),
    caption     VARCHAR(500) NOT NULL,
    description TEXT,
    media_path  VARCHAR(500) NOT NULL,
    media_type  ENUM('image','video') NOT NULL,
    media_paths TEXT,
    media_types TEXT,
    is_approved TINYINT(1) DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (weaver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_weaver_id  (weaver_id),
    INDEX idx_is_approved (is_approved),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Story Approvals
CREATE TABLE story_approvals (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    story_id         INT NOT NULL,
    status           ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    admin_id         INT NULL,
    rejection_reason TEXT,
    reviewed_at      TIMESTAMP NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id)  REFERENCES weaver_stories(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id)  REFERENCES users(id)          ON DELETE SET NULL,
    INDEX idx_story_id (story_id),
    INDEX idx_status   (status),
    INDEX idx_admin_id (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications
CREATE TABLE notifications (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    message    TEXT NOT NULL,
    type       VARCHAR(50) NOT NULL,
    is_read    TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id    (user_id),
    INDEX idx_is_read    (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews
CREATE TABLE reviews (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id   INT NOT NULL,
    saree_id   INT NOT NULL,
    rating     INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment    TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (saree_id) REFERENCES sarees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_buyer_saree (buyer_id, saree_id),
    INDEX idx_saree_id (saree_id),
    INDEX idx_rating   (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wishlist
CREATE TABLE wishlist (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    saree_id   INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (saree_id) REFERENCES sarees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_saree_wishlist (user_id, saree_id),
    INDEX idx_user_id  (user_id),
    INDEX idx_saree_id (saree_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED: USERS
-- Passwords:
--   Admin  → Admin@123
--   Others → Demo@123
-- ============================================================

INSERT INTO users (name, email, password_hash, role, region, phone, is_approved) VALUES
-- Admin
('Selvanayaki G',      'admin@nexus.com',    '$2a$10$VPkzcIzuk3.srSee7nLeMOYUw2VDyIex1p73QwIPcsrKBI3HTQS3q', 'admin',  NULL,          NULL,         1),
-- Buyers
('Tamilarasu',         'buyer1@demo.com',    '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'buyer',  'Tamil Nadu',  '9876543210', 1),
('Kavitha Nagaraj',    'buyer2@demo.com',    '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'buyer',  'Karnataka',   '9876543211', 1),
('Priya Mukherjee',    'buyer3@demo.com',    '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'buyer',  'West Bengal', '9876543212', 1),
-- Weavers
('Karthikeyan Murugan','weaver1@demo.com',   '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'weaver', 'Tamil Nadu',  '9876543220', 1),
('Ramesh Prasad Gupta','weaver2@demo.com',   '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'weaver', 'Uttar Pradesh','9876543221',1),
('Lakshmi Devi Sharma','weaver3@demo.com',   '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'weaver', 'West Bengal', '9876543222', 1);

-- ============================================================
-- SEED: SAREE CATEGORIES
-- IDs: 1=Kanchipuram, 2=Banarasi, 3=Tussar, 4=Chettinadu, 5=Half, 6=Tissue
-- ============================================================

INSERT INTO saree_categories (name, slug) VALUES
('Kanchipuram Silk',  'kanchipuram-silk'),
('Banarasi',          'banarasi'),
('Tussar Silk',       'tussar-silk'),
('Chettinadu Cotton', 'chettinadu-cotton'),
('Half Sarees',       'half-sarees'),
('Tissue Sarees',     'tissue-sarees');

-- ============================================================
-- SEED: OFFERS
-- ============================================================

INSERT INTO offers (title, description, type, value, start_date, end_date, is_active, category_id) VALUES
('Wedding Season',       'Wedding season special offer! Perfect sarees for your special day.',          'fixed',      2000.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90  DAY), 1, NULL),
('Winter Collection',    'Winter special offer on warm and elegant sarees.',                            'fixed',      1000.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90  DAY), 1, NULL),
('New Year Sale',        'Start the new year with amazing discounts! Up to 30% off.',                  'percentage',   30.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 45  DAY), 1, NULL),
('Summer Sale',          'Summer season sale — cool and comfortable sarees at discounted prices.',      'percentage',   25.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 60  DAY), 1, NULL),
('Monsoon Sale',         'Monsoon special — Stay stylish with our premium collection!',                 'percentage',   25.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 60  DAY), 1, NULL),
('Diwali Festival',      'Special Diwali discount on all sarees. Celebrate with style!',               'percentage',   20.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30  DAY), 1, NULL),
('Pongal Special',       'Pongal festival special offer on traditional sarees.',                        'percentage',   15.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 15  DAY), 1, NULL),
('Holi Special',         'Colorful Holi celebration offer! Special discounts on vibrant sarees.',       'percentage',   20.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 20  DAY), 1, NULL),
('Onam Festival',        'Onam special offer on traditional Kerala sarees.',                            'percentage',   18.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30  DAY), 1, NULL),
('Dussehra Celebration', 'Dussehra special discounts on all traditional sarees.',                       'percentage',   22.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 20  DAY), 1, NULL),
('Eid Mubarak Offer',    'Eid special offer on elegant and premium sarees.',                            'percentage',   15.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 25  DAY), 1, NULL),
('Free Shipping',        'Free shipping on all orders above ₹5000. Shop now!',                         'free_shipping',  0.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 1, NULL),
('Buy One Get One',      'Buy one saree, get one free on selected items!',                              'bogo',          0.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 10  DAY), 1, NULL),
('Kanchipuram Special',  'Special offer on Kanchipuram silk sarees. Limited time!',                    'percentage',   18.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 20  DAY), 1, 1),
('Banarasi Discount',    'Exclusive discount on Banarasi silk collection.',                             'percentage',   22.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 25  DAY), 1, 2),
('Tussar Silk Special',  'Exclusive offer on Tussar silk sarees. Natural and elegant!',                'percentage',   20.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30  DAY), 1, 3),
('Cotton Comfort',       'Special offer on Chettinadu cotton sarees. Perfect for daily wear!',          'percentage',   15.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 40  DAY), 1, 4),
('Half Saree Collection','Special discount on half sarees. Traditional and modern styles!',             'percentage',   18.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 25  DAY), 1, 5),
('Tissue Saree Offer',   'Elegant tissue sarees at discounted prices. Light and beautiful!',            'percentage',   20.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30  DAY), 1, 6),
('Grandmother Special',  'Special offer on traditional sarees. Celebrate timeless elegance!',           'percentage',   15.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 50  DAY), 1, NULL);

-- ============================================================
-- SEED: SAREES (48 sarees — 8 per category)
-- Weaver IDs: 5=Karthikeyan, 6=Ramesh, 7=Lakshmi
-- ============================================================

-- Kanchipuram Silk (category_id = 1)
INSERT INTO sarees (weaver_id, category_id, title, description, price, stock, is_active, is_approved) VALUES
(5, 1, 'Traditional Kanchipuram Silk Saree - Red',   'Exquisite handwoven Kanchipuram silk saree with intricate zari work. Perfect for weddings and special occasions.',          15000.00,  5, 1, 1),
(5, 1, 'Premium Kanchipuram Silk - Gold Border',     'Luxurious Kanchipuram silk with rich gold borders and traditional motifs. Heritage craftsmanship.',                         18000.00,  3, 1, 1),
(6, 1, 'Designer Kanchipuram Silk Saree',            'Modern design Kanchipuram silk with contemporary patterns. Blends tradition with style.',                                   12000.00,  8, 1, 1),
(6, 1, 'Classic Kanchipuram - Maroon',               'Classic maroon Kanchipuram silk with traditional temple borders. Timeless elegance.',                                       16000.00,  4, 1, 1),
(7, 1, 'Heavy Kanchipuram Silk Saree',               'Heavy weight Kanchipuram silk with extensive zari work. Grand appearance for grand occasions.',                             22000.00,  2, 1, 1),
(7, 1, 'Lightweight Kanchipuram Silk',               'Lightweight Kanchipuram silk perfect for daily wear. Comfortable yet elegant.',                                              8000.00, 10, 1, 1),
(5, 1, 'Bridal Kanchipuram Silk Saree',              'Special bridal collection Kanchipuram silk with elaborate designs. Made for your most special moments.',                    25000.00,  1, 1, 1),
(6, 1, 'Festival Kanchipuram Silk',                  'Vibrant Kanchipuram silk perfect for festivals. Bright colors and traditional patterns that celebrate joy.',                14000.00,  6, 1, 1),

-- Banarasi (category_id = 2)
(5, 2, 'Authentic Banarasi Silk Saree',              'Pure Banarasi silk with intricate brocade work. Traditional Varanasi craftsmanship passed through generations.',            20000.00,  4, 1, 1),
(6, 2, 'Banarasi Silk - Red & Gold',                 'Stunning red Banarasi silk with gold zari patterns. Rich, luxurious, and utterly captivating.',                            18000.00,  5, 1, 1),
(7, 2, 'Designer Banarasi Saree',                    'Contemporary Banarasi design with modern color combinations. A unique style that stands out in any crowd.',                 15000.00,  7, 1, 1),
(5, 2, 'Heavy Banarasi Silk Saree',                  'Heavy weight Banarasi silk with extensive brocade. Grand appearance fit for royalty.',                                      25000.00,  2, 1, 1),
(6, 2, 'Light Banarasi Silk',                        'Lightweight Banarasi silk for comfortable wear. Elegant and graceful without the heaviness.',                               12000.00,  9, 1, 1),
(7, 2, 'Banarasi Silk - Green',                      'Beautiful green Banarasi silk with traditional motifs. Perfect for festive and ceremonial occasions.',                      17000.00,  6, 1, 1),
(5, 2, 'Bridal Banarasi Collection',                 'Exclusive bridal Banarasi silk with elaborate designs and premium gold zari. Made for weddings.',                           30000.00,  1, 1, 1),
(6, 2, 'Festival Banarasi Silk',                     'Vibrant Banarasi silk for festive occasions. Bright, beautiful, and crafted with care.',                                   16000.00,  8, 1, 1),

-- Tussar Silk (category_id = 3)
(7, 3, 'Pure Tussar Silk Saree',                     'Natural Tussar silk with organic texture. Eco-friendly and elegant — a gift from nature.',                                  10000.00, 10, 1, 1),
(5, 3, 'Tussar Silk - Printed',                      'Printed Tussar silk with beautiful block patterns. Comfortable and stylish for any occasion.',                               8500.00, 12, 1, 1),
(6, 3, 'Designer Tussar Silk',                       'Contemporary Tussar silk design blending tradition with modernity. For the fashion-forward woman.',                          9500.00,  8, 1, 1),
(7, 3, 'Tussar Silk - Embroidered',                  'Embroidered Tussar silk with intricate handwork. Delicate and beautiful, every stitch tells a story.',                     11000.00,  7, 1, 1),
(5, 3, 'Tussar Silk - Traditional',                  'Traditional Tussar silk with classic patterns. Timeless appeal that never goes out of style.',                               9000.00,  9, 1, 1),
(6, 3, 'Light Tussar Silk Saree',                    'Lightweight Tussar silk for everyday wear. Breathable, comfortable, and naturally elegant.',                                 7500.00, 15, 1, 1),
(7, 3, 'Tussar Silk - Party Wear',                   'Party wear Tussar silk with modern designs and rich sheen. Perfect for evening events.',                                    12000.00,  5, 1, 1),
(5, 3, 'Tussar Silk - Office Wear',                  'Professional Tussar silk suitable for the office. Formal, elegant, and effortlessly polished.',                             8000.00, 11, 1, 1),

-- Chettinadu Cotton (category_id = 4)
(6, 4, 'Traditional Chettinadu Cotton',              'Authentic Chettinadu cotton with traditional checks and natural dyes. Comfortable and classic.',                             3500.00, 20, 1, 1),
(7, 4, 'Chettinadu Cotton - Modern',                 'Modern Chettinadu cotton with contemporary color patterns. Stylish and breathable for all seasons.',                         4000.00, 18, 1, 1),
(5, 4, 'Chettinadu Cotton - Daily Wear',             'Perfect for daily wear. Soft cotton with traditional designs that keep you cool and confident.',                             3000.00, 25, 1, 1),
(6, 4, 'Designer Chettinadu Cotton',                 'Designer Chettinadu cotton with unique patterns. A modern twist on a timeless tradition.',                                   4500.00, 15, 1, 1),
(7, 4, 'Chettinadu Cotton - Festive',                'Festive Chettinadu cotton with bright colors and bold checks. Perfect for celebrations and joy.',                            3800.00, 22, 1, 1),
(5, 4, 'Light Chettinadu Cotton',                    'Ultra-lightweight Chettinadu cotton. Stays cool and fresh in Indian summers.',                                               3200.00, 20, 1, 1),
(6, 4, 'Chettinadu Cotton - Office',                 'Professional Chettinadu cotton for office wear. Elegant, comfortable, and always appropriate.',                              4200.00, 16, 1, 1),
(7, 4, 'Classic Chettinadu Cotton',                  'Classic Chettinadu cotton with iconic checks. A wardrobe staple with timeless style.',                                       3600.00, 19, 1, 1),

-- Half Sarees (category_id = 5)
(5, 5, 'Traditional Half Saree Set',                 'Complete half saree set with blouse and petticoat. Traditional design for young women celebrating their heritage.',          6000.00, 12, 1, 1),
(6, 5, 'Designer Half Saree',                        'Modern half saree with contemporary designs. Perfect for young women who love tradition with a twist.',                      5500.00, 14, 1, 1),
(7, 5, 'Festival Half Saree',                        'Vibrant half saree for festivals. Bright colors and traditional patterns that make you shine.',                              5800.00, 13, 1, 1),
(5, 5, 'Party Half Saree Set',                       'Elegant half saree for parties and special occasions. Stylish, graceful, and comfortable.',                                  6500.00, 10, 1, 1),
(6, 5, 'Traditional Half Saree - Silk',              'Silk half saree with traditional motifs and rich finish. Luxurious and elegant for ceremonies.',                             8000.00,  8, 1, 1),
(7, 5, 'Cotton Half Saree',                          'Cotton half saree for daily wear and college. Comfortable, practical, and effortlessly charming.',                           4500.00, 16, 1, 1),
(5, 5, 'Bridal Half Saree Set',                      'Special bridal half saree collection with elaborate zari work. Designed for your unforgettable day.',                       12000.00,  3, 1, 1),
(6, 5, 'Casual Half Saree',                          'Casual half saree for everyday occasions. Simple, elegant, and incredibly easy to drape.',                                   5000.00, 15, 1, 1),

-- Tissue Sarees (category_id = 6)
(7, 6, 'Premium Tissue Saree',                       'High quality tissue saree with signature shimmer effect. Light as air, elegant as a dream.',                                 7000.00, 11, 1, 1),
(5, 6, 'Tissue Saree - Party Wear',                  'Party wear tissue saree with modern designs and golden sheen. You will be the center of attention.',                         7500.00,  9, 1, 1),
(6, 6, 'Designer Tissue Saree',                      'Designer tissue saree with unique weave patterns. Contemporary style with classic luxury.',                                   7200.00, 10, 1, 1),
(7, 6, 'Traditional Tissue Saree',                   'Traditional tissue saree with classic designs and timeless elegance. A true collector\'s piece.',                            6800.00, 12, 1, 1),
(5, 6, 'Tissue Saree - Festive',                     'Festive tissue saree with bright colors and celebratory sheen. Perfect for Diwali, weddings, and more.',                    7100.00, 10, 1, 1),
(6, 6, 'Light Tissue Saree',                         'Lightweight tissue saree for comfortable wear. Airy, elegant, and effortlessly graceful.',                                   6500.00, 13, 1, 1),
(7, 6, 'Bridal Tissue Saree',                        'Special bridal tissue saree with elaborate gold work and shimmering finish. Made for your most magical moment.',            10000.00,  4, 1, 1),
(5, 6, 'Office Tissue Saree',                        'Professional tissue saree for formal settings. Subtle sheen, formal drape, and refined elegance.',                           6900.00, 11, 1, 1);

-- ============================================================
-- SEED: SAREE IMAGES (3–5 images per saree)
-- ============================================================

INSERT INTO saree_images (saree_id, file_path, is_primary) VALUES

-- ── Kanchipuram (1–8) ──
(1,'/assets/images/sarees/saree_001.jpeg',1),(1,'/assets/images/sarees/saree_002.jpg',0),(1,'/assets/images/sarees/saree_003.jpg',0),(1,'/assets/images/sarees/saree_018.jpeg',0),(1,'/assets/images/sarees/saree_025.jpeg',0),
(2,'/assets/images/sarees/saree_002.jpg',1),(2,'/assets/images/sarees/saree_005.jpg',0),(2,'/assets/images/sarees/saree_014.jpg',0),(2,'/assets/images/sarees/saree_022.jpeg',0),
(3,'/assets/images/sarees/saree_003.jpg',1),(3,'/assets/images/sarees/saree_007.jpg',0),(3,'/assets/images/sarees/saree_011.avif',0),(3,'/assets/images/sarees/saree_019.jpeg',0),(3,'/assets/images/sarees/saree_026.jpeg',0),
(4,'/assets/images/sarees/saree_004.jpg',1),(4,'/assets/images/sarees/saree_009.jpg',0),(4,'/assets/images/sarees/saree_016.jpeg',0),(4,'/assets/images/sarees/saree_023.jpeg',0),
(5,'/assets/images/sarees/saree_005.jpg',1),(5,'/assets/images/sarees/saree_012.jpg',0),(5,'/assets/images/sarees/saree_020.jpeg',0),
(6,'/assets/images/sarees/saree_006.jpg',1),(6,'/assets/images/sarees/saree_010.jpg',0),(6,'/assets/images/sarees/saree_015.jpeg',0),(6,'/assets/images/sarees/saree_024.jpeg',0),(6,'/assets/images/sarees/saree_029.jpg',0),
(7,'/assets/images/sarees/saree_007.jpg',1),(7,'/assets/images/sarees/saree_013.jpg',0),(7,'/assets/images/sarees/saree_021.jpeg',0),(7,'/assets/images/sarees/saree_028.jpeg',0),
(8,'/assets/images/sarees/saree_008.jpg',1),(8,'/assets/images/sarees/saree_017.jpeg',0),(8,'/assets/images/sarees/saree_027.jpeg',0),

-- ── Banarasi (9–16) ──
(9,'/assets/images/sarees/saree_009.jpg',1),(9,'/assets/images/sarees/saree_001.jpeg',0),(9,'/assets/images/sarees/saree_014.jpg',0),(9,'/assets/images/sarees/saree_022.jpeg',0),(9,'/assets/images/sarees/saree_029.jpg',0),
(10,'/assets/images/sarees/saree_010.jpg',1),(10,'/assets/images/sarees/saree_003.jpg',0),(10,'/assets/images/sarees/saree_018.jpeg',0),(10,'/assets/images/sarees/saree_025.jpeg',0),
(11,'/assets/images/sarees/saree_011.avif',1),(11,'/assets/images/sarees/saree_005.jpg',0),(11,'/assets/images/sarees/saree_016.jpeg',0),(11,'/assets/images/sarees/saree_023.jpeg',0),
(12,'/assets/images/sarees/saree_012.jpg',1),(12,'/assets/images/sarees/saree_007.jpg',0),(12,'/assets/images/sarees/saree_015.jpeg',0),(12,'/assets/images/sarees/saree_020.jpeg',0),(12,'/assets/images/sarees/saree_027.jpeg',0),
(13,'/assets/images/sarees/saree_013.jpg',1),(13,'/assets/images/sarees/saree_002.jpg',0),(13,'/assets/images/sarees/saree_021.jpeg',0),
(14,'/assets/images/sarees/saree_014.jpg',1),(14,'/assets/images/sarees/saree_006.jpg',0),(14,'/assets/images/sarees/saree_019.jpeg',0),(14,'/assets/images/sarees/saree_028.jpeg',0),
(15,'/assets/images/sarees/saree_015.jpeg',1),(15,'/assets/images/sarees/saree_004.jpg',0),(15,'/assets/images/sarees/saree_010.jpg',0),(15,'/assets/images/sarees/saree_017.jpeg',0),(15,'/assets/images/sarees/saree_024.jpeg',0),
(16,'/assets/images/sarees/saree_016.jpeg',1),(16,'/assets/images/sarees/saree_008.jpg',0),(16,'/assets/images/sarees/saree_026.jpeg',0),

-- ── Tussar Silk (17–24) ──
(17,'/assets/images/sarees/saree_017.jpeg',1),(17,'/assets/images/sarees/saree_001.jpeg',0),(17,'/assets/images/sarees/saree_011.avif',0),(17,'/assets/images/sarees/saree_023.jpeg',0),
(18,'/assets/images/sarees/saree_018.jpeg',1),(18,'/assets/images/sarees/saree_003.jpg',0),(18,'/assets/images/sarees/saree_009.jpg',0),(18,'/assets/images/sarees/saree_015.jpeg',0),(18,'/assets/images/sarees/saree_029.jpg',0),
(19,'/assets/images/sarees/saree_019.jpeg',1),(19,'/assets/images/sarees/saree_006.jpg',0),(19,'/assets/images/sarees/saree_013.jpg',0),
(20,'/assets/images/sarees/saree_020.jpeg',1),(20,'/assets/images/sarees/saree_004.jpg',0),(20,'/assets/images/sarees/saree_014.jpg',0),(20,'/assets/images/sarees/saree_025.jpeg',0),
(21,'/assets/images/sarees/saree_021.jpeg',1),(21,'/assets/images/sarees/saree_002.jpg',0),(21,'/assets/images/sarees/saree_010.jpg',0),(21,'/assets/images/sarees/saree_016.jpeg',0),(21,'/assets/images/sarees/saree_028.jpeg',0),
(22,'/assets/images/sarees/saree_022.jpeg',1),(22,'/assets/images/sarees/saree_007.jpg',0),(22,'/assets/images/sarees/saree_012.jpg',0),
(23,'/assets/images/sarees/saree_023.jpeg',1),(23,'/assets/images/sarees/saree_005.jpg',0),(23,'/assets/images/sarees/saree_017.jpeg',0),(23,'/assets/images/sarees/saree_027.jpeg',0),
(24,'/assets/images/sarees/saree_024.jpeg',1),(24,'/assets/images/sarees/saree_001.jpeg',0),(24,'/assets/images/sarees/saree_008.jpg',0),(24,'/assets/images/sarees/saree_018.jpeg',0),(24,'/assets/images/sarees/saree_026.jpeg',0),

-- ── Chettinadu Cotton (25–32) ──
(25,'/assets/images/sarees/saree_025.jpeg',1),(25,'/assets/images/sarees/saree_002.jpg',0),(25,'/assets/images/sarees/saree_013.jpg',0),(25,'/assets/images/sarees/saree_022.jpeg',0),
(26,'/assets/images/sarees/saree_026.jpeg',1),(26,'/assets/images/sarees/saree_006.jpg',0),(26,'/assets/images/sarees/saree_019.jpeg',0),
(27,'/assets/images/sarees/saree_027.jpeg',1),(27,'/assets/images/sarees/saree_003.jpg',0),(27,'/assets/images/sarees/saree_010.jpg',0),(27,'/assets/images/sarees/saree_016.jpeg',0),(27,'/assets/images/sarees/saree_029.jpg',0),
(28,'/assets/images/sarees/saree_028.jpeg',1),(28,'/assets/images/sarees/saree_005.jpg',0),(28,'/assets/images/sarees/saree_012.jpg',0),(28,'/assets/images/sarees/saree_021.jpeg',0),
(29,'/assets/images/sarees/saree_029.jpg',1),(29,'/assets/images/sarees/saree_004.jpg',0),(29,'/assets/images/sarees/saree_024.jpeg',0),
(30,'/assets/images/sarees/saree_001.jpeg',1),(30,'/assets/images/sarees/saree_007.jpg',0),(30,'/assets/images/sarees/saree_014.jpg',0),(30,'/assets/images/sarees/saree_020.jpeg',0),(30,'/assets/images/sarees/saree_028.jpeg',0),
(31,'/assets/images/sarees/saree_002.jpg',1),(31,'/assets/images/sarees/saree_009.jpg',0),(31,'/assets/images/sarees/saree_017.jpeg',0),(31,'/assets/images/sarees/saree_025.jpeg',0),
(32,'/assets/images/sarees/saree_003.jpg',1),(32,'/assets/images/sarees/saree_011.avif',0),(32,'/assets/images/sarees/saree_023.jpeg',0),

-- ── Half Sarees (33–40) ──
(33,'/assets/images/sarees/saree_004.jpg',1),(33,'/assets/images/sarees/saree_008.jpg',0),(33,'/assets/images/sarees/saree_015.jpeg',0),(33,'/assets/images/sarees/saree_022.jpeg',0),(33,'/assets/images/sarees/saree_029.jpg',0),
(34,'/assets/images/sarees/saree_005.jpg',1),(34,'/assets/images/sarees/saree_013.jpg',0),(34,'/assets/images/sarees/saree_019.jpeg',0),(34,'/assets/images/sarees/saree_027.jpeg',0),
(35,'/assets/images/sarees/saree_006.jpg',1),(35,'/assets/images/sarees/saree_016.jpeg',0),(35,'/assets/images/sarees/saree_026.jpeg',0),
(36,'/assets/images/sarees/saree_007.jpg',1),(36,'/assets/images/sarees/saree_001.jpeg',0),(36,'/assets/images/sarees/saree_010.jpg',0),(36,'/assets/images/sarees/saree_018.jpeg',0),(36,'/assets/images/sarees/saree_024.jpeg',0),
(37,'/assets/images/sarees/saree_008.jpg',1),(37,'/assets/images/sarees/saree_014.jpg',0),(37,'/assets/images/sarees/saree_021.jpeg',0),(37,'/assets/images/sarees/saree_028.jpeg',0),
(38,'/assets/images/sarees/saree_009.jpg',1),(38,'/assets/images/sarees/saree_002.jpg',0),(38,'/assets/images/sarees/saree_020.jpeg',0),
(39,'/assets/images/sarees/saree_010.jpg',1),(39,'/assets/images/sarees/saree_004.jpg',0),(39,'/assets/images/sarees/saree_012.jpg',0),(39,'/assets/images/sarees/saree_017.jpeg',0),(39,'/assets/images/sarees/saree_025.jpeg',0),
(40,'/assets/images/sarees/saree_011.avif',1),(40,'/assets/images/sarees/saree_006.jpg',0),(40,'/assets/images/sarees/saree_015.jpeg',0),(40,'/assets/images/sarees/saree_023.jpeg',0),

-- ── Tissue Sarees (41–48) ──
(41,'/assets/images/sarees/saree_012.jpg',1),(41,'/assets/images/sarees/saree_005.jpg',0),(41,'/assets/images/sarees/saree_029.jpg',0),
(42,'/assets/images/sarees/saree_013.jpg',1),(42,'/assets/images/sarees/saree_003.jpg',0),(42,'/assets/images/sarees/saree_009.jpg',0),(42,'/assets/images/sarees/saree_019.jpeg',0),(42,'/assets/images/sarees/saree_026.jpeg',0),
(43,'/assets/images/sarees/saree_014.jpg',1),(43,'/assets/images/sarees/saree_007.jpg',0),(43,'/assets/images/sarees/saree_016.jpeg',0),(43,'/assets/images/sarees/saree_024.jpeg',0),
(44,'/assets/images/sarees/saree_015.jpeg',1),(44,'/assets/images/sarees/saree_011.avif',0),(44,'/assets/images/sarees/saree_021.jpeg',0),
(45,'/assets/images/sarees/saree_016.jpeg',1),(45,'/assets/images/sarees/saree_001.jpeg',0),(45,'/assets/images/sarees/saree_008.jpg',0),(45,'/assets/images/sarees/saree_013.jpg',0),(45,'/assets/images/sarees/saree_022.jpeg',0),
(46,'/assets/images/sarees/saree_017.jpeg',1),(46,'/assets/images/sarees/saree_004.jpg',0),(46,'/assets/images/sarees/saree_014.jpg',0),(46,'/assets/images/sarees/saree_028.jpeg',0),
(47,'/assets/images/sarees/saree_018.jpeg',1),(47,'/assets/images/sarees/saree_010.jpg',0),(47,'/assets/images/sarees/saree_027.jpeg',0),
(48,'/assets/images/sarees/saree_019.jpeg',1),(48,'/assets/images/sarees/saree_002.jpg',0),(48,'/assets/images/sarees/saree_012.jpg',0),(48,'/assets/images/sarees/saree_020.jpeg',0);

-- ============================================================
-- SEED: SAREE VARIANTS
-- ============================================================

INSERT INTO saree_variants (saree_id, color_name, color_code, design_name, design_description, image_path, stock, price_adjustment, is_active) VALUES
(1, 'Red',    '#C0392B', 'Traditional', 'Classic traditional design with pure zari work',    '/assets/images/sarees/saree_001.jpeg', 2,    0.00, 1),
(1, 'Maroon', '#800000', 'Modern',      'Modern twist on traditional Kanchipuram design',    '/assets/images/sarees/saree_002.jpg',  3,  500.00, 1),
(9, 'Ivory',  '#FFFFF0', 'Heritage',    'Classic ivory Banarasi with gold brocade',          '/assets/images/sarees/saree_009.jpg',  2,  800.00, 1),
(9, 'Cream',  '#FFFDD0', 'Floral',      'Floral motif Banarasi in soft cream tone',          '/assets/images/sarees/saree_010.jpg',  2,  300.00, 1);

-- ============================================================
-- SEED: WEAVER STORIES (12 stories — Tamil, Malayalam, Telugu, Tanglish, English)
-- ============================================================

INSERT INTO weaver_stories (weaver_id, title, caption, description, media_path, media_type, is_approved) VALUES

-- Story 1 — Tamil (Karthikeyan)
(5,
 'பட்டு நூலின் பயணம்',
 'ஒவ்வொரு நூலிலும் ஒரு வரலாறு உறைகிறது.',
 'என் பெயர் கார்த்திக். கஞ்சிவரம் பட்டு நெய்வது எங்கள் குடும்பத்தின் ஐந்து தலைமுறை பாரம்பரியம். காலை 4 மணிக்கு எழுந்து நூல் தயாரிக்கிறோம் — வெறும் துணி நெய்வதல்ல, ஒரு கலையை உயிர்ப்பிக்கிறோம். ஒவ்வொரு சேலையிலும் 3,000-க்கும் மேற்பட்ட தங்கநூல் முடிச்சுகள் உள்ளன. இந்தக் கலை அழியாமல் இருக்க வேண்டும் என்று என் மகனுக்கும் சொல்லிக்கொடுக்கிறேன். உங்கள் ஒவ்வொரு கொள்முதலும் ஒரு குடும்பத்தை காப்பாற்றுகிறது, ஒரு கலையை காக்கிறது.',
 '/assets/images/sarees/saree_001.jpeg', 'image', 1),

-- Story 2 — Tanglish (Karthikeyan)
(5,
 'Silk Saree Panna Yenna Aaguthu — Behind the Scenes',
 'Oru saree panna 3 days to 3 weeks aagathu, depends on design.',
 'Vanakkam! நான் Karthik, from Kanchipuram. Every morning I start at 4 AM — not because alarm, because passion. Loom sound is my alarm clock da! Oru Kanjivaram saree panna minimum 3 days, heavy zari work saree panna 3 weeks aagathu. Coloring process la natural dyes mattum use pannuvom — chemical illai. Namma ancestors taught us this and I am teaching my son now. When you wear our saree, you are carrying 500 years of Tamil craftsmanship on your shoulders. Seriously, it is not just a saree — it is living history. Thank you for supporting handloom artisans like me!',
 '/assets/images/sarees/saree_007.jpg', 'image', 1),

-- Story 3 — Tanglish (Karthikeyan — customer emotional story)
(5,
 'Oru Customer Paathi Azhuvaainga — True Story',
 'The moment a saree becomes more than just a saree.',
 'Oru naal oru aunty store ku vandhaanga. Kanjivaram paakanum nu sollaanga. 30 minutes pakki oru red and gold saree select pannaaanga. Pay pannum pothu aunty kanna thanneer vandhuchu. Naan shock aachen. Enna aache nu ketaen. Antha aunty sonna: "En amma ila aachi last year. Amma always red Kanjivaram pottu Diwali celebrate pannuvaa. Innaiku Diwali so I am buying it for her memory." Naanum azhudhaen. Seriously. Antha moment le feel aanen — naan just saree sell panrale. Oru memory, oru love, oru legacy — atha preserve pannaren. Ithu thaan handloom weaver aana satisfaction. Money is secondary. This feeling is everything.',
 '/assets/images/sarees/saree_004.jpg', 'image', 1),

-- Story 4 — Telugu (Ramesh)
(6,
 'చేనేత మాయాజాలం',
 'ప్రతి దారంలో ఒక కళాకారుని ఆత్మ ఉంటుంది.',
 'నమస్కారం! నా పేరు రమేష్. వారణాసిలో మా తాత కాలం నుండి బనారసీ పట్టు నేస్తున్నాం. ఒక్కో చీరను నేయడానికి కనీసం రెండు వారాలు పడుతుంది. జరీ పని చేయడానికి మా వేళ్ళు రక్తం కారినా ఆగం. ఆ నొప్పి మనసుకు తెలియదు — ఎందుకంటే ఆ అందమైన చీర చేతిలో పూర్తవుతే కలిగే ఆనందం అన్నిటినీ మరిచిపిస్తుంది. నేడు మా పిల్లలకు ఈ కళ నేర్పిస్తున్నాం, ఎందుకంటే ఇది కేవలం వ్యాపారం కాదు — ఇది మా గుండె చప్పుడు. మీరు మా చీరలు కొన్నప్పుడు, మా కలలకు రెక్కలు వస్తాయి.',
 '/assets/images/sarees/saree_014.jpg', 'image', 1),

-- Story 5 — Tanglish (Ramesh — Machine vs Handloom)
(6,
 'Banarasi Silk — Enna Special nu Solren',
 'Machine saree vs handloom — the real difference.',
 'Dei, Banarasi silk special aagurathukku oru reason iruku. Machine la pannavanga oru day la 100 sarees panuvanga. Nanga? Oru saree ku 15 days. But that 15 days la nanga pour panni pannuvom — oru oru design, oru oru thread, manually. Zari work la pure gold thread use panrom — fake gold illai. Touch pannathe theliyuthu difference! Market la Rs.500 la Banarasi saree kidaikuthu — antha saree la soul illai da. Nanga panra saree la oru kudiyal irukkum, oru warmth irukkum. Price difference is not greediness — it is years of practice and pure material. Next time saree vangum pothu, saree ku enna went into making it nu think pannunga.',
 '/assets/images/sarees/saree_012.jpg', 'image', 1),

-- Story 6 — Telugu (Ramesh — future of handloom)
(6,
 'తుస్సర్ పట్టు అందం',
 'ప్రకృతి మనకు ఇచ్చిన అత్యంత విలువైన బహుమతి.',
 'తుస్సర్ సిల్క్ అంటే ఏమిటో మీకు తెలుసా? ఇది Eri, Muga లేదా Mulberry పట్టు పురుగుల నుండి వస్తుంది — కానీ ఇవి అడవుల్లో స్వేచ్ఛగా పెరుగుతాయి, captive లో కాదు. అందుకే తుస్సర్ కొంచెం rough texture తో ఉంటుంది — ఇది defect కాదు, ఇదే అందం! Natural sheen, earth tones, organic feel — ఇవన్నీ తుస్సర్ specialties. మా village లో 200 కుటుంబాలు తుస్సర్ నేయడంతో జీవించాయి. ఇప్పుడు 50 కుటుంబాలే మిగిలాయి. మీరు ఒక తుస్సర్ చీర కొన్నప్పుడు, ఒక కుటుంబానికి మళ్ళీ జీవితం వస్తుంది. ఇది నిజం.',
 '/assets/images/sarees/saree_017.jpeg', 'image', 1),

-- Story 7 — Malayalam (Lakshmi)
(7,
 'നെയ്ത്തിൻ്റെ നാദം',
 'ഓരോ നൂലിലും ഒരു ജന്മത്തിൻ്റെ കഥ ഒളിഞ്ഞിരിക്കുന്നു.',
 'എൻ്റെ പേര് ലക്ഷ്മി. ബനാറസ് പട്ടുകൾ നെയ്യുന്നത് ഞങ്ങളുടെ കുടുംബത്തിൻ്റെ മൂന്ന് തലമുറ ചെയ്തുവരുന്ന ജോലിയാണ്. ഒരു സാരി തയ്യാറാക്കാൻ 15 ദിവസം മുതൽ ഒരു മാസം വരെ എടുക്കും. ഒരു ദിവസം ഞങ്ങൾ 3 ഇഞ്ച് മാത്രം നൂൽ നൂൽക്കും — ഇത്ര ക്ഷമ വേണം ഈ കലയ്ക്ക്. ആധുനിക മെഷീനുകൾ ഞങ്ങളുടെ ജീവിതം ഭീഷണിപ്പെടുത്തുന്നു, പക്ഷേ handloom ൻ്റെ സ്പർശം, ഊഷ്മളത — അത് ഒരു മെഷീനും നൽകില്ല. നിങ്ങൾ handloom സാരി വാങ്ങുമ്പോൾ, ഒരു കലാകാരൻ്റെ സ്വപ്നം ജീവിക്കുന്നു.',
 '/assets/images/sarees/saree_009.jpg', 'image', 1),

-- Story 8 — Malayalam (Lakshmi — future & youth)
(7,
 'കൈത്തറിയുടെ ഭാവി',
 'പുതുതലമുറ കൈത്തറി പഠിക്കുന്നു — hope still lives.',
 'ഇന്ന് ഒരു happy news പറയട്ടെ. എൻ്റെ 18 വയസ്സുള്ള മകൻ Arun, YouTube ൽ ഞങ്ങളുടെ weaving process video upload ചെയ്തു. 2 ദിവസം കൊണ്ട് 50,000 views കിട്ടി! Young generation handloom ൽ interest കാണിക്കുന്നത് കണ്ടാൽ മനസ്സ് നിറയും. Machine weaving ഇന്ന് 90% market control ചെയ്യുന്നു, പക്ഷേ handloom ൻ്റെ uniqueness — ഒരിക്കലും replicate ചെയ്യാൻ പറ്റില്ല. ഓരോ saree-ഉം unique ആണ്, ഒരിക്കൽ പോലും exactly same ആകില്ല. Future bright ആണ് — young weavers come forward ആകുന്നു, customers handloom appreciate ചെയ്യുന്നു. നന്ദി.',
 '/assets/images/sarees/saree_019.jpeg', 'image', 1),

-- Story 9 — Tanglish (Lakshmi — Chettinadu Cotton)
(7,
 'Chettinadu Cotton — Why It Hits Different',
 'AC illaina parava illai, Chettinadu cotton pottu paaru.',
 'Summer la saree pottu sweating pannitu irukeenga? Chettinadu cotton try pannunga da. Seriously. Antha cotton la weave panra way le air pockets irukkum — natural AC madiri work aagum. Check pattern la neyra time oru thread miss aanaloo design spoil aagum, so attention to detail 100% irukkanum. Oru saree neyra time 8 hours minimum. Machine saree madiri fast fashion illai. Colors also natural — indigo check, red stripe, green border — all natural dye. Wash pannum pothu color fade aagaaathu. Price pakkaree — cheap illai, but value for money 100%. Oru Chettinadu cotton saree vanguna 10 years varaiku irukum. Fast fashion la spend panra panam itha vita zyadha aagum — think pannunga!',
 '/assets/images/sarees/saree_026.jpeg', 'image', 1),

-- Story 10 — Tamil (Lakshmi — Eco-friendly)
(7,
 'இயற்கையும் கைத்தறியும்',
 'பூமியை காக்கும் பட்டு — natural dye revolution.',
 'கஞ்சிவரம் மட்டுமல்ல, இன்று இயற்கை சாயங்கள் பயன்படுத்தி நெய்யும் கலை திரும்பி வருகிறது. நாங்கள் இன்டிகோ, கர்குமா, மாதுளை தோல் ஆகியவற்றை சாயமாக பயன்படுத்துகிறோம். Chemical சாயங்கள் நதிகளை மாசுபடுத்துகின்றன — அதை நாங்கள் செய்ய மறுக்கிறோம். Natural dye saree போட்டால் skin rash ஆகாது, சூரிய ஒளியில் நிறம் மாறாது, ஆண்டுக்கணக்கில் நீடிக்கும். Sustainability என்பது ஒரு trend அல்ல — நாங்கள் நூறு ஆண்டுகளாக அப்படியே வாழ்கிறோம்.',
 '/assets/images/sarees/saree_025.jpeg', 'image', 1),

-- Story 11 — Tamil (Ramesh — Half Sarees emotional)
(6,
 'பாவாடை தாவணி முதல் பட்டு சேலை வரை',
 'ஒரு பெண்ணின் முதல் சேலை அவளுக்கு தெரியாமல் ஒரு கலையை சுமக்கிறது.',
 'நான் Ramesh. என் கடைசி customer, ஒரு 16 வயது பெண், அவளுடைய முதல் half saree வாங்கினாள். அவள் கண்களில் இருந்த மகிழ்ச்சி பார்க்கவே அழகு. Half saree என்பது ஒரு transition — சின்ன பெண்ணிலிருந்து பெண்மைக்கு. அது வெறும் துணி இல்ல. நாங்கள் நெய்யும் போது அந்த பெண் யாராக இருப்பாள், என்ன feel பண்ணுவாள் என்று யோசிக்கிறோம். அந்த emotional connection இதுதான் handloom வேறுபடுகிறது. Machine அந்த feeling தர முடியாது. ஒவ்வொரு half saree-யும் ஒரு அன்பு கடிதம்.',
 '/assets/images/sarees/saree_022.jpeg', 'image', 1),

-- Story 12 — English (Lakshmi — Tissue Sarees professional)
(7,
 'The Magic of Tissue Sarees',
 'Light as a feather, rich as a dream — tissue sarees explained.',
 'Tissue sarees are perhaps the most misunderstood of all handloom weaves. People see the shimmer and assume it must be synthetic. It is not. Real tissue sarees are woven with fine silk and metallic threads interlocked at every weft, creating that distinctive sheer, gossamer quality that catches light like liquid gold. The weaving technique requires extreme precision — one wrong thread and the entire drape loses its character. Our tissue sarees weigh less than 400 grams yet they command attention in any room. They are perfect for evening events, receptions, and festive occasions where you want elegance without heaviness. Each saree takes 10 to 14 days to complete. We take pride in zero machine intervention. When you hold one of our tissue sarees, you are holding ten days of a craftsman\'s dedication.',
 '/assets/images/sarees/saree_011.avif', 'image', 1);

-- ============================================================
-- COMMIT
-- ============================================================
COMMIT;

-- ============================================================
-- VERIFY
-- ============================================================
SELECT 'users'         AS tbl, COUNT(*) AS cnt FROM users;
SELECT 'categories'    AS tbl, COUNT(*) AS cnt FROM saree_categories;
SELECT 'offers'        AS tbl, COUNT(*) AS cnt FROM offers;
SELECT 'sarees'        AS tbl, COUNT(*) AS cnt FROM sarees;
SELECT 'saree_images'  AS tbl, COUNT(*) AS cnt FROM saree_images;
SELECT 'stories'       AS tbl, COUNT(*) AS cnt FROM weaver_stories;
SELECT id, name, email, role FROM users ORDER BY id;