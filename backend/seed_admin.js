// backend/seed_admin.js
require('dotenv').config();
// Gera usuário admin (username: admin, senha: admin) - obrigado trocar senha ao logar
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5555/notafacil'
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id FROM roles WHERE name='admin' LIMIT 1");
    if (res.rowCount === 0) {
      console.error('Role admin não encontrada. Rode a migration primeiro.');
      process.exit(1);
    }
    const adminRoleId = res.rows[0].id;

    const username = 'admin';
    const plain = 'admin';
    const saltRounds = 10;
    const hash = await bcrypt.hash(plain, saltRounds);

    const insert = `
      INSERT INTO users (username, password_hash, full_name, role_id, must_change_password)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (username) DO NOTHING
      RETURNING id;
    `;
    const r = await client.query(insert, [username, hash, 'Admin Padrão', adminRoleId]);
    if (r.rowCount > 0) {
      console.log('Usuário admin criado (username: admin, senha: admin). Por segurança troque a senha no primeiro login.');
    } else {
      console.log('Usuário admin já existe. Se quiser recrie manualmente.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();

