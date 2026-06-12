import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import s from './Login.module.css'

export default function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const res = await login(form.email, form.password)
    setLoading(false)
    if (res.ok) navigate('/')
    else setError(res.error)
  }

  return (
    <div className={s.root}>
      <div className={s.bg} />
      <div className={s.card}>
        <div className={s.logo}>
          <span className={s.logoText}>Abel Bou</span>
          <span className={s.logoSub}>Área de gestión privada</span>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          <div className={s.field}>
            <label>Email</label>
            <input type="email" placeholder="tu@email.com" autoFocus
              value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required />
          </div>
          <div className={s.field}>
            <label>Contraseña</label>
            <input type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required />
          </div>
          {error && <div className={s.error}>{error}</div>}
          <button type="submit" className={s.btn} disabled={loading}>
            {loading ? <span className={s.spinner} /> : 'Entrar'}
          </button>
        </form>

      </div>
    </div>
  )
}
