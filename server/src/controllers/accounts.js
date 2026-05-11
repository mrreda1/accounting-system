const pool = require('../config/db');

exports.getAccounts = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM accounts ORDER BY code`);
    const accounts = result.rows;

    const map = {};
    const roots = [];

    accounts.forEach((a) => (map[a.code] = { ...a, sub_accounts: [] }));

    accounts.forEach((a) => {
      if (a.parent_code && map[a.parent_code]) {
        map[a.parent_code].sub_accounts.push(map[a.code]);
      } else {
        roots.push(map[a.code]);
      }
    });

    res.status(200).json({
      status: 'success',
      data: { accounts: roots },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

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

    res.status(200).json({
      status: 'success',
      data: {
        account: account.rows[0],
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
      `SELECT
        t.id,
        t.date,
        t.description,
        CASE WHEN t.account_code_debit = $1 THEN t.amount ELSE 0 END AS debit,
        CASE WHEN t.account_code_credit = $1 THEN t.amount ELSE 0 END AS credit,
        t.account_code_debit,
        t.account_code_credit
      FROM transactions t
      WHERE t.account_code_debit = $1 OR t.account_code_credit = $1
      ORDER BY t.date ASC, t.id ASC`,
      [code],
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

  if (!isValidCode(code)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Code length must be 1, 3, 6, or 9 digits',
    });
  }

  const type = inferType(code);
  if (!type) {
    return res.status(400).json({
      status: 'fail',
      message:
        'Code must start with 1 (asset), 2 (liability and equity), 3 (expense), 4 (revenue)',
    });
  }

  const parentCode = getParentCode(code);

  if (parentCode) {
    const parent = await pool.query(
      `SELECT code FROM accounts WHERE code = $1`,
      [parentCode],
    );
    if (parent.rows.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Parent account ${parentCode} does not exist — create it first`,
      });
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO accounts (code, name, type, parent_code)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [code, name, type, parentCode],
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

exports.updateAccountStatus = async (req, res) => {
  try {
    const { code } = req.params;
    const { is_active, active } = req.body || {};

    const nextStatus =
      typeof is_active === 'boolean'
        ? is_active
        : typeof active === 'boolean'
          ? active
          : null;

    if (nextStatus === null) {
      return res.status(400).json({
        status: 'fail',
        message: 'is_active must be a boolean',
      });
    }

    if (nextStatus === false) {
      const activeDescendants = await pool.query(
        `WITH RECURSIVE descendants AS (
          SELECT code, is_active
          FROM accounts
          WHERE parent_code = $1
          UNION ALL
          SELECT a.code, a.is_active
          FROM accounts a
          JOIN descendants d ON a.parent_code = d.code
        )
        SELECT 1 FROM descendants WHERE is_active = TRUE LIMIT 1`,
        [code],
      );

      if (activeDescendants.rows.length > 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'Deactivate only when all child accounts are inactive',
        });
      }
    }

    const result = await pool.query(
      'UPDATE accounts SET is_active = $1 WHERE code = $2 RETURNING *',
      [nextStatus, code],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: `Account with code ${code} not found`,
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

function inferType(code) {
  const prefix = String(code)[0];
  const map = {
    1: 'asset',
    2: 'liability and equity',
    3: 'expense',
    4: 'revenue',
  };
  return map[prefix] || null;
}

function getParentCode(code) {
  const len = String(code).length;

  if (len === 1) return null;
  if (len === 3) return String(code).slice(0, 1);
  return String(code).slice(0, len - 3);
}

function isValidCode(code) {
  const len = String(code).length;
  return [1, 3, 6, 9].includes(len);
}
