const pool = require('../db');

const getAllCountries = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         country_code, country_name, flag_emoji,
         starting_money, starting_health, starting_stress,
         starting_happiness, starting_debt,
         difficulty_label, visual_setting, ambient_sound, intro_text
       FROM countries
       ORDER BY country_name ASC`
    );
    res.json({ countries: result.rows });
  } catch (err) {
    console.error('getAllCountries error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const getCountryByCode = async (req, res) => {
  const { code } = req.params;
  try {
    const countryResult = await pool.query(
      'SELECT * FROM countries WHERE country_code = $1', [code]
    );

    if (countryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Country not found.' });
    }

    const eventsResult = await pool.query(
      `SELECT * FROM country_events
       WHERE country_code = $1
       ORDER BY event_phase ASC`,
      [code]
    );

    res.json({
      country: countryResult.rows[0],
      events:  eventsResult.rows,
    });
  } catch (err) {
    console.error('getCountryByCode error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const getCountryEventByPhase = async (req, res) => {
  const { code, phase } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM country_events
       WHERE country_code = $1 AND event_phase = $2`,
      [code, parseInt(phase)]
    );

    res.json({ event: result.rows[0] || null });
  } catch (err) {
    console.error('getCountryEventByPhase error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getAllCountries, getCountryByCode, getCountryEventByPhase };