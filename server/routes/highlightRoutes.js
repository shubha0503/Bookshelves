const express = require('express');
const router = express.Router();
const highlightController = require('../controllers/highlightController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', highlightController.getHighlights);
router.get('/:id', highlightController.getHighlightById);
router.post('/', highlightController.createHighlight);
router.put('/:id', highlightController.updateHighlight);
router.delete('/:id', highlightController.deleteHighlight);

module.exports = router;
