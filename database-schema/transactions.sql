CREATE TABLE transactions (
  id                  SERIAL PRIMARY KEY,
  account_code_debit  VARCHAR(21) NOT NULL REFERENCES accounts(code),
  account_code_credit VARCHAR(21) NOT NULL REFERENCES accounts(code),
  amount              NUMERIC(15,2) DEFAULT 0,
  cost_centre         VARCHAR(40),
  numirical           VARCHAR(40),
  description         VARCHAR(255),
  date                DATE NOT NULL DEFAULT CURRENT_DATE
);
