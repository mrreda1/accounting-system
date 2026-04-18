CREATE TABLE accounts (
  id    SERIAL PRIMARY KEY,
  code  VARCHAR(10) UNIQUE NOT NULL,
  name  VARCHAR(100) NOT NULL,
  initial_credit NUMERIC(15,2) DEFAULT 0,
  initial_debit NUMERIC(15,2) DEFAULT 0,
  type  VARCHAR(20) NOT NULL CHECK (type IN ('asset', 'liability and equity', 'revenue', 'expense'))
);
