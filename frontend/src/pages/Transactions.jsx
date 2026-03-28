import { useState, useEffect } from 'react'
import { api } from '../api'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

function fmt(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(amount || 0))
}

function TransactionForm({ accounts, categories, envelopes, onSubmit, onClose, initial = {} }) {
  const [form, setForm] = useState({
    date: initial.date ? initial.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    amount: initial.amount || '',
    description: initial.description || '',
    account_id: initial.account_id || (accounts[0]?.id || ''),
    category_id: initial.category_id || '',
    envelope_id: initial.envelope_id || '',
    status: initial.status || 'posted',
    transaction_type: initial.transaction_type || 'debit',
    notes: initial.notes || '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      date: new Date(form.date).toISOString(),
      amount: parseFloat(form.amount),
      account_id: parseInt(form.account_id),
      category_id: form.category_id ? parseInt(form.category_id) : null,
      envelope_id: form.envelope_id ? parseInt(form.envelope_id) : null,
    })
  }

  const inputCls = 'w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date *</label>
          <input type="date" value={form.date} onChange={set('date')} required className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Amount *</label>
          <input type="number" step="0.01" value={form.amount} onChange={set('amount')} required placeholder="0.00" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description *</label>
        <input type="text" value={form.description} onChange={set('description')} required className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
          <select value={form.transaction_type} onChange={set('transaction_type')} className={inputCls}>
            <option value="debit">Debit (expense)</option>
            <option value="credit">Credit (income)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
          <select value={form.status} onChange={set('status')} className={inputCls}>
            <option value="posted">Posted</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Account *</label>
        <select value={form.account_id} onChange={set('account_id')} required className={inputCls}>
          <option value="">Select account</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
          <select value={form.category_id} onChange={set('category_id')} className={inputCls}>
            <option value="">None</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Envelope</label>
          <select value={form.envelope_id} onChange={set('envelope_id')} className={inputCls}>
            <option value="">None</option>
            {envelopes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
        <textarea value={form.notes} onChange={set('notes')} rows={2} className={inputCls} />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [envelopes, setEnvelopes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState({ account_id: '', status: '' })

  const load = () => {
    const params = {}
    if (filter.account_id) params.account_id = filter.account_id
    if (filter.status) params.status = filter.status
    Promise.all([
      api.getTransactions(params),
      api.getAccounts(),
      api.getCategories(),
      api.getEnvelopes(),
    ]).then(([t, a, c, e]) => {
      setTransactions(t)
      setAccounts(a)
      setCategories(c)
      setEnvelopes(e)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const handleCreate = async (data) => {
    await api.createTransaction(data)
    setShowModal(false)
    load()
  }

  const handleUpdate = async (data) => {
    await api.updateTransaction(editing.id, data)
    setEditing(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return
    await api.deleteTransaction(id)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Transactions</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => api.exportCSV()}>Export CSV</Button>
          <Button variant="secondary" onClick={() => api.exportXLSX()}>Export XLSX</Button>
          <Button onClick={() => setShowModal(true)}>+ Add</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={filter.account_id}
          onChange={e => setFilter(f => ({ ...f, account_id: e.target.value }))}
          className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">All Accounts</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select
          value={filter.status}
          onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">All Status</option>
          <option value="posted">Posted</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <Card>
        {loading ? (
          <p className="text-center py-8 text-gray-400">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="text-center py-8 text-gray-400">No transactions found. Add one or import a file.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Description</th>
                  <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-gray-800 dark:text-gray-200 max-w-xs truncate">{t.description}</td>
                    <td className={`px-4 py-2 font-medium whitespace-nowrap ${t.transaction_type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.transaction_type === 'credit' ? '+' : '-'}{fmt(t.amount)}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${t.status === 'posted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <Button variant="ghost" onClick={() => setEditing(t)}>Edit</Button>
                        <Button variant="ghost" onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700">Del</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <Modal title="Add Transaction" onClose={() => setShowModal(false)}>
          <TransactionForm accounts={accounts} categories={categories} envelopes={envelopes} onSubmit={handleCreate} onClose={() => setShowModal(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Transaction" onClose={() => setEditing(null)}>
          <TransactionForm accounts={accounts} categories={categories} envelopes={envelopes} onSubmit={handleUpdate} onClose={() => setEditing(null)} initial={editing} />
        </Modal>
      )}
    </div>
  )
}
