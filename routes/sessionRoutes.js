const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const pool = require('../db');
const { getCountryConditions } = require('../services/worldBankService');

// GET /api/sessions — all sessions for this player
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
    console.error('GET /sessions error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/sessions/start
// Body: { country_code, character_name }
router.post('/start', authenticateToken, async (req, res) => {
  const { country_code, character_name } = req.body;

  const validCodes = ['us', 'in', 'ke', 'se', 'br'];
  if (country_code && !validCodes.includes(country_code)) {
    return res.status(400).json({
      error: `country_code must be one of: ${validCodes.join(', ')}`
    });
  }

  try {
    // 1. Get hardcoded config from DB
    const cr = await pool.query(
      'SELECT * FROM countries WHERE country_code = $1',
      [country_code]
    );
    const countryConfig = cr.rows[0] || null;

    // 2. Fetch live World Bank data (non-blocking — falls back to DB if it fails)
    let mergedConfig = countryConfig;
    try {
      const wbData = await getCountryConditions(country_code);

      mergedConfig = {
        ...countryConfig,
        starting_money:        wbData.derived_starting_money        ?? countryConfig.starting_money,
        starting_health:       wbData.derived_starting_health       ?? countryConfig.starting_health,
        healthcare_cost_mult:  wbData.derived_healthcare_cost_mult  ?? countryConfig.healthcare_cost_mult,
        education_access_mult: wbData.derived_education_access_mult ?? countryConfig.education_access_mult,
        world_bank_data: {
          gni_per_capita:  wbData.wb_gni_per_capita,
          life_expectancy: wbData.wb_life_expectancy,
          poverty_rate:    wbData.wb_poverty_rate,
        }
      };
    } catch (wbErr) {
      // World Bank API is down or slow — just use DB defaults, don't crash
      console.warn('World Bank fetch failed, using DB defaults:', wbErr.message);
    }

    // 3. Create the session
    const result = await pool.query(
      `INSERT INTO game_sessions (user_id, country_code, character_name)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, country_code || null, character_name || null]
    );

    res.status(201).json({
      session:        result.rows[0],
      country_config: mergedConfig,
    });
  } catch (err) {
    console.error('POST /sessions/start error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;