import { useEffect, useMemo, useState } from 'react';
import { getAccountLedger } from '../services/api';
import { formatMoney } from '../utils/accounting';

function AccountLedger({ account, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAccountLedger(account.code)
      .then((res) => setTransactions(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [account.code]);

  const rows = useMemo(() => {
    let running = 0;
    return transactions.map((transaction) => {
      running += Number(transaction.debit || 0) - Number(transaction.credit || 0);
      return {
        ...transaction,
        runningBalance: running,
      };
    });
  }, [transactions]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-4 text-2xl text-slate-400 transition hover:text-slate-700"
          aria-label="Close"
        >
          ×
        </button>

        <div className="mb-6">
          <p className="font-mono text-xs text-slate-500">{account.code}</p>
          <h2 className="text-xl font-bold text-slate-900">{account.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Net Balance:
            <span className="ml-1 font-semibold text-slate-900">
              {formatMoney(Number(account.total_debit) - Number(account.total_credit))}
            </span>
          </p>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading transactions...</p>}
        {error && <p className="text-sm text-rose-600">Error: {error}</p>}

        {!loading && !error && transactions.length === 0 && (
          <p className="text-sm text-slate-400">No transactions found for this account.</p>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                  <th className="px-4 py-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(transaction.date).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-4 py-3">{transaction.description || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {Number(transaction.debit) > 0 ? formatMoney(transaction.debit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {Number(transaction.credit) > 0 ? formatMoney(transaction.credit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatMoney(transaction.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountLedger;
