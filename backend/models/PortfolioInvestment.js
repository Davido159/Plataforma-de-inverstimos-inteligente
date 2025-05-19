const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const PortfolioInvestment = sequelize.define('PortfolioInvestment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  symbol: { 
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "O símbolo do ativo é obrigatório."
      }
    }
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 4), 
    allowNull: false,
    validate: {
      isDecimal: true,
      min: {
        args: [0.0001],
        msg: "A quantidade deve ser maior que zero."
      }
    }
  },
  purchasePrice: { 
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: {
        args: [0.01],
        msg: "O preço de compra deve ser maior que zero."
      }
    }
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
    }
  },
  broker: { 
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: { 
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'portfolio_investments',
  timestamps: true, 
});

User.hasMany(PortfolioInvestment, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
PortfolioInvestment.belongsTo(User, { foreignKey: 'userId' });

module.exports = PortfolioInvestment;