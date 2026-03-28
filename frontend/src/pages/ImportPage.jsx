import { useState, useEffect } from 'react'
import { api } from '../api'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

function fmt(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(amount || 0))
}

export default function ImportPage() {
  const [accounts, setAccounts] = useState([])
  const [file, setFile] = useState(null)
  const [accountId, setAccountId] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { api.getAccounts().then(setAccounts) }, [])

  const handlePreview = async () => {
    if (!file || !accountId) return
    setLoading(true)
    setError(null)
    setPreview(null)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('account_id', accountId)
      const data = await api.previewImport(fd)
      setPreview(data)
    } catch (e) {
      setError(e.message || 'Preview failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCommit = async (skipDuplicates = true) => {
    if (!file || !accountId) return
    setImporting(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('account_id', accountId)
      fd.append('skip_duplicates', skipDuplicates)
      const data = await api.commitImport(fd)
      setResult(data)
      setPreview(null)
    } catch (e) {
      setError(e.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Import Transactions</h1>

      <Card className="p-4 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Account *</label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">File (CSV or XLSX) *</label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={e => { setFile(e.target.files[0]); setPreview(null); setResult(null) }}
              className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-900/30 dark:file:text-primary-400 hover:file:bg-primary-100"
            />
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-md p-3">
          <p className="font-medium mb-1">Required columns (flexible naming):</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li><strong>Date</strong> — "date", "transaction date", "posting date", etc.</li>
            <li><strong>Amount</strong> — "amount", "debit", "credit", etc. Supports $, commas, parentheses</li>
            <li><strong>Description</strong> — "description", "memo", "payee", "narrative", etc.</li>
          </ul>
        </div>

        <Button onClick={handlePreview} disabled={!file || !accountId || loading}>
          {loading ? 'Previewing…' : '🔍 Preview Import'}
        </Button>
      </Card>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {result && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-500 text-xl">✅</span>
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">Import Complete</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.imported}</p>
              <p className="text-xs text-gray-500">Imported</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{result.duplicates}</p>
              <p className="text-xs text-gray-500">Duplicates skipped</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{result.total}</p>
              <p className="text-xs text-gray-500">Total rows</p>
            </div>
          </div>
        </Card>
      )}

      {preview && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">Import Preview</h2>
            <div className="flex gap-2">
              <span className="text-xs text-gray-500">{preview.new} new · {preview.duplicates} duplicates</span>
              <Button onClick={() => handleCommit(true)} disabled={importing}>
                {importing ? 'Importing…' : `Import ${preview.new} transactions`}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="px-3 py-2 font-medium text-gray-500">Date</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Description</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Amount</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.transactions.slice(0, 50).map((t, i) => (
                  <tr key={i} className={`border-b border-gray-100 dark:border-gray-700/50 ${t.is_duplicate ? 'opacity-50' : ''}`}>
                    <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-3 py-1.5 text-gray-800 dark:text-gray-200 max-w-xs truncate">{t.description}</td>
                    <td className={`px-3 py-1.5 font-medium whitespace-nowrap ${t.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.transaction_type === 'credit' ? '+' : '-'}{fmt(t.amount)}
                    </td>
                    <td className="px-3 py-1.5">
                      {t.is_duplicate ? (
                        <span className="text-yellow-600 dark:text-yellow-400">⚠ duplicate</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">✓ new</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.transactions.length > 50 && (
              <p className="text-xs text-gray-400 text-center py-2">Showing first 50 of {preview.transactions.length} rows</p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
