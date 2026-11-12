const { pool } = require('../config/db');

/**
 * Get highlights with optional search and book_id filter
 */
async function getHighlights(req, res, next) {
  try {
    const userId = req.session.userId;
    const { search, book_id } = req.query;

    let query = `
      SELECT 
        h.id, h.user_id, h.book_id, h.passage, h.page_number, h.personal_note, h.created_at,
        b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url
      FROM highlights h
      LEFT JOIN books b ON h.book_id = b.id
      WHERE h.user_id = ?
    `;
    const params = [userId];

    if (book_id) {
      query += ' AND h.book_id = ?';
      params.push(parseInt(book_id, 10));
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += ' AND (h.passage LIKE ? OR h.personal_note LIKE ? OR b.title LIKE ?)';
      params.push(term, term, term);
    }

    query += ' ORDER BY h.created_at DESC';

    const [highlights] = await pool.execute(query, params);

    return res.status(200).json({
      success: true,
      data: {
        total: highlights.length,
        highlights
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get a single highlight by ID
 */
async function getHighlightById(req, res, next) {
  try {
    const userId = req.session.userId;
    const highlightId = parseInt(req.params.id, 10);

    if (isNaN(highlightId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid highlight ID.'
      });
    }

    const [rows] = await pool.execute(`
      SELECT 
        h.id, h.user_id, h.book_id, h.passage, h.page_number, h.personal_note, h.created_at,
        b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url
      FROM highlights h
      LEFT JOIN books b ON h.book_id = b.id
      WHERE h.id = ? AND h.user_id = ?
      LIMIT 1
    `, [highlightId, userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Highlight not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: { highlight: rows[0] }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new highlight / passage
 */
async function createHighlight(req, res, next) {
  try {
    const userId = req.session.userId;
    const { passage, book_id, page_number, personal_note } = req.body;

    if (!passage || typeof passage !== 'string' || passage.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Passage text is required.'
      });
    }

    let linkedBookId = null;
    if (book_id) {
      const parsedBookId = parseInt(book_id, 10);
      const [bookCheck] = await pool.execute(
        'SELECT id FROM books WHERE id = ? AND user_id = ? LIMIT 1',
        [parsedBookId, userId]
      );
      if (bookCheck.length > 0) {
        linkedBookId = parsedBookId;
      }
    }

    const parsedPage = page_number !== undefined && page_number !== null && page_number !== ''
      ? Math.max(1, parseInt(page_number, 10))
      : null;

    const [result] = await pool.execute(`
      INSERT INTO highlights (user_id, book_id, passage, page_number, personal_note)
      VALUES (?, ?, ?, ?, ?)
    `, [
      userId,
      linkedBookId,
      passage.trim(),
      parsedPage,
      personal_note ? personal_note.trim() : null
    ]);

    const highlightId = result.insertId;

    const [created] = await pool.execute(`
      SELECT 
        h.id, h.user_id, h.book_id, h.passage, h.page_number, h.personal_note, h.created_at,
        b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url
      FROM highlights h
      LEFT JOIN books b ON h.book_id = b.id
      WHERE h.id = ?
    `, [highlightId]);

    return res.status(201).json({
      success: true,
      message: 'Highlight saved to your collection.',
      data: { highlight: created[0] }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update an existing highlight
 */
async function updateHighlight(req, res, next) {
  try {
    const userId = req.session.userId;
    const highlightId = parseInt(req.params.id, 10);

    if (isNaN(highlightId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid highlight ID.'
      });
    }

    // Verify ownership
    const [existing] = await pool.execute(
      'SELECT * FROM highlights WHERE id = ? AND user_id = ? LIMIT 1',
      [highlightId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Highlight not found or access denied.'
      });
    }

    const current = existing[0];
    const {
      passage = current.passage,
      book_id = current.book_id,
      page_number = current.page_number,
      personal_note = current.personal_note
    } = req.body;

    if (!passage || typeof passage !== 'string' || passage.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Passage text is required.'
      });
    }

    let linkedBookId = null;
    if (book_id) {
      const parsedBookId = parseInt(book_id, 10);
      const [bookCheck] = await pool.execute(
        'SELECT id FROM books WHERE id = ? AND user_id = ? LIMIT 1',
        [parsedBookId, userId]
      );
      if (bookCheck.length > 0) {
        linkedBookId = parsedBookId;
      }
    }

    const parsedPage = page_number !== undefined && page_number !== null && page_number !== ''
      ? Math.max(1, parseInt(page_number, 10))
      : null;

    await pool.execute(`
      UPDATE highlights
      SET passage = ?, book_id = ?, page_number = ?, personal_note = ?
      WHERE id = ? AND user_id = ?
    `, [
      passage.trim(),
      linkedBookId,
      parsedPage,
      personal_note !== undefined && personal_note !== null ? personal_note.trim() : null,
      highlightId,
      userId
    ]);

    const [updated] = await pool.execute(`
      SELECT 
        h.id, h.user_id, h.book_id, h.passage, h.page_number, h.personal_note, h.created_at,
        b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url
      FROM highlights h
      LEFT JOIN books b ON h.book_id = b.id
      WHERE h.id = ?
    `, [highlightId]);

    return res.status(200).json({
      success: true,
      message: 'Highlight updated successfully.',
      data: { highlight: updated[0] }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a highlight
 */
async function deleteHighlight(req, res, next) {
  try {
    const userId = req.session.userId;
    const highlightId = parseInt(req.params.id, 10);

    if (isNaN(highlightId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid highlight ID.'
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM highlights WHERE id = ? AND user_id = ?',
      [highlightId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Highlight not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Highlight removed.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getHighlights,
  getHighlightById,
  createHighlight,
  updateHighlight,
  deleteHighlight
};
