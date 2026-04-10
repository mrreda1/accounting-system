const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // First check the account actually exists
    const account = await pool.query(
      `SELECT * FROM accounts WHERE code = $1`,
      [code]
    );

    if (account.rows.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: `Account with code ${code} not found`
      });
    }

    // Get all transactions for this account
    const transactions = await pool.query(
      `SELECT id, debit, credit, description, date::text
       FROM transactions
       WHERE account_code = $1
       ORDER BY date ASC`,
      [code]
    );

    // Calculate running balance after each transaction
    let runningBalance = 0;
    const ledger = transactions.rows.map(tx => {
      runningBalance += parseFloat(tx.debit) - parseFloat(tx.credit);
      return {
        id:          tx.id,
        date:        tx.date,
        description: tx.description,
        debit:       parseFloat(tx.debit),
        credit:      parseFloat(tx.credit),
        balance:     runningBalance
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        account: account.rows[0],
        ledger,
        finalBalance: runningBalance
      }
    });

  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
});

module.exports = router;
