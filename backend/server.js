require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
// Importa funções e instância do Sequelize do db.js
const { sequelize, connectDB, syncDB } = require('./config/db');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middlewares/errorHandler');

// Importa os modelos para que o Sequelize os reconheça ANTES de sincronizar
require('./models/User');
require('./models/Investment');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rota para a raiz (opcional)
app.get('/', (req, res) => {
  res.send('Bem-vindo à Plataforma de Investimentos Inteligentes!');
});

// Rotas
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);

// Middleware para tratamento de erros (deve ser o último)
app.use(errorHandler);

const startServer = async () => {
  try {
    // 1. Conectar ao banco de dados
    await connectDB();

    // 2. Sincronizar modelos (criar/alterar tabelas)
    // Use { force: true } CUIDADOSAMENTE em dev para recriar tabelas (apaga dados!)
    // Use { alter: true } para tentar atualizar tabelas sem perder dados (mais seguro)
    await syncDB({ alter: true }); // Ou syncDB() que usa alter: true por padrão

    // 3. Iniciar o servidor Express
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Inicia o processo
startServer();
