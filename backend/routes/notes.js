const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');
const auditLog = require('../utils/audit');

function calcSubtotal(items) {
  return (items || []).reduce((s, it) => s + (Number(it.qty || 0) * Number(it.unit_price || 0)), 0);
}

router.post('/', authMiddleware, async (req, res) => {
  const u = req.user;
  const data = req.body;
  if (!data.cliente_nome) return res.status(400).json({ error: 'Cliente é obrigatório' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const total = calcSubtotal(data.items || []);
    const assigned = (data.assign_checked && data.assigned_seller) ? data.assigned_seller : u.id;
    const insertNote = `INSERT INTO notes (store_id, created_by, assigned_seller, cliente_nome, cliente_endereco, cliente_telefone, data_compra, data_venda, payment_method, total)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, created_at`;
    const r = await client.query(insertNote, [
      data.store_id || u.store_id || null,
      u.id,
      assigned,
      data.cliente_nome || null,
      data.cliente_endereco || null,
      data.cliente_telefone || null,
      data.data_compra || null,
      data.data_venda || null,
      data.payment_method || 'dinheiro',
      total
    ]);
    const noteId = r.rows[0].id;
    const items = data.items || [];
    for (const it of items) {
      await client.query(
        `INSERT INTO note_items (note_id, product_name, supplier_name, qty, unit_price, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [noteId, it.description || it.product_name || null, it.supplier_name || null, it.qty || 0, it.unit_price || 0, (Number(it.qty || 0) * Number(it.unit_price || 0))]
      );
    }
    await client.query('COMMIT');
    await auditLog({
      user_id: u.id,
      action: 'criar_nota',
      description: `Nota criada para cliente ${data.cliente_nome}`,
      ip: req.ip
    });
    return res.json({ ok: true, id: noteId, created_at: r.rows[0].created_at });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro criar nota', err);
    return res.status(500).json({ error: 'Erro ao criar nota' });
  } finally {
    client.release();
  }
});

router.get('/', authMiddleware, async (req, res) => {
  const u = req.user;
  const { store_id, date_from, date_to } = req.query;
  try {
    let base = `SELECT n.*, u.username as created_by_username, ua.username as assigned_username
                FROM notes n
                LEFT JOIN users u ON n.created_by = u.id
                LEFT JOIN users ua ON n.assigned_seller = ua.id`;

    if (u.role_name === 'vendedor') {
      const params = [u.id];
      const whereParts = [`(n.created_by = $1 OR n.assigned_seller = $1)`];
      if (store_id) {
        params.push(Number(store_id));
        whereParts.push(`n.store_id = $${params.length}`);
      }
      if (date_from) {
        params.push(date_from);
        whereParts.push(`n.created_at >= $${params.length}`);
      }
      if (date_to) {
        params.push(date_to);
        whereParts.push(`n.created_at <= $${params.length}`);
      }
      const sql = `${base} WHERE ${whereParts.join(' AND ')} ORDER BY n.created_at DESC`;
      const r = await pool.query(sql, params);
      return res.json(r.rows);
    } else if (u.role_name === 'gerente' || u.role_name === 'admin') {
      const r = await pool.query(base + ' ORDER BY n.created_at DESC LIMIT 500');
      return res.json(r.rows);
    } else {
      return res.status(403).json({ error: 'Acesso negado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar notas' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  const u = req.user;
  const id = req.params.id;
  try {
    const r = await pool.query('SELECT * FROM notes WHERE id=$1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Nota não encontrada' });
    const note = r.rows[0];
    if (u.role_name === 'vendedor' && note.created_by !== u.id && note.assigned_seller !== u.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const items = await pool.query('SELECT * FROM note_items WHERE note_id=$1', [id]);
    note.items = items.rows;
    return res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const u = req.user;
  const id = req.params.id;
  const data = req.body;
  const client = await pool.connect();
  try {
    const r = await client.query('SELECT * FROM notes WHERE id=$1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Nota não encontrada' });
    const note = r.rows[0];
    let canEdit = false;
    if (u.role_name === 'admin' || u.role_name === 'gerente') canEdit = true;
    if (u.role_name === 'vendedor') {
      if (note.created_by === u.id || note.assigned_seller === u.id) canEdit = true;
    }
    if (!canEdit) return res.status(403).json({ error: 'Sem permissão' });

    await client.query('BEGIN');
    const assigned = (data.assign_checked && data.assigned_seller) ? data.assigned_seller : note.created_by;
    const total = calcSubtotal(data.items || []);
    await client.query(
      `UPDATE notes SET cliente_nome=$1, cliente_endereco=$2, cliente_telefone=$3, data_compra=$4, data_venda=$5, payment_method=$6, assigned_seller=$7, total=$8, updated_at=now() WHERE id=$9`,
      [data.cliente_nome, data.cliente_endereco, data.cliente_telefone, data.data_compra, data.data_venda, data.payment_method || 'dinheiro', assigned, total, id]
    );
    await client.query('DELETE FROM note_items WHERE note_id=$1', [id]);
    for (const it of (data.items || [])) {
      await client.query(
        `INSERT INTO note_items (note_id, product_name, supplier_name, qty, unit_price, subtotal) VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, it.description || null, it.supplier_name || null, it.qty || 0, it.unit_price || 0, (Number(it.qty || 0) * Number(it.unit_price || 0))]
      );
    }
    await client.query('COMMIT');
    // auditoria: verificar se houve transferência de vendedor
    const prevAssigned = note.assigned_seller;
    const newAssigned = assigned;
    if (prevAssigned !== newAssigned) {
      await auditLog({
        user_id: u.id,
        action: 'transferir_vendedor',
        description: `Nota ID ${id} transferida para vendedor ${newAssigned}`,
        ip: req.ip
      });
    }
    await auditLog({
      user_id: u.id,
      action: 'editar_nota',
      description: `Nota ID ${id} foi editada por ${u.username}`,
      ip: req.ip
    });
    return res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ error: 'Erro ao editar nota' });
  } finally {
    client.release();
  }
});

module.exports = router;

