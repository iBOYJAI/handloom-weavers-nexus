// Offer Routes
const express = require('express');
const router = express.Router();
const OfferController = require('../controllers/offer.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// Get active offers (public)
router.get('/offers/active', OfferController.getActiveOffers);

// Get all offers (public, but filtered)
router.get('/offers', OfferController.getAllOffers);

// Get offer by ID (public)
router.get('/offers/:id', OfferController.getOfferById);

// Admin only routes - Apply middleware specifically
// Create offer
router.post('/offers', requireAuth, requireRole('admin'), OfferController.createOffer);

// Update offer
router.put('/offers/:id', requireAuth, requireRole('admin'), OfferController.updateOffer);

// Delete offer
router.delete('/offers/:id', requireAuth, requireRole('admin'), OfferController.deleteOffer);

module.exports = router;

