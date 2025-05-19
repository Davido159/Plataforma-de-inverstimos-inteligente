require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, syncDB } = require('./config/db');

const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const budgetRoutes = require('./routes/budgetRoutes');

const { createDefaultCategories } = require('./controllers/categoryController');
const errorHandler = require('./middlewares/errorHandler');

require('./models/User');
require('./models/Investment');
require('./models/Category');
require('./models/Transaction');
require('./models/PortfolioInvestment');
require('./models/Budget');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200
}));
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(require('morgan')('dev'));
}

app.get('/', (req, res) => {
  res.send('API da Plataforma de Investimentos Inteligentes está operacional!');
});

app.use('/api/market', apiRoutes);
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/budgets', budgetRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    if (process.env.NODE_ENV === 'development') {
    
      await syncDB(); 
      console.log("DEV: Modelos sincronizados (tabelas criadas se não existiam). Use migrações para alterações de schema.");

    } else if (process.env.NODE_ENV === 'test') {
      console.log("TEST: Gerenciamento de schema deve ser explícito para testes.");
    }

    await createDefaultCategories();

    app.listen(PORT, () => {
      console.log(`Servidor backend rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {

    console.error('Falha crítica ao iniciar o servidor backend (após connectDB ou syncDB):', error.name, error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;