import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useClients, useProjects } from '../hooks/useData'
import { useInvoices } from '../hooks/useInvoices'
import { useTickets } from '../hooks/useTickets'
import { formatCurrency } from '../utils/helpers'
import { Avatar, SectionCard, StatusBadge, SeriesBadge, Spinner } from '../components/UI'
import s from './Dashboard.module.css'

export default function Dashboard() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const { clients } = useClients()
  const { projects } = useProjects()
  const { invoices, ivaCollected, irpfRetained, totalBilled, loading: invLoading } = useInvoices()
  const { ivaDeductible, totalGastos } = useTickets()

  const ivaAPagar  = Math.max(0, ivaCollected - ivaDeductible)
  const liquido    = totalBilled - ivaAPagar - irpfRetained

  const pendingProjects = projects.filter(p => p.status === 'pending' || p.status === 'active')
  const recentInvoices  = [...invoices].slice(0, 5)

  return (
    <div className={s.page}>
      <div className={s.greeting}>
        <h1>Hola, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Aquí tienes tu resumen de gestión y fiscal</p>
      </div>

      {/* Fiscal summary */}
      <div className={s.fiscalGrid}>
        <div className={`${s.fiscalCard} ${s.fcGreen}`}>
          <div className={s.fcLabel}>Facturado total</div>
          <div className={s.fcValue}>{formatCurrency(totalBilled)}</div>
          <div className={s.fcSub}>{invoices.length} facturas</div>
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
          <div className={s.fcSub}>A Hacienda este trimestre</div>
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
        {/* Recent invoices */}
        <SectionCard
          title="Últimas facturas"
          action={
            <button className={s.seeAll} onClick={() => navigate('/facturas')}>Ver todas →</button>
          }
        >
          {invLoading ? <Spinner /> : recentInvoices.length === 0
            ? <p className={s.empty}>Sin facturas aún</p>
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

        {/* Active projects */}
        <SectionCard
          title="Proyectos activos"
          action={
            <button className={s.seeAll} onClick={() => navigate('/proyectos')}>Ver todos →</button>
          }
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

      {/* Quick stats row */}
      <div className={s.quickStats}>
        {[
          { label: 'Clientes', value: clients.length,  onClick: () => navigate('/clientes') },
          { label: 'Proyectos', value: projects.length, onClick: () => navigate('/proyectos') },
          { label: 'Gastos registrados', value: formatCurrency(totalGastos) },
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
