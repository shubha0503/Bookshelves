const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', goalController.getGoal);
router.post('/', goalController.setGoal);
router.put('/', goalController.setGoal);

module.exports = router;
