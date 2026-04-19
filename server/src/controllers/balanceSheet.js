const pool = require('../config/db');

exports.getBalanceSheet = async (req, res) => {
  try {
    const accountsResult = await pool.query(`
      SELECT code, name, type, opening_debit, opening_credit
      FROM accounts
      WHERE type IN ('asset', 'liability and equity')
      ORDER BY code
    `);

    const movementsResult = await pool.query(`
      SELECT account_code_debit AS code, SUM(amount) AS debit, 0 AS credit
      FROM transactions
      GROUP BY account_code_debit

      UNION ALL

      SELECT account_code_credit AS code, 0 AS debit, SUM(amount) AS credit
      FROM transactions
      GROUP BY account_code_credit
    `);

    const movements = {};
    movementsResult.rows.forEach((row) => {
      if (!movements[row.code]) {
        movements[row.code] = { debit: 0, credit: 0 };
      }
      movements[row.code].debit += parseFloat(row.debit);
      movements[row.code].credit += parseFloat(row.credit);
    });

    const netIncomeResult = await pool.query(`
      SELECT
        -- revenue: credit side minus debit side
        COALESCE((
          SELECT SUM(amount) FROM transactions t
          JOIN accounts a ON t.account_code_credit = a.code
          WHERE a.type = 'revenue'
        ), 0) -
        COALESCE((
          SELECT SUM(amount) FROM transactions t
          JOIN accounts a ON t.account_code_debit = a.code
          WHERE a.type = 'revenue'
        ), 0) -
        -- expense: debit side minus credit side
        COALESCE((
          SELECT SUM(amount) FROM transactions t
          JOIN accounts a ON t.account_code_debit = a.code
          WHERE a.type = 'expense'
        ), 0) +
        COALESCE((
          SELECT SUM(amount) FROM transactions t
          JOIN accounts a ON t.account_code_credit = a.code
          WHERE a.type = 'expense'
        ), 0) AS net_income
    `);

    const netIncome = parseFloat(netIncomeResult.rows[0].net_income);

    const assets = [];
    const liabilitiesAndEquity = [];

    accountsResult.rows.forEach((account) => {
      const mov = movements[account.code] || { debit: 0, credit: 0 };

      const totalDebit = parseFloat(account.opening_debit) + mov.debit;
      const totalCredit = parseFloat(account.opening_credit) + mov.credit;

      const entry = {
        code: account.code,
        name: account.name,
        balance:
          account.type === 'asset'
            ? totalDebit - totalCredit
            : totalCredit - totalDebit,
      };

      if (account.type === 'asset') {
        assets.push(entry);
      } else {
        liabilitiesAndEquity.push(entry);
      }
    });

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilitiesAndEquity = liabilitiesAndEquity.reduce(
      (sum, a) => sum + a.balance,
      0,
    );
    const totalEquitySide = totalLiabilitiesAndEquity + netIncome;

    res.status(200).json({
      status: 'success',
      data: {
        assets,
        liabilitiesAndEquity,
        netIncome,
        totalAssets,
        totalLiabilitiesAndEquity: totalEquitySide,
        balanced: Math.abs(totalAssets - totalEquitySide) < 0.01,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};
