import { useState, useEffect } from 'react';
import { getBalanceSheet } from '../services/api';

function BalanceSheet({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBalanceSheet()
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-600 text-center mb-6">
          Balance Sheet
        </h2>

        {loading && <p className="text-gray-400 text-center">Loading...</p>}
        {error && <p className="text-red-500 text-center">Error: {error}</p>}

        {!loading && !error && data && (
          <>
            {/* Two Columns */}
            <div className="grid grid-cols-2 gap-6">
              {/* Assets Column */}
              <div>
                <h3 className="text-sm font-semibold uppercase text-green-600 mb-3">
                  Assets
                </h3>
                <table className="w-full text-sm">
                  <tbody>
                    {data.assets.map((item) => (
                      <tr key={item.code} className="border-b">
                        <td className="py-2 text-gray-700">{item.name}</td>
                        <td className="py-2 text-right text-gray-800 font-medium">
                          {formatNumber(item.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="pt-3 font-bold text-gray-800">
                        Total Assets
                      </td>
                      <td className="pt-3 text-right font-bold text-gray-800">
                        {formatNumber(data.totalAssets)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Liabilities & Equity Column */}
              <div>
                <h3 className="text-sm font-semibold uppercase text-red-500 mb-3">
                  Liabilities & Equity
                </h3>
                <table className="w-full text-sm">
                  <tbody>
                    {data.liabilitiesAndEquity.map((item) => (
                      <tr key={item.code} className="border-b">
                        <td className="py-2 text-gray-700">{item.name}</td>
                        <td className="py-2 text-right text-gray-800 font-medium">
                          {formatNumber(item.balance)}
                        </td>
                      </tr>
                    ))}
                    {/* Net Income Row */}
                    <tr className="border-b">
                      <td className="py-2 text-gray-700">Net Income</td>
                      <td
                        className={`py-2 text-right font-medium ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-500'}`}
                      >
                        {formatNumber(data.netIncome)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="pt-3 font-bold text-gray-800">Total</td>
                      <td className="pt-3 text-right font-bold text-gray-800">
                        {formatNumber(data.totalLiabilitiesAndEquity)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Balanced Indicator */}
            <div
              className={`mt-6 text-center text-sm font-medium py-2 rounded-lg ${
                data.balanced
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-500'
              }`}
            >
              {data.balanced
                ? '✓ Balance sheet is balanced'
                : '✗ Balance sheet is not balanced'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatNumber(value) {
  return parseFloat(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default BalanceSheet;
