// Lazy-load cloudinary + multer to reduce cold starts.
// These are only needed for POST /student/complete-setup (profile image upload).
let _cloudinary = null;
let _uploadProfile = null;
let _uploadDocument = null;

const getCloudinary = () => {
    if (!_cloudinary) {
        _cloudinary = require('cloudinary').v2;
        _cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
    }
    return _cloudinary;
};

const getUploadProfile = () => {
    if (!_uploadProfile) {
        const { CloudinaryStorage } = require('multer-storage-cloudinary');
        const multer = require('multer');

        const profileStorage = new CloudinaryStorage({
            cloudinary: getCloudinary(),
            params: {
                folder: 'student_profiles',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                transformation: [{ width: 500, height: 500, crop: 'limit' }]
            }
        });
        _uploadProfile = multer({ storage: profileStorage });
    }
    return _uploadProfile;
};

const getUploadDocument = () => {
    if (!_uploadDocument) {
        const { CloudinaryStorage } = require('multer-storage-cloudinary');
        const multer = require('multer');

        const genericStorage = new CloudinaryStorage({
            cloudinary: getCloudinary(),
            params: {
                folder: 'student_documents',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
            }
        });
        _uploadDocument = multer({ storage: genericStorage });
    }
    return _uploadDocument;
};

// Backwards-compatible named exports using getters
module.exports = {
    get cloudinary() { return getCloudinary(); },
    get uploadProfile() { return getUploadProfile(); },
    get uploadDocument() { return getUploadDocument(); }
};
