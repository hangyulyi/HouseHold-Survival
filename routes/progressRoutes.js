const express = require('express');
const router = express.Router();
const { getProgress, resetProgress } = require('../controllers/progressController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, getProgress);
router.post('/reset', authenticateToken, resetProgress);

module.exports = router;