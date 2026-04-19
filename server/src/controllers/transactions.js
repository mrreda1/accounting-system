const pool = require('../config/db');

exports.getTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        t.id,
        t.account_code,
        a.name AS account_name,
        t.debit,
        t.credit,
        t.description,
        t.date
      FROM transactions t
      LEFT JOIN accounts a ON a.code = t.account_code
      ORDER BY t.date DESC, t.id DESC`,
    );

    const data = result.rows.map((row) => ({
      ...row,
      debit: parseFloat(row.debit),
      credit: parseFloat(row.credit),
    }));

    res.status(200).json({
      status: 'success',
      results: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};

exports.addTransaction = async (req, res) => {
  const {
    account_code_debit,
    account_code_credit,
    amount,
    description,
    date,
    cost_centre,
    numirical,
  } = req.body;

  if (!account_code_debit || !account_code_credit || !amount) {
    return res.status(400).json({
      status: 'fail',
      message:
        'account_code_debit, account_code_credit and amount are required',
    });
  }

  if (account_code_debit === account_code_credit) {
    return res.status(400).json({
      status: 'fail',
      message: 'debit and credit accounts cannot be the same',
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'amount must be greater than 0',
    });
  }

  try {
    const debitAccount = await pool.query(
      `SELECT code, name FROM accounts WHERE code = $1`,
      [account_code_debit],
    );
    const creditAccount = await pool.query(
      `SELECT code, name FROM accounts WHERE code = $1`,
      [account_code_credit],
    );

    if (debitAccount.rows.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Debit account ${account_code_debit} does not exist`,
      });
    }

    if (creditAccount.rows.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Credit account ${account_code_credit} does not exist`,
      });
    }

    const result = await pool.query(
      `INSERT INTO transactions 
        (account_code_debit, account_code_credit, amount, description, date, cost_centre, numirical)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        account_code_debit,
        account_code_credit,
        amount,
        description || null,
        date || new Date().toISOString().split('T')[0],
        cost_centre || null,
        numirical || null,
      ],
    );

    res.status(201).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.date,
        t.account_code_debit,
        t.account_code_credit,
        a_debit.name  AS account_name_debit,
        a_credit.name AS account_name_credit,
        t.amount,
        t.description,
        t.cost_centre,
        t.numirical
      FROM transactions t
      JOIN accounts a_debit  ON t.account_code_debit  = a_debit.code
      JOIN accounts a_credit ON t.account_code_credit = a_credit.code
      ORDER BY t.date DESC, t.id DESC
    `);

    res.status(200).json({
      status: 'success',
      results: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};
