// /backend/config/db.js (Substituído)
const { Sequelize } = require('sequelize');
require('dotenv').config(); // Garante que as variáveis de ambiente sejam carregadas

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false, // Log SQL no desenvolvimento
    dialectOptions: {
      // Opções específicas do MySQL se necessário
      // connectTimeout: 60000
    },
    pool: { // Configurações opcionais do pool de conexões
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com MySQL estabelecida com sucesso.');
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados MySQL:', error);
    process.exit(1); // Sai se não conseguir conectar
  }
};

// Função para sincronizar modelos (criar tabelas)
// Chame isso APÓS os modelos serem definidos no server.js
const syncDB = async (options = { alter: true }) => { // 'alter: true' tenta alterar tabelas existentes
  try {
    await sequelize.sync(options);
    console.log("Modelos sincronizados com o banco de dados.");
  } catch (error) {
    console.error("Erro ao sincronizar modelos:", error);
    process.exit(1);
  }
};

console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);

module.exports = { sequelize, connectDB, syncDB };