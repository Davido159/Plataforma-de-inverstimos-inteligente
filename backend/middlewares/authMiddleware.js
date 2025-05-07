const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization');
  if(!token) return res.status(401).json({ error: 'Sem token, autorização negada' });
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch(err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
