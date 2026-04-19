CREATE TABLE accounts (
  id    SERIAL PRIMARY KEY,
  code  VARCHAR(21) UNIQUE NOT NULL,
  name  VARCHAR(200) NOT NULL,
  opening_credit NUMERIC(15,2) DEFAULT 0,
  opening_debit NUMERIC(15,2) DEFAULT 0,
  type  VARCHAR(40) NOT NULL CHECK (type IN ('asset', 'liability and equity', 'expense', 'revenue')),
  parent_code VARCHAR(10) REFERENCES accounts(code)
);
