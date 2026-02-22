// Variant Routes
const express = require('express');
const router = express.Router();
const VariantController = require('../controllers/variant.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { uploadSareeImages } = require('../middleware/upload');

// Public routes (no auth required)
// Get variants for a saree (public for buyers)
router.get('/sarees/:sareeId/variants', VariantController.getVariants);

// Get available colors/designs (public)
router.get('/sarees/:sareeId/colors', VariantController.getColors);
router.get('/sarees/:sareeId/designs', VariantController.getDesigns);

// Protected routes (require authentication and specific roles)
// Create variant (weaver/admin only)
router.post('/sarees/:sareeId/variants',
    requireAuth,
    requireRole('weaver', 'admin'),
    uploadSareeImages.single('image'),
    VariantController.createVariant
);

// Update variant (weaver/admin only)
router.put('/variants/:variantId',
    requireAuth,
    requireRole('weaver', 'admin'),
    uploadSareeImages.single('image'),
    VariantController.updateVariant
);

// Delete variant (weaver/admin only)
router.delete('/variants/:variantId',
    requireAuth,
    requireRole('weaver', 'admin'),
    VariantController.deleteVariant
);

module.exports = router;

