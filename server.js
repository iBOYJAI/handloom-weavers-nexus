const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'handloom_nexus',
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 minutes
    expiration: 86400000 // 24 hours
});

app.use(session({
    key: 'session_cookie_name',
    secret: process.env.SESSION_SECRET || 'handloom_nexus_secret_key_change_in_production_2024',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 86400000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' // Allows cookies to be sent with same-site requests
    }
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Chart.js (offline) - serve from node_modules
app.get('/js/chart.umd.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules', 'chart.js', 'dist', 'chart.umd.js'));
});

// API routes - Order matters! Public routes first
app.use('/api/auth', require('./routes/auth.routes'));

// Public routes (must be before protected routes)
const CategoryController = require('./controllers/category.controller');
app.get('/api/categories', CategoryController.getCategories);

// Notification routes (accessible to all users, including guests - returns 0 for guests)
// MUST be before protected routes to avoid middleware conflicts
const NotificationController = require('./controllers/notification.controller');
app.get('/api/notifications/unread-count', NotificationController.getUnreadCount);

// Protected routes (require specific authentication/roles)
// Mount specific paths BEFORE generic paths
app.use('/api/weaver', require('./routes/weaver.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

app.use('/api', require('./routes/public.routes')); // Public routes (guest viewing)
app.use('/api', require('./routes/offer.routes')); // Offer routes (has public routes)

// User profile routes (must be before generic /api routes to match /api/users/profile)
app.use('/api/users', require('./routes/user.routes'));

const { requireAuth } = require('./middleware/auth');
app.get('/api/notifications', requireAuth, NotificationController.getNotifications);
app.patch('/api/notifications/read-all', requireAuth, NotificationController.markAllRead);
app.patch('/api/notifications/:id/read', requireAuth, NotificationController.markAsRead);

// Remaining protected routes
app.use('/api', require('./routes/buyer.routes')); // Buyer routes (auth required)
app.use('/api', require('./routes/variant.routes')); // Variant routes
app.use('/api/wishlist', require('./routes/wishlist.routes')); // Wishlist routes


// Health / API test route – confirms server and public API are reachable
app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        message: 'API is running',
        endpoints: { sarees: 'GET /api/sarees', categories: 'GET /api/categories' }
    });
});

// Debug route to check session (remove before production)
app.get('/api/debug/session', (req, res) => {
    res.json({
        session: req.session,
        sessionID: req.sessionID,
        userId: req.session?.userId || null,
        role: req.session?.role || null,
        email: req.session?.email || null,
        name: req.session?.name || null,
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Handle root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve HTML pages and static files
app.get('*', (req, res, next) => {
    // Skip API routes (already handled above)
    if (req.path.startsWith('/api/')) {
        return next();
    }

    // Serve static files (HTML, CSS, JS, images, etc.)
    const filePath = path.join(__dirname, 'public', req.path);
    res.sendFile(filePath, (err) => {
        if (err && err.status === 404) {
            // Silently ignore missing static assets (fonts, images, etc.)
            // Only show 404 for HTML pages
            if (req.path.endsWith('.html') || !req.path.includes('.')) {
                // If file not found, try adding .html extension for pages
                if (!req.path.includes('.')) {
                    const htmlPath = path.join(__dirname, 'public', req.path + '.html');
                    res.sendFile(htmlPath, (err2) => {
                        if (err2) {
                            // Still not found, send 404 page
                            res.status(404).sendFile(path.join(__dirname, 'public', 'pages', '404.html'));
                        }
                    });
                } else {
                    // Send 404 page for HTML files
                    res.status(404).sendFile(path.join(__dirname, 'public', 'pages', '404.html'));
                }
            } else {
                // For other missing files (CSS, JS, images), just return 404 without error
                res.status(404).end();
            }
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Static files served from: ${path.join(__dirname, 'public')}`);
});

