import { useState } from 'react'
import { postTransaction } from '../services/api'

function AddTransaction({ accounts, prefilledAccount, onClose, onSuccess }) {
  const [form, setForm] = useState({
    debitAccount:  prefilledAccount.code,
    creditAccount: '',
    amount:        '',
    description:   '',
    date:          new Date().toISOString().split('T')[0]
  })
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    if (!form.creditAccount || !form.amount) {
      return setError('Please fill in all required fields')
    }
    setLoading(true)
    setError(null)
    try {
      await postTransaction({
        debitAccount:  form.debitAccount,
        creditAccount: form.creditAccount,
        amount:        parseFloat(form.amount),
        description:   form.description,
        date:          form.date
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-6">Add Transaction</h2>

        <div className="space-y-4">

          {/* Debit Account — pre-filled */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Debit Account
            </label>
            <select
              name="debitAccount"
              value={form.debitAccount}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            >
              {accounts.map(a => (
                <option key={a.code} value={a.code}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Credit Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Credit Account
            </label>
            <select
              name="creditAccount"
              value={form.creditAccount}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            >
              <option value="">Select account...</option>
              {accounts
                .filter(a => a.code !== form.debitAccount)
                .map(a => (
                  <option key={a.code} value={a.code}>
                    {a.code} — {a.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Transaction'}
          </button>

        </div>
      </div>
    </div>
  )
}

export default AddTransaction
