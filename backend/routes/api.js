const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investmentController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/fetch-data', authMiddleware, investmentController.fetchAndSaveMarketData);
router.get('/investments', authMiddleware, investmentController.getInvestments);

module.exports = router;
