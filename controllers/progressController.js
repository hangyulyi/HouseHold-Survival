const pool = require('../db');

// GET /api/progress
const getProgress = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await pool.query(
      'SELECT * FROM player_progress WHERE user_id = $1', [user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No progress found for this user.' });
    }
    res.json({ progress: result.rows[0] });
  } catch (err) {
    console.error('getProgress error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/progress/reset
const resetProgress = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await pool.query(
      `UPDATE player_progress
       SET health = 100, money = 500, happiness = 100,
           current_scenario = 1, last_updated = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [user_id]
    );
    res.json({ message: 'Progress reset successfully.', progress: result.rows[0] });
  } catch (err) {
    console.error('resetProgress error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getProgress, resetProgress };