import { useState } from 'react';
import TrialBalance from './components/TrialBalance';
import BalanceSheet from './components/BalanceSheet';
import TransactionsTab from './components/TransactionsTab';
import AccountsTab from './components/AccountsTab';

function App() {
  const tabs = [
    { id: 'accounts', label: 'Accounts' },
    { id: 'balance-sheet', label: 'Balance Sheet' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'trial-sheet', label: 'Trial Sheet' },
  ];

  const [activeTab, setActiveTab] = useState('accounts');

  function renderActiveTab() {
    if (activeTab === 'balance-sheet') return <BalanceSheet />;
    if (activeTab === 'transactions') return <TransactionsTab />;
    if (activeTab === 'trial-sheet') return <TrialBalance />;
    return <AccountsTab />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-teal-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-24 h-[28rem] w-[28rem] rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">General Ledger Workspace</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900 sm:text-4xl">Accounting System</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Analyze balance sheet, trial sheet, transactions, and account layers by ID hierarchy in one place.
          </p>
        </header>

        <nav className="rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur">
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-bold tracking-wide transition ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="animate-[fadeUp_300ms_ease-out]">{renderActiveTab()}</div>
      </div>
    </div>
  );
}

export default App;
