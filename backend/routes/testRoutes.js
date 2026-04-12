const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

// Direct push test (no auth required for diagnostics, keep it private)
router.post('/test/push', testController.testDirectPush);

module.exports = router;
