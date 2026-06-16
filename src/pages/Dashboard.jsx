import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useClients, useProjects } from '../hooks/useData'
import { useInvoices } from '../hooks/useInvoices'
import { useTickets } from '../hooks/useTickets'
import { formatCurrency } from '../utils/helpers'
import { Avatar, SectionCard, StatusBadge, Spinner, Btn } from '../components/UI'
import s from './Dashboard.module.css'

// ✅ Helper: always convert to a safe number (MySQL returns decimals as strings)
const n = (v) => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

function getCurrentQuarter() {
  const m = new Date().getMonth()
  return Math.floor(m / 3) + 1
}
function getQuarterRange(q, year) {
  const start = new Date(year, (q - 1) * 3, 1)
  const end   = new Date(year, q * 3, 0, 23, 59, 59)
  return { start, end }
}

export default function Dashboard() {
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const { clients }  = useClients()
  const { projects } = useProjects()
  const { invoices, loading: invLoading } = useInvoices()
  const { tickets } = useTickets()

  const now   = new Date()
  const year  = now.getFullYear()
  const [period, setPeriod] = useState('quarter')

  const range = useMemo(() => {
    if (period === 'all') return null
    if (period === 'month') {
      return {
        start: new Date(year, now.getMonth(), 1),
        end:   new Date(year, now.getMonth() + 1, 0, 23, 59, 59),
      }
    }
    return getQuarterRange(getCurrentQuarter(), year)
  }, [period])

  const periodLabel = period === 'all'
    ? `Todo · ${year}`
    : period === 'month'
      ? `${now.toLocaleString('es-ES', { month: 'long' })} ${year}`
      : `${getCurrentQuarter()}T ${year}`

  const filteredInvoices = useMemo(() => {
    if (!range) return invoices
    return invoices.filter(i => {
      if (!i.date) return false
      const d = new Date(i.date)
      return d >= range.start && d <= range.end
    })
  }, [invoices, range])

  const filteredTickets = useMemo(() => {
    if (!range) return tickets
    return tickets.filter(t => {
      if (!t.date) return false
      const d = new Date(t.date)
      return d >= range.start && d <= range.end
    })
  }, [tickets, range])

  // ✅ All sums wrapped with n()
  const ivaCollected   = filteredInvoices.reduce((s, i) => s + n(i.iva_amount), 0)
  const irpfRetained   = filteredInvoices.reduce((s, i) => s + n(i.irpf_amount), 0)
  const totalBilled    = filteredInvoices.reduce((s, i) => s + n(i.total), 0)
  const ivaDeductible  = filteredTickets.reduce((s, t) => s + n(t.iva_amount), 0)
  const totalGastos    = filteredTickets.reduce((s, t) => s + n(t.amount), 0)
  const ivaAPagar      = Math.max(0, ivaCollected - ivaDeductible)
  const liquido        = totalBilled - ivaAPagar - irpfRetained

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)

  const activeProjects = projects.filter(p => p.status !== 'done').slice(0, 5)

  function exportForGestor() {
    const report = {
      periodo: periodLabel,
      generado: new Date().toLocaleString('es-ES'),
      resumen_fiscal: {
        facturado_total:  totalBilled,
        iva_repercutido:  ivaCollected,
        iva_soportado:    ivaDeductible,
        iva_a_pagar:      ivaAPagar,
        irpf_retenido:    irpfRetained,
        liquido_neto:     liquido,
        total_gastos:     totalGastos,
      },
      facturas: filteredInvoices.map(i => ({
        numero: i.number, serie: i.series, fecha: i.date,
        cliente_id: i.client_id, total: n(i.total),
        iva: n(i.iva_amount), irpf: n(i.irpf_amount), estado: i.status,
      })),
      tickets: filteredTickets.map(t => ({
        descripcion: t.description, fecha: t.date,
        importe: n(t.amount), iva: n(t.iva_amount), categoria: t.category,
      })),
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `informe_fiscal_${periodLabel.replace(/\s/g, '_')}.json`
    a.click()
  }

  if (invLoading) return <div className={s.page}><Spinner /></div>

  return (
    <div className={s.page}>
      <div className={s.topRow}>
        <div className={s.greeting}>
          <h1>Hola, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Resumen fiscal · <strong>{periodLabel}</strong></p>
        </div>
        <div className={s.controls}>
          <div className={s.periodGroup}>
            {[
              { v: 'month',   l: 'Este mes'   },
              { v: 'quarter', l: 'Trimestre'  },
              { v: 'all',     l: 'Todo'        },
            ].map(({ v, l }) => (
              <button key={v}
                className={`${s.pBtn} ${period === v ? s.pActive : ''}`}
                onClick={() => setPeriod(v)}>
                {l}
              </button>
            ))}
          </div>
          <Btn small variant="secondary" onClick={exportForGestor}>
            📤 Presentar al Gestor
          </Btn>
        </div>
      </div>

      <div className={s.fiscalGrid}>
        {[
          { label: 'Facturado',       value: formatCurrency(totalBilled),   color: '#22c55e', sub: `${filteredInvoices.length} facturas` },
          { label: 'IVA repercutido', value: formatCurrency(ivaCollected),  color: '#3b82f6', sub: 'Cobrado de clientes' },
          { label: 'IVA soportado',   value: `-${formatCurrency(ivaDeductible)}`, color: '#f97316', sub: 'De tus tickets/gastos' },
          { label: 'IVA a pagar',     value: formatCurrency(ivaAPagar),     color: '#e5484d', sub: 'A Hacienda este periodo' },
          { label: 'IRPF retenido',   value: formatCurrency(irpfRetained),  color: '#a78bfa', sub: 'Ya descontado en facturas' },
          { label: 'Líquido para ti', value: formatCurrency(liquido),       color: '#6dcf94', sub: 'Tras IVA e IRPF', dark: true },
        ].map(st => (
          <div key={st.label} className={`${s.fiscalCard} ${st.dark ? s.fcDark : ''}`}
            style={{ '--c': st.color }}>
            <div className={s.fcLabel}>{st.label}</div>
            <div className={s.fcValue}>{st.value}</div>
            <div className={s.fcSub}>{st.sub}</div>
          </div>
        ))}
      </div>

      <div className={s.cols}>
        <SectionCard
          title="Últimas facturas"
          action={<button className={s.seeAll} onClick={() => navigate('/facturas')}>Ver todas →</button>}
        >
          {recentInvoices.length === 0
            ? <p className={s.empty}>Sin facturas en este periodo</p>
            : recentInvoices.map(inv => {
              const client = clients.find(c => c.id === inv.client_id)
              return (
                <div key={inv.id} className={s.invRow} onClick={() => navigate('/facturas')}>
                  <div>
                    <div className={s.invNum}>{inv.number || 'Borrador'}</div>
                    <div className={s.invClient}>{client?.name || '—'}</div>
                  </div>
                  <div className={s.invRight}>
                    <div className={s.invAmount}>{formatCurrency(n(inv.total))}</div>
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              )
            })
          }
        </SectionCard>

        <SectionCard
          title="Proyectos activos"
          action={<button className={s.seeAll} onClick={() => navigate('/proyectos')}>Ver todos →</button>}
        >
          {activeProjects.length === 0
            ? <p className={s.empty}>Sin proyectos activos</p>
            : activeProjects.map(p => {
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

      <div className={s.quickStats}>
        {[
          { label: 'Clientes',          value: clients.length,                onClick: () => navigate('/clientes') },
          { label: 'Proyectos',         value: projects.length,               onClick: () => navigate('/proyectos') },
          { label: 'Gastos del periodo',value: formatCurrency(totalGastos) },
          { label: 'Tickets registrados', value: tickets.length,              onClick: () => navigate('/tickets') },
        ].map(st => (
          <div key={st.label} className={`${s.qstat} ${st.onClick ? s.qstatClick : ''}`}
            onClick={st.onClick}>
            <div className={s.qstatVal}>{st.value}</div>
            <div className={s.qstatLbl}>{st.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
