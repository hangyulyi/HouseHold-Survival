const pool = require('../db');

// GET /api/progress — all scenarios progress for this player
const getProgress = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT pp.*, s.title, s.difficulty
       FROM player_progress pp
       JOIN scenarios s ON s.scenario_id = pp.scenario_id
       WHERE pp.user_id = $1
       ORDER BY pp.scenario_id ASC`,
      [user_id]
    );
    res.json({ progress: result.rows });
  } catch (err) {
    console.error('getProgress error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/progress/leaderboard — top 10 scores
const getLeaderboard = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.leaderboard_id, u.email, l.total_score
       FROM leaderboard l
       JOIN users u ON u.user_id = l.user_id
       ORDER BY l.total_score DESC
       LIMIT 10`
    );
    res.json({ leaderboard: result.rows });
  } catch (err) {
    console.error('getLeaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/progress/reset
const resetProgress = async (req, res) => {
  const user_id = req.user.id;
  try {
    await pool.query(
      `DELETE FROM player_progress WHERE user_id = $1`, [user_id]
    );
    await pool.query(
      `UPDATE leaderboard SET total_score = 0 WHERE user_id = $1`, [user_id]
    );
    res.json({ message: 'Progress reset successfully.' });
  } catch (err) {
    console.error('resetProgress error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getProgress, getLeaderboard, resetProgress };