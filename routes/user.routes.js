/**
 * User routes - Profile and avatar for authenticated users
 * Mount at /api/users - specific paths must be registered before generic /api routers
 */
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { uploadAvatar, handleUploadError } = require('../middleware/upload');

// All user routes require authentication + buyer, weaver, or admin role
router.use(requireAuth);
router.use(requireRole('buyer', 'admin', 'weaver'));

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.post('/avatar', uploadAvatar.single('avatar'), handleUploadError, UserController.uploadAvatar);

module.exports = router;
