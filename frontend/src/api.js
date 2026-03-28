const BASE_URL = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  // Accounts
  getAccounts: () => request('/accounts/'),
  createAccount: (data) => request('/accounts/', { method: 'POST', body: JSON.stringify(data) }),
  updateAccount: (id, data) => request(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAccount: (id) => request(`/accounts/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request('/categories/'),
  createCategory: (data) => request('/categories/', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Envelopes
  getEnvelopes: () => request('/envelopes/'),
  createEnvelope: (data) => request('/envelopes/', { method: 'POST', body: JSON.stringify(data) }),
  updateEnvelope: (id, data) => request(`/envelopes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEnvelope: (id) => request(`/envelopes/${id}`, { method: 'DELETE' }),
  assignFunds: (id, amount) => request(`/envelopes/${id}/assign?amount=${amount}`, { method: 'POST' }),

  // Transactions
  getTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/transactions/${qs ? '?' + qs : ''}`)
  },
  getSummary: () => request('/transactions/summary'),
  createTransaction: (data) => request('/transactions/', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id, data) => request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),

  // Imports
  previewImport: (formData) => fetch(`${BASE_URL}/imports/preview`, { method: 'POST', body: formData }).then(r => r.json()),
  commitImport: (formData) => fetch(`${BASE_URL}/imports/commit`, { method: 'POST', body: formData }).then(r => r.json()),

  // Exports
  exportCSV: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    window.open(`${BASE_URL}/exports/transactions/csv${qs ? '?' + qs : ''}`, '_blank')
  },
  exportXLSX: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    window.open(`${BASE_URL}/exports/transactions/xlsx${qs ? '?' + qs : ''}`, '_blank')
  },
}
