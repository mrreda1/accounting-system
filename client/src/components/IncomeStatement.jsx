import { useEffect, useState } from 'react';
import { getIncomeStatement } from '../services/api';
import { formatMoney } from '../utils/accounting';

function IncomeStatement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadIncomeStatement() {
    try {
      const res = await getIncomeStatement();
      setData(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncomeStatement();
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Income Statement</h2>
            <p className="text-sm text-slate-500">
              Revenues and expenses summary to measure net income.
            </p>
          </div>
          <button
            onClick={loadIncomeStatement}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700"
          >
            Refresh
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading income statement...</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>

      {!loading && !error && data && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <StatementColumn
              title="Revenues"
              className="border-cyan-200 from-cyan-500/15 to-sky-500/10"
              items={data.revenues}
              totalLabel="Total Revenues"
              totalValue={data.totalRevenues}
            />

            <StatementColumn
              title="Expenses"
              className="border-rose-200 from-rose-500/15 to-orange-500/10"
              items={data.expenses}
              totalLabel="Total Expenses"
              totalValue={data.totalExpenses}
            />
          </div>

          <div
            className={`rounded-2xl border px-5 py-3 text-center text-sm font-semibold ${
              data.netIncome >= 0
                ? 'border-teal-200 bg-teal-50 text-teal-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            Net Income: {formatMoney(data.netIncome)}
          </div>
        </>
      )}
    </section>
  );
}

function StatementColumn({ title, className, items, totalLabel, totalValue }) {
  return (
    <div className={`rounded-3xl border bg-gradient-to-br p-5 shadow-sm ${className}`}>
      <h3 className="mb-4 text-lg font-bold text-slate-900">{title}</h3>

      <div className="overflow-x-auto rounded-2xl bg-white/85">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Account Name</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-5 text-center text-slate-400">
                  No accounts in this group yet.
                </td>
              </tr>
            )}

            {items.map((item) => (
              <tr key={item.code} className="border-b border-slate-100 text-slate-700">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.code}</td>
                <td className="px-4 py-3 text-slate-800" dir="auto">{item.name}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                  {formatMoney(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="px-4 py-3 font-bold text-slate-900">{totalLabel}</td>
              <td className="px-4 py-3 text-right font-bold text-slate-900">
                {formatMoney(totalValue)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default IncomeStatement;
