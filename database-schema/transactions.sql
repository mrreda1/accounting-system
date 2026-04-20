CREATE SEQUENCE IF NOT EXISTS transactions_journal_no_seq;

CREATE TABLE transactions (
  id                  SERIAL PRIMARY KEY,
  journal_no          BIGINT NOT NULL DEFAULT nextval('transactions_journal_no_seq'),
  account_code_debit  VARCHAR(21) NOT NULL REFERENCES accounts(code),
  account_code_credit VARCHAR(21) NOT NULL REFERENCES accounts(code),
  amount              NUMERIC(15,2) DEFAULT 0,
  cost_centre         VARCHAR(40),
  numerical           VARCHAR(40),
  description         VARCHAR(255),
  date                DATE NOT NULL DEFAULT CURRENT_DATE
);
