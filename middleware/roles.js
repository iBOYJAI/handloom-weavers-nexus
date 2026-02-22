// Role-based access control middleware
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        // Must check session exists AND userId exists
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }
        
        const userRole = (req.session.role || '').toString().toLowerCase();
        const allowedLower = allowedRoles.map(r => (r || '').toString().toLowerCase());
        
        // Check if role exists and is in allowed roles (case-insensitive)
        if (!userRole || !allowedLower.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }
        
        next();
    };
};

// Special middleware for weaver routes - also checks if approved
// Admins can also access weaver routes
const requireWeaverApproved = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    
    const role = (req.session.role || '').toString().toLowerCase();
    // Allow admin to access weaver routes
    if (role === 'admin') {
        return next();
    }
    
    if (role !== 'weaver') {
        return res.status(403).json({
            success: false,
            message: 'Weaver access required'
        });
    }
    
    // Check if weaver is approved (this will be checked in controller)
    // We'll verify is_approved in the controller after fetching user from DB
    next();
};

module.exports = { requireRole, requireWeaverApproved };

