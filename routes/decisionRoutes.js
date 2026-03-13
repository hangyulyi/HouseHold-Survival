const express = require('express');
const router  = express.Router();
const { submitDecision, submitEventDecision } = require('../controllers/decisionController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/submit',       authenticateToken, submitDecision);
router.post('/submit-event', authenticateToken, submitEventDecision);

module.exports = router;