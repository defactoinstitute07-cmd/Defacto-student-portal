const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadProfile } = require('../config/cloudinary');

// Add Student (Admin Side)
router.post('/students/add', authController.addStudent);

// Student Login
router.post('/student/login', authController.studentLogin);

// Get Student Profile
router.get('/student/me', authMiddleware, authController.getStudentProfile);

// Reset Password
router.post('/student/reset-password', authMiddleware, authController.resetPassword);

// Complete Setup (First Login)
router.post('/student/complete-setup', authMiddleware, uploadProfile.single('profileImage'), authController.completeSetup);

module.exports = router;
