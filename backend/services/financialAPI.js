const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 });

const API_KEY = process.env.FINANCIAL_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

const getMarketData = async (symbol) => {
  const cacheKey = `marketData_${symbol}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: symbol,
        apikey: API_KEY
      }
    });
    cache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar dados de mercado:", error);
    throw error;
  }
};

module.exports = { getMarketData };
