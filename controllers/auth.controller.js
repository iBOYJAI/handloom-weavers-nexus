const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const NotificationModel = require('../models/notification.model');

const AuthController = {
    // Register a new user
    async register(req, res) {
        try {
            const { name, email, password, role, region, phone } = req.body;

            // Validation
            if (!name || name.length < 3 || name.length > 60) {
                return res.status(400).json({
                    success: false,
                    message: 'Name must be between 3 and 60 characters'
                });
            }

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid email is required'
                });
            }

            if (!password || password.length < 8 || password.length > 64) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be between 8 and 64 characters'
                });
            }

            if (role && !['buyer', 'weaver'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role. Must be buyer or weaver'
                });
            }

            // Check if user already exists
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create user
            const userId = await UserModel.create({
                name,
                email,
                passwordHash,
                role: role || 'buyer',
                region: region || null,
                phone: phone || null,
                avatar: null
            });

            // If weaver, create notification for admin approval
            if (role === 'weaver') {
                // Get all admins and notify them (simplified - just log for now)
                // In production, you'd fetch all admins and create notifications
            }

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: {
                    userId,
                    role: role || 'buyer'
                }
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                message: 'Registration failed'
            });
        }
    },

    // Login user
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Find user
            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Check if user is suspended
            if (user.is_suspended) {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been suspended. Contact support for assistance.'
                });
            }

            // Allow weavers to log in even if not approved - they'll see pending approval page

            // Create session
            req.session.userId = user.id;
            req.session.role = user.role;
            req.session.email = user.email;
            req.session.name = user.name;
            req.session.is_approved = user.is_approved;

            // Explicitly save session before responding
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Session error'
                    });
                }

                const weaverRedirect = (user.role === 'weaver' && !user.is_approved)
                    ? '/pages/weaver-pending.html'
                    : '/pages/weaver-dashboard.html';
                res.json({
                    success: true,
                    message: 'Login successful',
                    data: {
                        userId: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        isApproved: user.is_approved,
                        redirectTo: user.role === 'buyer' ? '/pages/buyer-home.html' :
                                    user.role === 'weaver' ? weaverRedirect :
                                    '/pages/admin-dashboard.html'
                    }
                });
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed'
            });
        }
    },

    // Logout user
    async logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Logout failed'
                });
            }
            // Clear the session cookie (use the same key as in server.js)
            res.clearCookie('session_cookie_name');
            res.json({
                success: true,
                message: 'Logout successful'
            });
        });
    },

    // Get current user
    async getMe(req, res) {
        try {
            if (!req.session || !req.session.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated'
                });
            }

            const user = await UserModel.findById(req.session.userId);
            if (!user) {
                req.session.destroy();
                return res.status(401).json({
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
                    isApproved: user.is_approved
                }
            });
        } catch (error) {
            console.error('Get me error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user info'
            });
        }
    }
};

module.exports = AuthController;

