'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      userId: { 
        type: Sequelize.INTEGER,
        allowNull: true, 
        references: {
          model: 'users', 
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' 
      },
      type: {
        type: Sequelize.ENUM('income', 'expense'),
        allowNull: false,
        defaultValue: 'expense'
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.addIndex('categories', ['name', 'type', 'userId'], {
      unique: true,
      name: 'unique_category_name_type_for_user_or_default'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('categories');
  }
};