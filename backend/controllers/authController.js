// /backend/controllers/authController.js 
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Sequelize Model

exports.register = async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    // Verifica se o usuário já existe usando Sequelize
    let user = await User.findOne({ where: { email: email } });
    if (user) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    // Cria o usuário usando Sequelize (o hook beforeSave fará o hash da senha)
    user = await User.create({ name, email, password });

    // Não enviamos o usuário criado de volta por padrão, apenas sucesso
    res.status(201).json({ message: 'Usuário registrado com sucesso' });

  } catch (err) {
     // Trata erros de validação do Sequelize (ex: email inválido)
    if (err.name === 'SequelizeValidationError') {
        const messages = err.errors.map(e => e.message);
        return res.status(400).json({ error: messages });
    }
     // Trata erros de constraint única (ex: email já existe - dupla checagem)
    if (err.name === 'SequelizeUniqueConstraintError') {
         return res.status(400).json({ error: 'Email já registrado.' });
     }
    next(err); // Passa outros erros para o errorHandler
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    // Encontra o usuário pelo email
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return res.status(400).json({ error: 'Credenciais inválidas' }); // Erro genérico
    }

    // Compara a senha usando o método do modelo
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Credenciais inválidas' }); // Erro genérico
    }

    // Cria o payload e gera o token JWT
    const payload = { id: user.id, email: user.email }; // Usa user.id do Sequelize
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    next(err);
  }
};