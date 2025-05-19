const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', portfolioController.addPortfolioInvestment);

router.get('/', portfolioController.getPortfolioInvestments);

router.put('/:id', portfolioController.updatePortfolioInvestment);

router.delete('/:id', portfolioController.deletePortfolioInvestment);


router.post('/:portfolioInvestmentId/sell', portfolioController.sellPortfolioInvestment);

module.exports = router;