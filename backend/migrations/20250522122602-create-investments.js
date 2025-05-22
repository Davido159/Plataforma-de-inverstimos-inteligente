'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('investments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      symbol: {
        type: Sequelize.STRING,
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY, 
        allowNull: false
      },
      open: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      high: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      low: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      close: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      volume: {
        type: Sequelize.BIGINT, 
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

    await queryInterface.addIndex('investments', ['symbol', 'date'], {
      unique: true,
      name: 'unique_symbol_date_on_investments' 
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('investments');
  }
};