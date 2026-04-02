const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const mobileAuthController = require('../controllers/mobileAuthController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadProfile } = require('../config/cloudinary');
const { cacheMiddleware } = require('../middleware/cache');

// Add Student (Admin Side)
router.post('/students/add', authController.addStudent);

// Student Login
router.post('/student/login', authController.studentLogin);
router.get('/student/login', (req, res) => {
	res.status(405).json({
		success: false,
		message: 'Use POST /api/student/login for authentication.'
	});
});
router.post('/student/mobile/login', mobileAuthController.mobileLogin);
router.post('/student/mobile/refresh', mobileAuthController.mobileRefresh);
router.post('/student/mobile/logout', mobileAuthController.mobileLogout);
router.get('/student/mobile/session', ...mobileAuthController.mobileSession);

// Get Student Profile
router.get('/student/me', authMiddleware, cacheMiddleware(30), authController.getStudentProfile);

// Device registration + activity tracking
router.post('/student/device', authMiddleware, authController.registerDevice);
router.post('/student/activity', authMiddleware, authController.trackActivity);

// Get Subject Attendance Detail
router.get('/student/attendance/subject/:subjectId', authMiddleware, authController.getSubjectAttendanceDetail);

// Reset Password
router.post('/student/reset-password', authMiddleware, authController.resetPassword);

// Complete Setup (First Login)
router.post('/student/complete-setup', authMiddleware, uploadProfile.single('profileImage'), authController.completeSetup);

module.exports = router;
