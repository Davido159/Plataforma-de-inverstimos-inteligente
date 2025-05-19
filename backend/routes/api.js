const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investmentController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/fetch-data', investmentController.fetchAndSaveMarketData);

router.get('/investments', investmentController.getInvestments);

router.delete('/investments/:symbol', investmentController.deleteMarketDataForSymbol);

module.exports = router;