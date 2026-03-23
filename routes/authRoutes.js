const express = require('express');
const router  = express.Router();
const { register, login, updateProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login',    login);
router.patch('/update',  authenticateToken, updateProfile);

module.exports = router;