const PortfolioInvestment = require('../models/PortfolioInvestment');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { sequelize } = require('../config/db'); 
const { Op } = require('sequelize');

exports.addPortfolioInvestment = async (req, res, next) => {
  const t = await sequelize.transaction(); 
  try {
    const { symbol, quantity, purchasePrice, purchaseDate, broker, notes } = req.body;
    const userId = req.user.id;

    if (!symbol || !quantity || !purchasePrice || !purchaseDate) {
      await t.rollback();
      return res.status(400).json({ error: "Símbolo, quantidade, preço de compra e data da compra são obrigatórios." });
    }

    const fQuantity = parseFloat(quantity);
    const fPurchasePrice = parseFloat(purchasePrice);

    if (fQuantity <= 0) {
      await t.rollback();
      return res.status(400).json({ error: "Quantidade deve ser positiva." });
    }
    if (fPurchasePrice <= 0) {
      await t.rollback();
      return res.status(400).json({ error: "Preço de compra deve ser positivo." });
    }
    if (isNaN(new Date(purchaseDate).getTime())) {
      await t.rollback();
      return res.status(400).json({ error: "Data da compra inválida." });
    }

    const newPortfolioItem = await PortfolioInvestment.create({
      userId,
      symbol: symbol.toUpperCase(),
      quantity: fQuantity,
      purchasePrice: fPurchasePrice,
      purchaseDate,
      broker,
      notes
    }, { transaction: t });

    const investmentCategory = await Category.findOne({
      where: { 
        name: 'Investimentos (Compra)', 
        type: 'expense',
        [Op.or]: [
            { isDefault: true, userId: null },
            { userId: userId } 
        ]
      } 
    }, { transaction: t });

    if (!investmentCategory) {
      await t.rollback();
      console.error(`[addPortfolioInvestment] Categoria 'Investimentos (Compra)' não encontrada para userId: ${userId}.`);
      return res.status(500).json({ error: "Erro interno: Categoria para despesa de investimento não configurada. Contate o suporte." });
    }

    const totalPurchaseCost = fQuantity * fPurchasePrice;
    await Transaction.create({
      description: `Compra de ${fQuantity.toLocaleString('pt-BR', {minimumFractionDigits:0, maximumFractionDigits: 4})} ${symbol.toUpperCase()} @ R$ ${fPurchasePrice.toFixed(2)}`,
      amount: totalPurchaseCost,
      date: purchaseDate,
      type: 'expense',
      categoryId: investmentCategory.id,
      userId,
    }, { transaction: t });

    await t.commit();
    const itemWithMarketData = await Investment.findOne({ 
        where: { symbol: newPortfolioItem.symbol },
        order: [['date', 'DESC']],
        attributes: ['close', 'date'],
    });
    res.status(201).json({
        ...newPortfolioItem.toJSON(),
        currentPrice: itemWithMarketData ? parseFloat(itemWithMarketData.close) : null,
        lastMarketDataDate: itemWithMarketData ? itemWithMarketData.date : null,
    });

  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message);
        return res.status(400).json({ error: messages.join(', ') });
    }
    console.error("Erro em addPortfolioInvestment:", error);
    next(error);
  }
};

exports.getPortfolioInvestments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    console.log(`[PortfolioController GET] Buscando portfólio para userId: ${userId}`);

    const portfolio = await PortfolioInvestment.findAll({
      where: { userId },
      order: [['purchaseDate', 'DESC'], ['symbol', 'ASC']],
    });
    console.log(`[PortfolioController GET] ${portfolio.length} itens encontrados no BD para userId: ${userId}`);

    if (!portfolio || portfolio.length === 0) {
        return res.json([]);
    }

    const portfolioWithMarketData = await Promise.all(
      portfolio.map(async (item) => {
        const latestMarketData = await Investment.findOne({
          where: { symbol: item.symbol },
          order: [['date', 'DESC']],
          attributes: ['close', 'date'],
        });
        return {
          ...item.toJSON(),
          currentPrice: latestMarketData ? parseFloat(latestMarketData.close) : null,
          lastMarketDataDate: latestMarketData ? latestMarketData.date : null,
        };
      })
    );
    console.log(`[PortfolioController GET] Enviando portfólio com dados de mercado para userId: ${userId}`, JSON.stringify(portfolioWithMarketData, null, 2).substring(0, 500) + "..."); // Loga apenas parte para não poluir
    res.json(portfolioWithMarketData);
  } catch (error) {
    console.error("Erro em getPortfolioInvestments:", error);
    next(error);
  }
};

