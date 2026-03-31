import { useState, useEffect } from 'react'
import { getMe, getLoginUrl, logout as apiLogout } from '../utils/api'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async () => {
    const url = await getLoginUrl()
    window.location.href = url
  }

  const logout = async () => {
    await apiLogout()
    setUser(null)
  }

  return { user, loading, login, logout }
}
