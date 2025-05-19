const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('income', 'expense'),
    allowNull: false,
    defaultValue: 'expense',
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  tableName: 'categories',
  timestamps: true,
  indexes: [
    {
      name: 'unique_category_name_type_for_user_or_default',
      unique: true,
      fields: ['name', 'type', 'userId']
    }
  ]
});

User.hasMany(Category, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Category.belongsTo(User, { foreignKey: 'userId' });

module.exports = Category;