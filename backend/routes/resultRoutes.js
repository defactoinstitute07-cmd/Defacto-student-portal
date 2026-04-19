const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const authMiddleware = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cache');

router.get('/', authMiddleware, cacheMiddleware(120), resultController.getStudentResults);
router.get('/leaderboard', authMiddleware, cacheMiddleware(180), resultController.getLeaderboard);

module.exports = router;
