// Variant Controller
const VariantModel = require('../models/variant.model');
const SareeModel = require('../models/saree.model');

const VariantController = {
    // Get variants for a saree
    async getVariants(req, res) {
        try {
            const { sareeId } = req.params;
            const variants = await VariantModel.findBySareeId(sareeId, true);
            
            res.json({
                success: true,
                data: variants
            });
        } catch (error) {
            console.error('Get variants error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch variants'
            });
        }
    },

    // Create variant (weaver/admin)
    async createVariant(req, res) {
        try {
            const { sareeId } = req.params;
            const { colorName, colorCode, designName, designDescription, stock, priceAdjustment } = req.body;
            
            // Validate saree exists and belongs to weaver (if weaver)
            const saree = await SareeModel.findById(sareeId);
            if (!saree) {
                return res.status(404).json({
                    success: false,
                    message: 'Saree not found'
                });
            }
            
            // Check if weaver owns this saree (unless admin)
            if (req.session.userRole === 'weaver' && saree.weaver_id !== req.session.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only add variants to your own sarees'
                });
            }
            
            // Validate required fields
            if (!colorName || !colorCode || !designName) {
                return res.status(400).json({
                    success: false,
                    message: 'Color name, color code, and design name are required'
                });
            }
            
            // Handle image upload
            const imagePath = req.file ? `/uploads/sarees/${req.file.filename}` : null;
            if (!imagePath) {
                return res.status(400).json({
                    success: false,
                    message: 'Variant image is required'
                });
            }
            
            const variantId = await VariantModel.create({
                sareeId: parseInt(sareeId),
                colorName,
                colorCode,
                designName,
                designDescription,
                imagePath,
                stock: stock || 0,
                priceAdjustment: priceAdjustment || 0
            });
            
            res.json({
                success: true,
                data: { id: variantId },
                message: 'Variant created successfully'
            });
        } catch (error) {
            console.error('Create variant error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create variant'
            });
        }
    },

    // Update variant
    async updateVariant(req, res) {
        try {
            const { variantId } = req.params;
            const updateData = {};
            
            if (req.body.colorName) updateData.colorName = req.body.colorName;
            if (req.body.colorCode) updateData.colorCode = req.body.colorCode;
            if (req.body.designName) updateData.designName = req.body.designName;
            if (req.body.designDescription !== undefined) updateData.designDescription = req.body.designDescription;
            if (req.body.stock !== undefined) updateData.stock = parseInt(req.body.stock);
            if (req.body.priceAdjustment !== undefined) updateData.priceAdjustment = parseFloat(req.body.priceAdjustment);
            if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive === true;
            
            if (req.file) {
                updateData.imagePath = `/uploads/sarees/${req.file.filename}`;
            }
            
            const updated = await VariantModel.update(variantId, updateData);
            
            if (updated) {
                res.json({
                    success: true,
                    message: 'Variant updated successfully'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Variant not found'
                });
            }
        } catch (error) {
            console.error('Update variant error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update variant'
            });
        }
    },

    // Delete variant
    async deleteVariant(req, res) {
        try {
            const { variantId } = req.params;
            const deleted = await VariantModel.delete(variantId);
            
            if (deleted) {
                res.json({
                    success: true,
                    message: 'Variant deleted successfully'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Variant not found'
                });
            }
        } catch (error) {
            console.error('Delete variant error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete variant'
            });
        }
    },

    // Get available colors for saree
    async getColors(req, res) {
        try {
            const { sareeId } = req.params;
            const colors = await VariantModel.getAvailableColors(sareeId);
            
            res.json({
                success: true,
                data: colors
            });
        } catch (error) {
            console.error('Get colors error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch colors'
            });
        }
    },

    // Get available designs for saree
    async getDesigns(req, res) {
        try {
            const { sareeId } = req.params;
            const designs = await VariantModel.getAvailableDesigns(sareeId);
            
            res.json({
                success: true,
                data: designs
            });
        } catch (error) {
            console.error('Get designs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch designs'
            });
        }
    }
};

module.exports = VariantController;

