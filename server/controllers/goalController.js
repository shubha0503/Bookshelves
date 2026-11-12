const { pool } = require('../config/db');

/**
 * Get reading goal for a specific year (default: current year)
 */
async function getGoal(req, res, next) {
  try {
    const userId = req.session.userId;
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    // 1. Fetch reading goal target
    const [goals] = await pool.execute(
      'SELECT id, user_id, year, target_books, created_at, updated_at FROM reading_goals WHERE user_id = ? AND year = ? LIMIT 1',
      [userId, year]
    );

    const targetBooks = goals.length > 0 ? goals[0].target_books : 12;

    // 2. Count completed books for that specific year
    // Check completed_at year or status = 'COMPLETED'
    const [completedRows] = await pool.execute(`
      SELECT COUNT(*) AS completed_count
      FROM books
      WHERE user_id = ?
        AND status = 'COMPLETED'
        AND (
          YEAR(completed_at) = ? 
          OR (completed_at IS NULL AND YEAR(updated_at) = ?)
        )
    `, [userId, year, year]);

    const completedCount = completedRows[0].completed_count || 0;
    const progressPercentage = targetBooks > 0 
      ? Math.min(100, Math.round((completedCount / targetBooks) * 100))
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        year,
        target_books: targetBooks,
        completed_count: completedCount,
        progress_percentage: progressPercentage,
        remaining_books: Math.max(0, targetBooks - completedCount)
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Set or update reading goal target for a year
 */
async function setGoal(req, res, next) {
  try {
    const userId = req.session.userId;
    const { year, target_books } = req.body;

    const targetYear = parseInt(year, 10) || new Date().getFullYear();
    const targetCount = parseInt(target_books, 10);

    if (isNaN(targetCount) || targetCount < 1 || targetCount > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Target books must be a positive integer between 1 and 1000.'
      });
    }

    await pool.execute(`
      INSERT INTO reading_goals (user_id, year, target_books)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE target_books = VALUES(target_books)
    `, [userId, targetYear, targetCount]);

    // Recalculate
    const [completedRows] = await pool.execute(`
      SELECT COUNT(*) AS completed_count
      FROM books
      WHERE user_id = ?
        AND status = 'COMPLETED'
        AND (
          YEAR(completed_at) = ? 
          OR (completed_at IS NULL AND YEAR(updated_at) = ?)
        )
    `, [userId, targetYear, targetYear]);

    const completedCount = completedRows[0].completed_count || 0;
    const progressPercentage = targetCount > 0 
      ? Math.min(100, Math.round((completedCount / targetCount) * 100))
      : 0;

    return res.status(200).json({
      success: true,
      message: `Reading goal for ${targetYear} set to ${targetCount} books.`,
      data: {
        year: targetYear,
        target_books: targetCount,
        completed_count: completedCount,
        progress_percentage: progressPercentage,
        remaining_books: Math.max(0, targetCount - completedCount)
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getGoal,
  setGoal
};
