const pool = require('../db');

const getAllScenarios = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scenarios ORDER BY phase_number ASC'
    );
    res.json({ scenarios: result.rows });
  } catch (err) {
    console.error('getAllScenarios error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const getScenarioById = async (req, res) => {
  const { id }      = req.params;
  const { country } = req.query;

  try {
    const scenarioResult = await pool.query(
      'SELECT * FROM scenarios WHERE scenario_id = $1', [id]
    );

    if (scenarioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Scenario not found.' });
    }

    const scenario = scenarioResult.rows[0];

    const decisionsResult = await pool.query(
      'SELECT * FROM decisions WHERE scenario_id = $1 ORDER BY decision_id ASC', [id]
    );

    let countryEvent = null;
    if (country) {
      const eventResult = await pool.query(
        `SELECT * FROM country_events
         WHERE country_code = $1 AND event_phase = $2`,
        [country, scenario.phase_number]
      );
      countryEvent = eventResult.rows[0] || null;
    }

    res.json({
      scenario,
      decisions:     decisionsResult.rows,
      country_event: countryEvent,
    });
  } catch (err) {
    console.error('getScenarioById error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getAllScenarios, getScenarioById };