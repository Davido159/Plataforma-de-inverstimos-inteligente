const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware); 


router.post('/', budgetController.setBudget);

router.get('/', budgetController.getBudgetsForMonth);

router.delete('/:budgetId', budgetController.deleteBudget);

module.exports = router;