exports.updatePortfolioInvestment = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { symbol, quantity, purchasePrice, purchaseDate, broker, notes } = req.body;

        const investment = await PortfolioInvestment.findOne({ where: { id: parseInt(id, 10), userId } }, { transaction: t });
        if (!investment) {
            await t.rollback();
            return res.status(404).json({ error: "Investimento do portfólio não encontrado ou não pertence ao usuário." });
        }
        
        const oldQuantity = parseFloat(investment.quantity);
        const oldPurchasePrice = parseFloat(investment.purchasePrice);

        let requiresTransactionUpdate = false;

        if (symbol !== undefined && investment.symbol !== symbol.toUpperCase()) {
            investment.symbol = symbol.toUpperCase();
            requiresTransactionUpdate = true; 
        }
        if (quantity !== undefined) {
            const q = parseFloat(quantity);
            if (q < 0) { await t.rollback(); return res.status(400).json({ error: "Quantidade não pode ser negativa." });}
            if (q !== oldQuantity) requiresTransactionUpdate = true;
            investment.quantity = q;
        }
        if (purchasePrice !== undefined) {
            const p = parseFloat(purchasePrice);
            if (p <= 0) { await t.rollback(); return res.status(400).json({ error: "Preço de compra deve ser positivo." });}
            if (p !== oldPurchasePrice) requiresTransactionUpdate = true;
            investment.purchasePrice = p;
        }
        if (purchaseDate !== undefined) {
            if (isNaN(new Date(purchaseDate).getTime())) { await t.rollback(); return res.status(400).json({ error: "Data da compra inválida." });}
            if (new Date(purchaseDate).toISOString().slice(0,10) !== new Date(investment.purchaseDate).toISOString().slice(0,10)) requiresTransactionUpdate = true;
            investment.purchaseDate = purchaseDate;
        }
        if (broker !== undefined) investment.broker = broker;
        if (notes !== undefined) investment.notes = notes;
        
        await investment.save({ transaction: t });

        if (requiresTransactionUpdate) {
            const purchaseCategory = await Category.findOne({ where: { name: 'Investimentos (Compra)', type: 'expense', [Op.or]: [{isDefault: true, userId: null}, {userId}] }}, {transaction: t});
            if (purchaseCategory) {
                const originalTransaction = await Transaction.findOne({
                    where: {
                        userId: userId,
                        categoryId: purchaseCategory.id,
                        date: investment.purchaseDate, 
                    }
                }, {transaction: t});

                if (originalTransaction) {
                    const newTotalCost = parseFloat(investment.quantity) * parseFloat(investment.purchasePrice);
                    originalTransaction.description = `Compra de ${parseFloat(investment.quantity).toLocaleString('pt-BR', {minimumFractionDigits:0, maximumFractionDigits: 4})} ${investment.symbol.toUpperCase()} @ R$ ${parseFloat(investment.purchasePrice).toFixed(2)} (Atualizada)`;
                    originalTransaction.amount = newTotalCost;
                    originalTransaction.date = investment.purchaseDate;
                    await originalTransaction.save({ transaction: t });
                    console.log(`[updatePortfolioInvestment] Transação de compra original ID ${originalTransaction.id} atualizada.`);
                } else {
                    console.warn(`[updatePortfolioInvestment] Transação de compra original não encontrada para ajuste. Pode ser necessário ajuste manual.`);
                }
            }
        }

        await t.commit();
        const itemWithMarketData = await Investment.findOne({
            where: { symbol: investment.symbol },
            order: [['date', 'DESC']],
            attributes: ['close', 'date'],
        });
        res.json({
            ...investment.toJSON(),
            currentPrice: itemWithMarketData ? parseFloat(itemWithMarketData.close) : null,
            lastMarketDataDate: itemWithMarketData ? itemWithMarketData.date : null,
        });
    } catch (error) {
        await t.rollback();
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        console.error("Erro em updatePortfolioInvestment:", error);
        next(error);
    }
};

exports.deletePortfolioInvestment = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const investment = await PortfolioInvestment.findOne({ where: { id: parseInt(id, 10), userId } }, { transaction: t });
        if (!investment) {
            await t.rollback();
            return res.status(404).json({ error: "Investimento do portfólio não encontrado ou não pertence ao usuário." });
        }
        
        console.warn(`[deletePortfolioInvestment] Investimento ID ${id} (${investment.symbol}) excluído do portfólio. A transação de compra original associada NÃO foi removida.`);

        await investment.destroy({ transaction: t });
        await t.commit();
        res.status(200).json({ message: "Investimento do portfólio excluído com sucesso.", id: parseInt(id, 10) });
    } catch (error) {
        await t.rollback();
        console.error("Erro em deletePortfolioInvestment:", error);
        next(error);
    }
};

