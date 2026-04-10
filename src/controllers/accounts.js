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
