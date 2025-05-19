const { Sequelize } = require('sequelize');
require('dotenv').config(); 

const dbConfigOptions = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306, 
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false, 
  pool: {
    max: 5, 
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};


if (process.env.NODE_ENV === 'production' && process.env.DB_SSL_REQUIRED === 'true') {
  dbConfigOptions.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false 
    }
  };
  console.log('[DB Config] SSL para MySQL ATIVADO em produção.');
} else if (process.env.NODE_ENV === 'production') {
  console.log('[DB Config] SSL para MySQL NÃO ATIVADO explicitamente em produção (DB_SSL_REQUIRED não é "true").');
}


const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  dbConfigOptions
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com MySQL estabelecida com sucesso.');
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados MySQL:', error);
    process.exit(1); 
  }
};

const syncDB = async (options = {}) => { 
  try {

    if (process.env.NODE_ENV === 'production') {
      await sequelize.sync(); 
      console.log("Modelos sincronizados com o banco de dados (Modo Produção - sem alter/force).");
    } else {
      await sequelize.sync(options); 
      console.log("Modelos sincronizados com o banco de dados (Modo Desenvolvimento). Opções:", options);
    }
  } catch (error) {
    console.error("Erro ao sincronizar modelos:", error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB, syncDB };