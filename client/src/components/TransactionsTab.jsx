import { useEffect, useMemo, useState } from 'react';
import { getTransactions, getTrialBalance } from '../services/api';
import AddTransaction from './AddTransaction';
import { compareCode, formatMoney, getAccountLayer } from '../utils/accounting';

function TransactionsTab() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  async function loadData() {
    try {
      const [accountsRes, transactionsRes] = await Promise.all([
        getTrialBalance(),
        getTransactions(),
      ]);

      setAccounts([...accountsRes.data.data].sort(compareCode));
      setTransactions(transactionsRes.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        acc.debit += Number(transaction.debit || 0);
        acc.credit += Number(transaction.credit || 0);
        return acc;
      },
      { debit: 0, credit: 0 },
    );
  }, [transactions]);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Transactions</h2>
            <p className="text-sm text-slate-500">
              Journal entries with debit and credit lines linked to account IDs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              New Transaction
            </button>
          </div>
        </div>

        {loading && <p className="mt-4 text-sm text-slate-500">Loading transactions...</p>}
        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

        {!loading && !error && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Entries" value={String(transactions.length)} />
            <MetricCard label="Total Debit" value={formatMoney(totals.debit)} />
            <MetricCard label="Total Credit" value={formatMoney(totals.credit)} />
          </div>
        )}
      </div>

      {!loading && !error && (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Account ID</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Layer</th>
                <th className="px-4 py-3">Side</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              )}

              {transactions.map((transaction) => {
                const side = transaction.debit > 0 ? 'Debit' : 'Credit';

                return (
                  <tr key={transaction.id} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(transaction.date).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{transaction.account_code}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{transaction.account_name || '-'}</td>
                    <td className="px-4 py-3">Layer {getAccountLayer(transaction.account_code)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          side === 'Debit'
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {side}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {transaction.debit > 0 ? formatMoney(transaction.debit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {transaction.credit > 0 ? formatMoney(transaction.credit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{transaction.description || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddTransaction
          accounts={accounts}
          onClose={() => setShowAddModal(false)}
          onSuccess={async () => {
            setShowAddModal(false);
            await loadData();
          }}
        />
      )}
    </section>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default TransactionsTab;
