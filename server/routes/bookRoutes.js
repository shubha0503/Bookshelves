const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { requireAuth } = require('../middleware/auth');

// Safe public display data for the read-only bookshelf page.
router.get('/public', bookController.getPublicShelf);

// All management endpoints still require authentication.
router.use(requireAuth);

router.get('/', bookController.getBooks);
router.get('/:id', bookController.getBookById);
router.post('/', bookController.createBook);
router.put('/:id', bookController.updateBook);
router.patch('/:id/progress', bookController.updateProgress);
router.delete('/:id', bookController.deleteBook);

module.exports = router;