exports.sellPortfolioInvestment = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { portfolioInvestmentId } = req.params; 
      const { quantitySold, salePrice, saleDate, notes } = req.body;
      const userId = req.user.id;
  
      if (!quantitySold || !salePrice || !saleDate) {
        await t.rollback();
        return res.status(400).json({ error: "Quantidade vendida, preço de venda e data da venda são obrigatórios." });
      }
  
      const fQuantitySold = parseFloat(quantitySold);
      const fSalePrice = parseFloat(salePrice);
  
      if (isNaN(fQuantitySold) || fQuantitySold <= 0) {
        await t.rollback();
        return res.status(400).json({ error: "Quantidade vendida deve ser positiva." });
      }
      if (isNaN(fSalePrice) || fSalePrice <= 0) {
        await t.rollback();
        return res.status(400).json({ error: "Preço de venda deve ser positivo." });
      }
      if (isNaN(new Date(saleDate).getTime())) {
        await t.rollback();
        return res.status(400).json({ error: "Data da venda inválida." });
      }
  
      const investmentToSell = await PortfolioInvestment.findOne({
        where: { id: parseInt(portfolioInvestmentId, 10), userId }
      }, { transaction: t });
  
      if (!investmentToSell) {
        await t.rollback();
        return res.status(404).json({ error: "Investimento do portfólio não encontrado ou não pertence ao usuário." });
      }
  
      if (fQuantitySold > parseFloat(investmentToSell.quantity)) {
        await t.rollback();
        return res.status(400).json({ error: `Quantidade a vender (${fQuantitySold.toLocaleString('pt-BR')}) é maior que a quantidade possuída (${parseFloat(investmentToSell.quantity).toLocaleString('pt-BR')}).` });
      }
  
      const saleCategory = await Category.findOne({
        where: { 
          name: 'Investimentos (Venda/Rendimento)', 
          type: 'income',
          [Op.or]: [
              { isDefault: true, userId: null },
              { userId: userId } 
          ]
        } 
      }, { transaction: t });
  
      if (!saleCategory) {
        await t.rollback();
        console.error(`[sellPortfolioInvestment] Categoria 'Investimentos (Venda/Rendimento)' não encontrada para userId: ${userId}.`);
        return res.status(500).json({ error: "Erro interno: Categoria para receita de venda de investimento não configurada." });
      }
  
      const totalSaleValue = fQuantitySold * fSalePrice;
      await Transaction.create({
        description: `Venda de ${fQuantitySold.toLocaleString('pt-BR', {minimumFractionDigits:0, maximumFractionDigits: 4})} ${investmentToSell.symbol.toUpperCase()} @ R$ ${fSalePrice.toFixed(2)}`,
        amount: totalSaleValue,
        date: saleDate,
        type: 'income',
        categoryId: saleCategory.id,
        userId,
        notes: notes || null 
      }, { transaction: t });
  
      const remainingQuantity = parseFloat(investmentToSell.quantity) - fQuantitySold;
      let updatedOrDeletedItemData; 
  
      if (remainingQuantity > 0.00009) { 
        investmentToSell.quantity = remainingQuantity;
        await investmentToSell.save({ transaction: t });
        
        const marketData = await Investment.findOne({
            where: { symbol: investmentToSell.symbol },
            order: [['date', 'DESC']],
            attributes: ['close', 'date'],
        });
        updatedOrDeletedItemData = {
            ...investmentToSell.toJSON(),
            currentPrice: marketData ? parseFloat(marketData.close) : null,
            lastMarketDataDate: marketData ? marketData.date : null,
            operation: 'updated' 
        };

      } else { 
        const deletedItemId = investmentToSell.id;
        const deletedItemSymbol = investmentToSell.symbol;
        await investmentToSell.destroy({ transaction: t });
        updatedOrDeletedItemData = { 
            id: parseInt(deletedItemId, 10), 
            symbol: deletedItemSymbol,
            operation: 'deleted' 
        };
      }
  
      await t.commit();
      res.status(200).json({ 
          message: 'Venda registrada com sucesso!', 
          item: updatedOrDeletedItemData 
      });
  
    } catch (error) {
      await t.rollback();
      if (error.name === 'SequelizeValidationError') {
          const messages = error.errors.map(e => e.message);
          return res.status(400).json({ error: messages.join(', ') });
      }
      console.error("Erro em sellPortfolioInvestment:", error);
      next(error);
    }
  };