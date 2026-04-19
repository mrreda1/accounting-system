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

  const debitMap = useMemo(
    () => new Map(debitAccounts.map((account) => [String(account.code), account])),
    [debitAccounts],
  );

  const creditMap = useMemo(
    () => new Map(creditAccounts.map((account) => [String(account.code), account])),
    [creditAccounts],
  );

  const [form, setForm] = useState({
    debitAccount: '',
    creditAccount: '',
    amount: '',
    description: '',
    costCentre: '',
    numerical: '',
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
    const { name, value } = e.target;

    setForm((prev) => {
      const nextValue =
        name === 'debitAccount' || name === 'creditAccount' ? value.trim() : value;

      const next = { ...prev, [name]: nextValue };

      if (
        name === 'debitAccount' &&
        next.creditAccount &&
        String(next.creditAccount) === String(nextValue)
      ) {
        next.creditAccount = '';
      }

      return next;
    });
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
        account_code_debit: form.debitAccount,
        account_code_credit: form.creditAccount,
        amount,
        description: form.description,
        cost_centre: form.costCentre,
        numerical: form.numerical,
        date: form.date,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedDebit = debitMap.get(String(form.debitAccount));
  const selectedCredit = creditMap.get(String(form.creditAccount));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-4 text-2xl text-slate-400 transition hover:text-slate-700"
          aria-label="Close"
        >
          ×
        </button>

        <h2 className="mb-1 text-xl font-bold text-slate-900">Add Transaction</h2>
        <p className="mb-6 text-sm text-slate-500">
          Create a double-entry journal transaction. Journal No is assigned automatically.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Debit Account Code (Debit side only)
            </label>
            <input
              type="text"
              list="debit-account-codes"
              name="debitAccount"
              value={form.debitAccount}
              onChange={handleChange}
              placeholder="Type code (example: 101001001)"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Debit Account Name</label>
            <input
              type="text"
              value={selectedDebit?.name || ''}
              readOnly
              placeholder="Auto from code"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type of Account</label>
            <input
              type="text"
              value={selectedDebit?.resolvedType || selectedDebit?.type || ''}
              readOnly
              placeholder="Auto from code"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Credit Account Code (Credit side only)
            </label>
            <input
              type="text"
              list="credit-account-codes"
              name="creditAccount"
              value={form.creditAccount}
              onChange={handleChange}
              placeholder="Type code (example: 201001)"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Credit Account Name</label>
            <input
              type="text"
              value={selectedCredit?.name || ''}
              readOnly
              placeholder="Auto from code"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type of Account</label>
            <input
              type="text"
              value={selectedCredit?.resolvedType || selectedCredit?.type || ''}
              readOnly
              placeholder="Auto from code"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Cost Centre</label>
            <input
              type="text"
              name="costCentre"
              value={form.costCentre}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Numerical</label>
            <input
              type="text"
              name="numerical"
              value={form.numerical}
              onChange={handleChange}
              placeholder="Invoice number (optional)"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500"
            />
          </div>

          <div className="md:col-span-2">
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

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500"
            />
          </div>

          <datalist id="debit-account-codes">
            {debitAccounts.map((account) => (
              <option key={account.code} value={account.code}>
                {account.name}
              </option>
            ))}
          </datalist>

          <datalist id="credit-account-codes">
            {creditAccounts.map((account) => (
              <option key={account.code} value={account.code}>
                {account.name}
              </option>
            ))}
          </datalist>

          {error && <p className="text-sm text-rose-600 md:col-span-2">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || debitAccounts.length === 0 || creditAccounts.length === 0}
            className="w-full rounded-xl bg-slate-900 py-2.5 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 md:col-span-2"
          >
            {loading ? 'Saving...' : 'Save Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddTransaction;
