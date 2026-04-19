const pool = require('../config/db');

exports.getIncomeStatement = async (req, res) => {
  try {
    const accountsResult = await pool.query(`
      SELECT code, name, type, opening_debit, opening_credit
      FROM accounts
      WHERE type IN ('revenue', 'expense')
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

    const movementByCode = {};
    movementsResult.rows.forEach((row) => {
      if (!movementByCode[row.code]) {
        movementByCode[row.code] = { debit: 0, credit: 0 };
      }
      movementByCode[row.code].debit += parseFloat(row.debit);
      movementByCode[row.code].credit += parseFloat(row.credit);
    });

    const revenues = [];
    const expenses = [];

    accountsResult.rows.forEach((account) => {
      const movement = movementByCode[account.code] || { debit: 0, credit: 0 };
      const openingDebit = parseFloat(account.opening_debit);
      const openingCredit = parseFloat(account.opening_credit);
      const totalDebit = openingDebit + movement.debit;
      const totalCredit = openingCredit + movement.credit;

      const amount =
        account.type === 'revenue'
          ? totalCredit - totalDebit
          : totalDebit - totalCredit;

      const entry = {
        code: account.code,
        name: account.name,
        amount,
      };

      if (account.type === 'revenue') {
        revenues.push(entry);
      } else {
        expenses.push(entry);
      }
    });

    const totalRevenues = revenues.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netIncome = totalRevenues - totalExpenses;

    res.status(200).json({
      status: 'success',
      data: {
        revenues,
        expenses,
        totalRevenues,
        totalExpenses,
        netIncome,
        profitable: netIncome >= 0,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};
