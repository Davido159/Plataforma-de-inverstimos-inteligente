const Budget = require('../models/Budget');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const { Op, fn, col, literal } = require('sequelize');


exports.setBudget = async (req, res, next) => {
    try {
        const { categoryId, month, limitAmount, notes } = req.body;
        const userId = req.user.id;

        if (!categoryId || !month || limitAmount === undefined) {
            return res.status(400).json({ error: "ID da categoria, mês (YYYY-MM) e valor limite são obrigatórios." });
        }
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
            return res.status(400).json({ error: "Formato do mês inválido. Use YYYY-MM." });
        }
        const parsedLimit = parseFloat(limitAmount);
        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            return res.status(400).json({ error: "Valor limite do orçamento deve ser um número positivo." });
        }

        const category = await Category.findOne({
            where: {
                id: parseInt(categoryId, 10),
                type: 'expense', // Orçamentos são geralmente para despesas
                [Op.or]: [{ userId: userId }, { isDefault: true, userId: null }]
            }
        });

        if (!category) {
            return res.status(400).json({ error: "Categoria inválida, não encontrada, ou não é do tipo 'despesa'." });
        }

        const [budget, created] = await Budget.findOrCreate({
            where: { userId, categoryId: parseInt(categoryId, 10), month },
            defaults: { limitAmount: parsedLimit, notes },
        });

        if (!created) { 
            budget.limitAmount = parsedLimit;
            budget.notes = notes || budget.notes; 
            await budget.save();
        }
        
        const resultBudget = await Budget.findByPk(budget.id, {
            include: [{ model: Category, as: 'Category', attributes: ['id', 'name', 'type']}]
        });

        res.status(created ? 201 : 200).json(resultBudget);
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors ? error.errors.map(e => e.message) : [error.message];
            return res.status(400).json({ error: messages.join(', ') });
        }
        console.error("Erro em setBudget:", error);
        next(error);
    }
};

exports.getBudgetsForMonth = async (req, res, next) => {
    try {
        const { month } = req.query; 
        const userId = req.user.id;

        if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
            return res.status(400).json({ error: "Mês (YYYY-MM) é obrigatório e deve estar no formato correto." });
        }

        const budgets = await Budget.findAll({
            where: { userId, month },
            include: [{ model: Category, as: 'Category', attributes: ['id', 'name', 'type'] }],
            order: [[{model: Category, as: 'Category'}, 'name', 'ASC']]
        });

        const year = parseInt(month.substring(0, 4), 10);
        const monthNum = parseInt(month.substring(5, 7), 10);
        const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
        const tempDate = new Date(year, monthNum, 0);
        const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;

        const budgetsWithSpentAmount = await Promise.all(budgets.map(async (budget) => {
            const spent = await Transaction.sum('amount', {
                where: {
                    userId,
                    categoryId: budget.categoryId,
                    type: 'expense',
                    date: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });
            return {
                ...budget.toJSON(),
                spentAmount: parseFloat(spent || 0).toFixed(2)
            };
        }));

        res.json(budgetsWithSpentAmount);
    } catch (error) {
        console.error("Erro em getBudgetsForMonth:", error);
        next(error);
    }
};

exports.deleteBudget = async (req, res, next) => {
    try {
        const { budgetId } = req.params;
        const userId = req.user.id;

        const budget = await Budget.findOne({ where: { id: parseInt(budgetId, 10), userId }});

        if (!budget) {
            return res.status(404).json({ error: "Orçamento não encontrado ou não pertence ao usuário." });
        }

        await budget.destroy();
        res.status(200).json({ message: "Orçamento excluído com sucesso.", id: parseInt(budgetId, 10) });

    } catch (error) {
        console.error("Erro em deleteBudget:", error);
        next(error);
    }
};