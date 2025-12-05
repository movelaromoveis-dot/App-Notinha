const pool = require('../db');

async function auditLog({ user_id, action, description, ip }) {
  try {
    await pool.query(
      `INSERT INTO audit_log (user_id, action, description, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [user_id || null, action, description || null, ip || null]
    );
  } catch (err) {
    console.error("Erro ao registrar auditoria:", err);
  }
}

module.exports = auditLog;
