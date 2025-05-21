const { Sequelize } = require('sequelize');
const fs = require('fs'); 
require('dotenv').config(); 
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {

    },
    pool: {
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
    console.log('Conexão com MySQL (AWS RDS) estabelecida com sucesso.'); 
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados MySQL (AWS RDS):', error); 
    process.exit(1);
  }
};

const syncDB = async (options = { alter: true }) => {
  try {
    await sequelize.sync(options);
    console.log("Modelos sincronizados com o banco de dados (AWS RDS)."); 
  } catch (error) {
    console.error("Erro ao sincronizar modelos com AWS RDS:", error); 
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB, syncDB };