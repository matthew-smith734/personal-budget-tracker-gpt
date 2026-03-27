import { useState, useEffect } from 'react'
import { api } from '../api'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

function fmt(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
}

const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'cash', 'investment', 'other']

function AccountForm({ onSubmit, onClose, initial = {} }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    account_type: initial.account_type || 'checking',
    balance: initial.balance || '',
    currency: initial.currency || 'USD',
    notes: initial.notes || '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const inputCls = 'w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500'

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, balance: parseFloat(form.balance || 0) }) }} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name *</label>
        <input type="text" value={form.name} onChange={set('name')} required className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
          <select value={form.account_type} onChange={set('account_type')} className={inputCls}>
            {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Balance</label>
          <input type="number" step="0.01" value={form.balance} onChange={set('balance')} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Currency</label>
        <input type="text" value={form.currency} onChange={set('currency')} maxLength={3} className={inputCls} />
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

const TYPE_ICONS = { checking: '🏦', savings: '💰', credit: '💳', cash: '💵', investment: '📈', other: '🏧' }

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = () => api.getAccounts().then(setAccounts).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreate = async (data) => { await api.createAccount(data); setShowModal(false); load() }
  const handleUpdate = async (data) => { await api.updateAccount(editing.id, data); setEditing(null); load() }
  const handleDelete = async (id) => { if (!confirm('Delete account?')) return; await api.deleteAccount(id); load() }

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Accounts</h1>
        <Button onClick={() => setShowModal(true)}>+ Add Account</Button>
      </div>

      <Card className="px-4 py-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">Total Balance</p>
        <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{fmt(totalBalance)}</p>
      </Card>

      {loading ? (
        <p className="text-center py-8 text-gray-400">Loading…</p>
      ) : accounts.length === 0 ? (
        <Card className="p-8 text-center text-gray-400">No accounts yet.</Card>
      ) : (
        <div className="space-y-2">
          {accounts.map(a => (
            <Card key={a.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{TYPE_ICONS[a.account_type] || '🏧'}</span>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{a.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{a.account_type} · {a.currency}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className={`font-semibold ${a.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{fmt(a.balance)}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" onClick={() => setEditing(a)}>Edit</Button>
                  <Button variant="ghost" onClick={() => handleDelete(a.id)} className="text-red-500">Del</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Add Account" onClose={() => setShowModal(false)}>
          <AccountForm onSubmit={handleCreate} onClose={() => setShowModal(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Account" onClose={() => setEditing(null)}>
          <AccountForm onSubmit={handleUpdate} onClose={() => setEditing(null)} initial={editing} />
        </Modal>
      )}
    </div>
  )
}
