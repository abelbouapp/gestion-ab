import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { settingsApi } from '../utils/api'
import { Btn, Field, Row, Spinner } from '../components/UI'
import s from './Settings.module.css'

export default function Settings() {
  const { user, changePassword } = useAuth()
  const uid = user?.email || 'default'

  const [info,   setInfo]   = useState({})
  const [saved,  setSaved]  = useState(false)
  const [loading,setLoading]= useState(true)
  const [pwd, setPwd]       = useState({ current: '', next: '', confirm: '' })
  const [pwdMsg, setPwdMsg] = useState(null)

  useEffect(() => {
    settingsApi.get(uid).then(data => {
      setInfo(data || {})
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [uid])

  const si = (k, v) => setInfo(p => ({ ...p, [k]: v }))

  async function saveInfo(e) {
    e.preventDefault()
    await settingsApi.save(uid, info)
    // Also keep in localStorage for PDF generation (offline)
    localStorage.setItem('ab_myinfo', JSON.stringify(info))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function savePwd(e) {
    e.preventDefault()
    if (pwd.next !== pwd.confirm) { setPwdMsg({ ok: false, msg: 'Las contraseñas no coinciden' }); return }
    if (pwd.next.length < 6)      { setPwdMsg({ ok: false, msg: 'Mínimo 6 caracteres' }); return }
    const r = changePassword(pwd.current, pwd.next)
    setPwdMsg({ ok: r.ok, msg: r.ok ? '¡Contraseña actualizada!' : r.error })
    if (r.ok) setPwd({ current: '', next: '', confirm: '' })
  }

  if (loading) return <div className={s.page}><Spinner /></div>

  return (
    <div className={s.page}>
      <h1 className={s.title}>Ajustes</h1>
      <p className={s.sub}>Datos fiscales y configuración de cuenta</p>

      <section className={s.section}>
        <h2 className={s.sTitle}>Mis datos fiscales <span className={s.sBadge}>Aparecen en todas las facturas</span></h2>
        <form onSubmit={saveInfo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Row>
            <Field label="Nombre completo">
              <input value={info.name || ''} onChange={e => si('name', e.target.value)} placeholder="Abel Bou" />
            </Field>
            <Field label="Nombre comercial">
              <input value={info.company || ''} onChange={e => si('company', e.target.value)} placeholder="Abel Bou" />
            </Field>
          </Row>
          <Row>
            <Field label="NIF / DNI">
              <input value={info.nif || ''} onChange={e => si('nif', e.target.value)} placeholder="12345678A" />
            </Field>
            <Field label="Email profesional">
              <input type="email" value={info.email || ''} onChange={e => si('email', e.target.value)} placeholder="hola@abelbou.com" />
            </Field>
          </Row>
          <Row>
            <Field label="Teléfono">
              <input value={info.phone || ''} onChange={e => si('phone', e.target.value)} placeholder="+34 600 000 000" />
            </Field>
            <Field label="Dirección fiscal">
              <input value={info.address || ''} onChange={e => si('address', e.target.value)} placeholder="Calle, Nº, Ciudad, CP" />
            </Field>
          </Row>
          <Field label="IBAN">
            <input value={info.iban || ''} onChange={e => si('iban', e.target.value)} placeholder="ES00 0000 0000 0000 0000 0000" />
          </Field>

          <div className={s.epigrafes}>
            <h3 className={s.epTitle}>Epígrafes IAE</h3>
            <div className={s.epiRow}>
              <div className={s.epiCard} style={{ borderColor: 'var(--series-d)' }}>
                <div className={s.epiSeries}>Serie D</div>
                <div className={s.epiName}>Servicios Digitales</div>
                <div className={s.epiInfo}>IVA 21% + IRPF 7% (empresas/autónomos)</div>
              </div>
              <div className={s.epiCard} style={{ borderColor: 'var(--series-p)' }}>
                <div className={s.epiSeries} style={{ color: 'var(--series-p)' }}>Serie P</div>
                <div className={s.epiName}>Productos</div>
                <div className={s.epiInfo}>Solo IVA 21% — sin retención IRPF</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Btn type="submit">Guardar datos</Btn>
            {saved && <span style={{ color: 'var(--brand-dark)', fontSize: 13 }}>✓ Guardado</span>}
          </div>
        </form>
      </section>

      <section className={s.section}>
        <h2 className={s.sTitle}>Cambiar contraseña</h2>
        <p className={s.hint}>Cuenta activa: <strong>{user?.email}</strong></p>
        <form onSubmit={savePwd} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 380 }}>
          <Field label="Contraseña actual">
            <input type="password" value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} required />
          </Field>
          <Field label="Nueva contraseña">
            <input type="password" value={pwd.next} onChange={e => setPwd(p => ({ ...p, next: e.target.value }))} required />
          </Field>
          <Field label="Confirmar nueva">
            <input type="password" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} required />
          </Field>
          {pwdMsg && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13,
              background: pwdMsg.ok ? 'rgba(109,207,148,0.1)' : 'rgba(229,72,77,0.1)',
              color: pwdMsg.ok ? 'var(--brand-dark)' : 'var(--danger)',
              border: `1px solid ${pwdMsg.ok ? 'rgba(109,207,148,0.3)' : 'rgba(229,72,77,0.25)'}`
            }}>
              {pwdMsg.msg}
            </div>
          )}
          <Btn type="submit" variant="secondary">Actualizar contraseña</Btn>
        </form>
      </section>
    </div>
  )
}
