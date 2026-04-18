import { useEffect, useMemo, useState } from 'react';
import { getTrialBalance } from '../services/api';
import AccountLedger from './AccountLedger';
import AddTransaction from './AddTransaction';
import {
  compareCode,
  formatMoney,
  getAccountLayer,
  getNormalSide,
} from '../utils/accounting';

function TrialBalance() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactionAccount, setTransactionAccount] = useState(null);
  const [expandedCodes, setExpandedCodes] = useState(() => new Set());

  async function loadTrialBalance() {
    try {
      const res = await getTrialBalance();
      setAccounts([...res.data.data].sort(compareCode));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrialBalance();
  }, []);

  const totals = useMemo(
    () =>
      accounts.reduce(
        (acc, account) => {
          acc.debit += Number(account.total_debit || 0);
          acc.credit += Number(account.total_credit || 0);
          return acc;
        },
        { debit: 0, credit: 0 },
      ),
    [accounts],
  );

  const { roots, expandableCodes } = useMemo(() => buildAccountTree(accounts), [accounts]);

  useEffect(() => {
    const defaults = new Set();
    roots.forEach((root) => {
      if (root.children.length > 0) {
        defaults.add(root.code);
      }
    });
    setExpandedCodes(defaults);
  }, [roots]);

  function toggleNode(code) {
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const rows = useMemo(() => {
    return renderTrialRows({
      nodes: roots,
      depth: 0,
      expandedCodes,
      onToggle: toggleNode,
      onSelectAccount: setSelectedAccount,
      onPostTransaction: setTransactionAccount,
    });
  }, [roots, expandedCodes]);

  if (loading) return <p className="text-sm text-slate-500">Loading trial sheet...</p>;
  if (error) return <p className="text-sm text-rose-600">Error: {error}</p>;

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Trial Sheet</h2>
            <p className="text-sm text-slate-500">
              Double-entry totals grouped by account IDs and account layers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadTrialBalance}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700"
            >
              Refresh
            </button>
            <button
              onClick={() => setExpandedCodes(new Set(expandableCodes))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-500 hover:text-teal-700"
            >
              Expand all
            </button>
            <button
              onClick={() => setExpandedCodes(new Set())}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-500 hover:text-rose-700"
            >
              Collapse all
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Layer</th>
                <th className="px-4 py-3">Normal Side</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No accounts found yet. Add accounts from the Accounts tab.
                  </td>
                </tr>
              )}

              {rows}
            </tbody>

            <tfoot>
              <tr className="bg-slate-50 text-sm font-bold text-slate-800">
                <td colSpan={5} className="px-4 py-3">
                  Total
                </td>
                <td className="px-4 py-3 text-right">{formatMoney(totals.debit)}</td>
                <td className="px-4 py-3 text-right">{formatMoney(totals.credit)}</td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div
          className={`mt-4 rounded-xl border px-4 py-2 text-center text-sm font-semibold ${
            Number(totals.debit.toFixed(2)) === Number(totals.credit.toFixed(2))
              ? 'border-teal-200 bg-teal-50 text-teal-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {Number(totals.debit.toFixed(2)) === Number(totals.credit.toFixed(2))
            ? 'Trial sheet is balanced'
            : 'Trial sheet is not balanced'}
        </div>
      </div>

      {selectedAccount && (
        <AccountLedger
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
        />
      )}

      {transactionAccount && (
        <AddTransaction
          accounts={accounts}
          prefilledAccount={transactionAccount}
          onClose={() => setTransactionAccount(null)}
          onSuccess={async () => {
            setTransactionAccount(null);
            await loadTrialBalance();
          }}
        />
      )}
    </section>
  );
}

function renderTrialRows({
  nodes,
  depth,
  expandedCodes,
  onToggle,
  onSelectAccount,
  onPostTransaction,
}) {
  const rows = [];

  nodes.forEach((account) => {
    const hasChildren = account.children.length > 0;
    const isExpanded = expandedCodes.has(account.code);

    rows.push(
      <tr
        key={account.code}
        onClick={() => onSelectAccount(account)}
        className="cursor-pointer border-b border-slate-100 text-slate-700 transition hover:bg-slate-50/80"
      >
        <td className="px-4 py-3 font-mono text-xs text-slate-500">{account.code}</td>
        <td className="px-4 py-3 font-medium text-slate-800">
          <div className="flex items-center gap-2" style={{ paddingInlineStart: `${depth * 1.2}rem` }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(account.code);
                }}
                className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-white text-xs text-slate-600 transition hover:border-teal-500 hover:text-teal-700"
                aria-label={isExpanded ? 'Collapse layer' : 'Expand layer'}
                title={isExpanded ? 'Collapse layer' : 'Expand layer'}
              >
                {isExpanded ? '▾' : '▸'}
              </button>
            ) : (
              <span className="inline-block h-5 w-5" />
            )}
            <span dir="auto" className="leading-6">{account.name}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${typeStyle(account.type)}`}>
            {account.type}
          </span>
        </td>
        <td className="px-4 py-3">Layer {getAccountLayer(account.code)}</td>
        <td className="px-4 py-3">{getNormalSide(account.type)}</td>
        <td className="px-4 py-3 text-right font-semibold text-slate-900">
          {Number(account.total_debit) > 0 ? formatMoney(account.total_debit) : '-'}
        </td>
        <td className="px-4 py-3 text-right font-semibold text-slate-900">
          {Number(account.total_credit) > 0 ? formatMoney(account.total_credit) : '-'}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPostTransaction(account);
            }}
            className="rounded-lg border border-dashed border-teal-500 px-2 py-1 text-xs font-semibold text-teal-600 transition hover:bg-teal-500 hover:text-white"
          >
            + Post
          </button>
        </td>
      </tr>,
    );

    if (hasChildren && isExpanded) {
      rows.push(
        ...renderTrialRows({
          nodes: account.children,
          depth: depth + 1,
          expandedCodes,
          onToggle,
          onSelectAccount,
          onPostTransaction,
        }),
      );
    }
  });

  return rows;
}

