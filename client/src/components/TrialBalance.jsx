import { useState, useEffect } from 'react';
import { getTrialBalance } from '../services/api';
import AccountLedger from './AccountLedger';

function TrialBalance() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    getTrialBalance()
      .then((res) => setAccounts(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold text-gray-700 mb-4">Trial Balance</h2>

      <table className="w-full text-sm text-left">
        {/* Table Head */}
        <thead>
          <tr className="border-b text-gray-500 uppercase text-xs">
            <th className="py-3 pr-4">Code</th>
            <th className="py-3 pr-4">Account</th>
            <th className="py-3 pr-4">Type</th>
            <th className="py-3 pr-4 text-right">Debit</th>
            <th className="py-3 text-right">Credit</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {accounts.map((account) => (
            <tr
              key={account.code}
              onClick={() => setSelectedAccount(account)}
              className="border-b hover:bg-blue-50 cursor-pointer transition"
            >
              <td className="py-3 pr-4 text-gray-400">{account.code}</td>
              <td className="py-3 pr-4 font-medium text-gray-800">
                {account.name}
              </td>
              <td className="py-3 pr-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${typeStyle(account.type)}`}
                >
                  {account.type}
                </span>
              </td>
              <td className="py-3 pr-4 text-right text-gray-700">
                {account.total_debit > 0
                  ? formatNumber(account.total_debit)
                  : '—'}
              </td>
              <td className="py-3 text-right text-gray-700">
                {account.total_credit > 0
                  ? formatNumber(account.total_credit)
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>

        {/* Totals Row */}
        <tfoot>
          <tr className="font-bold text-gray-800">
            <td colSpan={3} className="py-3">
              Total
            </td>
            <td className="py-3 text-right">
              {formatNumber(
                accounts.reduce((sum, a) => sum + parseFloat(a.total_debit), 0),
              )}
            </td>
            <td className="py-3 text-right">
              {formatNumber(
                accounts.reduce(
                  (sum, a) => sum + parseFloat(a.total_credit),
                  0,
                ),
              )}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Account Ledger Popup */}
      {selectedAccount && (
        <AccountLedger
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
        />
      )}
    </div>
  );
}

// Color badge per account type
function typeStyle(type) {
  const styles = {
    asset: 'bg-green-100 text-green-700',
    liability: 'bg-red-100 text-red-700',
    equity: 'bg-purple-100 text-purple-700',
    revenue: 'bg-blue-100 text-blue-700',
    expense: 'bg-orange-100 text-orange-700',
  };
  return styles[type] || 'bg-gray-100 text-gray-600';
}

// Format numbers as currency
function formatNumber(value) {
  return parseFloat(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default TrialBalance;
