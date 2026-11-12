const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

/**
 * Register a new user
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid name (at least 2 characters).'
      });
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check if user already exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [cleanEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [cleanName, cleanEmail, passwordHash]
    );

    const userId = result.insertId;

    // Set default reading goal for current year
    const currentYear = new Date().getFullYear();
    await pool.execute(
      'INSERT IGNORE INTO reading_goals (user_id, year, target_books) VALUES (?, ?, ?)',
      [userId, currentYear, 12]
    );

    // Save session
    req.session.userId = userId;

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: {
          id: userId,
          name: cleanName,
          email: cleanEmail
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Log in an existing user
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Fetch user
    const [users] = await pool.execute(
      'SELECT id, name, email, password_hash, created_at FROM users WHERE email = ? LIMIT 1',
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    // Set session
    req.session.userId = user.id;

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.created_at
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Log out current session
 */
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Could not log out. Please try again.'
      });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  });
}

/**
 * Get currently authenticated user
 */
async function getMe(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated.'
      });
    }

    const [users] = await pool.execute(
      'SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1',
      [req.session.userId]
    );

    if (users.length === 0) {
      // Stale session
      req.session.destroy(() => {});
      return res.status(401).json({
        success: false,
        error: 'User account no longer exists.'
      });
    }

    const user = users[0];
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.created_at
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe
};
