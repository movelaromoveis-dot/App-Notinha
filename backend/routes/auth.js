const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'troque_por_uma_chave_super_secreta';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username e password obrigatórios' });

  try {
    const r = await pool.query('SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE username=$1 AND active=true', [username]);
    if (r.rowCount === 0) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    const user = r.rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Usuário ou senha inválidos' });

    const payload = { userId: user.id, username: user.username, role: user.role_name, store_id: user.store_id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role_name,
        store_id: user.store_id,
        must_change_password: user.must_change_password
      }
    });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/register', async (req, res) => {
  const { username, password, full_name, role_id, store_id } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username e password obrigatórios' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role_id, store_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, username`,
      [username, hash, full_name || null, role_id || null, store_id || null]
    );
    res.json({ ok: true, user: r.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

module.exports = router;
