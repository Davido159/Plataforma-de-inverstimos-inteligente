const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Category = require('./Category');

const Budget = sequelize.define('Budget', {
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
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Category,
      key: 'id',
    },
  },
  month: { 
    type: DataTypes.STRING(7), 
    allowNull: false,
    validate: {
      is: /^\d{4}-\d{2}$/ 
    }
  },
  limitAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0.01 
    }
  },

  notes: {
      type: DataTypes.TEXT,
      allowNull: true,
  }
}, {
  tableName: 'budgets',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'categoryId', 'month']
    }
  ]
});

User.hasMany(Budget, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Budget.belongsTo(User, { foreignKey: 'userId' });

Category.hasMany(Budget, { foreignKey: 'categoryId', onDelete: 'CASCADE', onUpdate: 'CASCADE' }); 
Budget.belongsTo(Category, { as: 'Category', foreignKey: 'categoryId' });

module.exports = Budget;