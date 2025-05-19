const { Sequelize } = require('sequelize');
require('dotenv').config(); 


const dbHost = process.env.DB_HOST || 'localhost'; 
const dbPort = process.env.DB_PORT || 3306;    

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: dbHost,
    port: dbPort,
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
    console.log(`Conexão com MySQL em ${dbHost}:${dbPort} estabelecida com sucesso.`);
  } catch (error) {
    console.error(`Não foi possível conectar ao banco de dados MySQL em ${dbHost}:${dbPort}:`, error.message);
    if (error.original) {
        console.error('Detalhes do erro original:', error.original);
    }
    process.exit(1); 
  }
};

const syncDB = async (options = {}) => { 
  try {
    await sequelize.sync(options);
    if (options.alter) {
        console.log("Modelos sincronizados com o banco de dados (com alterações aplicadas).");
    } else if (options.force) {
        console.log("Banco de dados recriado (com tabelas dropadas e recriadas).");
    } else {
        console.log("Modelos sincronizados com o banco de dados (tabelas criadas se não existiam).");
    }
  } catch (error) {
    console.error("Erro ao sincronizar modelos:", error);
    throw error; 
  }
};

module.exports = { sequelize, connectDB, syncDB };