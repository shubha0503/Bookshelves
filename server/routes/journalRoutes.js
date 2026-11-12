const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', journalController.getJournalEntries);
router.get('/tags', journalController.getTags);
router.get('/:id', journalController.getJournalEntryById);
router.post('/', journalController.createJournalEntry);
router.put('/:id', journalController.updateJournalEntry);
router.delete('/:id', journalController.deleteJournalEntry);

module.exports = router;
