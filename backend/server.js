require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize, connectDB, syncDB } 
    = require('./config/db');

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
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('short')); 
}

app.get('/', (req, res) => {
  res.send(`API da Plataforma de Investimentos Inteligentes está operacional! Ambiente: ${process.env.NODE_ENV || 'não definido'}`);
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
      await syncDB({ alter: true }); 
      console.log("Modelos sincronizados com o banco de dados (MODO DESENVOLVIMENTO).");
    }


    await createDefaultCategories(); 

    app.listen(PORT, () => {
      console.log(`Servidor backend rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'desconhecido'}`);
    });
  } catch (error) {
    console.error('Falha crítica ao iniciar o servidor backend:', error.message);
    console.error(error.stack); 
    process.exit(1);
  }
};

if (require.main === module) {
    startServer();
}

module.exports = app; 