import TrialBalance from './components/TrialBalance'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Accounting System
        </h1>
        <TrialBalance />
      </div>
    </div>
  )
}

export default App
