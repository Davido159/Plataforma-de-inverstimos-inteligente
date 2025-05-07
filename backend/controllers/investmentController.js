// /backend/controllers/investmentController.js (Atualizado)
const Investment = require('../models/Investment'); // Sequelize Model
const { getMarketData } = require('../services/financialAPI');
const { Op } = require('sequelize'); // Importar operadores do Sequelize se necessário

exports.fetchAndSaveMarketData = async (req, res, next) => {
  const { symbol } = req.body;
  if (!symbol) {
    return res.status(400).json({ error: 'Símbolo é obrigatório' });
  }
  try {
    const data = await getMarketData(symbol);
    const timeSeries = data["Time Series (Daily)"];
    if (!timeSeries) {
        // Verifica se há uma nota de limite da API na resposta
        const apiNote = data["Note"];
        if (apiNote && apiNote.includes("API call frequency")) {
            return res.status(429).json({ error: 'Limite da API Alpha Vantage atingido. Tente novamente mais tarde.' });
        }
        return res.status(400).json({ error: 'Símbolo inválido ou dados não encontrados na API' });
    }

    const investmentPromises = [];
    for (const date in timeSeries) {
        if (Object.hasOwnProperty.call(timeSeries, date)) {
            const dayData = timeSeries[date];
            const investmentData = {
                symbol: symbol.toUpperCase(), // Padroniza para maiúsculas
                date: date, // Sequelize DATEONLY aceita 'YYYY-MM-DD'
                open: parseFloat(dayData["1. open"]),
                high: parseFloat(dayData["2. high"]),
                low: parseFloat(dayData["3. low"]),
                close: parseFloat(dayData["4. close"]),
                volume: parseInt(dayData["5. volume"], 10) // Especifica base 10
            };

            // Usa o método upsert do Sequelize.
            // Ele insere se não existir (baseado nos índices únicos - symbol, date),
            // ou atualiza se já existir.
            investmentPromises.push(Investment.upsert(investmentData));
        }
    }

    // Espera todas as operações de upsert terminarem
    await Promise.all(investmentPromises);

    // Nota: O resultado de Promise.all(upserts) pode variar entre dialetos.
    // Retornamos uma mensagem genérica de sucesso.
    // Se precisasse retornar os dados salvos/atualizados, faria uma nova query.
    res.json({ message: `Dados de mercado para ${symbol} obtidos e salvos/atualizados.` });

  } catch (error) {
    // Log específico para erro no upsert pode ser útil
    if (error.name === 'SequelizeDatabaseError') {
        console.error("Database Error during upsert:", error.message);
        // Pode ser um erro de tipo de dado, etc.
    }
    next(error); // Passa para o error handler
  }
};

exports.getInvestments = async (req, res, next) => {
  try {
    // Busca todos os investimentos usando Sequelize
    // Pode adicionar 'where', 'order', 'limit', etc., se necessário
    const investments = await Investment.findAll({
        order: [['date', 'DESC']] // Exemplo: Ordenar por data descendente
    });
    res.json(investments);
  } catch (error) {
    next(error);
  }
};