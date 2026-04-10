const pool = require('../config/db');

exports.getBalanceSheet = async (req, res) => {
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
      WHERE a.type IN ('asset', 'liability', 'equity')
      GROUP BY a.code, a.name, a.type
      ORDER BY a.code
    `);

    const netIncomeResult = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN a.type = 'revenue' THEN t.credit - t.debit ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN a.type = 'expense' THEN t.debit - t.credit ELSE 0 END), 0) AS net_income
      FROM accounts a
      LEFT JOIN transactions t ON a.code = t.account_code
    `);

    const netIncome = parseFloat(netIncomeResult.rows[0].net_income);

    const assets = result.rows
      .filter((row) => row.type === 'asset')
      .map((row) => ({
        code: row.code,
        name: row.name,
        balance: parseFloat(row.total_debit) - parseFloat(row.total_credit),
      }));

    const liabilitiesAndEquity = result.rows
      .filter((row) => row.type === 'liability' || row.type === 'equity')
      .map((row) => ({
        code: row.code,
        name: row.name,
        balance: parseFloat(row.total_credit) - parseFloat(row.total_debit),
      }));

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
        balanced: totalAssets === totalEquitySide,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};
