import { useState, useEffect } from 'react'
import { getAccountLedger } from '../services/api'

function AccountLedger({ account, onClose }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getAccountLedger(account.code)
      .then(res => setTransactions(res.data.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [account.code])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-6">
          <p className="text-sm text-gray-400">{account.code}</p>
          <h2 className="text-xl font-bold text-gray-800">{account.name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Net Balance:
            <span className="font-semibold text-gray-800 ml-1">
              {formatNumber(account.total_debit - account.total_credit)}
            </span>
          </p>
        </div>

        {/* Content */}
        {loading && <p className="text-gray-400">Loading transactions...</p>}
        {error   && <p className="text-red-500">Error: {error}</p>}

        {!loading && !error && transactions.length === 0 && (
          <p className="text-gray-400">No transactions found for this account.</p>
        )}

        {!loading && !error && transactions.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500 uppercase text-xs">
                <th className="py-2 text-left">Date</th>
                <th className="py-2 text-left">Description</th>
                <th className="py-2 text-right">Debit</th>
                <th className="py-2 text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 text-gray-400">
                    {new Date(t.date).toLocaleDateString('en-US')}
                  </td>
                  <td className="py-2 text-gray-700">{t.description || '—'}</td>
                  <td className="py-2 text-right text-gray-700">
                    {t.debit > 0 ? formatNumber(t.debit) : '—'}
                  </td>
                  <td className="py-2 text-right text-gray-700">
                    {t.credit > 0 ? formatNumber(t.credit) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>
    </div>
  )
}

function formatNumber(value) {
  return parseFloat(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export default AccountLedger
