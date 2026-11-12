const { pool } = require('../config/db');

/**
 * Calculate word count helper
 */
function getWordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Helper to sync tags for a journal entry
 */
async function syncTags(connection, entryId, tags = []) {
  if (!Array.isArray(tags)) return;

  // Clear existing entry tags
  await connection.execute(
    'DELETE FROM journal_entry_tags WHERE journal_entry_id = ?',
    [entryId]
  );

  for (let rawTag of tags) {
    if (typeof rawTag !== 'string') continue;
    const cleanTag = rawTag.trim();
    if (!cleanTag) continue;

    // Insert tag if not exists
    await connection.execute(
      'INSERT IGNORE INTO journal_tags (name) VALUES (?)',
      [cleanTag]
    );

    // Get tag ID
    const [tagRows] = await connection.execute(
      'SELECT id FROM journal_tags WHERE name = ? LIMIT 1',
      [cleanTag]
    );

    if (tagRows.length > 0) {
      const tagId = tagRows[0].id;
      await connection.execute(
        'INSERT IGNORE INTO journal_entry_tags (journal_entry_id, tag_id) VALUES (?, ?)',
        [entryId, tagId]
      );
    }
  }
}

/**
 * List journal entries with optional search, book filter, and tag filter
 */
async function getJournalEntries(req, res, next) {
  try {
    const userId = req.session.userId;
    const { search, book_id, tag } = req.query;

    let query = `
      SELECT 
        j.id, j.user_id, j.book_id, j.title, j.content, j.created_at, j.updated_at,
        b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url,
        GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags
      FROM journal_entries j
      LEFT JOIN books b ON j.book_id = b.id
      LEFT JOIN journal_entry_tags jet ON j.id = jet.journal_entry_id
      LEFT JOIN journal_tags t ON jet.tag_id = t.id
      WHERE j.user_id = ?
    `;
    const params = [userId];

    if (book_id) {
      query += ' AND j.book_id = ?';
      params.push(parseInt(book_id, 10));
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += ' AND (j.title LIKE ? OR j.content LIKE ?)';
      params.push(term, term);
    }

    query += ' GROUP BY j.id';

    // If tag filter is provided, use HAVING or subquery
    if (tag && tag.trim() !== '') {
      query += ' HAVING FIND_IN_SET(?, tags) > 0';
      params.push(tag.trim());
    }

    query += ' ORDER BY j.created_at DESC';

    const [entries] = await pool.execute(query, params);

    const formatted = entries.map(entry => ({
      ...entry,
      tags: entry.tags ? entry.tags.split(',') : [],
      word_count: getWordCount(entry.content)
    }));

    return res.status(200).json({
      success: true,
      data: {
        total: formatted.length,
        entries: formatted
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get a single journal entry by ID
 */
async function getJournalEntryById(req, res, next) {
  try {
    const userId = req.session.userId;
    const entryId = parseInt(req.params.id, 10);

    if (isNaN(entryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid entry ID.'
      });
    }

    const [entries] = await pool.execute(`
      SELECT 
        j.id, j.user_id, j.book_id, j.title, j.content, j.created_at, j.updated_at,
        b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url,
        GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags
      FROM journal_entries j
      LEFT JOIN books b ON j.book_id = b.id
      LEFT JOIN journal_entry_tags jet ON j.id = jet.journal_entry_id
      LEFT JOIN journal_tags t ON jet.tag_id = t.id
      WHERE j.id = ? AND j.user_id = ?
      GROUP BY j.id
      LIMIT 1
    `, [entryId, userId]);

    if (entries.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Journal entry not found.'
      });
    }

    const entry = entries[0];
    return res.status(200).json({
      success: true,
      data: {
        entry: {
          ...entry,
          tags: entry.tags ? entry.tags.split(',') : [],
          word_count: getWordCount(entry.content)
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new journal entry
 */
async function createJournalEntry(req, res, next) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.session.userId;
    const { title, content, book_id, tags = [] } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      connection.release();
      return res.status(400).json({
        success: false,
        error: 'Entry title is required.'
      });
    }

    if (!content || typeof content !== 'string') {
      connection.release();
      return res.status(400).json({
        success: false,
        error: 'Entry content is required.'
      });
    }

    let linkedBookId = null;
    if (book_id) {
      const parsedBookId = parseInt(book_id, 10);
      const [bookCheck] = await connection.execute(
        'SELECT id FROM books WHERE id = ? AND user_id = ? LIMIT 1',
        [parsedBookId, userId]
      );
      if (bookCheck.length > 0) {
        linkedBookId = parsedBookId;
      }
    }

    const [insertResult] = await connection.execute(
      'INSERT INTO journal_entries (user_id, book_id, title, content) VALUES (?, ?, ?, ?)',
      [userId, linkedBookId, title.trim(), content.trim()]
    );

    const entryId = insertResult.insertId;

    // Process tags
    const tagArray = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : []);
    await syncTags(connection, entryId, tagArray);

    await connection.commit();
    connection.release();

    // Return the newly created entry
    const [created] = await pool.execute(`
      SELECT 
        j.id, j.user_id, j.book_id, j.title, j.content, j.created_at, j.updated_at,
        b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url,
        GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags
      FROM journal_entries j
      LEFT JOIN books b ON j.book_id = b.id
      LEFT JOIN journal_entry_tags jet ON j.id = jet.journal_entry_id
      LEFT JOIN journal_tags t ON jet.tag_id = t.id
      WHERE j.id = ?
      GROUP BY j.id
    `, [entryId]);

    const entry = created[0];
    return res.status(201).json({
      success: true,
      message: 'Journal reflection saved.',
      data: {
        entry: {
          ...entry,
          tags: entry.tags ? entry.tags.split(',') : [],
          word_count: getWordCount(entry.content)
        }
      }
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    next(err);
  }
}

/**
 * Update an existing journal entry
 */
async function updateJournalEntry(req, res, next) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.session.userId;
    const entryId = parseInt(req.params.id, 10);

    if (isNaN(entryId)) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: 'Invalid entry ID.'
      });
    }

    // Verify ownership
    const [existing] = await connection.execute(
      'SELECT id FROM journal_entries WHERE id = ? AND user_id = ? LIMIT 1',
      [entryId, userId]
    );

    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        error: 'Journal entry not found or access denied.'
      });
    }

    const { title, content, book_id, tags } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      connection.release();
      return res.status(400).json({
        success: false,
        error: 'Entry title is required.'
      });
    }

    let linkedBookId = null;
    if (book_id) {
      const parsedBookId = parseInt(book_id, 10);
      const [bookCheck] = await connection.execute(
        'SELECT id FROM books WHERE id = ? AND user_id = ? LIMIT 1',
        [parsedBookId, userId]
      );
      if (bookCheck.length > 0) {
        linkedBookId = parsedBookId;
      }
    }

    await connection.execute(`
      UPDATE journal_entries
      SET title = ?, content = ?, book_id = ?
      WHERE id = ? AND user_id = ?
    `, [
      title.trim(),
      content !== undefined ? content.trim() : '',
      linkedBookId,
      entryId,
      userId
    ]);

    if (tags !== undefined) {
      const tagArray = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : []);
      await syncTags(connection, entryId, tagArray);
    }

    await connection.commit();
    connection.release();

    const [updated] = await pool.execute(`
      SELECT 
        j.id, j.user_id, j.book_id, j.title, j.content, j.created_at, j.updated_at,
        b.title AS book_title, b.author AS book_author, b.cover_url AS book_cover_url,
        GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ',') AS tags
      FROM journal_entries j
      LEFT JOIN books b ON j.book_id = b.id
      LEFT JOIN journal_entry_tags jet ON j.id = jet.journal_entry_id
      LEFT JOIN journal_tags t ON jet.tag_id = t.id
      WHERE j.id = ?
      GROUP BY j.id
    `, [entryId]);

    const entry = updated[0];
    return res.status(200).json({
      success: true,
      message: 'Journal reflection updated.',
      data: {
        entry: {
          ...entry,
          tags: entry.tags ? entry.tags.split(',') : [],
          word_count: getWordCount(entry.content)
        }
      }
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    next(err);
  }
}

/**
 * Delete a journal entry
 */
async function deleteJournalEntry(req, res, next) {
  try {
    const userId = req.session.userId;
    const entryId = parseInt(req.params.id, 10);

    if (isNaN(entryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid entry ID.'
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM journal_entries WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Journal entry not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Journal entry deleted.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all available unique tags for the logged-in user's journal entries
 */
async function getTags(req, res, next) {
  try {
    const userId = req.session.userId;
    const [tags] = await pool.execute(`
      SELECT DISTINCT t.id, t.name, COUNT(jet.journal_entry_id) as count
      FROM journal_tags t
      INNER JOIN journal_entry_tags jet ON t.id = jet.tag_id
      INNER JOIN journal_entries j ON jet.journal_entry_id = j.id
      WHERE j.user_id = ?
      GROUP BY t.id, t.name
      ORDER BY count DESC, t.name ASC
    `, [userId]);

    return res.status(200).json({
      success: true,
      data: { tags }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getJournalEntries,
  getJournalEntryById,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getTags
};
