// /backend/models/User.js (Substituído)
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db'); // Importa a instância do Sequelize

const User = sequelize.define('User', {
  // Não precisamos definir 'id', Sequelize adiciona por padrão (auto-incrementing primary key)
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Garante que o email seja único
    validate: { // Adiciona validação de formato de email
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  // Opções do Model
  tableName: 'users', // Nome explícito da tabela (opcional, senão seria 'Users')
  timestamps: true, // Adiciona createdAt e updatedAt por padrão

  hooks: {
    // Hook para hashear a senha ANTES de criar ou atualizar o usuário
    beforeSave: async (user, options) => {
      if (user.changed('password')) { // Só hashear se a senha mudou
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
    /* Alternativamente, pode usar beforeCreate e beforeUpdate separados:
    beforeCreate: async (user, options) => {
       const salt = await bcrypt.genSalt(10);
       user.password = await bcrypt.hash(user.password, salt);
    },
    beforeUpdate: async (user, options) => {
        if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }
    }
    */
  }
});

// Adiciona um método de instância ao protótipo do modelo para comparar senhas
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;