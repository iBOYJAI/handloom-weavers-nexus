const express = require('express');
const router = express.Router();
const BuyerController = require('../controllers/buyer.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// Note: Saree viewing routes moved to public.routes.js for guest access

// Middleware to check if user can access buyer features
// Weavers can also add items to cart (they might want to buy from other weavers)
const canAccessBuyerFeatures = requireRole('buyer', 'admin', 'weaver');

// Cart routes
router.post('/cart/add', requireAuth, canAccessBuyerFeatures, BuyerController.addToCart);
router.get('/cart', requireAuth, canAccessBuyerFeatures, BuyerController.getCart);
router.put('/cart/:id', requireAuth, canAccessBuyerFeatures, BuyerController.updateCart);
router.delete('/cart/:id', requireAuth, canAccessBuyerFeatures, BuyerController.removeFromCart);

// Order routes
router.post('/orders', requireAuth, canAccessBuyerFeatures, BuyerController.createOrder);
router.get('/orders', requireAuth, canAccessBuyerFeatures, BuyerController.getOrders);

module.exports = router;

