import { useState, useEffect } from 'react'
import { api } from '../api'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

function fmt(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
}

function EnvelopeForm({ categories, onSubmit, onClose, initial = {} }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    category_id: initial.category_id || '',
    budgeted_amount: initial.budgeted_amount || '',
    period: initial.period || 'monthly',
    notes: initial.notes || '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const inputCls = 'w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500'

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, budgeted_amount: parseFloat(form.budgeted_amount), category_id: form.category_id ? parseInt(form.category_id) : null }) }} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name *</label>
        <input type="text" value={form.name} onChange={set('name')} required className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Budgeted Amount *</label>
          <input type="number" step="0.01" value={form.budgeted_amount} onChange={set('budgeted_amount')} required className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Period</label>
          <select value={form.period} onChange={set('period')} className={inputCls}>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="yearly">Yearly</option>
            <option value="one-time">One-time</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
        <select value={form.category_id} onChange={set('category_id')} className={inputCls}>
          <option value="">None</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
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

export default function Envelopes() {
  const [envelopes, setEnvelopes] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [assigning, setAssigning] = useState(null)
  const [assignAmount, setAssignAmount] = useState('')

  const load = () => {
    Promise.all([api.getEnvelopes(), api.getCategories()])
      .then(([e, c]) => { setEnvelopes(e); setCategories(c) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (data) => { await api.createEnvelope(data); setShowModal(false); load() }
  const handleUpdate = async (data) => { await api.updateEnvelope(editing.id, data); setEditing(null); load() }
  const handleDelete = async (id) => { if (!confirm('Delete envelope?')) return; await api.deleteEnvelope(id); load() }
  const handleAssign = async () => {
    await api.assignFunds(assigning.id, parseFloat(assignAmount))
    setAssigning(null)
    setAssignAmount('')
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Envelopes</h1>
        <Button onClick={() => setShowModal(true)}>+ New Envelope</Button>
      </div>

      {loading ? (
        <p className="text-center py-8 text-gray-400">Loading…</p>
      ) : envelopes.length === 0 ? (
        <Card className="p-8 text-center text-gray-400">No envelopes yet. Create one to start budgeting.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {envelopes.map(env => {
            const pct = env.budgeted_amount > 0 ? Math.min(100, (env.spent_amount / env.budgeted_amount) * 100) : 0
            const overBudget = env.spent_amount > env.budgeted_amount
            return (
              <Card key={env.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">{env.name}</h3>
                    <p className="text-xs text-gray-400 capitalize">{env.period}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" onClick={() => setAssigning(env)} className="text-xs px-1.5 py-0.5">+$</Button>
                    <Button variant="ghost" onClick={() => setEditing(env)} className="text-xs px-1.5 py-0.5">Edit</Button>
                    <Button variant="ghost" onClick={() => handleDelete(env.id)} className="text-xs px-1.5 py-0.5 text-red-500">Del</Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Spent: {fmt(env.spent_amount)}</span>
                    <span>Budget: {fmt(env.budgeted_amount)}</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-primary-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className={`text-sm font-semibold ${overBudget ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                    {overBudget ? 'Over by ' : 'Available: '}{fmt(Math.abs(env.available_amount))}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {showModal && (
        <Modal title="New Envelope" onClose={() => setShowModal(false)}>
          <EnvelopeForm categories={categories} onSubmit={handleCreate} onClose={() => setShowModal(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Envelope" onClose={() => setEditing(null)}>
          <EnvelopeForm categories={categories} onSubmit={handleUpdate} onClose={() => setEditing(null)} initial={editing} />
        </Modal>
      )}
      {assigning && (
        <Modal title={`Assign Funds to "${assigning.name}"`} onClose={() => setAssigning(null)}>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Current budget: {fmt(assigning.budgeted_amount)}</p>
            <input
              type="number" step="0.01" value={assignAmount}
              onChange={e => setAssignAmount(e.target.value)}
              placeholder="Amount to add"
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setAssigning(null)}>Cancel</Button>
              <Button onClick={handleAssign} disabled={!assignAmount}>Assign</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
