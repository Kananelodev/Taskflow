import React from 'react'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'

export default function App() {
  const { user, loading, login, logout } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text3)', fontSize: 13, fontFamily: 'var(--mono)'
      }}>
        Loading...
      </div>
    )
  }

  if (!user) return <LoginPage onLogin={login} />
  return <HomePage user={user} onLogout={logout} />
}
