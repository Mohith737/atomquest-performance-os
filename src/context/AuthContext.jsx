import { createContext, useEffect, useState } from 'react'

import { getMe, loginUser, logoutUser } from '@/api/auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      const accessToken = localStorage.getItem('access_token')
      if (!accessToken) {
        if (isMounted) setIsLoading(false)
        return
      }

      try {
        const currentUser = await getMe()
        if (isMounted) {
          setUser(currentUser)
          setIsAuthenticated(true)
        }
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (isMounted) {
          setUser(null)
          setIsAuthenticated(false)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    restoreSession()

    return () => {
      isMounted = false
    }
  }, [])

  async function login(email, password) {
    const data = await loginUser({ email, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    setUser(data.user)
    setIsAuthenticated(true)
    return data
  }

  async function logout() {
    try {
      await logoutUser(localStorage.getItem('refresh_token'))
    } finally {
      localStorage.clear()
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
