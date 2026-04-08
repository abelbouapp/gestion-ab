import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const USERS_KEY = 'ab_users'
const SESSION_KEY = 'ab_session'

const DEFAULT_USERS = [
  { email: 'abel@abelbou.com', password: 'abelbou2024', name: 'Abel Bou' }
]

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS))
    }
    const s = localStorage.getItem(SESSION_KEY)
    if (s) { try { setUser(JSON.parse(s)) } catch {} }
    setLoading(false)
  }, [])

  function login(email, password) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    const found = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (!found) return { ok: false, error: 'Email o contraseña incorrectos' }
    const u = { email: found.email, name: found.name }
    setUser(u)
    localStorage.setItem(SESSION_KEY, JSON.stringify(u))
    return { ok: true }
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  function changePassword(current, next) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    const idx   = users.findIndex(
      u => u.email.toLowerCase() === user?.email?.toLowerCase() && u.password === current
    )
    if (idx === -1) return { ok: false, error: 'Contraseña actual incorrecta' }
    users[idx].password = next
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    return { ok: true }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
