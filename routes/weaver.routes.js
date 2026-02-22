const express = require('express');
const router = express.Router();
const WeaverController = require('../controllers/weaver.controller');
const { requireAuth } = require('../middleware/auth');
const { requireWeaverApproved } = require('../middleware/roles');
const { uploadSareeImages, uploadStoryMedia, handleUploadError } = require('../middleware/upload');

// All routes require authentication and weaver role
router.use(requireAuth);
router.use(requireWeaverApproved);

// Dashboard
router.get('/dashboard', WeaverController.getDashboard);

// Orders (weaver's orders - orders containing their sarees)
router.get('/orders', WeaverController.getOrders);
router.put('/orders/:id/status', WeaverController.updateOrderStatus);

// Saree routes
router.get('/sarees', WeaverController.getMySarees);
router.get('/sarees/:id', WeaverController.getSareeById);
router.post('/sarees', uploadSareeImages.array('images', 5), handleUploadError, WeaverController.uploadSaree);
router.put('/sarees/:id', uploadSareeImages.array('images', 5), handleUploadError, WeaverController.updateSaree);
router.delete('/sarees/:id', WeaverController.deleteSaree);
router.delete('/sarees/images/:id', WeaverController.deleteSareeImage);

// Story routes
router.get('/stories', WeaverController.getMyStories);
router.post('/stories', uploadStoryMedia.array('media', 5), handleUploadError, WeaverController.uploadStory);
router.delete('/stories/:id', WeaverController.deleteStory);

// Sales report
router.get('/sales-report', WeaverController.getSalesReport);

module.exports = router;

