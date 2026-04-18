const { Pool } = require('pg');
require('dotenv').config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const isSslEnabled = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

const baseConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
    }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: toInt(process.env.DB_PORT, 5432),
      database: process.env.DB_NAME || 'accounting_system',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

const pool = new Pool({
  ...baseConfig,
  ssl: isSslEnabled ? { rejectUnauthorized: false } : undefined,
  max: toInt(process.env.DB_POOL_MAX, 10),
  idleTimeoutMillis: toInt(process.env.DB_IDLE_TIMEOUT_MS, 30000),
  connectionTimeoutMillis: toInt(process.env.DB_CONNECTION_TIMEOUT_MS, 5000),
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

async function initializeDatabase() {
  await pool.query('SELECT 1');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      code VARCHAR(10) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense'))
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      account_code VARCHAR(10) NOT NULL REFERENCES accounts(code) ON DELETE RESTRICT,
      debit NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
      credit NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
      description VARCHAR(255),
      date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
    )
  `);

  await pool.query(
    'CREATE INDEX IF NOT EXISTS idx_transactions_account_code ON transactions(account_code)',
  );
  await pool.query(
    'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)',
  );

  console.log('PostgreSQL connected and schema is ready');
}

module.exports = pool;
module.exports.initializeDatabase = initializeDatabase;
