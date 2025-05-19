const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const authMiddleware = require('../middlewares/authMiddleware'); 

router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
        return res.status(400).json({ message: 'ID do usuário não encontrado no token' });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'createdAt'],
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(user.toJSON());
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar dados do perfil' });
  }
});

module.exports = router;