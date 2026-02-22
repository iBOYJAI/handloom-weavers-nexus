const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Ensure upload directories exist
const uploadDirs = ['uploads/sarees', 'uploads/stories', 'uploads/avatars'];
uploadDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// Configure storage for saree images
const sareeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/sarees/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'saree-' + uniqueSuffix + ext);
    }
});

// Configure storage for weaver stories
const storyStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/stories/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'story-' + uniqueSuffix + ext);
    }
});

// Configure storage for user avatars
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, 'avatar-' + uniqueSuffix + ext);
    }
});

// File filter for images (sarees)
const imageFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, and WebP images are allowed.'), false);
    }
};

// File filter for stories (images or videos)
const storyFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'video/mp4', 'video/webm'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images (JPG, PNG, WebP) and videos (MP4, WebM) are allowed.'), false);
    }
};

// Multer upload configurations
const uploadSareeImages = multer({
    storage: sareeStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: parseInt(process.env.UPLOAD_MAX_IMAGE_SIZE) || 5242880 // 5MB default
    }
});

const uploadStoryMedia = multer({
    storage: storyStorage,
    fileFilter: storyFilter,
    limits: {
        fileSize: parseInt(process.env.UPLOAD_MAX_VIDEO_SIZE) || 52428800 // 50MB default
    }
});

const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: parseInt(process.env.UPLOAD_MAX_IMAGE_SIZE) || 5242880 // 5MB default
    }
});

// Middleware to handle multer errors
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Images max 5MB, videos max 50MB.'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    next();
};

module.exports = {
    uploadSareeImages,
    uploadStoryMedia,
    uploadAvatar,
    handleUploadError
};

