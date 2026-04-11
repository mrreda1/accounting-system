const pool = require('../config/db');

exports.getAccount = async (req, res) => {
  try {
    const { code } = req.params;

    const account = await pool.query(`SELECT * FROM accounts WHERE code = $1`, [
      code,
    ]);

    if (account.rows.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: `Account with code ${code} not found`,
      });
    }

    const transactions = await pool.query(
      `SELECT id, debit, credit, description, date::text
       FROM transactions
       WHERE account_code = $1
       ORDER BY date ASC`,
      [code],
    );

    let runningBalance = 0;
    const ledger = transactions.rows.map((tx) => {
      runningBalance += parseFloat(tx.debit) - parseFloat(tx.credit);
      return {
        id: tx.id,
        date: tx.date,
        description: tx.description,
        debit: parseFloat(tx.debit),
        credit: parseFloat(tx.credit),
        balance: runningBalance,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        account: account.rows[0],
        ledger,
        finalBalance: runningBalance,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};

exports.getLedgerInfo = async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query(
      `SELECT * FROM transactions
       WHERE account_code = $1
       ORDER BY date ASC`,
      [code],
    );
    res.status(200).json({
      status: 'success',
      results: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.addAccount = async (req, res) => {
  const { code, name } = req.body;

  if (!code || !name) {
    return res.status(400).json({
      status: 'fail',
      message: 'code and name are required',
    });
  }

  const type = inferType(code);

  if (!type) {
    return res.status(400).json({
      status: 'fail',
      message:
        'Code must start with 1 (asset), 2 (liability), 3 (equity), 4 (revenue), or 5 (expense)',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO accounts (code, name, type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [code, name, type],
    );
    res.status(201).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({
        status: 'fail',
        message: `Account with code ${code} already exists`,
      });
    }
    res.status(500).json({ status: 'error', message: err.message });
  }
};

function inferType(code) {
  const prefix = String(code)[0];
  const map = {
    1: 'asset',
    2: 'liability',
    3: 'equity',
    4: 'revenue',
    5: 'expense',
  };
  return map[prefix] || null;
}
