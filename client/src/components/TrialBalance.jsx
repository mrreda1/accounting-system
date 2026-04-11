import { useState, useEffect } from 'react';
import { getTrialBalance, postAccount } from '../services/api';
import AccountLedger from './AccountLedger';
import AddTransaction from './AddTransaction';

function TrialBalance() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactionAccount, setTransactionAccount] = useState(null);
  const [addingAccount, setAddingAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ code: '', name: '' });

  async function handleAddAccount() {
    if (!newAccount.code || !newAccount.name) return;
    try {
      await postAccount(newAccount);
      const res = await getTrialBalance();
      setAccounts(res.data.data);
      setNewAccount({ code: '', name: '' });
      setAddingAccount(false);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  }

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
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Trial Balance</h2>
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b text-gray-700 uppercase text-xs">
            <th className="py-3 pr-4">Code</th>
            <th className="py-3 pr-4">Account</th>
            <th className="py-3 pr-4">Type</th>
            <th className="py-3 pr-4 text-right">Debit</th>
            <th className="py-3 text-right">Credit</th>
            <th className="py-3 text-right"></th>
          </tr>
        </thead>

        <tbody>
          {accounts.map((account) => (
            <tr
              key={account.code}
              onClick={() => setSelectedAccount(account)}
              className="border-b hover:bg-blue-50 cursor-pointer transition"
            >
              <td className="py-3 pr-4 text-gray-600">{account.code}</td>
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

              {/* + Button */}
              <td className="py-3 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // prevents opening the ledger
                    setTransactionAccount(account);
                  }}
                  className="text-blue-500 hover:text-white hover:bg-blue-500 border border-dashed border-blue-500 rounded w-8 h-6  items-center justify-center text-xs transition mx-3"
                >
                  +
                </button>
              </td>
            </tr>
          ))}
          {/* Inline form row — shown when addingAccount is true */}
          {addingAccount && (
            <tr className="border-b bg-blue-50">
              <td className="py-2 pr-4 w-32">
                <input
                  autoFocus
                  type="text"
                  placeholder="xxxx"
                  value={newAccount.code}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, code: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900"
                />
              </td>
              <td className="py-2 pr-4">
                <input
                  type="text"
                  placeholder="Account name"
                  value={newAccount.name}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900"
                />
              </td>
              <td className="py-2 pr-4">
                {/* Live type badge */}
                {inferType(newAccount.code) ? (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${typeStyle(inferType(newAccount.code))}`}
                  >
                    {inferType(newAccount.code)}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">type</span>
                )}
              </td>
              <td className="py-2 pr-4" colSpan={1}></td>
              <td className="py-2 text-right">
                <div className="flex items-center justify-end">
                  <button
                    onClick={handleAddAccount}
                    className="text-white bg-blue-600 hover:bg-blue-500 rounded px-3 py-1 text-xs transition"
                  >
                    Save
                  </button>
                </div>
              </td>
              <td className="py-2 text-right">
                <div className="flex items-center justify-end  px-5">
                  <button
                    onClick={() => {
                      setAddingAccount(false);
                      setNewAccount({ code: '', name: '' });
                    }}
                    className="text-gray-400 hover:text-gray-600 text-s"
                  >
                    ✕
                  </button>
                </div>
              </td>
            </tr>
          )}

          {/* Dashed add row */}
          {!addingAccount && (
            <tr
              onClick={() => setAddingAccount(true)}
              className="border-b border-dashed hover:bg-gray-50 cursor-pointer transition"
            >
              <td
                colSpan={6}
                className="py-3 text-center text-gray-400 text-sm hover:text-blue-500 transition"
              >
                + Add Account
              </td>
            </tr>
          )}
        </tbody>

        <tfoot>
          <tr className="font-bold text-lg text-gray-600">
            <td colSpan={3} className="py-4">
              Total
            </td>
            <td className="py-4 text-right">
              {formatNumber(
                accounts.reduce((sum, a) => sum + parseFloat(a.total_debit), 0),
              )}
            </td>
            <td className="py-4 text-right">
              {formatNumber(
                accounts.reduce(
                  (sum, a) => sum + parseFloat(a.total_credit),
                  0,
                ),
              )}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>

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
          onSuccess={() => {
            setTransactionAccount(null);
            // refresh the trial balance
            getTrialBalance().then((res) => setAccounts(res.data.data));
          }}
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

function inferType(code) {
  const map = {
    1: 'asset',
    2: 'liability',
    3: 'equity',
    4: 'revenue',
    5: 'expense',
  };
  return map[String(code)[0]] || null;
}

export default TrialBalance;
