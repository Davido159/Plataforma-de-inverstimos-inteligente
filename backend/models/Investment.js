const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); 

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
    type: DataTypes.DATEONLY, 
    allowNull: false,
  },
  open: {
    type: DataTypes.FLOAT, 
    allowNull: true, 
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
    type: DataTypes.BIGINT, 
    allowNull: true,
  },
}, {
  tableName: 'investments',
  timestamps: true, 
  indexes: [
    {
      unique: true,
      fields: ['symbol', 'date']
    }
  ]
});

module.exports = Investment;