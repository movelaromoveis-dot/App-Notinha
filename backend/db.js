const { Pool } = require('pg');

// Support both a full DATABASE_URL or individual env vars
const connectionString = process.env.DATABASE_URL || null;
let poolConfig;
if (connectionString) {
  poolConfig = { connectionString };
} else {
  // Read individual env vars; fallback to local defaults
  const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
  const port = process.env.DB_PORT || process.env.PGPORT || 5432;
  const user = process.env.DB_USER || process.env.PGUSER || 'postgres';
  const password = process.env.DB_PASS || process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || 'postgres';
  const database = process.env.DB_NAME || process.env.PGDATABASE || 'notafacil';

  poolConfig = {
    host,
    port: Number(port),
    user,
    password,
    database,
  };
}

const pool = new Pool(poolConfig);
module.exports = pool;
