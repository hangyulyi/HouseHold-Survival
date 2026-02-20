const express = require('express');
const router = express.Router();
const { submitDecision } = require('../controllers/decisionController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/submit', authenticateToken, submitDecision);

module.exports = router;