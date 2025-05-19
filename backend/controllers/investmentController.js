const Investment = require('../models/Investment');
const { getMarketData } = require('../services/financialAPI');
const { Op } = require('sequelize'); 

exports.fetchAndSaveMarketData = async (req, res, next) => {
  const { symbol } = req.body;
  if (!symbol) {
    return res.status(400).json({ error: 'Símbolo é obrigatório' });
  }
  try {
    const data = await getMarketData(symbol); 
    const timeSeries = data["Time Series (Daily)"];
    
    if (!timeSeries) {
        const apiNote = data["Note"]; 
        if (apiNote && apiNote.includes("API call frequency")) {
            return res.status(429).json({ error: 'Limite da API Alpha Vantage atingido. Tente novamente mais tarde.' });
        }
        return res.status(400).json({ error: 'Símbolo inválido ou dados não encontrados na API para este símbolo.' });
    }

    const investmentPromises = [];
    for (const date in timeSeries) {
        if (Object.hasOwnProperty.call(timeSeries, date)) {
            const dayData = timeSeries[date];
            const investmentData = {
                symbol: symbol.toUpperCase(),
                date: date,
                open: parseFloat(dayData["1. open"]),
                high: parseFloat(dayData["2. high"]),
                low: parseFloat(dayData["3. low"]),
                close: parseFloat(dayData["4. close"]),
                volume: parseInt(dayData["5. volume"], 10)
            };
            investmentPromises.push(Investment.upsert(investmentData));
        }
    }

    await Promise.all(investmentPromises);
    res.json({ message: `Dados de mercado para ${symbol.toUpperCase()} obtidos e salvos/atualizados com sucesso.` });

  } catch (error) {
    console.error(`Erro no processo fetchAndSaveMarketData para o símbolo ${symbol}:`, error.message);
    if (error.isAxiosError && error.response) {
        return res.status(error.response.status || 500).json({ error: error.response.data.error || 'Erro ao buscar dados na API externa.' });
    }
    if (error.name === 'SequelizeDatabaseError') {
        console.error("Database Error during upsert:", error.original?.message || error.message);
    }
    next(error); 
  }
};

exports.getInvestments = async (req, res, next) => {
  try {
    const { symbol } = req.query;
    const whereClause = {};
    if (symbol) {
        whereClause.symbol = symbol.toUpperCase();
    }

    const investments = await Investment.findAll({
        where: whereClause, 
        order: [['symbol', 'ASC'], ['date', 'DESC']] 
    });
    res.json(investments);
  } catch (error) {
    console.error("Erro ao buscar investimentos:", error);
    next(error);
  }
};

exports.deleteMarketDataForSymbol = async (req, res, next) => {
  const { symbol } = req.params; 

  if (!symbol) {
    return res.status(400).json({ error: 'Símbolo é obrigatório para exclusão.' });
  }

  try {
    const uppercaseSymbol = symbol.toUpperCase();
    const numberOfDeletedRows = await Investment.destroy({
      where: {
        symbol: uppercaseSymbol 
      }
    });

    if (numberOfDeletedRows > 0) {
      res.json({ 
        message: `Dados de mercado para o símbolo ${uppercaseSymbol} foram excluídos com sucesso.`,
        details: `${numberOfDeletedRows} registros removidos.` 
      });
    } else {
      res.status(404).json({ error: `Nenhum dado de mercado encontrado para o símbolo ${uppercaseSymbol}. Nada foi excluído.` });
    }
  } catch (error) {
    console.error(`Erro ao excluir dados de mercado para ${symbol}:`, error.message);
    if (error.name === 'SequelizeDatabaseError') {
        console.error("Database Error during delete:", error.original?.message || error.message);
    }
    next(error); 
  }
};