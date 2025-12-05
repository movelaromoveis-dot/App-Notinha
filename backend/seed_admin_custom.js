require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || null,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5555),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'MovelaroApp',
  database: process.env.DB_NAME || 'notafacil'
});

async function run() {
  const client = await pool.connect();
  try {
    const rRole = await client.query("SELECT id FROM roles WHERE name='admin' LIMIT 1");
    if (rRole.rowCount === 0) {
      console.error('Role admin não encontrada. Rode as migrations primeiro.');
      process.exit(1);
    }
    const adminRoleId = rRole.rows[0].id;

    const username = 'admin';
    const plain = 'admin123';
    const hash = await bcrypt.hash(plain, 10);

    const insert = `
      INSERT INTO users (username, password_hash, full_name, role_id, must_change_password)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id;
    `;
    const r = await client.query(insert, [username, hash, 'Admin Padrão', adminRoleId]);
    if (r.rowCount > 0) {
      console.log('Usuário admin criado/atualizado (username: admin, senha: admin123)');
    } else {
      console.log('Falha ao criar/atualizar admin');
    }
  } catch (err) {
    console.error('Erro seed admin:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
