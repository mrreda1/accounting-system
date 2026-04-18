import { useEffect, useMemo, useState } from 'react';
import { postTransaction } from '../services/api';
import { getNormalSide, inferTypeFromCode } from '../utils/accounting';

function AddTransaction({ accounts = [], prefilledAccount, onClose, onSuccess }) {
  const classifiedAccounts = useMemo(
    () =>
      accounts.map((account) => {
        const resolvedType = account.type || inferTypeFromCode(account.code);
        return {
          ...account,
          resolvedType,
          normalSide: getNormalSide(resolvedType),
        };
      }),
    [accounts],
  );

  const debitAccounts = useMemo(
    () => classifiedAccounts.filter((account) => account.normalSide === 'Debit'),
    [classifiedAccounts],
  );

  const creditAccounts = useMemo(
    () => classifiedAccounts.filter((account) => account.normalSide === 'Credit'),
    [classifiedAccounts],
  );

  const [form, setForm] = useState({
    debitAccount: '',
    creditAccount: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const debitSet = new Set(debitAccounts.map((account) => String(account.code)));
    const creditSet = new Set(creditAccounts.map((account) => String(account.code)));

    const prefilledCode = prefilledAccount?.code ? String(prefilledAccount.code) : '';
    const prefilledType = prefilledAccount?.type || inferTypeFromCode(prefilledCode);
    const prefilledSide = getNormalSide(prefilledType);

    setForm((prev) => {
      let nextDebit = prev.debitAccount ? String(prev.debitAccount) : '';
      let nextCredit = prev.creditAccount ? String(prev.creditAccount) : '';

      if (!debitSet.has(nextDebit)) {
        if (prefilledSide === 'Debit' && debitSet.has(prefilledCode)) {
          nextDebit = prefilledCode;
        } else {
          nextDebit = debitAccounts[0]?.code ? String(debitAccounts[0].code) : '';
        }
      }

      const firstCreditChoice = creditAccounts.find(
        (account) => String(account.code) !== String(nextDebit),
      );

      if (!creditSet.has(nextCredit) || nextCredit === nextDebit) {
        if (
          prefilledSide === 'Credit' &&
          creditSet.has(prefilledCode) &&
          prefilledCode !== nextDebit
        ) {
          nextCredit = prefilledCode;
        } else {
          nextCredit = firstCreditChoice?.code ? String(firstCreditChoice.code) : '';
        }
      }

      if (
        nextDebit === String(prev.debitAccount || '') &&
        nextCredit === String(prev.creditAccount || '')
      ) {
        return prev;
      }

      return {
        ...prev,
        debitAccount: nextDebit,
        creditAccount: nextCredit,
      };
    });
  }, [debitAccounts, creditAccounts, prefilledAccount]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.debitAccount || !form.creditAccount || !form.amount) {
      return setError('Please fill in debit account, credit account, and amount.');
    }

    const isDebitValid = debitAccounts.some(
      (account) => String(account.code) === String(form.debitAccount),
    );
    const isCreditValid = creditAccounts.some(
      (account) => String(account.code) === String(form.creditAccount),
    );

    if (!isDebitValid) {
      return setError('Please select a valid debit-side account.');
    }

    if (!isCreditValid) {
      return setError('Please select a valid credit-side account.');
    }

    const amount = parseFloat(form.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      return setError('Amount must be greater than zero.');
    }

    setLoading(true);
    setError(null);

    try {
      await postTransaction({
        debitAccount: form.debitAccount,
        creditAccount: form.creditAccount,
        amount,
        description: form.description,
        date: form.date,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-4 text-2xl text-slate-400 transition hover:text-slate-700"
          aria-label="Close"
        >
          ×
        </button>

        <h2 className="mb-1 text-xl font-bold text-slate-900">Add Transaction</h2>
        <p className="mb-6 text-sm text-slate-500">
          Create a double-entry journal transaction.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Debit Account (Debit side only)
            </label>
            <select
              name="debitAccount"
              value={form.debitAccount}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500"
            >
              {debitAccounts.length === 0 && (
                <option value="">No debit-side accounts available</option>
              )}
              {debitAccounts.map((account) => (
                <option key={account.code} value={account.code}>
                  {account.code} - {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Credit Account (Credit side only)
            </label>
            <select
              name="creditAccount"
              value={form.creditAccount}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500"
            >
              {creditAccounts.length === 0 ? (
                <option value="">No credit-side accounts available</option>
              ) : (
                <option value="">Select account...</option>
              )}
              {creditAccounts
                .filter((account) => String(account.code) !== String(form.debitAccount))
                .map((account) => (
                  <option key={account.code} value={account.code}>
                    {account.code} - {account.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500"
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || debitAccounts.length === 0 || creditAccounts.length === 0}
            className="w-full rounded-xl bg-slate-900 py-2.5 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Saving...' : 'Save Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddTransaction;
