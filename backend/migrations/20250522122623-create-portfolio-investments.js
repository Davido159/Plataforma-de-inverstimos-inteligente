'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('portfolio_investments', {
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
      symbol: {
        type: Sequelize.STRING,
        allowNull: false
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false
      },
      purchasePrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      purchaseDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      broker: {
        type: Sequelize.STRING,
        allowNull: true 
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('portfolio_investments');
  }
};