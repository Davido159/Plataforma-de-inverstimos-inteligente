const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Category = require('./Category');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0.01
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('income', 'expense'),
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Category,
      key: 'id',
    },
  },
}, {
  tableName: 'transactions',
  timestamps: true,
});

User.hasMany(Transaction, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

Category.hasMany(Transaction, { foreignKey: 'categoryId', onDelete: 'RESTRICT', onUpdate: 'CASCADE' }); 
Transaction.belongsTo(Category, { as: 'Category', foreignKey: 'categoryId' });

module.exports = Transaction;