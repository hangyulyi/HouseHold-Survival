const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const pool   = require('../db');

const VALID_CODES = ['us', 'in', 'ke', 'se', 'br'];

// POST /api/auth/register
const register = async (req, res) => {
  const { email, password, username, country_code } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (country_code && !VALID_CODES.includes(country_code)) {
    return res.status(400).json({ error: `country_code must be one of: ${VALID_CODES.join(', ')}` });
  }

  try {
    const existing = await pool.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, username, country_code)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, email, username, country_code, created_at`,
      [email, password_hash, username || null, country_code || null]
    );

    const user = result.rows[0];

    // Create leaderboard entry
    await pool.query(
      `INSERT INTO leaderboard (user_id, country_code, total_score) VALUES ($1, $2, 0)`,
      [user.user_id, country_code || null]
    );

    // Create opening game session
    await pool.query(
      `INSERT INTO game_sessions (user_id, country_code)
       VALUES ($1, $2)`,
      [user.user_id, country_code || null]
    );

    const token = jwt.sign(
      { id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({ message: 'User registered successfully.', token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user  = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: {
        user_id:      user.user_id,
        email:        user.email,
        username:     user.username,
        country_code: user.country_code,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { register, login };