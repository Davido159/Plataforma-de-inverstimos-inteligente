// /backend/models/Investment.js (Substituído)
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // Importa a instância do Sequelize

const Investment = sequelize.define('Investment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  symbol: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY, // Armazena apenas a data (YYYY-MM-DD)
    allowNull: false,
  },
  open: {
    type: DataTypes.FLOAT, // Ou DECIMAL para maior precisão financeira
    // type: DataTypes.DECIMAL(10, 2), // Ex: 10 dígitos no total, 2 decimais
    allowNull: true, // Permite nulos se a API não retornar
  },
  high: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  low: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  close: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  volume: {
    type: DataTypes.BIGINT, // Para números potencialmente grandes
    allowNull: true,
  },
}, {
  // Opções do Model
  tableName: 'investments',
  timestamps: true, // Adiciona createdAt e updatedAt
  indexes: [
    // Cria um índice único composto para evitar entradas duplicadas para o mesmo símbolo na mesma data
    {
      unique: true,
      fields: ['symbol', 'date']
    }
  ]
});

module.exports = Investment;