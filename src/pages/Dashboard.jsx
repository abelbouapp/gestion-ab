import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useClients, useProjects } from '../hooks/useData'
import { useInvoices } from '../hooks/useInvoices'
import { useTickets } from '../hooks/useTickets'
import { formatCurrency } from '../utils/helpers'
import { Avatar, SectionCard, StatusBadge, Spinner } from '../components/UI'
import { exportGestorPDF } from '../utils/exportGestor'
import s from './Dashboard.module.css'

function getDateRange(period) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  if (period === 'month') {
    return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59) }
  }
  if (period === 'quarter') {
    const q = Math.floor(m / 3)
    return { start: new Date(y, q * 3, 1), end: new Date(y, q * 3 + 3, 0, 23, 59, 59) }
  }
  return null
}

function periodLabel(period) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  if (period === 'month') return now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  if (period === 'quarter') return `${Math.floor(m / 3) + 1}T ${y}`
  return 'Todo el tiempo'
}

export default function Dashboard() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const { clients } = useClients()
  const { projects } = useProjects()
  const { invoices, loading: invLoading } = useInvoices()
  const { tickets, ivaDeductible: ivaDeducAll, totalGastos: gastosAll } = useTickets()

  const [period, setPeriod] = useState('quarter') // 'month' | 'quarter' | 'all'

  const myInfo = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('ab_myinfo') || '{}') } catch { return {} }
  }, [])

  // Filtrar por período
  const { filtInvoices, filtTickets } = useMemo(() => {
    const range = getDateRange(period)
    if (!range) return { filtInvoices: invoices, filtTickets: tickets }
    const filtInvoices = invoices.filter(i => {
      const d = new Date(i.date)
      return d >= range.start && d <= range.end
    })
    const filtTickets = tickets.filter(t => {
      const d = new Date(t.date)
      return d >= range.start && d <= range.end
    })
    return { filtInvoices, filtTickets }
  }, [invoices, tickets, period])

  const ivaCollected  = filtInvoices.reduce((s, i) => s + (i.iva_amount || 0), 0)
  const irpfRetained  = filtInvoices.reduce((s, i) => s + (i.irpf_amount || 0), 0)
  const totalBilled   = filtInvoices.reduce((s, i) => s + (i.total || 0), 0)
  const ivaDeductible = filtTickets.reduce((s, t) => s + (t.iva_amount || 0), 0)
  const totalGastos   = filtTickets.reduce((s, t) => s + (t.amount || 0), 0)
  const ivaAPagar     = Math.max(0, ivaCollected - ivaDeductible)
  const liquido       = totalBilled - ivaAPagar - irpfRetained

  const pendingProjects = projects.filter(p => p.status === 'pending' || p.status === 'active')
  const recentInvoices  = [...filtInvoices].slice(0, 5)

  const btnPeriod = (p) => ({
    padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: period === p ? 'var(--brand)' : 'var(--bg3)',
    color: period === p ? 'var(--text)' : 'var(--text2)',
  })

  return (
    <div className={s.page}>
      {/* Header con controles de período */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div className={s.greeting}>
          <h1>Hola, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Resumen fiscal · <strong>{periodLabel(period)}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Selector período */}
          <div style={{ display: 'flex', gap: 3, background: 'var(--bg3)', padding: 3, borderRadius: 8 }}>
            {[['month', 'Este mes'], ['quarter', 'Trimestre'], ['all', 'Todo']].map(([p, label]) => (
              <button key={p} style={btnPeriod(p)} onClick={() => setPeriod(p)}>{label}</button>
            ))}
          </div>
          {/* Botón Presentar al Gestor */}
          <button
            onClick={() => exportGestorPDF({ invoices: filtInvoices, tickets: filtTickets, clients, period, myInfo })}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 16px', borderRadius: 8, border: '1.5px solid var(--brand)',
              background: 'transparent', color: 'var(--brand)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'var(--font)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.target.style.background = 'var(--brand)'; e.target.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--brand)' }}
          >
            📤 Presentar al Gestor
          </button>
        </div>
      </div>

      {/* Resumen fiscal */}
      <div className={s.fiscalGrid}>
        <div className={`${s.fiscalCard} ${s.fcGreen}`}>
          <div className={s.fcLabel}>Facturado</div>
          <div className={s.fcValue}>{formatCurrency(totalBilled)}</div>
          <div className={s.fcSub}>{filtInvoices.length} facturas</div>
        </div>
        <div className={`${s.fiscalCard} ${s.fcBlue}`}>
          <div className={s.fcLabel}>IVA repercutido</div>
          <div className={s.fcValue}>{formatCurrency(ivaCollected)}</div>
          <div className={s.fcSub}>Cobrado de clientes</div>
        </div>
        <div className={`${s.fiscalCard} ${s.fcOrange}`}>
          <div className={s.fcLabel}>IVA soportado</div>
          <div className={s.fcValue}>-{formatCurrency(ivaDeductible)}</div>
          <div className={s.fcSub}>De tus tickets/gastos</div>
        </div>
        <div className={`${s.fiscalCard} ${s.fcRed}`}>
          <div className={s.fcLabel}>IVA a pagar</div>
          <div className={s.fcValue}>{formatCurrency(ivaAPagar)}</div>
          <div className={s.fcSub}>A Hacienda este período</div>
        </div>
        <div className={`${s.fiscalCard} ${s.fcPurple}`}>
          <div className={s.fcLabel}>IRPF retenido</div>
          <div className={s.fcValue}>{formatCurrency(irpfRetained)}</div>
          <div className={s.fcSub}>Ya descontado en facturas</div>
        </div>
        <div className={`${s.fiscalCard} ${s.fcDark}`}>
          <div className={s.fcLabel}>Líquido para ti</div>
          <div className={s.fcValue}>{formatCurrency(liquido)}</div>
          <div className={s.fcSub}>Tras IVA e IRPF</div>
        </div>
      </div>

      <div className={s.cols}>
        {/* Últimas facturas */}
        <SectionCard
          title="Últimas facturas"
          action={<button className={s.seeAll} onClick={() => navigate('/facturas')}>Ver todas →</button>}
        >
          {invLoading ? <Spinner /> : recentInvoices.length === 0
            ? <p className={s.empty}>Sin facturas en este período</p>
            : recentInvoices.map(inv => {
              const client = clients.find(c => c.id === inv.client_id)
              return (
                <div key={inv.id} className={s.invRow} onClick={() => navigate('/facturas')}>
                  <div>
                    <div className={s.invNum}>{inv.number}</div>
                    <div className={s.invClient}>{client?.name || '—'}</div>
                  </div>
                  <div className={s.invRight}>
                    <div className={s.invAmount}>{formatCurrency(inv.total)}</div>
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              )
            })
          }
        </SectionCard>

        {/* Proyectos activos */}
        <SectionCard
          title="Proyectos activos"
          action={<button className={s.seeAll} onClick={() => navigate('/proyectos')}>Ver todos →</button>}
        >
          {pendingProjects.length === 0
            ? <p className={s.empty}>Sin proyectos activos</p>
            : pendingProjects.slice(0, 5).map(p => {
              const client = clients.find(c => c.id === p.client_id)
              return (
                <div key={p.id} className={s.projRow} onClick={() => navigate('/proyectos')}>
                  <Avatar name={client?.name} color={client?.color} size={32} />
                  <div className={s.projInfo}>
                    <div className={s.projTitle}>{p.title}</div>
                    <div className={s.projClient}>{client?.name}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              )
            })
          }
        </SectionCard>
      </div>

      {/* Quick stats */}
      <div className={s.quickStats}>
        {[
          { label: 'Clientes',          value: clients.length,              onClick: () => navigate('/clientes') },
          { label: 'Proyectos',         value: projects.length,             onClick: () => navigate('/proyectos') },
          { label: 'Gastos del período', value: formatCurrency(totalGastos) },
          { label: 'Tickets registrados', value: filtTickets.length,        onClick: () => navigate('/tickets') },
        ].map(st => (
          <div key={st.label} className={`${s.qstat} ${st.onClick ? s.qstatClick : ''}`} onClick={st.onClick}>
            <div className={s.qstatVal}>{st.value}</div>
            <div className={s.qstatLbl}>{st.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
