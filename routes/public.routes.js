// Public routes - accessible without authentication (guest viewing)
const express = require('express');
const router = express.Router();
const BuyerController = require('../controllers/buyer.controller');

// Public saree viewing routes (no auth required)
router.get('/sarees', BuyerController.getSarees);
router.get('/sarees/search', BuyerController.searchSarees);
router.get('/sarees/:id', BuyerController.getSareeDetail);
router.get('/stories', BuyerController.getApprovedStories);
router.get('/stories/:id', BuyerController.getStoryDetail);

module.exports = router;

