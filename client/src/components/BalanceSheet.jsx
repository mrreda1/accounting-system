import { useEffect, useState } from 'react';
import { getBalanceSheet } from '../services/api';
import { formatMoney } from '../utils/accounting';

function BalanceSheet() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadBalanceSheet() {
    try {
      const res = await getBalanceSheet();
      setData(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBalanceSheet();
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Balance Sheet</h2>
            <p className="text-sm text-slate-500">
              Assets on the debit side and liabilities plus equity on the credit side.
            </p>
          </div>
          <button
            onClick={loadBalanceSheet}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700"
          >
            Refresh
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading balance sheet...</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>

      {!loading && !error && data && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <BalanceColumn
              title="Assets"
              className="border-teal-200 from-teal-500/15 to-cyan-500/10"
              items={data.assets}
              totalLabel="Total Assets"
              totalValue={data.totalAssets}
            />

            <BalanceColumn
              title="Liabilities & Equity"
              className="border-amber-200 from-amber-500/15 to-orange-500/10"
              items={[
                ...data.liabilitiesAndEquity,
                {
                  code: 'NET-INCOME',
                  name: 'Net Income',
                  balance: data.netIncome,
                },
              ]}
              totalLabel="Total Liabilities & Equity"
              totalValue={data.totalLiabilitiesAndEquity}
            />
          </div>

          <div
            className={`rounded-2xl border px-5 py-3 text-center text-sm font-semibold ${
              data.balanced
                ? 'border-teal-200 bg-teal-50 text-teal-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {data.balanced
              ? 'Balance sheet is balanced'
              : 'Balance sheet is not balanced'}
          </div>
        </>
      )}
    </section>
  );
}

function BalanceColumn({ title, className, items, totalLabel, totalValue }) {
  return (
    <div className={`rounded-3xl border bg-gradient-to-br p-5 shadow-sm ${className}`}>
      <h3 className="mb-4 text-lg font-bold text-slate-900">{title}</h3>

      <div className="overflow-x-auto rounded-2xl bg-white/85">
        <table className="min-w-full text-sm">
          <tbody>
            {items.map((item) => (
              <tr key={item.code} className="border-b border-slate-100 text-slate-700">
                <td className="px-4 py-3 text-slate-800">{item.name}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                  {formatMoney(item.balance)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="px-4 py-3 font-bold text-slate-900">{totalLabel}</td>
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

export default BalanceSheet;