function buildAccountTree(accounts) {
  const nodesByCode = new Map();

  accounts.forEach((account) => {
    const code = String(account.code);
    nodesByCode.set(code, {
      ...account,
      code,
      children: [],
    });
  });

  const roots = [];

  nodesByCode.forEach((node) => {
    const parentCode = getParentCode(node.code);
    const parent = parentCode ? nodesByCode.get(parentCode) : null;

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  sortNodesByCode(roots);

  const expandableCodes = [];
  collectExpandableCodes(roots, expandableCodes);

  return { roots, expandableCodes };
}

function collectExpandableCodes(nodes, result) {
  nodes.forEach((node) => {
    if (node.children.length > 0) {
      result.push(node.code);
      collectExpandableCodes(node.children, result);
    }
  });
}

function sortNodesByCode(nodes) {
  nodes.sort(compareCode);
  nodes.forEach((node) => {
    if (node.children.length > 0) {
      sortNodesByCode(node.children);
    }
  });
}

function getParentCode(code) {
  const digits = String(code || '').replace(/\D/g, '');

  if (digits.length <= 1) return null;
  if (digits.length <= 3) return digits.slice(0, 1);
  if (digits.length <= 6) return digits.slice(0, 3);
  if (digits.length <= 9) return digits.slice(0, 6);

  return digits.slice(0, 9);
}

function typeStyle(type) {
  const styles = {
    asset: 'bg-teal-100 text-teal-700',
    liability: 'bg-amber-100 text-amber-700',
    equity: 'bg-orange-100 text-orange-700',
    revenue: 'bg-cyan-100 text-cyan-700',
    expense: 'bg-rose-100 text-rose-700',
  };
  return styles[type] || 'bg-slate-100 text-slate-600';
}

export default TrialBalance;
