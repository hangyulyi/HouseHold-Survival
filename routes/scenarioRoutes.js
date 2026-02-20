const express = require('express');
const router = express.Router();
const { getAllScenarios, getScenarioById } = require('../controllers/scenarioController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, getAllScenarios);
router.get('/:id', authenticateToken, getScenarioById);

module.exports = router;