const { pool } = require('../config/db');

/**
 * Get comprehensive editorial dashboard statistics for the logged-in user
 */
async function getDashboardStats(req, res, next) {
  try {
    const userId = req.session.userId;
    const currentYear = new Date().getFullYear();

    // 1. Book status counts & total pages read
    const [countsRows] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_books,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS books_completed,
        SUM(CASE WHEN status = 'READING' THEN 1 ELSE 0 END) AS books_reading,
        SUM(CASE WHEN status = 'WANT_TO_READ' THEN 1 ELSE 0 END) AS books_want_to_read,
        SUM(CASE WHEN status = 'PAUSED' THEN 1 ELSE 0 END) AS books_paused,
        SUM(
          CASE 
            WHEN status = 'COMPLETED' THEN GREATEST(current_page, total_pages)
            ELSE current_page
          END
        ) AS total_pages_read
      FROM books
      WHERE user_id = ?
    `, [userId]);

    const stats = countsRows[0] || {};
    const totalBooks = parseInt(stats.total_books || 0, 10);
    const completedBooks = parseInt(stats.books_completed || 0, 10);
    const readingBooks = parseInt(stats.books_reading || 0, 10);
    const wantToReadBooks = parseInt(stats.books_want_to_read || 0, 10);
    const pausedBooks = parseInt(stats.books_paused || 0, 10);
    const totalPagesRead = parseInt(stats.total_pages_read || 0, 10);

    // 2. Yearly Reading Goal
    const [goalRows] = await pool.execute(
      'SELECT target_books FROM reading_goals WHERE user_id = ? AND year = ? LIMIT 1',
      [userId, currentYear]
    );
    const targetBooks = goalRows.length > 0 ? goalRows[0].target_books : 12;

    const [currentYearCompletedRows] = await pool.execute(`
      SELECT COUNT(*) AS count
      FROM books
      WHERE user_id = ?
        AND status = 'COMPLETED'
        AND (
          YEAR(completed_at) = ? 
          OR (completed_at IS NULL AND YEAR(updated_at) = ?)
        )
    `, [userId, currentYear, currentYear]);

    const currentYearCompleted = currentYearCompletedRows[0].count || 0;
    const goalPercentage = targetBooks > 0 
      ? Math.min(100, Math.round((currentYearCompleted / targetBooks) * 100))
      : 0;

    // 3. Recently Added Books (Up to 5)
    const [recentlyAdded] = await pool.execute(`
      SELECT id, title, author, cover_url, genre, status, rating, current_page, total_pages, created_at
      FROM books
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `, [userId]);

    // 4. Recently Completed Books (Up to 5)
    const [recentlyCompleted] = await pool.execute(`
      SELECT id, title, author, cover_url, genre, rating, review, completed_at
      FROM books
      WHERE user_id = ? AND status = 'COMPLETED'
      ORDER BY completed_at DESC, updated_at DESC
      LIMIT 5
    `, [userId]);

    // 5. Monthly Reading Activity for the past 12 months
    // Aggregates completed books per month
    const [monthlyRows] = await pool.execute(`
      SELECT 
        DATE_FORMAT(completed_at, '%Y-%m') AS month,
        COUNT(*) AS books_completed,
        SUM(total_pages) AS pages_read
      FROM books
      WHERE user_id = ? 
        AND status = 'COMPLETED'
        AND completed_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(completed_at, '%Y-%m')
      ORDER BY month ASC
    `, [userId]);

    // 6. Random Saved Quote / Highlight
    const [quoteRows] = await pool.execute(`
      SELECT 
        h.id, h.passage, h.page_number, h.personal_note,
        b.title AS book_title, b.author AS book_author
      FROM highlights h
      LEFT JOIN books b ON h.book_id = b.id
      WHERE h.user_id = ?
      ORDER BY RAND()
      LIMIT 1
    `, [userId]);

    const randomQuote = quoteRows.length > 0 ? quoteRows[0] : null;

    // 7. Total Journal Entries count
    const [journalCountRows] = await pool.execute(
      'SELECT COUNT(*) as count FROM journal_entries WHERE user_id = ?',
      [userId]
    );
    const totalJournalEntries = journalCountRows[0].count || 0;

    return res.status(200).json({
      success: true,
      data: {
        counts: {
          total_books: totalBooks,
          completed: completedBooks,
          reading: readingBooks,
          want_to_read: wantToReadBooks,
          paused: pausedBooks,
          total_pages_read: totalPagesRead,
          journal_entries: totalJournalEntries
        },
        yearly_goal: {
          year: currentYear,
          target_books: targetBooks,
          completed_books: currentYearCompleted,
          percentage: goalPercentage,
          remaining_books: Math.max(0, targetBooks - currentYearCompleted)
        },
        recently_added: recentlyAdded,
        recently_completed: recentlyCompleted,
        monthly_activity: monthlyRows,
        random_quote: randomQuote
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats
};
