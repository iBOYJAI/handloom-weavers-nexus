-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 22, 2026 at 02:56 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `handloom_nexus`
--

-- --------------------------------------------------------

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `saree_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL CHECK (`quantity` > 0),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `offers`
--

CREATE TABLE `offers` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('percentage','fixed','free_shipping','bogo') NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `category_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `offers`
--

INSERT INTO `offers` (`id`, `title`, `description`, `type`, `value`, `start_date`, `end_date`, `is_active`, `category_id`, `created_at`) VALUES
(1, 'Diwali Festival Offer', 'Special Diwali discount on all sarees. Celebrate with style!', 'percentage', 20.00, '2026-02-22', '2026-03-24', 1, NULL, '2026-02-22 13:28:09'),
(2, 'Pongal Special', 'Pongal festival special offer on traditional sarees.', 'percentage', 15.00, '2026-02-22', '2026-03-09', 1, NULL, '2026-02-22 13:28:09'),
(3, 'Summer Sale', 'Summer season sale - cool and comfortable sarees at discounted prices.', 'percentage', 25.00, '2026-02-22', '2026-04-23', 1, NULL, '2026-02-22 13:28:09'),
(4, 'Winter Collection', 'Winter special offer on warm and cozy sarees.', 'fixed', 1000.00, '2026-02-22', '2026-05-23', 1, NULL, '2026-02-22 13:28:09'),
(5, 'Free Shipping', 'Free shipping on all orders above ₹5000. Shop now!', 'free_shipping', 0.00, '2026-02-22', '2027-02-22', 1, NULL, '2026-02-22 13:28:09'),
(6, 'Kanchipuram Special', 'Special offer on Kanchipuram silk sarees. Limited time!', 'percentage', 18.00, '2026-02-22', '2026-03-14', 1, 1, '2026-02-22 13:28:09'),
(7, 'Banarasi Discount', 'Exclusive discount on Banarasi silk collection.', 'percentage', 22.00, '2026-02-22', '2026-03-19', 1, 2, '2026-02-22 13:28:09'),
(8, 'Buy One Get One', 'Buy one saree, get one free on selected items!', 'bogo', 0.00, '2026-02-22', '2026-03-04', 1, NULL, '2026-02-22 13:28:09'),
(9, 'New Year Sale', 'Start the new year with amazing discounts! Up to 30% off on all sarees.', 'percentage', 30.00, '2026-02-22', '2026-04-08', 1, NULL, '2026-02-22 13:28:09'),
(10, 'Holi Special', 'Colorful Holi celebration offer! Special discounts on vibrant sarees.', 'percentage', 20.00, '2026-02-22', '2026-03-14', 1, NULL, '2026-02-22 13:28:09'),
(11, 'Eid Mubarak Offer', 'Eid special offer on elegant and premium sarees.', 'percentage', 15.00, '2026-02-22', '2026-03-19', 1, NULL, '2026-02-22 13:28:09'),
(12, 'Onam Festival', 'Onam special offer on traditional Kerala sarees.', 'percentage', 18.00, '2026-02-22', '2026-03-24', 1, NULL, '2026-02-22 13:28:09'),
(13, 'Dussehra Celebration', 'Dussehra special discounts on all traditional sarees.', 'percentage', 22.00, '2026-02-22', '2026-03-14', 1, NULL, '2026-02-22 13:28:09'),
(14, 'Tussar Silk Special', 'Exclusive offer on Tussar silk sarees. Natural and elegant!', 'percentage', 20.00, '2026-02-22', '2026-03-24', 1, 3, '2026-02-22 13:28:09'),
(15, 'Cotton Comfort', 'Special offer on Chettinadu cotton sarees. Perfect for daily wear!', 'percentage', 15.00, '2026-02-22', '2026-04-03', 1, 4, '2026-02-22 13:28:09'),
(16, 'Half Saree Collection', 'Special discount on half sarees. Traditional and modern styles!', 'percentage', 18.00, '2026-02-22', '2026-03-19', 1, 5, '2026-02-22 13:28:09'),
(17, 'Tissue Saree Offer', 'Elegant tissue sarees at discounted prices. Light and beautiful!', 'percentage', 20.00, '2026-02-22', '2026-03-24', 1, 6, '2026-02-22 13:28:09'),
(18, 'Monsoon Sale', 'Monsoon special - Stay dry and stylish with our premium collection!', 'percentage', 25.00, '2026-02-22', '2026-04-23', 1, NULL, '2026-02-22 13:28:09'),
(19, 'Wedding Season', 'Wedding season special offer! Perfect sarees for your special day.', 'fixed', 2000.00, '2026-02-22', '2026-05-23', 1, NULL, '2026-02-22 13:28:09'),
(20, 'Grandmother Special', 'Special offer on traditional sarees. Celebrate timeless elegance!', 'percentage', 15.00, '2026-02-22', '2026-04-13', 1, NULL, '2026-02-22 13:28:09');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `buyer_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL CHECK (`total_amount` > 0),
  `status` enum('pending','confirmed','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  `payment_method` varchar(10) NOT NULL DEFAULT 'COD',
  `address` text NOT NULL,
  `offer_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_customizations`
--

CREATE TABLE `order_customizations` (
  `id` int(11) NOT NULL,
  `order_item_id` int(11) NOT NULL,
  `blouse_color` varchar(50) DEFAULT NULL,
  `custom_design_type` enum('peacock','temple','name','other') DEFAULT NULL,
  `custom_design_text` varchar(500) DEFAULT NULL,
  `custom_design_image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `saree_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL CHECK (`quantity` > 0),
  `price_at_purchase` decimal(10,2) NOT NULL CHECK (`price_at_purchase` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `buyer_id` int(11) NOT NULL,
  `saree_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sarees`
--

CREATE TABLE `sarees` (
  `id` int(11) NOT NULL,
  `weaver_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `price` decimal(10,2) NOT NULL CHECK (`price` > 0),
  `stock` int(11) NOT NULL DEFAULT 0 CHECK (`stock` >= 0),
  `blouse_colors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`blouse_colors`)),
  `is_active` tinyint(1) DEFAULT 1,
  `is_approved` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sarees`
