const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// All routes require authentication and admin role
router.use(requireAuth);
router.use(requireRole('admin'));

// Dashboard
router.get('/dashboard', AdminController.getDashboard);

// User management
router.get('/users', AdminController.getUsers);
router.put('/users/:id/approve', AdminController.approveWeaver);
router.put('/users/:id/reject', AdminController.rejectWeaver);
router.put('/users/:id/suspend', AdminController.suspendUser);
router.put('/users/:id/reactivate', AdminController.reactivateUser);
router.put('/users/:id', AdminController.updateUser);

// Saree management
router.get('/sarees', AdminController.getSarees);
router.put('/sarees/:id/deactivate', AdminController.deactivateSaree);
router.put('/sarees/:id/activate', AdminController.activateSaree);
router.delete('/sarees/:id', AdminController.deleteSaree);

// Order management
router.get('/orders', AdminController.getOrders);
router.put('/orders/:id/status', AdminController.updateOrderStatus);

// Category management
router.get('/categories', AdminController.getCategories);
router.post('/categories', AdminController.createCategory);
router.put('/categories/:id', AdminController.updateCategory);

// Analytics
router.get('/analytics', AdminController.getAnalytics);
router.get('/report', AdminController.getReport);

// Approval management
router.get('/approvals', AdminController.getPendingApprovals);
router.put('/sarees/:id/approve', AdminController.approveSaree);
router.put('/sarees/:id/reject', AdminController.rejectSaree);
router.put('/stories/:id/approve', AdminController.approveStory);
router.put('/stories/:id/reject', AdminController.rejectStory);
router.post('/sarees/bulk-approve', AdminController.bulkApproveSarees);

module.exports = router;

