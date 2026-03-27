import { useEffect, useState } from 'react'
import { api } from '../api'
import Card from '../components/ui/Card'

function StatCard({ label, value, color = 'text-gray-900 dark:text-gray-100' }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </Card>
  )
}

function fmt(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [envelopes, setEnvelopes] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getSummary(), api.getEnvelopes(), api.getTransactions({ limit: 10 })])
      .then(([s, e, t]) => {
        setSummary(s)
        setEnvelopes(e)
        setTransactions(t)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-400">Loading dashboard…</div>

  const totalBudgeted = envelopes.reduce((s, e) => s + e.budgeted_amount, 0)
  const totalSpent = envelopes.reduce((s, e) => s + e.spent_amount, 0)
  const totalAvailable = envelopes.reduce((s, e) => s + e.available_amount, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Income" value={fmt(summary?.total_income)} color="text-green-600 dark:text-green-400" />
        <StatCard label="Total Expenses" value={fmt(summary?.total_expenses)} color="text-red-600 dark:text-red-400" />
        <StatCard label="Net Balance" value={fmt(summary?.net)} color={summary?.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} />
        <StatCard label="Transactions" value={summary?.transaction_count || 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Envelope Summary */}
        <Card className="p-4">
          <h2 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Envelope Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Budgeted</span>
              <span className="font-medium">{fmt(totalBudgeted)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Spent</span>
              <span className="font-medium text-red-500">{fmt(totalSpent)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Available</span>
              <span className={`font-medium ${totalAvailable >= 0 ? 'text-green-500' : 'text-red-500'}`}>{fmt(totalAvailable)}</span>
            </div>
          </div>
          {envelopes.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Envelopes</p>
              {envelopes.slice(0, 5).map(env => (
                <div key={env.id} className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{env.name}</span>
                    <span>{fmt(env.available_amount)} left</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${env.spent_amount / env.budgeted_amount > 1 ? 'bg-red-500' : 'bg-primary-500'}`}
                      style={{ width: `${Math.min(100, env.budgeted_amount > 0 ? (env.spent_amount / env.budgeted_amount) * 100 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card className="p-4">
          <h2 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Recent Transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 8).map(t => (
                <div key={t.id} className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.description}</p>
                    <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-sm font-medium ml-2 shrink-0 ${t.transaction_type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.transaction_type === 'credit' ? '+' : ''}{fmt(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
