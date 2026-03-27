import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Envelopes from './pages/Envelopes'
import Accounts from './pages/Accounts'
import ImportPage from './pages/ImportPage'
import Categories from './pages/Categories'

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <Layout darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/envelopes" element={<Envelopes />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/categories" element={<Categories />} />
      </Routes>
    </Layout>
  )
}
