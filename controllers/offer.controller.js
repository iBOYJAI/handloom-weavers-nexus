// Offer Controller
const OfferModel = require('../models/offer.model');

const OfferController = {
    // Get all offers
    async getAllOffers(req, res) {
        try {
            const filters = {
                activeOnly: req.query.activeOnly === 'true',
                type: req.query.type || null,
                categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : null
            };
            
            const offers = await OfferModel.findAll(filters);
            
            res.json({
                success: true,
                data: offers
            });
        } catch (error) {
            console.error('Get offers error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch offers'
            });
        }
    },

    // Get active offers
    async getActiveOffers(req, res) {
        try {
            const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : null;
            const offers = await OfferModel.getActiveOffers(categoryId);
            
            res.json({
                success: true,
                data: offers
            });
        } catch (error) {
            console.error('Get active offers error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch active offers'
            });
        }
    },

    // Get offer by ID
    async getOfferById(req, res) {
        try {
            const { id } = req.params;
            const offer = await OfferModel.findById(id);
            
            if (offer) {
                res.json({
                    success: true,
                    data: offer
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Offer not found'
                });
            }
        } catch (error) {
            console.error('Get offer error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch offer'
            });
        }
    },

    // Create offer (admin only)
    async createOffer(req, res) {
        try {
            const { title, description, type, value, startDate, endDate, categoryId } = req.body;
            
            // Validation
            if (!title || !type || value === undefined || !startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Title, type, value, start date, and end date are required'
                });
            }
            
            if (!['percentage', 'fixed', 'free_shipping', 'bogo'].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid offer type'
                });
            }
            
            const valueNum = parseFloat(value);
            if (isNaN(valueNum) || valueNum < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid offer value'
                });
            }
            
            // Validate dates
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (end < start) {
                return res.status(400).json({
                    success: false,
                    message: 'End date must be after start date'
                });
            }
            
            const offerId = await OfferModel.create({
                title,
                description,
                type,
                value: valueNum,
                startDate,
                endDate,
                categoryId: categoryId ? parseInt(categoryId) : null
            });
            
            res.json({
                success: true,
                data: { id: offerId },
                message: 'Offer created successfully'
            });
        } catch (error) {
            console.error('Create offer error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create offer'
            });
        }
    },

    // Update offer (admin only)
    async updateOffer(req, res) {
        try {
            const { id } = req.params;
            const updateData = {};
            
            if (req.body.title) updateData.title = req.body.title;
            if (req.body.description !== undefined) updateData.description = req.body.description;
            if (req.body.type) updateData.type = req.body.type;
            if (req.body.value !== undefined) updateData.value = parseFloat(req.body.value);
            if (req.body.startDate) updateData.startDate = req.body.startDate;
            if (req.body.endDate) updateData.endDate = req.body.endDate;
            if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive === true;
            if (req.body.categoryId !== undefined) updateData.categoryId = req.body.categoryId ? parseInt(req.body.categoryId) : null;
            
            const updated = await OfferModel.update(id, updateData);
            
            if (updated) {
                res.json({
                    success: true,
                    message: 'Offer updated successfully'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Offer not found'
                });
            }
        } catch (error) {
            console.error('Update offer error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update offer'
            });
        }
    },

    // Delete offer (admin only)
    async deleteOffer(req, res) {
        try {
            const { id } = req.params;
            const deleted = await OfferModel.delete(id);
            
            if (deleted) {
                res.json({
                    success: true,
                    message: 'Offer deleted successfully'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Offer not found'
                });
            }
        } catch (error) {
            console.error('Delete offer error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete offer'
            });
        }
    }
};

module.exports = OfferController;

