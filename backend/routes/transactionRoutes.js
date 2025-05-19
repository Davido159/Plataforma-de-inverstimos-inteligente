const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, transactionController.getTransactionsByUser);
router.post('/', authMiddleware, transactionController.addTransaction);
router.put('/:id', authMiddleware, transactionController.updateTransaction);
router.delete('/:id', authMiddleware, transactionController.deleteTransaction);

router.get('/balance-until', authMiddleware, transactionController.getBalanceUntilDate);

module.exports = router;