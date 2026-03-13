const express = require('express');
const router  = express.Router();
const { getProgress, getLeaderboard, resetProgress } = require('../controllers/progressController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/',            authenticateToken, getProgress);
router.get('/leaderboard', authenticateToken, getLeaderboard);
router.post('/reset',      authenticateToken, resetProgress);

module.exports = router;