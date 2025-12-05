// backend/routes/stores.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const auditLog = require('../utils/audit');

// GET /stores
router.get('/', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query('SELECT id, name, address FROM stores ORDER BY name');
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro listar lojas' });
  }
});

// POST /stores  (admin only)
router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const { name, address } = req.body;
  if (!name) return res.status(400).json({ error: 'name obrigatório' });
  try {
    const r = await pool.query('INSERT INTO stores (name, address) VALUES ($1,$2) RETURNING id, name', [name, address || null]);
    await auditLog({
      user_id: req.user.id,
      action: 'criar_loja',
      description: `Criada loja ${name}`,
      ip: req.ip
    });
    res.json({ ok: true, store: r.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro criar loja' });
  }
});

module.exports = router;
