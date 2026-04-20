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
      code VARCHAR(21) UNIQUE NOT NULL,
      name VARCHAR(200) NOT NULL,
      opening_credit NUMERIC(15, 2) DEFAULT 0,
      opening_debit NUMERIC(15, 2) DEFAULT 0,
      type VARCHAR(40) NOT NULL CHECK (type IN ('asset', 'liability and equity', 'expense', 'revenue')),
      parent_code VARCHAR(10) REFERENCES accounts(code)
    )
  `);

  await pool.query('CREATE SEQUENCE IF NOT EXISTS transactions_journal_no_seq');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      journal_no BIGINT NOT NULL DEFAULT nextval('transactions_journal_no_seq'),
      account_code_debit VARCHAR(21) NOT NULL REFERENCES accounts(code),
      account_code_credit VARCHAR(21) NOT NULL REFERENCES accounts(code),
      amount NUMERIC(15, 2) DEFAULT 0,
      cost_centre VARCHAR(40),
      numerical VARCHAR(40),
      description VARCHAR(255),
      date DATE NOT NULL DEFAULT CURRENT_DATE
    )
  `);

  await pool.query(`
    ALTER TABLE accounts
      ALTER COLUMN code TYPE VARCHAR(21),
      ALTER COLUMN name TYPE VARCHAR(200),
      ALTER COLUMN type TYPE VARCHAR(40)
  `);

  await pool.query(
    'ALTER TABLE accounts ADD COLUMN IF NOT EXISTS opening_credit NUMERIC(15, 2) DEFAULT 0',
  );
  await pool.query(
    'ALTER TABLE accounts ADD COLUMN IF NOT EXISTS opening_debit NUMERIC(15, 2) DEFAULT 0',
  );
  await pool.query(
    'ALTER TABLE accounts ADD COLUMN IF NOT EXISTS parent_code VARCHAR(10)',
  );

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'accounts_type_check'
          AND conrelid = 'accounts'::regclass
      ) THEN
        ALTER TABLE accounts DROP CONSTRAINT accounts_type_check;
      END IF;
    END $$;
  `);

  await pool.query(`
    UPDATE accounts
    SET type = 'liability and equity'
    WHERE LOWER(TRIM(type)) IN ('liability', 'equity', 'liability and equity')
  `);

  await pool.query(`
    ALTER TABLE accounts
    ADD CONSTRAINT accounts_type_check
    CHECK (type IN ('asset', 'liability and equity', 'expense', 'revenue'))
  `).catch(() => {});

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'accounts_parent_code_fkey'
          AND conrelid = 'accounts'::regclass
      ) THEN
        ALTER TABLE accounts
        ADD CONSTRAINT accounts_parent_code_fkey
        FOREIGN KEY (parent_code) REFERENCES accounts(code);
      END IF;
    END $$;
  `);

  await pool.query(
    'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_code_debit VARCHAR(21)',
  );
  await pool.query(
    'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_code_credit VARCHAR(21)',
  );
  await pool.query(
    'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(15, 2) DEFAULT 0',
  );
  await pool.query(
    'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cost_centre VARCHAR(40)',
  );
  await pool.query(
    'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS numerical VARCHAR(40)',
  );
  await pool.query(
    'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS numirical VARCHAR(40)',
  );
  await pool.query(
    'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS journal_no BIGINT',
  );
  await pool.query(
    "ALTER TABLE transactions ALTER COLUMN journal_no SET DEFAULT nextval('transactions_journal_no_seq')",
  );

  await pool.query(`
    UPDATE transactions
    SET
      account_code_debit = COALESCE(account_code_debit, account_code),
      account_code_credit = COALESCE(account_code_credit, account_code),
      amount = COALESCE(amount, NULLIF(debit, 0), NULLIF(credit, 0), 0)
  `).catch(() => {});

  await pool.query(
    'UPDATE transactions SET numerical = COALESCE(numerical, numirical)',
  ).catch(() => {});

  await pool.query(
    "UPDATE transactions SET journal_no = nextval('transactions_journal_no_seq') WHERE journal_no IS NULL",
  );
  await pool.query(`
    SELECT setval(
      'transactions_journal_no_seq',
      COALESCE((SELECT MAX(journal_no) FROM transactions), 0) + 1,
      false
    )
  `);
  await pool.query(
    'ALTER TABLE transactions ALTER COLUMN journal_no SET NOT NULL',
  ).catch(() => {});

  await pool.query(
    'ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_check',
  );
  await pool.query(
    'ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_debit_check',
  );
  await pool.query(
    'ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_credit_check',
  );
  await pool.query(
    'ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_account_code_fkey',
  );

  await pool.query('DROP INDEX IF EXISTS idx_transactions_account_code');

  await pool.query('ALTER TABLE transactions DROP COLUMN IF EXISTS account_code');
  await pool.query('ALTER TABLE transactions DROP COLUMN IF EXISTS debit');
  await pool.query('ALTER TABLE transactions DROP COLUMN IF EXISTS credit');

  await pool.query(
    'ALTER TABLE transactions ALTER COLUMN date TYPE DATE USING date::date',
  );

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'transactions_account_code_debit_fkey'
          AND conrelid = 'transactions'::regclass
      ) THEN
        ALTER TABLE transactions
        ADD CONSTRAINT transactions_account_code_debit_fkey
        FOREIGN KEY (account_code_debit) REFERENCES accounts(code);
      END IF;
    END $$;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'transactions_account_code_credit_fkey'
          AND conrelid = 'transactions'::regclass
      ) THEN
        ALTER TABLE transactions
        ADD CONSTRAINT transactions_account_code_credit_fkey
        FOREIGN KEY (account_code_credit) REFERENCES accounts(code);
      END IF;
    END $$;
  `);

  await pool.query(
    'CREATE INDEX IF NOT EXISTS idx_transactions_account_code_debit ON transactions(account_code_debit)',
  );
  await pool.query(
    'CREATE INDEX IF NOT EXISTS idx_transactions_account_code_credit ON transactions(account_code_credit)',
  );
  await pool.query(
    'CREATE INDEX IF NOT EXISTS idx_transactions_journal_no ON transactions(journal_no)',
  );
  await pool.query(
    'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)',
  );

  console.log('PostgreSQL connected and schema is ready');
}

module.exports = pool;
module.exports.initializeDatabase = initializeDatabase;
