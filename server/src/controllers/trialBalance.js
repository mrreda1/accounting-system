const pool = require('../config/db');

exports.getTrialBalance = async (req, res) => {
  try {
    const accountsResult = await pool.query(`
      SELECT code, name, type, parent_code, opening_debit, opening_credit
      FROM accounts
      ORDER BY code
    `);

    const movementsResult = await pool.query(`
      SELECT 
        account_code_debit  AS code,
        SUM(amount)         AS movement_debit,
        0                   AS movement_credit
      FROM transactions
      GROUP BY account_code_debit

      UNION ALL

      SELECT 
        account_code_credit AS code,
        0                   AS movement_debit,
        SUM(amount)         AS movement_credit
      FROM transactions
      GROUP BY account_code_credit
    `);

    const movements = {};
    movementsResult.rows.forEach((row) => {
      if (!movements[row.code]) {
        movements[row.code] = { movement_debit: 0, movement_credit: 0 };
      }
      movements[row.code].movement_debit += parseFloat(row.movement_debit);
      movements[row.code].movement_credit += parseFloat(row.movement_credit);
    });

    const map = {};
    accountsResult.rows.forEach((account) => {
      const mov = movements[account.code] || {
        movement_debit: 0,
        movement_credit: 0,
      };

      const opening_debit = parseFloat(account.opening_debit);
      const opening_credit = parseFloat(account.opening_credit);
      const movement_debit = mov.movement_debit;
      const movement_credit = mov.movement_credit;

      const total_debit = opening_debit + movement_debit;
      const total_credit = opening_credit + movement_credit;

      const balance_debit =
        total_debit > total_credit ? total_debit - total_credit : 0;
      const balance_credit =
        total_credit > total_debit ? total_credit - total_debit : 0;

      map[account.code] = {
        code: account.code,
        name: account.name,
        type: account.type,
        parent_code: account.parent_code,
        opening_debit,
        opening_credit,
        movement_debit,
        movement_credit,
        total_debit,
        total_credit,
        balance_debit,
        balance_credit,
        children: [],
      };
    });

    const codes = Object.keys(map).sort((a, b) => b.length - a.length);

    codes.forEach((code) => {
      const account = map[code];
      if (account.parent_code && map[account.parent_code]) {
        const parent = map[account.parent_code];
        parent.opening_debit += account.opening_debit;
        parent.opening_credit += account.opening_credit;
        parent.movement_debit += account.movement_debit;
        parent.movement_credit += account.movement_credit;
        parent.total_debit += account.total_debit;
        parent.total_credit += account.total_credit;
        parent.balance_debit += account.balance_debit;
        parent.balance_credit += account.balance_credit;
      }
    });

    const roots = [];
    Object.values(map).forEach((account) => {
      if (account.parent_code && map[account.parent_code]) {
        map[account.parent_code].children.push(account);
      } else {
        roots.push(account);
      }
    });

    res.status(200).json({
      status: 'success',
      data: roots,
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};
