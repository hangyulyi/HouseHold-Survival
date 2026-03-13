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

module.exports = { getProgress, getLeaderboard, resetProgress };