--

INSERT INTO `sarees` (`id`, `weaver_id`, `category_id`, `title`, `description`, `price`, `stock`, `blouse_colors`, `is_active`, `is_approved`, `created_at`) VALUES
(1, 4, 1, 'Traditional Kanchipuram Silk Saree - Red', 'Exquisite handwoven Kanchipuram silk saree with intricate zari work. Perfect for weddings and special occasions.', 15000.00, 5, NULL, 1, 1, '2026-02-22 13:28:09'),
(2, 4, 1, 'Premium Kanchipuram Silk - Gold Border', 'Luxurious Kanchipuram silk with rich gold borders and traditional motifs. Heritage craftsmanship.', 18000.00, 3, NULL, 1, 1, '2026-02-22 13:28:09'),
(3, 5, 1, 'Designer Kanchipuram Silk Saree', 'Modern design Kanchipuram silk with contemporary patterns. Blends tradition with style.', 12000.00, 8, NULL, 1, 1, '2026-02-22 13:28:09'),
(4, 5, 1, 'Classic Kanchipuram - Maroon', 'Classic maroon Kanchipuram silk with traditional temple borders. Timeless elegance.', 16000.00, 4, NULL, 1, 1, '2026-02-22 13:28:09'),
(5, 6, 1, 'Heavy Kanchipuram Silk Saree', 'Heavy weight Kanchipuram silk with extensive zari work. Grand appearance.', 22000.00, 2, NULL, 1, 1, '2026-02-22 13:28:09'),
(6, 6, 1, 'Lightweight Kanchipuram Silk', 'Lightweight Kanchipuram silk perfect for daily wear. Comfortable yet elegant.', 8000.00, 10, NULL, 1, 1, '2026-02-22 13:28:09'),
(7, 4, 1, 'Bridal Kanchipuram Silk Saree', 'Special bridal collection Kanchipuram silk with elaborate designs. Made for special moments.', 25000.00, 1, NULL, 1, 1, '2026-02-22 13:28:09'),
(8, 5, 1, 'Festival Kanchipuram Silk', 'Vibrant Kanchipuram silk perfect for festivals. Bright colors and traditional patterns.', 14000.00, 6, NULL, 1, 1, '2026-02-22 13:28:09'),
(9, 4, 2, 'Authentic Banarasi Silk Saree', 'Pure Banarasi silk with intricate brocade work. Traditional Varanasi craftsmanship.', 20000.00, 4, NULL, 1, 1, '2026-02-22 13:28:09'),
(10, 5, 2, 'Banarasi Silk - Red & Gold', 'Stunning red Banarasi silk with gold zari patterns. Rich and luxurious.', 18000.00, 5, NULL, 1, 1, '2026-02-22 13:28:09'),
(11, 6, 2, 'Designer Banarasi Saree', 'Contemporary Banarasi design with modern color combinations. Unique style.', 15000.00, 7, NULL, 1, 1, '2026-02-22 13:28:09'),
(12, 4, 2, 'Heavy Banarasi Silk Saree', 'Heavy weight Banarasi silk with extensive brocade. Grand appearance.', 25000.00, 2, NULL, 1, 1, '2026-02-22 13:28:09'),
(13, 5, 2, 'Light Banarasi Silk', 'Lightweight Banarasi silk for comfortable wear. Elegant and graceful.', 12000.00, 9, NULL, 1, 1, '2026-02-22 13:28:09'),
(14, 6, 2, 'Banarasi Silk - Green', 'Beautiful green Banarasi silk with traditional motifs. Perfect for occasions.', 17000.00, 6, NULL, 1, 1, '2026-02-22 13:28:09'),
(15, 4, 2, 'Bridal Banarasi Collection', 'Exclusive bridal Banarasi silk with elaborate designs. Made for weddings.', 30000.00, 1, NULL, 1, 1, '2026-02-22 13:28:09'),
(16, 5, 2, 'Festival Banarasi Silk', 'Vibrant Banarasi silk for festive occasions. Bright and beautiful.', 16000.00, 8, NULL, 1, 1, '2026-02-22 13:28:09'),
(17, 6, 3, 'Pure Tussar Silk Saree', 'Natural Tussar silk with organic texture. Eco-friendly and elegant.', 10000.00, 10, NULL, 1, 1, '2026-02-22 13:28:09'),
(18, 4, 3, 'Tussar Silk - Printed', 'Printed Tussar silk with beautiful patterns. Comfortable and stylish.', 8500.00, 12, NULL, 1, 1, '2026-02-22 13:28:09'),
(19, 5, 3, 'Designer Tussar Silk', 'Contemporary Tussar silk design. Modern and trendy.', 9500.00, 8, NULL, 1, 1, '2026-02-22 13:28:09'),
(20, 6, 3, 'Tussar Silk - Embroidered', 'Embroidered Tussar silk with handwork. Delicate and beautiful.', 11000.00, 7, NULL, 1, 1, '2026-02-22 13:28:09'),
(21, 4, 3, 'Tussar Silk - Traditional', 'Traditional Tussar silk with classic patterns. Timeless appeal.', 9000.00, 9, NULL, 1, 1, '2026-02-22 13:28:09'),
(22, 5, 3, 'Light Tussar Silk Saree', 'Lightweight Tussar silk for daily wear. Comfortable and elegant.', 7500.00, 15, NULL, 1, 1, '2026-02-22 13:28:09'),
(23, 6, 3, 'Tussar Silk - Party Wear', 'Party wear Tussar silk with modern designs. Perfect for events.', 12000.00, 5, NULL, 1, 1, '2026-02-22 13:28:09'),
(24, 4, 3, 'Tussar Silk - Office Wear', 'Professional Tussar silk suitable for office. Elegant and formal.', 8000.00, 11, NULL, 1, 1, '2026-02-22 13:28:09'),
(25, 5, 4, 'Traditional Chettinadu Cotton', 'Authentic Chettinadu cotton with traditional checks. Comfortable and classic.', 3500.00, 20, NULL, 1, 1, '2026-02-22 13:28:09'),
(26, 6, 4, 'Chettinadu Cotton - Modern', 'Modern Chettinadu cotton with contemporary patterns. Stylish and comfortable.', 4000.00, 18, NULL, 1, 1, '2026-02-22 13:28:09'),
(27, 4, 4, 'Chettinadu Cotton - Daily Wear', 'Perfect for daily wear. Soft cotton with traditional designs.', 3000.00, 25, NULL, 1, 1, '2026-02-22 13:28:09'),
(28, 5, 4, 'Designer Chettinadu Cotton', 'Designer Chettinadu cotton with unique patterns. Modern twist on tradition.', 4500.00, 15, NULL, 1, 1, '2026-02-22 13:28:09'),
(29, 6, 4, 'Chettinadu Cotton - Festive', 'Festive Chettinadu cotton with bright colors. Perfect for celebrations.', 3800.00, 22, NULL, 1, 1, '2026-02-22 13:28:09'),
(30, 4, 4, 'Light Chettinadu Cotton', 'Lightweight Chettinadu cotton. Comfortable for all seasons.', 3200.00, 20, NULL, 1, 1, '2026-02-22 13:28:09'),
(31, 5, 4, 'Chettinadu Cotton - Office', 'Professional Chettinadu cotton for office wear. Elegant and comfortable.', 4200.00, 16, NULL, 1, 1, '2026-02-22 13:28:09'),
(32, 6, 4, 'Classic Chettinadu Cotton', 'Classic Chettinadu cotton with traditional checks. Timeless style.', 3600.00, 19, NULL, 1, 1, '2026-02-22 13:28:09'),
(33, 4, 5, 'Traditional Half Saree Set', 'Complete half saree set with blouse and petticoat. Traditional design.', 6000.00, 12, NULL, 1, 1, '2026-02-22 13:28:09'),
(34, 5, 5, 'Designer Half Saree', 'Modern half saree with contemporary designs. Perfect for young women.', 5500.00, 14, NULL, 1, 1, '2026-02-22 13:28:09'),
(35, 6, 5, 'Festival Half Saree', 'Vibrant half saree for festivals. Bright colors and patterns.', 5800.00, 13, NULL, 1, 1, '2026-02-22 13:28:09'),
(36, 4, 5, 'Party Half Saree Set', 'Elegant half saree for parties. Stylish and comfortable.', 6500.00, 10, NULL, 1, 1, '2026-02-22 13:28:09'),
(37, 5, 5, 'Traditional Half Saree - Silk', 'Silk half saree with traditional motifs. Luxurious and elegant.', 8000.00, 8, NULL, 1, 1, '2026-02-22 13:28:09'),
(38, 6, 5, 'Cotton Half Saree', 'Cotton half saree for daily wear. Comfortable and practical.', 4500.00, 16, NULL, 1, 1, '2026-02-22 13:28:09'),
(39, 4, 5, 'Bridal Half Saree Set', 'Special bridal half saree collection. Elaborate designs.', 12000.00, 3, NULL, 1, 1, '2026-02-22 13:28:09'),
(40, 5, 5, 'Casual Half Saree', 'Casual half saree for everyday occasions. Simple and elegant.', 5000.00, 15, NULL, 1, 1, '2026-02-22 13:28:09'),
(41, 6, 6, 'Premium Tissue Saree', 'High quality tissue saree with shimmer effect. Elegant and graceful.', 7000.00, 11, NULL, 1, 1, '2026-02-22 13:28:09'),
(42, 4, 6, 'Tissue Saree - Party Wear', 'Party wear tissue saree with modern designs. Perfect for events.', 7500.00, 9, NULL, 1, 1, '2026-02-22 13:28:09'),
(43, 5, 6, 'Designer Tissue Saree', 'Designer tissue saree with unique patterns. Contemporary style.', 7200.00, 10, NULL, 1, 1, '2026-02-22 13:28:09'),
(44, 6, 6, 'Traditional Tissue Saree', 'Traditional tissue saree with classic designs. Timeless elegance.', 6800.00, 12, NULL, 1, 1, '2026-02-22 13:28:09'),
(45, 4, 6, 'Tissue Saree - Festive', 'Festive tissue saree with bright colors. Perfect for celebrations.', 7100.00, 10, NULL, 1, 1, '2026-02-22 13:28:09'),
(46, 5, 6, 'Light Tissue Saree', 'Lightweight tissue saree for comfortable wear. Elegant and airy.', 6500.00, 13, NULL, 1, 1, '2026-02-22 13:28:09'),
(47, 6, 6, 'Bridal Tissue Saree', 'Special bridal tissue saree with elaborate work. Made for special moments.', 10000.00, 4, NULL, 1, 1, '2026-02-22 13:28:09'),
(48, 4, 6, 'Office Tissue Saree', 'Professional tissue saree for office. Formal and elegant.', 6900.00, 11, NULL, 1, 1, '2026-02-22 13:28:09'),
(49, 4, 1, 'Wedding Special Kanchipuram - Pending', 'Waiting for admin approval.', 19000.00, 2, NULL, 1, 1, '2026-02-22 13:28:09'),
(50, 5, 2, 'Luxury Banarasi - Pending', 'A masterpiece in progress.', 22000.00, 1, NULL, 1, 1, '2026-02-22 13:28:09');

