const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { Op, fn, col, literal } = require('sequelize'); 

exports.addTransaction = async (req, res, next) => {
  try {
    const { description, amount, date, type, categoryId } = req.body;
    const userId = req.user.id;

    if (!description || description.trim() === "" || amount == null || !date || !type || !categoryId) {
        return res.status(400).json({ error: "Todos os campos (descrição, valor, data, tipo, categoria) são obrigatórios." });
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: "O valor da transação deve ser um número positivo." });
    }
    if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: "Tipo de transação inválido. Use 'income' ou 'expense'." });
    }

    const category = await Category.findOne({
        where: {
            id: parseInt(categoryId, 10),
            [Op.or]: [
                { userId: userId },
                { isDefault: true, userId: null }
            ]
        }
    });

    if (!category) {
        return res.status(400).json({ error: "Categoria inválida ou não pertence ao usuário." });
    }
    if (category.type !== type) {
        return res.status(400).json({ error: `A categoria '${category.name}' é do tipo '${category.type}', mas a transação é do tipo '${type}'.`});
    }

    const transaction = await Transaction.create({
      description: description.trim(),
      amount: parsedAmount,
      date,
      type,
      categoryId: parseInt(categoryId, 10),
      userId,
    });
    
    const newTransactionWithCategory = await Transaction.findByPk(transaction.id, { 
        include: [{ model: Category, as: 'Category', attributes: ['id', 'name', 'type'] }]
    });
    res.status(201).json(newTransactionWithCategory);
  } catch (error) {
    console.error("Erro em addTransaction:", error);
    next(error);
  }
};

exports.getTransactionsByUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month, year, type: transactionTypeFilter, categoryId: filterCategoryId } = req.query;
    
    const whereClause = { userId };

    if (month && year) {
        const F_month = parseInt(month, 10);
        const F_year = parseInt(year, 10);
        if (!isNaN(F_month) && !isNaN(F_year) && F_month >= 1 && F_month <= 12) {
          const startDate = `${F_year}-${String(F_month).padStart(2, '0')}-01`;
          const tempDate = new Date(F_year, F_month, 0); 
          const endDate = `${F_year}-${String(F_month).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
          whereClause.date = { [Op.between]: [startDate, endDate] };
        }
    }
    if (transactionTypeFilter && ['income', 'expense'].includes(transactionTypeFilter)) {
        whereClause.type = transactionTypeFilter;
    }
    if (filterCategoryId && !isNaN(parseInt(filterCategoryId, 10))) {
        whereClause.categoryId = parseInt(filterCategoryId, 10);
    }

    const transactions = await Transaction.findAll({
      where: whereClause,
      include: [{ model: Category, as: 'Category', attributes: ['id', 'name', 'type'] }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json(transactions);
  } catch (error) {
    console.error("Erro em getTransactionsByUser:", error);
    next(error);
  }
};

exports.updateTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { description, amount, date, type, categoryId } = req.body;

        const transaction = await Transaction.findOne({ where: { id: parseInt(id, 10), userId } });
        if (!transaction) {
            return res.status(404).json({ error: "Transação não encontrada ou não pertence ao usuário." });
        }

        if (amount !== undefined && (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)) {
            return res.status(400).json({ error: "O valor da transação deve ser um número positivo." });
        }
        if (type !== undefined && !['income', 'expense'].includes(type)) {
            return res.status(400).json({ error: "Tipo de transação inválido." });
        }
        
        let categoryTypeMatches = true;
        if (categoryId !== undefined) {
            const category = await Category.findOne({
                where: {
                    id: parseInt(categoryId, 10),
                    [Op.or]: [{ userId: userId }, { isDefault: true, userId: null }]
                }
            });
            if (!category) {
                return res.status(400).json({ error: "Categoria inválida ou não pertence ao usuário." });
            }
            const typeToCheck = type || transaction.type;
            if (category.type !== typeToCheck) {
                categoryTypeMatches = false;
            }
        } else if (type !== undefined && transaction.categoryId) {
            const existingCategory = await Category.findByPk(transaction.categoryId);
            if (existingCategory && existingCategory.type !== type) {
                categoryTypeMatches = false;
            }
        }

        if (!categoryTypeMatches) {
            return res.status(400).json({ error: "O tipo da transação não corresponde ao tipo da categoria selecionada." });
        }

        if(description !== undefined) transaction.description = description.trim();
        if(amount !== undefined) transaction.amount = parseFloat(amount);
        if(date !== undefined) transaction.date = date;
        if(type !== undefined) transaction.type = type;
        if(categoryId !== undefined) transaction.categoryId = parseInt(categoryId, 10);
        
        await transaction.save();
        const updatedTransactionWithCategory = await Transaction.findByPk(transaction.id, {
            include: [{ model: Category, as: 'Category', attributes: ['id', 'name', 'type'] }]
        });
        res.json(updatedTransactionWithCategory);
    } catch (error) {
        console.error("Erro em updateTransaction:", error);
        next(error);
    }
};

exports.deleteTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const transaction = await Transaction.findOne({ where: { id: parseInt(id, 10), userId } });
        if (!transaction) {
            return res.status(404).json({ error: "Transação não encontrada ou não pertence ao usuário." });
        }
        await transaction.destroy();
        res.status(200).json({ message: "Transação excluída com sucesso.", id: parseInt(id, 10) });
    } catch (error) {
        console.error("Erro em deleteTransaction:", error);
        next(error);
    }
};

exports.getBalanceUntilDate = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query; 

    if (!month || !year) {
      return res.status(400).json({ error: "Mês e ano são obrigatórios." });
    }

    const F_month = parseInt(month, 10);
    const F_year = parseInt(year, 10);

    if (isNaN(F_month) || isNaN(F_year) || F_month < 1 || F_month > 12) {
      return res.status(400).json({ error: "Mês ou ano inválido." });
    }

    let prevMonth = F_month - 1;
    let prevYear = F_year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    
    const endDatePreviousMonth = new Date(prevYear, prevMonth, 0).toISOString().slice(0,10);

    const totalIncome = await Transaction.sum('amount', {
      where: {
        userId,
        type: 'income',
        date: { [Op.lte]: endDatePreviousMonth } 
      }
    });

    const totalExpense = await Transaction.sum('amount', {
      where: {
        userId,
        type: 'expense',
        date: { [Op.lte]: endDatePreviousMonth } 
      }
    });
    
    const openingBalance = (totalIncome || 0) - (totalExpense || 0);

    res.json({ openingBalance: parseFloat(openingBalance.toFixed(2)) });

  } catch (error) {
    console.error("Erro em getBalanceUntilDate:", error);
    next(error);
  }
};