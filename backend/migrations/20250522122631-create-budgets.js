'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('budgets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', 
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'categories', 
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' 
      },
      month: { 
        type: Sequelize.STRING(7), 
        allowNull: false
      },
      limitAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('budgets', ['userId', 'categoryId', 'month'], {
      unique: true,
      name: 'unique_user_category_month_on_budgets'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('budgets');
  }
};