/*
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  const { role } = req.query;
  try {
    if (role) {
      const r = await pool.query(
        `SELECT id, username, full_name FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name=$1 AND active=true`,
        [role]
      );
      return res.json(r.rows);
    }
    const r = await pool.query('SELECT id, username, full_name FROM users WHERE active=true');
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro listar usuários' });
  }
});

module.exports = router;
*/

// backend/routes/users.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const { authMiddleware, requireRole } = require('../middleware/auth');
const auditLog = require('../utils/audit');

// GET /users?role=vendedor
router.get('/', authMiddleware, async (req, res) => {
  const { role } = req.query;
  try {
    if (role) {
      const r = await pool.query(
        `SELECT u.id, u.username, u.full_name, r.name as role_name, u.store_id, u.active
         FROM users u JOIN roles r ON u.role_id = r.id
         WHERE r.name = $1 AND u.active = true
         ORDER BY u.full_name NULLS LAST`,
        [role]
      );
      return res.json(r.rows);
    }
    // lista geral (admin/gerente)
    const r = await pool.query(
      `SELECT u.id, u.username, u.full_name, r.name as role_name, u.store_id, u.active
       FROM users u JOIN roles r ON u.role_id = r.id
       ORDER BY u.full_name NULLS LAST`
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro listar usuários' });
  }
});

// POST /users  (criar usuário) - protegido: gerente e admin
router.post('/', authMiddleware, requireRole('gerente','admin'), async (req, res) => {
  const requester = req.user;
  const { username, password, full_name, role_name, store_id, active } = req.body;
  if (!username || !password || !role_name) return res.status(400).json({ error: 'username, password e role_name são obrigatórios' });

  try {
    // se quem cria não é admin, impedir criar admin
    if (role_name === 'admin' && requester.role_name !== 'admin') {
      return res.status(403).json({ error: 'Apenas admin pode criar outro admin' });
    }
    // buscar role id
    const rRole = await pool.query('SELECT id FROM roles WHERE name=$1', [role_name]);
    if (rRole.rowCount === 0) return res.status(400).json({ error: 'Role inválida' });

    const role_id = rRole.rows[0].id;
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role_id, store_id, active, must_change_password)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6, true), true) RETURNING id, username, full_name`,
      [username, hash, full_name || null, role_id, store_id || null, (active===false?false:true)]
    );
    await auditLog({
      user_id: requester.id,
      action: 'criar_usuario',
      description: `Criado usuário ${username} com role ${role_name}`,
      ip: req.ip
    });
    res.json({ ok: true, user: r.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'Usuário já existe' });
    res.status(500).json({ error: 'Erro criar usuário' });
  }
});

// PUT /users/:id (editar) - gerente/admin (mas gerente não pode transformar em admin)
router.put('/:id', authMiddleware, requireRole('gerente','admin'), async (req, res) => {
  const requester = req.user;
  const id = Number(req.params.id);
  const { full_name, role_name, store_id, active } = req.body;
  try {
    const userRes = await pool.query('SELECT u.id, r.name as role_name FROM users u JOIN roles r ON u.role_id=r.id WHERE u.id=$1', [id]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    const targetRole = userRes.rows[0].role_name;
    // if trying to change role to admin but requester isn't admin -> forbidden
    if (role_name === 'admin' && requester.role_name !== 'admin') {
      return res.status(403).json({ error: 'Apenas admin pode tornar outro usuário admin' });
    }
    // gerente não pode editar admins
    if (requester.role_name === 'gerente' && targetRole === 'admin') {
      return res.status(403).json({ error: 'Gerente não pode editar usuário admin' });
    }
    let role_id = null;
    if (role_name) {
      const r = await pool.query('SELECT id FROM roles WHERE name=$1', [role_name]);
      if (r.rowCount === 0) return res.status(400).json({ error: 'Role inválida' });
      role_id = r.rows[0].id;
    }
    await pool.query(
      `UPDATE users SET full_name = COALESCE($1, full_name), role_id = COALESCE($2, role_id), store_id = COALESCE($3, store_id), active = COALESCE($4, active) WHERE id=$5`,
      [full_name, role_id, store_id, active, id]
    );
    await auditLog({
      user_id: requester.id,
      action: 'editar_usuario',
      description: `Usuário ${requester.username} editou o usuário ID ${id}`,
      ip: req.ip
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro atualizar usuário' });
  }
});

// PATCH /users/:id/password (resetar senha) - gerente/admin
router.patch('/:id/password', authMiddleware, requireRole('gerente','admin'), async (req, res) => {
  const requester = req.user;
  const id = Number(req.params.id);
  const { new_password } = req.body;
  if (!new_password) return res.status(400).json({ error: 'new_password requerido' });
  try {
    // gerente não pode resetar senha de admin? Permitimos resetar, mas não criar/admin change earlier
    const userRes = await pool.query('SELECT u.id, r.name as role_name FROM users u JOIN roles r ON u.role_id=r.id WHERE u.id=$1', [id]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (requester.role_name === 'gerente' && userRes.rows[0].role_name === 'admin') {
      return res.status(403).json({ error: 'Gerente não pode resetar senha de admin' });
    }
    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash=$1, must_change_password=true WHERE id=$2', [hash, id]);
    await auditLog({
      user_id: requester.id,
      action: 'resetar_senha',
      description: `Senha do usuário ${id} foi resetada por ${requester.username}`,
      ip: req.ip
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro resetar senha' });
  }
});

// PATCH /users/:id/activate (ativar/desativar) - gerente/admin
router.patch('/:id/activate', authMiddleware, requireRole('gerente','admin'), async (req, res) => {
  const requester = req.user;
  const id = Number(req.params.id);
  const { active } = req.body;
  if (typeof active !== 'boolean') return res.status(400).json({ error: 'active boolean requerido' });
  try {
    const userRes = await pool.query('SELECT u.id, r.name as role_name FROM users u JOIN roles r ON u.role_id=r.id WHERE u.id=$1', [id]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (requester.role_name === 'gerente' && userRes.rows[0].role_name === 'admin') {
      return res.status(403).json({ error: 'Gerente não pode desativar admin' });
    }
    await pool.query('UPDATE users SET active = $1 WHERE id=$2', [active, id]);
    await auditLog({
      user_id: requester.id,
      action: 'alterar_status_usuario',
      description: `Usuário ${requester.username} alterou status de ${userRes.rows[0].id} para ${active}`,
      ip: req.ip
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ativar/desativar' });
  }
});

module.exports = router;
