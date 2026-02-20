const pool = require('../db');

// POST /api/decisions/submit
const submitDecision = async (req, res) => {
  const { decision_id } = req.body;
  const user_id = req.user.id;

  if (!decision_id) {
    return res.status(400).json({ error: 'decision_id is required.' });
  }

  try {
    const decisionResult = await pool.query(
      'SELECT * FROM decisions WHERE id = $1', [decision_id]
    );
    if (decisionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Decision not found.' });
    }

    const decision = decisionResult.rows[0];

    const progressResult = await pool.query(
      'SELECT * FROM player_progress WHERE user_id = $1', [user_id]
    );
    if (progressResult.rows.length === 0) {
      return res.status(404).json({ error: 'Player progress not found.' });
    }

    const progress = progressResult.rows[0];

    const newHealth    = Math.max(0, Math.min(100, progress.health + decision.health_impact));
    const newMoney     = Math.max(0, progress.money + decision.money_impact);
    const newHappiness = Math.max(0, Math.min(100, progress.happiness + decision.happiness_impact));
    const nextScenario = progress.current_scenario + 1;

    const updated = await pool.query(
      `UPDATE player_progress
       SET health = $1, money = $2, happiness = $3,
           current_scenario = $4, last_updated = NOW()
       WHERE user_id = $5
       RETURNING *`,
      [newHealth, newMoney, newHappiness, nextScenario, user_id]
    );

    res.json({
      message: 'Decision submitted successfully.',
      chosen_decision: decision,
      updated_progress: updated.rows[0]
    });
  } catch (err) {
    console.error('submitDecision error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { submitDecision };