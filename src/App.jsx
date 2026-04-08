import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Projects from './pages/Projects'
import Quotes from './pages/Quotes'
import Invoices from './pages/Invoices'
import Tickets from './pages/Tickets'
import Settings from './pages/Settings'

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--text)', color: 'var(--brand)',
      fontFamily: 'var(--font)', fontSize: 16, fontWeight: 600, gap: 12
    }}>
      <div style={{
        width: 20, height: 20, border: '2.5px solid rgba(109,207,148,0.3)',
        borderTopColor: 'var(--brand)', borderRadius: '50%',
        animation: 'spin 0.65s linear infinite'
      }} />
      Cargando…
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function LoginGuard() {
  const { user } = useAuth()
  if (user) return <Navigate to="/" replace />
  return <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"           element={<LoginGuard />} />
        <Route path="/"                element={<Guard><Dashboard /></Guard>} />
        <Route path="/clientes"        element={<Guard><Clients /></Guard>} />
        <Route path="/clientes/:id"    element={<Guard><ClientDetail /></Guard>} />
        <Route path="/proyectos"       element={<Guard><Projects /></Guard>} />
        <Route path="/presupuestos"    element={<Guard><Quotes /></Guard>} />
        <Route path="/facturas"        element={<Guard><Invoices /></Guard>} />
        <Route path="/tickets"         element={<Guard><Tickets /></Guard>} />
        <Route path="/ajustes"         element={<Guard><Settings /></Guard>} />
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
