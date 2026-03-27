const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');

// These endpoints are protected using an "x-admin-push-key" header.
// Set ADMIN_PUSH_API_KEY in backend .env and send the same value from your admin client.

// Broadcast to all students who have at least one registered device token
router.post('/notifications/broadcast', notificationController.broadcastToAllStudents);

// Send to a specific list of student IDs
router.post('/notifications/students', notificationController.sendToSpecificStudents);

module.exports = router;
