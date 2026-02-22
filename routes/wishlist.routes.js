const express = require('express');
const router = express.Router();
const WishlistController = require('../controllers/wishlist.controller');
const { requireAuth } = require('../middleware/auth');

// All wishlist routes require authentication
router.use(requireAuth);

router.get('/', WishlistController.getWishlist);
router.post('/add', WishlistController.addToWishlist);
router.post('/toggle', WishlistController.toggleWishlist);
router.get('/check/:sareeId', WishlistController.checkWishlist);
router.delete('/:sareeId', WishlistController.removeFromWishlist);

module.exports = router;
