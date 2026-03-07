const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Add Student (Admin Side)
router.post('/students/add', authController.addStudent);

// Student Login
router.post('/student/login', authController.studentLogin);

// Get Student Profile
const authMiddleware = require('../middleware/authMiddleware');
router.get('/student/me', authMiddleware, authController.getStudentProfile);

// Reset Password
router.post('/student/reset-password', authMiddleware, authController.resetPassword);

module.exports = router;
