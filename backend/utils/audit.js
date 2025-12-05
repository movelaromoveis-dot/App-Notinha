const pool = require('../db');

async function auditLog({ user_id, action, description, ip, entity, entity_id }) {
  try {
    await pool.query(
      `INSERT INTO audit_log (user_id, action, details, entity, entity_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [user_id || null, action, description || null, entity || null, entity_id || null]
    );
  } catch (err) {
    console.error("Erro ao registrar auditoria:", err);
  }
}

module.exports = auditLog;
