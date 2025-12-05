const jwt = require('jsonwebtoken');
const pool = require('../db');
const JWT_SECRET = process.env.JWT_SECRET || 'troque_por_uma_chave_super_secreta';

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Token não informado' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const r = await pool.query('SELECT u.id, u.username, u.full_name, r.name as role_name, u.store_id FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id=$1', [payload.userId]);
    if (r.rowCount === 0) return res.status(401).json({ error: 'Usuário inválido' });
    req.user = r.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(500).json({ error: 'auth middleware não aplicado' });
    if (allowedRoles.includes(req.user.role_name)) return next();
    return res.status(403).json({ error: 'Acesso negado' });
  };
}

module.exports = { authMiddleware, requireRole };

