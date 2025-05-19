const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 * 60 * 12 }); 

const API_KEY = process.env.FINANCIAL_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

const getMarketData = async (symbol) => {
  const cacheKey = `marketData_${symbol}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: symbol,
        apikey: API_KEY
      }
    });
    if (response.data && !response.data["Error Message"] && !response.data["Note"]) {
        cache.set(cacheKey, response.data);
    } else if (response.data && response.data["Note"] && response.data["Note"].includes("API call frequency")) {
        console.warn(`Nota da API Alpha Vantage para ${symbol}: ${response.data["Note"]}`);
    } else if (response.data && response.data["Error Message"]) {
        console.error(`Erro da API Alpha Vantage para ${symbol}: ${response.data["Error Message"]}`);
    }
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar dados de mercado para ${symbol} na financialAPI:`, error.message);

    throw error;
  }
};

module.exports = { getMarketData };