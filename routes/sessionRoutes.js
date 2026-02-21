const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const pool = require('../db');

// GET /api/sessions — get all sessions for this player
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM game_sessions
       WHERE user_id = $1
       ORDER BY started_at DESC`,
      [req.user.id]
    );
    res.json({ sessions: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/sessions/start — start a new session
router.post('/start', authenticateToken, async (req, res) => {
  const { country } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO game_sessions (user_id, country)
       VALUES ($1, $2) RETURNING *`,
      [req.user.id, country || null]
    );
    res.status(201).json({ session: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;