CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  account_code VARCHAR(10) NOT NULL REFERENCES accounts(code) ON DELETE RESTRICT,
  debit NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  description VARCHAR(255),
  date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);

CREATE INDEX IF NOT EXISTS idx_transactions_account_code ON transactions(account_code);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