-- --------------------------------------------------------

--
-- Table structure for table `saree_approvals`
--

CREATE TABLE `saree_approvals` (
  `id` int(11) NOT NULL,
  `saree_id` int(11) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `admin_id` int(11) DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `saree_categories`
--

CREATE TABLE `saree_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `saree_categories`
--

INSERT INTO `saree_categories` (`id`, `name`, `slug`, `created_at`) VALUES
(1, 'Kanchipuram Silk', 'kanchipuram-silk', '2026-02-22 13:28:09'),
(2, 'Banarasi', 'banarasi', '2026-02-22 13:28:09'),
(3, 'Tussar Silk', 'tussar-silk', '2026-02-22 13:28:09'),
(4, 'Chettinadu Cotton', 'chettinadu-cotton', '2026-02-22 13:28:09'),
(5, 'Half Sarees', 'half-sarees', '2026-02-22 13:28:09'),
(6, 'Tissue Sarees', 'tissue-sarees', '2026-02-22 13:28:09');

-- --------------------------------------------------------

--
-- Table structure for table `saree_images`
--

CREATE TABLE `saree_images` (
  `id` int(11) NOT NULL,
  `saree_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `saree_images`
--

INSERT INTO `saree_images` (`id`, `saree_id`, `file_path`, `is_primary`, `created_at`) VALUES
(1, 1, '/assets/images/sarees/saree_001.jpeg', 1, '2026-02-22 13:28:09'),
(2, 1, '/assets/images/sarees/saree_002.jpg', 0, '2026-02-22 13:28:09'),
(3, 1, '/assets/images/sarees/saree_003.jpg', 0, '2026-02-22 13:28:09'),
(4, 1, '/assets/images/sarees/saree_004.jpg', 0, '2026-02-22 13:28:09'),
(5, 1, '/assets/images/sarees/saree_005.jpg', 0, '2026-02-22 13:28:09'),
(6, 2, '/assets/images/sarees/saree_002.jpg', 1, '2026-02-22 13:28:09'),
(7, 2, '/assets/images/sarees/saree_003.jpg', 0, '2026-02-22 13:28:09'),
(8, 2, '/assets/images/sarees/saree_004.jpg', 0, '2026-02-22 13:28:09'),
(9, 2, '/assets/images/sarees/saree_005.jpg', 0, '2026-02-22 13:28:09'),
(10, 2, '/assets/images/sarees/saree_006.jpg', 0, '2026-02-22 13:28:09'),
(11, 3, '/assets/images/sarees/saree_003.jpg', 1, '2026-02-22 13:28:09'),
(12, 3, '/assets/images/sarees/saree_004.jpg', 0, '2026-02-22 13:28:09'),
(13, 3, '/assets/images/sarees/saree_005.jpg', 0, '2026-02-22 13:28:09'),
(14, 3, '/assets/images/sarees/saree_006.jpg', 0, '2026-02-22 13:28:09'),
(15, 3, '/assets/images/sarees/saree_007.jpg', 0, '2026-02-22 13:28:09'),
(16, 4, '/assets/images/sarees/saree_004.jpg', 1, '2026-02-22 13:28:09'),
(17, 5, '/assets/images/sarees/saree_005.jpg', 1, '2026-02-22 13:28:09'),
(18, 6, '/assets/images/sarees/saree_006.jpg', 1, '2026-02-22 13:28:09'),
(19, 7, '/assets/images/sarees/saree_007.jpg', 1, '2026-02-22 13:28:09'),
(20, 8, '/assets/images/sarees/saree_008.jpg', 1, '2026-02-22 13:28:09'),
(21, 9, '/assets/images/sarees/saree_009.jpg', 1, '2026-02-22 13:28:09'),
(22, 10, '/assets/images/sarees/saree_010.jpg', 1, '2026-02-22 13:28:09'),
(23, 11, '/assets/images/sarees/saree_011.avif', 1, '2026-02-22 13:28:09'),
(24, 12, '/assets/images/sarees/saree_012.jpg', 1, '2026-02-22 13:28:09'),
(25, 13, '/assets/images/sarees/saree_013.jpg', 1, '2026-02-22 13:28:09'),
(26, 14, '/assets/images/sarees/saree_014.jpg', 1, '2026-02-22 13:28:09'),
(27, 15, '/assets/images/sarees/saree_015.jpeg', 1, '2026-02-22 13:28:09'),
(28, 16, '/assets/images/sarees/saree_016.jpeg', 1, '2026-02-22 13:28:09'),
(29, 17, '/assets/images/sarees/saree_017.jpeg', 1, '2026-02-22 13:28:09'),
(30, 18, '/assets/images/sarees/saree_018.jpeg', 1, '2026-02-22 13:28:09'),
(31, 19, '/assets/images/sarees/saree_019.jpeg', 1, '2026-02-22 13:28:09'),
(32, 20, '/assets/images/sarees/saree_020.jpeg', 1, '2026-02-22 13:28:09'),
(33, 21, '/assets/images/sarees/saree_021.jpeg', 1, '2026-02-22 13:28:09'),
(34, 22, '/assets/images/sarees/saree_022.jpeg', 1, '2026-02-22 13:28:09'),
(35, 23, '/assets/images/sarees/saree_023.jpeg', 1, '2026-02-22 13:28:09'),
(36, 24, '/assets/images/sarees/saree_024.jpeg', 1, '2026-02-22 13:28:09'),
(37, 25, '/assets/images/sarees/saree_025.jpeg', 1, '2026-02-22 13:28:09'),
(38, 26, '/assets/images/sarees/saree_026.jpeg', 1, '2026-02-22 13:28:09'),
(39, 27, '/assets/images/sarees/saree_027.jpeg', 1, '2026-02-22 13:28:09'),
(40, 28, '/assets/images/sarees/saree_028.jpeg', 1, '2026-02-22 13:28:09'),
(41, 29, '/assets/images/sarees/saree_029.jpg', 1, '2026-02-22 13:28:09'),
(42, 30, '/assets/images/sarees/saree_001.jpeg', 1, '2026-02-22 13:28:09'),
(43, 31, '/assets/images/sarees/saree_002.jpg', 1, '2026-02-22 13:28:09'),
(44, 32, '/assets/images/sarees/saree_003.jpg', 1, '2026-02-22 13:28:09'),
(45, 33, '/assets/images/sarees/saree_004.jpg', 1, '2026-02-22 13:28:09'),
(46, 34, '/assets/images/sarees/saree_005.jpg', 1, '2026-02-22 13:28:09'),
(47, 35, '/assets/images/sarees/saree_006.jpg', 1, '2026-02-22 13:28:09'),
(48, 36, '/assets/images/sarees/saree_007.jpg', 1, '2026-02-22 13:28:09'),
(49, 37, '/assets/images/sarees/saree_008.jpg', 1, '2026-02-22 13:28:09'),
(50, 38, '/assets/images/sarees/saree_009.jpg', 1, '2026-02-22 13:28:09'),
(51, 39, '/assets/images/sarees/saree_010.jpg', 1, '2026-02-22 13:28:09'),
(52, 40, '/assets/images/sarees/saree_011.avif', 1, '2026-02-22 13:28:09'),
(53, 41, '/assets/images/sarees/saree_012.jpg', 1, '2026-02-22 13:28:09'),
(54, 42, '/assets/images/sarees/saree_013.jpg', 1, '2026-02-22 13:28:09'),
(55, 43, '/assets/images/sarees/saree_014.jpg', 1, '2026-02-22 13:28:09'),
(56, 44, '/assets/images/sarees/saree_015.jpeg', 1, '2026-02-22 13:28:09'),
(57, 45, '/assets/images/sarees/saree_016.jpeg', 1, '2026-02-22 13:28:09'),
(58, 46, '/assets/images/sarees/saree_017.jpeg', 1, '2026-02-22 13:28:09'),
(59, 47, '/assets/images/sarees/saree_018.jpeg', 1, '2026-02-22 13:28:09'),
(60, 48, '/assets/images/sarees/saree_019.jpeg', 1, '2026-02-22 13:28:09');

-- --------------------------------------------------------

--
-- Table structure for table `saree_variants`
--

CREATE TABLE `saree_variants` (
  `id` int(11) NOT NULL,
  `saree_id` int(11) NOT NULL,
  `color_name` varchar(50) NOT NULL,
  `color_code` varchar(7) NOT NULL,
  `design_name` varchar(100) NOT NULL,
  `design_description` text DEFAULT NULL,
  `image_path` varchar(500) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0 CHECK (`stock` >= 0),
  `price_adjustment` decimal(10,2) DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `saree_variants`
--

INSERT INTO `saree_variants` (`id`, `saree_id`, `color_name`, `color_code`, `design_name`, `design_description`, `image_path`, `stock`, `price_adjustment`, `is_active`, `created_at`) VALUES
(1, 1, 'Red', '#C0392B', 'Traditional', 'Classic traditional design with zari work', '/assets/images/sarees/saree_001.jpeg', 2, 0.00, 1, '2026-02-22 13:28:09'),
(2, 1, 'Maroon', '#800000', 'Modern', 'Modern twist on traditional design', '/assets/images/sarees/saree_002.jpg', 3, 500.00, 1, '2026-02-22 13:28:09');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `story_approvals`
--

CREATE TABLE `story_approvals` (
  `id` int(11) NOT NULL,
  `story_id` int(11) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `admin_id` int(11) DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(60) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('buyer','weaver','admin') NOT NULL DEFAULT 'buyer',
  `region` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT 0,
  `is_suspended` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `region`, `phone`, `avatar`, `address`, `is_approved`, `is_suspended`, `created_at`) VALUES
(1, 'Admin User', 'admin@nexus.com', '$2a$10$VPkzcIzuk3.srSee7nLeMOYUw2VDyIex1p73QwIPcsrKBI3HTQS3q', 'admin', NULL, NULL, NULL, NULL, 1, 0, '2026-02-22 13:28:09'),
(2, 'Demo Buyer 1', 'buyer1@demo.com', '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'buyer', 'Tamil Nadu', '9876543210', NULL, NULL, 1, 0, '2026-02-22 13:28:09'),
(3, 'Demo Buyer 2', 'buyer2@demo.com', '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'buyer', 'Karnataka', '9876543211', NULL, NULL, 1, 0, '2026-02-22 13:28:09'),
(4, 'Demo Buyer 3', 'buyer3@demo.com', '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'buyer', 'West Bengal', '9876543212', NULL, NULL, 1, 0, '2026-02-22 13:28:09'),
(5, 'Demo Weaver 1', 'weaver1@demo.com', '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'weaver', 'Tamil Nadu', '9876543220', NULL, NULL, 1, 0, '2026-02-22 13:28:09'),
(6, 'Demo Weaver 2', 'weaver2@demo.com', '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'weaver', 'Uttar Pradesh', '9876543221', NULL, NULL, 1, 0, '2026-02-22 13:28:09'),
(7, 'Demo Weaver 3', 'weaver3@demo.com', '$2a$10$2hL0woW8DMGhY8D7ykkXnu9sRzgICXOjGG4ckFk6hQlHRb3mIAymC', 'weaver', 'West Bengal', '9876543222', NULL, NULL, 1, 0, '2026-02-22 13:28:09');

-- --------------------------------------------------------

--
-- Table structure for table `weaver_stories`
--

CREATE TABLE `weaver_stories` (
  `id` int(11) NOT NULL,
  `weaver_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `caption` varchar(500) NOT NULL,
  `description` text DEFAULT NULL,
  `media_path` varchar(500) NOT NULL,
  `media_type` enum('image','video') NOT NULL,
  `media_paths` text DEFAULT NULL,
  `media_types` text DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `weaver_stories`
--

INSERT INTO `weaver_stories` (`id`, `weaver_id`, `title`, `caption`, `description`, `media_path`, `media_type`, `media_paths`, `media_types`, `is_approved`, `created_at`) VALUES
(1, 4, 'The Art of Silk Weaving', 'Generations of craftsmanship in every thread.', 'In the heart of Kanchipuram, our family has been weaving silk for over four generations. Every saree is a labor of love, taking weeks to perfect the intricate zari patterns.', '/assets/images/sarees/saree_001.jpeg', 'image', NULL, NULL, 1, '2026-02-22 13:28:09'),
(2, 5, 'Sustainability in Handloom', 'Eco-friendly dyes and natural fibers.', 'We believe in preserving nature while creating beauty. Our cotton sarees use only natural vegetable dyes, ensuring health for both the wearer and the planet.', '/assets/images/sarees/saree_025.jpeg', 'image', NULL, NULL, 1, '2026-02-22 13:28:09'),
(3, 6, 'The Banarasi Heritage', 'Varanasi magic on looms.', 'The shimmer of Banarasi silk is unmatched. We combine traditional brocade techniques with modern designs to keep the heritage alive for the new generation.', '/assets/images/sarees/saree_009.jpg', 'image', NULL, NULL, 1, '2026-02-22 13:28:09');

-- --------------------------------------------------------

--
-- Table structure for table `wishlist`
--

CREATE TABLE `wishlist` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `saree_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_saree` (`user_id`,`saree_id`),
  ADD KEY `saree_id` (`saree_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `offers`
--
ALTER TABLE `offers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_dates` (`start_date`,`end_date`),
  ADD KEY `idx_category_id` (`category_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_buyer_id` (`buyer_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_offer_id` (`offer_id`);

--
-- Indexes for table `order_customizations`
--
ALTER TABLE `order_customizations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_item_id` (`order_item_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_saree_id` (`saree_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_buyer_saree` (`buyer_id`,`saree_id`),
  ADD KEY `idx_saree_id` (`saree_id`),
  ADD KEY `idx_rating` (`rating`);

--
-- Indexes for table `sarees`
--
ALTER TABLE `sarees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_weaver_id` (`weaver_id`),
  ADD KEY `idx_category_id` (`category_id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_is_approved` (`is_approved`);
ALTER TABLE `sarees` ADD FULLTEXT KEY `idx_search` (`title`,`description`);

--
-- Indexes for table `saree_approvals`
--
ALTER TABLE `saree_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_saree_id` (`saree_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_admin_id` (`admin_id`);

--
-- Indexes for table `saree_categories`
--
ALTER TABLE `saree_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_slug` (`slug`);

--
-- Indexes for table `saree_images`
--
ALTER TABLE `saree_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_saree_id` (`saree_id`),
  ADD KEY `idx_is_primary` (`is_primary`);

--
-- Indexes for table `saree_variants`
--
ALTER TABLE `saree_variants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_saree_id` (`saree_id`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `story_approvals`
--
ALTER TABLE `story_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_story_id` (`story_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_admin_id` (`admin_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_is_approved` (`is_approved`);

--
-- Indexes for table `weaver_stories`
--
ALTER TABLE `weaver_stories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_weaver_id` (`weaver_id`),
  ADD KEY `idx_is_approved` (`is_approved`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_saree_wishlist` (`user_id`,`saree_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_saree_id` (`saree_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `offers`
--
ALTER TABLE `offers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_customizations`
--
ALTER TABLE `order_customizations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sarees`
--
ALTER TABLE `sarees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `saree_approvals`
--
ALTER TABLE `saree_approvals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `saree_categories`
--
ALTER TABLE `saree_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `saree_images`
--
ALTER TABLE `saree_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `saree_variants`
--
ALTER TABLE `saree_variants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `story_approvals`
--
ALTER TABLE `story_approvals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `weaver_stories`
--
ALTER TABLE `weaver_stories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `wishlist`
--
ALTER TABLE `wishlist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`saree_id`) REFERENCES `sarees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `offers`
--
ALTER TABLE `offers`
  ADD CONSTRAINT `offers_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `saree_categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_offer` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `order_customizations`
--
ALTER TABLE `order_customizations`
  ADD CONSTRAINT `order_customizations_ibfk_1` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`saree_id`) REFERENCES `sarees` (`id`);

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`saree_id`) REFERENCES `sarees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sarees`
--
ALTER TABLE `sarees`
  ADD CONSTRAINT `sarees_ibfk_1` FOREIGN KEY (`weaver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sarees_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `saree_categories` (`id`);

--
-- Constraints for table `saree_approvals`
--
ALTER TABLE `saree_approvals`
  ADD CONSTRAINT `saree_approvals_ibfk_1` FOREIGN KEY (`saree_id`) REFERENCES `sarees` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `saree_approvals_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `saree_images`
--
ALTER TABLE `saree_images`
  ADD CONSTRAINT `saree_images_ibfk_1` FOREIGN KEY (`saree_id`) REFERENCES `sarees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `saree_variants`
--
ALTER TABLE `saree_variants`
  ADD CONSTRAINT `saree_variants_ibfk_1` FOREIGN KEY (`saree_id`) REFERENCES `sarees` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `story_approvals`
--
ALTER TABLE `story_approvals`
  ADD CONSTRAINT `story_approvals_ibfk_1` FOREIGN KEY (`story_id`) REFERENCES `weaver_stories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `story_approvals_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `weaver_stories`
--
ALTER TABLE `weaver_stories`
  ADD CONSTRAINT `weaver_stories_ibfk_1` FOREIGN KEY (`weaver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`saree_id`) REFERENCES `sarees` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
