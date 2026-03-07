const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create different storage profiles if needed
// Profile Image Storage Profile
const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'student_profiles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
});

// Generic Storage Profile (for future use: certificates, receipts, etc)
const genericStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'student_documents',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    }
});

const uploadProfile = multer({ storage: profileStorage });
const uploadDocument = multer({ storage: genericStorage });

module.exports = {
    cloudinary,
    uploadProfile,
    uploadDocument
};
