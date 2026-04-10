const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.code,
        a.name,
        a.type,
        COALESCE(SUM(t.debit), 0)  AS total_debit,
        COALESCE(SUM(t.credit), 0) AS total_credit
      FROM accounts a
      LEFT JOIN transactions t ON a.code = t.account_code
      GROUP BY a.code, a.name, a.type
      ORDER BY a.code
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
});

module.exports = router;
