const pool = require('../db');

const getProgress = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT pp.*, s.title, s.phase_number, s.difficulty
       FROM player_progress pp
       JOIN scenarios s ON s.scenario_id = pp.scenario_id
       WHERE pp.user_id = $1
       ORDER BY s.phase_number ASC`,
      [user_id]
    );
    res.json({ progress: result.rows });
  } catch (err) {
    console.error('getProgress error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const getLeaderboard = async (req, res) => {
  const { country } = req.query;
  try {
    let query, params;
    if (country) {
      query = `
        SELECT l.leaderboard_id, u.username, u.email, l.country_code, l.total_score
        FROM leaderboard l
        JOIN users u ON u.user_id = l.user_id
        WHERE l.country_code = $1
        ORDER BY l.total_score DESC
        LIMIT 10`;
      params = [country];
    } else {
      query = `
        SELECT l.leaderboard_id, u.username, u.email, l.country_code, l.total_score
        FROM leaderboard l
        JOIN users u ON u.user_id = l.user_id
        ORDER BY l.total_score DESC
        LIMIT 10`;
      params = [];
    }
    const result = await pool.query(query, params);
    res.json({ leaderboard: result.rows });
  } catch (err) {
    console.error('getLeaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const resetProgress = async (req, res) => {
  const user_id = req.user.id;
  try {
    await pool.query('DELETE FROM player_progress WHERE user_id = $1', [user_id]);
    await pool.query('UPDATE leaderboard SET total_score = 0 WHERE user_id = $1', [user_id]);
    res.json({ message: 'Progress reset successfully.' });
  } catch (err) {
    console.error('resetProgress error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/progress/summary
// Powers the final result screen in Unity
const getProgressSummary = async (req, res) => {
  const user_id = req.user.id;

  try {
    // 1. Per-phase breakdown — what decision the player made each phase and its scores
    const phaseResult = await pool.query(
      `SELECT
         pp.scenario_id,
         pp.score,
         s.phase_number,
         s.title,
         d.choice_text,
         d.economic_score,
         d.social_score,
         d.health_score
       FROM player_progress pp
       JOIN scenarios s ON s.scenario_id = pp.scenario_id
       JOIN decisions d ON d.decision_id = pp.decision_id
       WHERE pp.user_id = $1
       ORDER BY s.phase_number ASC`,
      [user_id]
    );

    // 2. Cumulative totals across all phases
    const totalsResult = await pool.query(
      `SELECT
         COALESCE(SUM(pp.score), 0)           AS total_score,
         COALESCE(SUM(d.economic_score), 0)   AS total_economic,
         COALESCE(SUM(d.social_score), 0)     AS total_social,
         COALESCE(SUM(d.health_score), 0)     AS total_health
       FROM player_progress pp
       JOIN decisions d ON d.decision_id = pp.decision_id
       WHERE pp.user_id = $1`,
      [user_id]
    );

    // 3. Most recent completed session — ending label, country, character name
    const sessionResult = await pool.query(
      `SELECT final_ending, total_score, country_code, character_name
       FROM game_sessions
       WHERE user_id = $1
       ORDER BY completed_at DESC
       LIMIT 1`,
      [user_id]
    );

    res.json({
      phases:  phaseResult.rows,
      totals:  totalsResult.rows[0],
      session: sessionResult.rows[0] || null,
    });
  } catch (err) {
    console.error('getProgressSummary error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getProgress, getLeaderboard, resetProgress, getProgressSummary };