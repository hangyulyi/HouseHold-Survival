const pool = require('../db');

// GET /api/scenarios
const getAllScenarios = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scenarios ORDER BY scenario_id ASC'
    );
    res.json({ scenarios: result.rows });
  } catch (err) {
    console.error('getAllScenarios error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/scenarios/:id
const getScenarioById = async (req, res) => {
  const { id } = req.params;
  try {
    const scenarioResult = await pool.query(
      'SELECT * FROM scenarios WHERE scenario_id = $1', [id]
    );
    if (scenarioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Scenario not found.' });
    }

    const decisionsResult = await pool.query(
      'SELECT * FROM decisions WHERE scenario_id = $1', [id]
    );

    res.json({
      scenario: scenarioResult.rows[0],
      decisions: decisionsResult.rows
    });
  } catch (err) {
    console.error('getScenarioById error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getAllScenarios, getScenarioById };