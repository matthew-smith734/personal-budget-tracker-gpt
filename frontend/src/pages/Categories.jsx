import { useState, useEffect } from 'react'
import { api } from '../api'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

function CategoryForm({ onSubmit, onClose, initial = {} }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    color: initial.color || '#6366f1',
    icon: initial.icon || '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const inputCls = 'w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500'

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name *</label>
        <input type="text" value={form.name} onChange={set('name')} required className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Color</label>
          <input type="color" value={form.color} onChange={set('color')} className="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Icon (emoji)</label>
          <input type="text" value={form.icon} onChange={set('icon')} placeholder="🏷️" maxLength={2} className={inputCls} />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = () => api.getCategories().then(setCategories).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreate = async (data) => { await api.createCategory(data); setShowModal(false); load() }
  const handleUpdate = async (data) => { await api.updateCategory(editing.id, data); setEditing(null); load() }
  const handleDelete = async (id) => { if (!confirm('Delete category?')) return; await api.deleteCategory(id); load() }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Categories</h1>
        <Button onClick={() => setShowModal(true)}>+ New Category</Button>
      </div>

      {loading ? (
        <p className="text-center py-8 text-gray-400">Loading…</p>
      ) : categories.length === 0 ? (
        <Card className="p-8 text-center text-gray-400">No categories yet.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(cat => (
            <Card key={cat.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: cat.color }}>
                  {cat.icon || cat.name[0].toUpperCase()}
                </div>
                <span className="font-medium text-gray-800 dark:text-gray-200">{cat.name}</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" onClick={() => setEditing(cat)}>Edit</Button>
                <Button variant="ghost" onClick={() => handleDelete(cat.id)} className="text-red-500">Del</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="New Category" onClose={() => setShowModal(false)}>
          <CategoryForm onSubmit={handleCreate} onClose={() => setShowModal(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Category" onClose={() => setEditing(null)}>
          <CategoryForm onSubmit={handleUpdate} onClose={() => setEditing(null)} initial={editing} />
        </Modal>
      )}
    </div>
  )
}
