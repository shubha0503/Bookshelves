const { pool } = require('../config/db');

const ALLOWED_STATUSES = ['READING', 'COMPLETED', 'WANT_TO_READ', 'PAUSED'];

/**
 * Helper to compute progress percentage
 */
function computeProgress(currentPage, totalPages) {
  if (!totalPages || totalPages <= 0) return 0;
  const pct = Math.round((currentPage / totalPages) * 100);
  return Math.max(0, Math.min(100, pct));
}

/**
 * Get all books for current user with filtering, searching, and sorting
 */
async function getBooks(req, res, next) {
  try {
    const userId = req.session.userId;
    const { status, search, genre, sort = 'created_at', order = 'desc' } = req.query;

    let query = `
      SELECT 
        id, user_id, title, author, cover_url, genre, 
        publication_year, isbn, total_pages, current_page, 
        status, rating, review, started_at, completed_at, 
        created_at, updated_at
      FROM books
      WHERE user_id = ?
    `;
    const params = [userId];

    // Status filter
    if (status && status.toUpperCase() !== 'ALL') {
      const upperStatus = status.toUpperCase();
      if (ALLOWED_STATUSES.includes(upperStatus)) {
        query += ' AND status = ?';
        params.push(upperStatus);
      }
    }

    // Genre filter
    if (genre && genre.trim() !== '') {
      query += ' AND genre = ?';
      params.push(genre.trim());
    }

    // Search filter (title or author)
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      query += ' AND (title LIKE ? OR author LIKE ?)';
      params.push(searchTerm, searchTerm);
    }

    // Safe Sorting mapping
    const sortMapping = {
      title: 'title',
      author: 'author',
      rating: 'rating',
      date_added: 'created_at',
      created_at: 'created_at',
      date_completed: 'completed_at',
      completed_at: 'completed_at',
      current_page: 'current_page'
    };

    const sortBy = sortMapping[sort.toLowerCase()] || 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Handle null values for completed_at / rating gracefully
    if (sortBy === 'completed_at' || sortBy === 'rating') {
      query += ` ORDER BY ${sortBy} IS NULL, ${sortBy} ${sortOrder}`;
    } else {
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
    }

    const [books] = await pool.execute(query, params);

    // Format books with computed progress percentage
    const formattedBooks = books.map(book => ({
      ...book,
      progress_percentage: computeProgress(book.current_page, book.total_pages)
    }));

    return res.status(200).json({
      success: true,
      data: {
        total: formattedBooks.length,
        books: formattedBooks
      }
    });
  } catch (err) {
    next(err);
  }
}

