const Category = require('../models/Category');
const User = require('../models/User'); 
const { Op } = require('sequelize');

const createDefaultCategories = async () => {
  const defaultCategories = [
    { name: 'Alimentação', type: 'expense', isDefault: true },
    { name: 'Transporte', type: 'expense', isDefault: true },
    { name: 'Moradia', type: 'expense', isDefault: true },
    { name: 'Saúde', type: 'expense', isDefault: true },
    { name: 'Lazer', type: 'expense', isDefault: true },
    { name: 'Educação', type: 'expense', isDefault: true },
    { name: 'Vestuário', type: 'expense', isDefault: true },
    { name: 'Contas (água, luz, internet)', type: 'expense', isDefault: true },
    { name: 'Investimentos (Compra)', type: 'expense', isDefault: true },
    { name: 'Outras Despesas', type: 'expense', isDefault: true },
    
    { name: 'Salário', type: 'income', isDefault: true },
    { name: 'Freelance', type: 'income', isDefault: true },
    { name: 'Investimentos (Venda/Rendimento)', type: 'income', isDefault: true },
    { name: 'Presentes', type: 'income', isDefault: true },
    { name: 'Outras Receitas', type: 'income', isDefault: true },
  ];

  try {
    for (const cat of defaultCategories) {
      await Category.findOrCreate({
        where: { name: cat.name, type: cat.type, isDefault: true, userId: null }, 
        defaults: cat,
      });
    }
    console.log('Categorias padrão verificadas/criadas com sucesso.');
  } catch (error) {
    console.error('Erro ao criar/verificar categorias padrão:', error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const userId = req.user.id; 

    const categories = await Category.findAll({
      where: {
        [Op.or]: [
          { isDefault: true, userId: null }, 
          { userId: userId }                  
        ]
      },
      order: [['type', 'ASC'], ['name', 'ASC']] 
    });
    res.json(categories);
  } catch (error) {
    console.error("Erro em getCategories:", error.message);
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, type } = req.body;
    const userId = req.user.id;

    if (!name || !type) {
      return res.status(400).json({ error: "Nome e tipo da categoria são obrigatórios." });
    }
    if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: "Tipo de categoria inválido. Use 'income' ou 'expense'." });
    }

    const existingUserCategory = await Category.findOne({
        where: { name, type, userId, isDefault: false } 
    });

    if (existingUserCategory) {
        return res.status(400).json({ error: "Você já possui uma categoria personalizada com este nome e tipo." });
    }


    const existingDefaultCategory = await Category.findOne({
        where: { name, type, isDefault: true, userId: null }
    });
    if (existingDefaultCategory) {
    }


    const category = await Category.create({
      name,
      type,
      userId, 
      isDefault: false 
    });
    res.status(201).json(category);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Uma categoria com este nome e tipo já existe (seja padrão ou sua).' });
    }
    console.error("Erro em createCategory:", error);
    next(error);
  }
};

module.exports = {
    getCategories,
    createCategory,
    createDefaultCategories
};