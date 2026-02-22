// Authentication middleware - checks if user is logged in
const requireAuth = (req, res, next) => {
    // Check if session exists and has userId
    if (!req.session || !req.session.userId) {
        // If API request, return JSON error
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }
        
        // Otherwise redirect to login
        return res.redirect('/pages/login.html');
    }
    
    // Ensure role is set in session (for compatibility)
    if (!req.session.role && req.session.userId) {
        // Role should be set on login, but if missing, we'll allow it through
        // The controller can handle missing role if needed
    }
    
    next();
};

module.exports = { requireAuth };

