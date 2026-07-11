-- ════════════════════════════════════════════════════════════════════
-- SwiftPOS — PostgreSQL schema
-- Run once against a fresh database:
--   psql -U postgres -d swiftpos -f db/schema.sql
-- ════════════════════════════════════════════════════════════════════

-- Staff accounts (login). Roles: 'Admin' | 'Manager' | 'Cashier'
CREATE TABLE IF NOT EXISTS users (
  user_id    SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   TEXT         NOT NULL,          -- bcrypt hash (see hash.js)
  role       VARCHAR(20)  NOT NULL DEFAULT 'Cashier',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  customer_id    SERIAL PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  phone          VARCHAR(30)  NOT NULL,
  email          VARCHAR(150) NOT NULL,
  loyalty_points INTEGER      NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  product_id   SERIAL PRIMARY KEY,
  product_name VARCHAR(150)  NOT NULL,
  category     VARCHAR(100),
  price        NUMERIC(10,2) NOT NULL,
  barcode      VARCHAR(100)  UNIQUE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- One row per product, tracks stock level
CREATE TABLE IF NOT EXISTS inventory (
  inventory_id SERIAL PRIMARY KEY,
  product_id   INTEGER NOT NULL UNIQUE REFERENCES products(product_id) ON DELETE CASCADE,
  quantity     INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Status: 'pending' → 'completed' | 'voided'
CREATE TABLE IF NOT EXISTS sales (
  sale_id        SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(user_id),
  customer_id    INTEGER REFERENCES customers(customer_id),
  total_amount   NUMERIC(10,2) NOT NULL DEFAULT 0,
  status         VARCHAR(20)   NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(30),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_items (
  sale_item_id SERIAL PRIMARY KEY,
  sale_id      INTEGER NOT NULL REFERENCES sales(sale_id) ON DELETE CASCADE,
  product_id   INTEGER NOT NULL REFERENCES products(product_id),
  quantity     INTEGER NOT NULL,
  price        NUMERIC(10,2) NOT NULL
);

-- One or more payments per sale (split payments create several rows)
CREATE TABLE IF NOT EXISTS payments (
  payment_id            SERIAL PRIMARY KEY,
  sale_id               INTEGER NOT NULL REFERENCES sales(sale_id) ON DELETE CASCADE,
  payment_method        VARCHAR(30)   NOT NULL,   -- 'cash' | 'card' | 'mobile_money'
  amount                NUMERIC(10,2) NOT NULL,
  transaction_reference VARCHAR(150),             -- Paystack reference (null for cash)
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_sales_created_at  ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status      ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_items_sale  ON sales_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_sale     ON payments(sale_id);

-- ── Seed an initial Admin user ──────────────────────────────────────
-- 1. Generate a bcrypt hash for your chosen password:
--      node hash.js yourpassword
-- 2. Insert the user (replace the hash below with your output):
-- INSERT INTO users (name, email, password, role)
-- VALUES ('Admin', 'admin@swiftpos.com', '$2b$10$REPLACE_WITH_HASH', 'Admin');
