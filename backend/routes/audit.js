const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT a.*, u.username
      FROM audit_log a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.id DESC
      LIMIT 300
    `);
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro carregar auditoria' });
  }
});

module.exports = router;
