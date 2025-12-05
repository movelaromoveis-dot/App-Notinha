-- migrations/001_init.sql

-- roles
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(32) UNIQUE NOT NULL
);

-- stores (lojas)
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  address TEXT
);

-- users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(80) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(150),
  role_id INT REFERENCES roles(id),
  store_id INT REFERENCES stores(id),
  active BOOLEAN DEFAULT TRUE,
  must_change_password BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- notes mínimo (para etapa 3 futura)
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  store_id INT REFERENCES stores(id),
  created_by INT REFERENCES users(id),
  assigned_seller INT REFERENCES users(id),
  cliente_nome VARCHAR(200),
  cliente_endereco TEXT,
  cliente_telefone VARCHAR(50),
  data_compra DATE,
  data_venda DATE,
  payment_method VARCHAR(32) DEFAULT 'dinheiro',
  total NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(32) DEFAULT 'ativa',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS note_items (
  id SERIAL PRIMARY KEY,
  note_id INT REFERENCES notes(id) ON DELETE CASCADE,
  product_name VARCHAR(200),
  supplier_name VARCHAR(200),
  qty NUMERIC(10,2),
  unit_price NUMERIC(12,2),
  subtotal NUMERIC(14,2)
);

-- audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  action VARCHAR(50),
  entity VARCHAR(50),
  entity_id INT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- seeds for roles
INSERT INTO roles (name) VALUES ('vendedor') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('gerente') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('admin') ON CONFLICT (name) DO NOTHING;

