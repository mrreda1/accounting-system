import { useEffect, useMemo, useState } from 'react';
import {
  getTransactions,
  getTrialBalance,
} from '../services/api';
import AddTransaction from './AddTransaction';
import {
  compareCode,
  flattenAccountTree,
  formatMoney,
  getAccountLayer,
} from '../utils/accounting';

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

      const roots = accountsRes.data.data || [];
      setAccounts(flattenAccountTree(roots).sort(compareCode));
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
        const amount = Number(transaction.amount || 0);
        acc.debit += amount;
        acc.credit += amount;
        return acc;
      },
      { debit: 0, credit: 0 },
    );
  }, [transactions]);

  const groupedTransactions = useMemo(() => {
    let lastJournalNo = null;
    let groupIndex = -1;

    return transactions.map((transaction, index) => {
      const currentJournalNo = transaction.journal_no ?? `legacy-${index}`;
      if (currentJournalNo !== lastJournalNo) {
        groupIndex += 1;
        lastJournalNo = currentJournalNo;
      }

      return {
        ...transaction,
        groupIndex,
      };
    });
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
                <th className="px-4 py-3">Journal No</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Debit Account</th>
                <th className="px-4 py-3">Credit Account</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Cost Centre</th>
                <th className="px-4 py-3">Numerical</th>
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

              {groupedTransactions.map((transaction) => {
                const groupBackground =
                  transaction.groupIndex % 2 === 0 ? 'bg-white' : 'bg-amber-50/35';

                return (
                  <tr key={transaction.id} className={`border-b border-slate-100 text-slate-700 hover:bg-teal-50/40 ${groupBackground}`}>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                      {transaction.journal_no || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(transaction.date).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-slate-500">
                        {transaction.account_code_debit}
                      </div>
                      <div className="font-medium text-slate-800">
                        {transaction.account_name_debit || '-'}
                      </div>
                      <div className="text-xs text-slate-500">
                        Layer {getAccountLayer(transaction.account_code_debit)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-slate-500">
                        {transaction.account_code_credit}
                      </div>
                      <div className="font-medium text-slate-800">
                        {transaction.account_name_credit || '-'}
                      </div>
                      <div className="text-xs text-slate-500">
                        Layer {getAccountLayer(transaction.account_code_credit)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatMoney(transaction.amount)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{transaction.cost_centre || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{transaction.numerical || '-'}</td>
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
