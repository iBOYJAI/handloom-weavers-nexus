/**
 * User Controller - Profile and avatar management for authenticated users
 * Handles PUT /api/users/profile and POST /api/users/avatar
 */
const UserModel = require('../models/user.model');

const UserController = {
    /**
     * Get current user profile
     * Requires authentication
     */
    async getProfile(req, res) {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated'
                });
            }

            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    region: user.region,
                    phone: user.phone,
                    address: user.address || '',
                    avatar: user.avatar,
                    isApproved: user.is_approved,
                    isSuspended: user.is_suspended,
                    createdAt: user.created_at
                }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch profile'
            });
        }
    },

    /**
     * Update current user profile (name, region, phone)
     * Requires authentication
     */
    async updateProfile(req, res) {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated'
                });
            }

            const { name, region, phone, address } = req.body;

            const updateData = {};
            if (name !== undefined && typeof name === 'string' && name.trim().length >= 3 && name.length <= 60) {
                updateData.name = name.trim();
            }
            if (region !== undefined) {
                updateData.region = region ? String(region).trim().slice(0, 100) : null;
            }
            if (phone !== undefined) {
                updateData.phone = phone ? String(phone).trim().slice(0, 20) : null;
            }
            if (address !== undefined) {
                updateData.address = typeof address === 'string' ? address.trim().slice(0, 500) : null;
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid fields to update'
                });
            }

            const success = await UserModel.update(userId, updateData);
            if (!success) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to update profile'
                });
            }

            const updatedUser = await UserModel.findById(userId);
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    region: updatedUser.region,
                    phone: updatedUser.phone,
                    avatar: updatedUser.avatar,
                    isApproved: updatedUser.is_approved
                }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile'
            });
        }
    },

    /**
     * Upload avatar image for current user
     * Requires authentication, multer single('avatar') middleware
     */
    async uploadAvatar(req, res) {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated'
                });
            }

            if (!req.file || !req.file.path) {
                return res.status(400).json({
                    success: false,
                    message: 'No avatar file uploaded'
                });
            }

            const avatarPath = '/uploads/avatars/' + req.file.filename;
            const success = await UserModel.update(userId, { avatar: avatarPath });

            if (!success) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to save avatar'
                });
            }

            res.json({
                success: true,
                message: 'Avatar uploaded successfully',
                data: { avatar: avatarPath }
            });
        } catch (error) {
            console.error('Upload avatar error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload avatar'
            });
        }
    }
};

module.exports = UserController;
