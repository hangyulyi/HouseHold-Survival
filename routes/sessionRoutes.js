const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const pool = require('../db');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT gs.*, c.country_name, c.flag_emoji
       FROM game_sessions gs
       LEFT JOIN countries c ON c.country_code = gs.country_code
       WHERE gs.user_id = $1
       ORDER BY gs.started_at DESC`,
      [req.user.id]
    );
    res.json({ sessions: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/start', authenticateToken, async (req, res) => {
  const { country_code, character_name } = req.body;

  const validCodes = ['us', 'in', 'ke', 'se', 'br'];
  if (country_code && !validCodes.includes(country_code)) {
    return res.status(400).json({ error: `country_code must be one of: ${validCodes.join(', ')}` });
  }

  try {
    const result = await pool.query(
      `INSERT INTO game_sessions (user_id, country_code, character_name)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, country_code || null, character_name || null]
    );

    let countryConfig = null;
    if (country_code) {
      const cr = await pool.query(
        'SELECT * FROM countries WHERE country_code = $1', [country_code]
      );
      countryConfig = cr.rows[0] || null;
    }

    res.status(201).json({
      session:        result.rows[0],
      country_config: countryConfig,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;