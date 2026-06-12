import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../utils/api'

const AuthContext = createContext()
const STORAGE_KEY = 'ab_session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  async function login(email, password) {
    try {
      const res = await authApi.login(email, password)
      const session = { email: res.email, name: res.name }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      setUser(session)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message || 'Email o contraseña incorrectos' }
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  function changePassword(current, next) {
    // Pendiente de endpoint en la API (auth.php solo soporta login por ahora)
    return { ok: false, error: 'Cambio de contraseña no disponible todavía' }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
