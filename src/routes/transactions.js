const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/', async (req, res) => {
  const { debitAccount, creditAccount, amount, description, date } = req.body;

  // Basic validation
  if (!debitAccount || !creditAccount || !amount) {
    return res.status(400).json({
      status: 'fail',
      message: 'debitAccount, creditAccount and amount are required'
    });
  }

  if (debitAccount === creditAccount) {
    return res.status(400).json({
      status: 'fail',
      message: 'debitAccount and creditAccount cannot be the same'
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'amount must be greater than 0'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert debit row
    await client.query(
      `INSERT INTO transactions (account_code, debit, credit, description, date)
       VALUES ($1, $2, 0, $3, $4)`,
      [debitAccount, amount, description, date || new Date()]
    );

    // Insert credit row
    await client.query(
      `INSERT INTO transactions (account_code, debit, credit, description, date)
       VALUES ($1, 0, $2, $3, $4)`,
      [creditAccount, amount, description, date || new Date()]
    );

    await client.query('COMMIT');

    res.status(201).json({
      status: 'success',
      message: 'Transaction recorded successfully'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
