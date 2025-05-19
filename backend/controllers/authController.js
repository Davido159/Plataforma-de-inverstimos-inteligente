const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res, next) => {
  const { name, email, password } = req.body;
  console.log('[REGISTER] Recebida requisição de registro para:', { name, email });

  if (!name || !email || !password) {
    console.log('[REGISTER] Campos faltando:', { name, email, password_present: !!password });
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
  }

  try {
    console.log(`[REGISTER] Verificando se o usuário ${email} já existe...`);
    let user = await User.findOne({ where: { email: email } });

    if (user) {
      console.log('[REGISTER] Usuário já existe:', email);
      return res.status(400).json({ error: 'Usuário já existe com este email.' });
    }

    console.log(`[REGISTER] Criando novo usuário ${email}... (Senha será hasheada pelo hook do modelo)`);
    user = await User.create({ name, email, password }); 

    const createdUser = await User.findByPk(user.id);
    if (createdUser) {
        console.log('[REGISTER] Usuário registrado com sucesso:', { id: createdUser.id, email: createdUser.email });
        res.status(201).json({ message: 'Usuário registrado com sucesso. Você já pode fazer login.' });
    } else {
        console.error('[REGISTER] Falha ao criar usuário, User.create retornou, mas findByPk falhou.');
        return res.status(500).json({ error: 'Erro interno ao registrar usuário.'})
    }

  } catch (err) {
    console.error('[REGISTER] Erro durante o processo de registro:', err.name, err.message);
    if (err.errors) { 
        err.errors.forEach(e => console.error(`[REGISTER VALIDATION ERROR] ${e.path}: ${e.message}`));
    }

    if (err.name === 'SequelizeValidationError') {
        const messages = err.errors.map(e => e.message);
        return res.status(400).json({ error: messages.join(', ') });
    }
    if (err.name === 'SequelizeUniqueConstraintError') {
         console.log('[REGISTER] Erro de constraint única, provavelmente email já registrado:', email);
         return res.status(400).json({ error: 'Este email já está registrado.' });
     }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  console.log('[LOGIN] Tentativa de login para:', email);

  if (!email || !password) {
    console.log('[LOGIN] Email ou senha não fornecidos.');
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    console.log(`[LOGIN] Buscando usuário ${email} no banco de dados...`);
    const user = await User.findOne({ where: { email: email } });

    if (!user) {
      console.log('[LOGIN] Usuário não encontrado no banco de dados:', email);
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    console.log('[LOGIN] Usuário encontrado, comparando senha para:', email);
    const isMatch = await user.comparePassword(password); 

    if (!isMatch) {
      console.log('[LOGIN] Senha não confere para:', email);
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    console.log('[LOGIN] Login bem-sucedido, gerando token JWT para:', email);
    const payload = { 
      id: user.id, 
      email: user.email,
      name: user.name 
    };
    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } 
    );

    res.json({ 
        token,
        user: { 
            id: user.id,
            name: user.name,
            email: user.email
        }
    });
  } catch (err) {
    console.error('[LOGIN] Erro durante o processo de login:', err.name, err.message);
    next(err); 
  }
};