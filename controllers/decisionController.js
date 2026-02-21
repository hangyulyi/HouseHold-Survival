const pool = require('../db');

// POST /api/decisions/submit
const submitDecision = async (req, res) => {
  const { decision_id, scenario_id } = req.body;
  const user_id = req.user.id;

  if (!decision_id || !scenario_id) {
    return res.status(400).json({ error: 'decision_id and scenario_id are required.' });
  }

  try {
    // Fetch the chosen decision
    const decisionResult = await pool.query(
      'SELECT * FROM decisions WHERE decision_id = $1', [decision_id]
    );
    if (decisionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Decision not found.' });
    }

    const decision = decisionResult.rows[0];

    // Upsert player_progress for this scenario
    const existing = await pool.query(
      `SELECT * FROM player_progress WHERE user_id = $1 AND scenario_id = $2`,
      [user_id, scenario_id]
    );

    let progress;
    if (existing.rows.length === 0) {
      // First time playing this scenario
      const inserted = await pool.query(
        `INSERT INTO player_progress (user_id, scenario_id, score, completed, last_played)
         VALUES ($1, $2, $3, TRUE, NOW())
         RETURNING *`,
        [user_id, scenario_id, decision.impact_score]
      );
      progress = inserted.rows[0];
    } else {
      // Update existing progress
      const updated = await pool.query(
        `UPDATE player_progress
         SET score = score + $1, completed = TRUE, last_played = NOW()
         WHERE user_id = $2 AND scenario_id = $3
         RETURNING *`,
        [decision.impact_score, user_id, scenario_id]
      );
      progress = updated.rows[0];
    }

    // Update leaderboard total score
    await pool.query(
      `UPDATE leaderboard
       SET total_score = total_score + $1
       WHERE user_id = $2`,
      [decision.impact_score, user_id]
    );

    res.json({
      message: 'Decision submitted successfully.',
      chosen_decision: decision,
      updated_progress: progress
    });
  } catch (err) {
    console.error('submitDecision error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { submitDecision };