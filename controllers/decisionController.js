const pool = require('../db');

// POST /api/decisions/submit
const submitDecision = async (req, res) => {
  const { decision_id, scenario_id } = req.body;
  const user_id = req.user.id;

  if (!decision_id || !scenario_id) {
    return res.status(400).json({ error: 'decision_id and scenario_id are required.' });
  }

  try {
    const decisionResult = await pool.query(
      'SELECT * FROM decisions WHERE decision_id = $1', [decision_id]
    );
    if (decisionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Decision not found.' });
    }

    const decision = decisionResult.rows[0];

    const existing = await pool.query(
      `SELECT * FROM player_progress WHERE user_id = $1 AND scenario_id = $2`,
      [user_id, scenario_id]
    );

    let progress;
    if (existing.rows.length === 0) {
      const inserted = await pool.query(
        `INSERT INTO player_progress (user_id, scenario_id, score, completed, last_played)
         VALUES ($1, $2, $3, TRUE, NOW()) RETURNING *`,
        [user_id, scenario_id, decision.impact_score]
      );
      progress = inserted.rows[0];
    } else {
      const updated = await pool.query(
        `UPDATE player_progress
         SET score = score + $1, completed = TRUE, last_played = NOW()
         WHERE user_id = $2 AND scenario_id = $3 RETURNING *`,
        [decision.impact_score, user_id, scenario_id]
      );
      progress = updated.rows[0];
    }

    // Update leaderboard
    await pool.query(
      `UPDATE leaderboard SET total_score = total_score + $1 WHERE user_id = $2`,
      [decision.impact_score, user_id]
    );

    // ── Phase 7: Calculate final outcome ──────────────────────────
    let finalOutcome = null;
    if (scenario_id === 7) {
      // Get total score across all scenarios
      const scoreResult = await pool.query(
        `SELECT SUM(score) as total FROM player_progress WHERE user_id = $1`,
        [user_id]
      );
      const total = parseInt(scoreResult.rows[0].total) || 0;

      // Determine ending based on accumulated score
      if      (total >= 60) finalOutcome = 'Stabilized Household';
      else if (total >= 35) finalOutcome = 'Economic Survival, Social Loss';
      else if (total >= 10) finalOutcome = 'Cycle of Poverty Continues';
      else                  finalOutcome = 'Crisis State — Household Collapses';

      // Save final outcome to game_sessions
      await pool.query(
        `UPDATE game_sessions
         SET final_ending = $1, total_score = $2, completed_at = NOW()
         WHERE user_id = $3 AND completed_at IS NULL`,
        [finalOutcome, total, user_id]
      );
    }

    res.json({
      message: 'Decision submitted successfully.',
      chosen_decision:  decision,
      updated_progress: progress,
      final_outcome:    finalOutcome  // null for phases 1-6, string for phase 7
    });
  } catch (err) {
    console.error('submitDecision error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { submitDecision };