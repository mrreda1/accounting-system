import { useState } from 'react';
import TrialBalance from './components/TrialBalance';
import BalanceSheet from './components/BalanceSheet';

function App() {
  const [showBalanceSheet, setShowBalanceSheet] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-600">
            Accounting System
          </h1>
          <button
            onClick={() => setShowBalanceSheet(true)}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            View Balance Sheet
          </button>
        </div>

        {/* Trial Balance — always visible */}
        <TrialBalance />

        {/* Balance Sheet — popup */}
        {showBalanceSheet && (
          <BalanceSheet onClose={() => setShowBalanceSheet(false)} />
        )}
      </div>
    </div>
  );
}

export default App;