/** Public, read-only owner-curated shelf for the storefront. */
async function getPublicShelf(req, res, next) {
  try {
    const [books] = await pool.execute(`
      SELECT id, title, author, NULL AS cover_url, status
      FROM curated_books
      ORDER BY title ASC
    `);

    return res.status(200).json({ success: true, data: { books } });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single book detail by ID with linked highlights and journal reflections
 */
async function getBookById(req, res, next) {
  try {
    const userId = req.session.userId;
    const bookId = parseInt(req.params.id, 10);

    if (isNaN(bookId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid book ID.'
      });
    }

    // 1. Fetch Book
    const [books] = await pool.execute(
      'SELECT * FROM books WHERE id = ? AND user_id = ? LIMIT 1',
      [bookId, userId]
    );

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Book not found.'
      });
    }

    const book = books[0];
    book.progress_percentage = computeProgress(book.current_page, book.total_pages);

    // 2. Fetch linked highlights for this book
    const [highlights] = await pool.execute(
      'SELECT id, passage, page_number, personal_note, created_at FROM highlights WHERE book_id = ? AND user_id = ? ORDER BY created_at DESC',
      [bookId, userId]
    );

    // 3. Fetch linked journal entries for this book with tags
    const [journalEntries] = await pool.execute(`
      SELECT 
        j.id, j.title, j.content, j.created_at, j.updated_at,
        GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ',') as tags
      FROM journal_entries j
      LEFT JOIN journal_entry_tags jet ON j.id = jet.journal_entry_id
      LEFT JOIN journal_tags t ON jet.tag_id = t.id
      WHERE j.book_id = ? AND j.user_id = ?
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `, [bookId, userId]);

    const formattedJournalEntries = journalEntries.map(entry => ({
      ...entry,
      tags: entry.tags ? entry.tags.split(',') : []
    }));

    return res.status(200).json({
      success: true,
      data: {
        book,
        highlights,
        journal_entries: formattedJournalEntries
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new book
 */
async function createBook(req, res, next) {
  try {
    const userId = req.session.userId;
    const {
      title,
      author,
      cover_url,
      genre,
      publication_year,
      isbn,
      total_pages = 0,
      current_page = 0,
      status = 'WANT_TO_READ',
      rating,
      review,
      started_at,
      completed_at
    } = req.body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Book title is required.'
      });
    }

    if (!author || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Book author is required.'
      });
    }

    const upperStatus = status.toUpperCase();
    if (!ALLOWED_STATUSES.includes(upperStatus)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`
      });
    }

    const parsedTotalPages = Math.max(0, parseInt(total_pages, 10) || 0);
    const parsedCurrentPage = Math.max(0, parseInt(current_page, 10) || 0);

    if (parsedTotalPages > 0 && parsedCurrentPage > parsedTotalPages) {
      return res.status(400).json({
        success: false,
        error: 'Current page cannot exceed total pages.'
      });
    }

    let parsedRating = null;
    if (rating !== undefined && rating !== null && rating !== '') {
      parsedRating = parseInt(rating, 10);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be an integer between 1 and 5.'
        });
      }
    }

    // Auto-dates based on status if not provided
    let autoStartedAt = started_at || null;
    let autoCompletedAt = completed_at || null;

    if (upperStatus === 'READING' && !autoStartedAt) {
      autoStartedAt = new Date().toISOString().split('T')[0];
    } else if (upperStatus === 'COMPLETED' && !autoCompletedAt) {
      autoCompletedAt = new Date().toISOString().split('T')[0];
    }

    const [result] = await pool.execute(`
      INSERT INTO books (
        user_id, title, author, cover_url, genre, 
        publication_year, isbn, total_pages, current_page, 
        status, rating, review, started_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      title.trim(),
      author.trim(),
      cover_url ? cover_url.trim() : null,
      genre ? genre.trim() : null,
      publication_year ? parseInt(publication_year, 10) : null,
      isbn ? isbn.trim() : null,
      parsedTotalPages,
      parsedCurrentPage,
      upperStatus,
      parsedRating,
      review ? review.trim() : null,
      autoStartedAt,
      autoCompletedAt
    ]);

    const newBookId = result.insertId;

    const [created] = await pool.execute(
      'SELECT * FROM books WHERE id = ?',
      [newBookId]
    );

    const book = created[0];
    book.progress_percentage = computeProgress(book.current_page, book.total_pages);

    return res.status(201).json({
      success: true,
      message: 'Book added to your library successfully.',
      data: { book }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update an existing book
 */
async function updateBook(req, res, next) {
  try {
    const userId = req.session.userId;
    const bookId = parseInt(req.params.id, 10);

    if (isNaN(bookId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid book ID.'
      });
    }

    // Check ownership
    const [existing] = await pool.execute(
      'SELECT * FROM books WHERE id = ? AND user_id = ? LIMIT 1',
      [bookId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Book not found or access denied.'
      });
    }

    const currentBook = existing[0];
    const {
      title = currentBook.title,
      author = currentBook.author,
      cover_url = currentBook.cover_url,
      genre = currentBook.genre,
      publication_year = currentBook.publication_year,
      isbn = currentBook.isbn,
      total_pages = currentBook.total_pages,
      current_page = currentBook.current_page,
      status = currentBook.status,
      rating = currentBook.rating,
      review = currentBook.review,
      started_at = currentBook.started_at,
      completed_at = currentBook.completed_at
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Book title is required.'
      });
    }

    if (!author || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Book author is required.'
      });
    }

    const upperStatus = status.toUpperCase();
    if (!ALLOWED_STATUSES.includes(upperStatus)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`
      });
    }

    const parsedTotalPages = Math.max(0, parseInt(total_pages, 10) || 0);
    const parsedCurrentPage = Math.max(0, parseInt(current_page, 10) || 0);

    if (parsedTotalPages > 0 && parsedCurrentPage > parsedTotalPages) {
      return res.status(400).json({
        success: false,
        error: 'Current page cannot exceed total pages.'
      });
    }

    let parsedRating = null;
    if (rating !== undefined && rating !== null && rating !== '') {
      parsedRating = parseInt(rating, 10);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be an integer between 1 and 5.'
        });
      }
    }

    await pool.execute(`
      UPDATE books SET
        title = ?,
        author = ?,
        cover_url = ?,
        genre = ?,
        publication_year = ?,
        isbn = ?,
        total_pages = ?,
        current_page = ?,
        status = ?,
        rating = ?,
        review = ?,
        started_at = ?,
        completed_at = ?
      WHERE id = ? AND user_id = ?
    `, [
      title.trim(),
      author.trim(),
      cover_url ? cover_url.trim() : null,
      genre ? genre.trim() : null,
      publication_year ? parseInt(publication_year, 10) : null,
      isbn ? isbn.trim() : null,
      parsedTotalPages,
      parsedCurrentPage,
      upperStatus,
      parsedRating,
      review !== undefined && review !== null ? review.trim() : null,
      started_at || null,
      completed_at || null,
      bookId,
      userId
    ]);

    const [updated] = await pool.execute('SELECT * FROM books WHERE id = ?', [bookId]);
    const book = updated[0];
    book.progress_percentage = computeProgress(book.current_page, book.total_pages);

    return res.status(200).json({
      success: true,
      message: 'Book updated successfully.',
      data: { book }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update reading progress (Current page and auto-adjust status)
 */
async function updateProgress(req, res, next) {
  try {
    const userId = req.session.userId;
    const bookId = parseInt(req.params.id, 10);

    if (isNaN(bookId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid book ID.'
      });
    }

    const { current_page, status } = req.body;

    if (current_page === undefined || current_page === null) {
      return res.status(400).json({
        success: false,
        error: 'current_page is required.'
      });
    }

    const newPage = parseInt(current_page, 10);
    if (isNaN(newPage) || newPage < 0) {
      return res.status(400).json({
        success: false,
        error: 'current_page must be a non-negative integer.'
      });
    }

    // Fetch existing book
    const [existing] = await pool.execute(
      'SELECT * FROM books WHERE id = ? AND user_id = ? LIMIT 1',
      [bookId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Book not found.'
      });
    }

    const book = existing[0];
    const totalPages = book.total_pages || 0;

    if (totalPages > 0 && newPage > totalPages) {
      return res.status(400).json({
        success: false,
        error: `Current page cannot exceed total pages (${totalPages}).`
      });
    }

    let newStatus = status ? status.toUpperCase() : book.status;
    let completedAt = book.completed_at;
    let startedAt = book.started_at;
    const today = new Date().toISOString().split('T')[0];

    // If target page hits or exceeds total pages
    if (totalPages > 0 && newPage >= totalPages) {
      newStatus = 'COMPLETED';
      if (!completedAt) completedAt = today;
    } else if (newPage > 0 && newStatus === 'WANT_TO_READ') {
      newStatus = 'READING';
      if (!startedAt) startedAt = today;
    }

    if (newStatus === 'COMPLETED' && !completedAt) {
      completedAt = today;
    }

    await pool.execute(`
      UPDATE books SET
        current_page = ?,
        status = ?,
        started_at = ?,
        completed_at = ?
      WHERE id = ? AND user_id = ?
    `, [
      newPage,
      newStatus,
      startedAt,
      completedAt,
      bookId,
      userId
    ]);

    const [updated] = await pool.execute('SELECT * FROM books WHERE id = ?', [bookId]);
    const updatedBook = updated[0];
    updatedBook.progress_percentage = computeProgress(updatedBook.current_page, updatedBook.total_pages);

    return res.status(200).json({
      success: true,
      message: 'Reading progress updated successfully.',
      data: { book: updatedBook }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a book
 */
async function deleteBook(req, res, next) {
  try {
    const userId = req.session.userId;
    const bookId = parseInt(req.params.id, 10);

    if (isNaN(bookId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid book ID.'
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM books WHERE id = ? AND user_id = ?',
      [bookId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Book not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Book removed from library successfully.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBooks,
  getPublicShelf,
  getBookById,
  createBook,
  updateBook,
  updateProgress,
  deleteBook
};
