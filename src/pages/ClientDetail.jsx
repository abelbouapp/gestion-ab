import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, FileText } from 'lucide-react'
import { useClients, useProjects } from '../hooks/useData'
import { useInvoices } from '../hooks/useInvoices'
import { Avatar, Btn, Empty, StatusBadge, SeriesBadge } from '../components/UI'
import { formatCurrency, formatDate, getColor } from '../utils/helpers'
import ClientModal from '../components/ClientModal'
import ProjectModal from '../components/ProjectModal'
import s from './ClientDetail.module.css'

export default function ClientDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { clients, updateClient, deleteClient } = useClients()
  const { projects, addProject }                = useProjects(id)
  const { invoices }                            = useInvoices(id)

  const client = clients.find(c => c.id === id)
  const [tab, setTab]       = useState('projects')
  const [editModal, setEdit]= useState(false)
  const [projModal, setProj]= useState(false)

  if (!client) return (
    <div style={{ padding:40, color:'var(--muted)' }}>
      Cliente no encontrado.{' '}
      <button style={{ color:'var(--brand-dark)' }} onClick={() => navigate('/clientes')}>← Volver</button>
    </div>
  )

  const billed = invoices.reduce((s, i) => s + (i.total || 0), 0)
  const color  = client.color || getColor(0)

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar "${client.name}" y todos sus datos?`)) return
    await deleteClient(id)
    navigate('/clientes')
  }

  return (
    <div className={s.page}>
      <button className={s.back} onClick={() => navigate('/clientes')}>
        <ArrowLeft size={14}/> Clientes
      </button>

      <div className={s.header}>
        <Avatar name={client.name} color={color} size={52} />
        <div className={s.hInfo}>
          <h1 className={s.name}>{client.name}</h1>
          <div className={s.meta}>
            {client.email && <span>{client.email}</span>}
            {client.phone && <span>{client.phone}</span>}
            {client.nif   && <span>NIF: {client.nif}</span>}
          </div>
          <div className={s.meta}>
            {client.is_company
              ? <span style={{color:'var(--series-d)'}}>🏢 Empresa/Autónomo — IRPF aplicable en Serie D</span>
              : <span style={{color:'var(--muted)'}}>👤 Particular — sin retención IRPF</span>
            }
          </div>
        </div>
        <div className={s.hActions}>
          <Btn small variant="secondary" icon={<Pencil size={13}/>}
            onClick={() => setEdit(true)}>Editar</Btn>
          <Btn small variant="danger" icon={<Trash2 size={13}/>}
            onClick={handleDelete}>Eliminar</Btn>
        </div>
      </div>

      <div className={s.statsRow}>
        {[
          { l:'Proyectos',  v: projects.length },
          { l:'Activos',    v: projects.filter(p=>p.status!=='done').length },
          { l:'Facturas',   v: invoices.length },
          { l:'Facturado',  v: formatCurrency(billed) },
        ].map(st => (
          <div key={st.l} className={s.stat}>
            <div className={s.statVal}>{st.v}</div>
            <div className={s.statLbl}>{st.l}</div>
          </div>
        ))}
      </div>

      <div className={s.tabs}>
        {['projects','invoices','notes'].map(t => (
          <button key={t} className={`${s.tab} ${tab===t?s.tabActive:''}`} onClick={()=>setTab(t)}>
            {{ projects:`Proyectos (${projects.length})`, invoices:`Facturas (${invoices.length})`, notes:'Notas' }[t]}
          </button>
        ))}
      </div>

      {tab === 'projects' && (
        <div>
          <div className={s.tabAction}>
            <Btn small icon={<Plus size={13}/>} onClick={() => setProj(true)}>Nuevo proyecto</Btn>
          </div>
          {projects.length === 0
            ? <Empty message="Sin proyectos para este cliente." />
            : projects.map(p => (
              <div key={p.id} className={s.projRow}
                onClick={() => navigate(`/proyectos?client=${id}&project=${p.id}`)}>
                <div className={s.projTitle}>{p.title}</div>
                <div className={s.projMeta}>
                  {p.type === 'hourly'
                    ? `${p.estimated_hours || '?'}h est. · ${p.hourly_rate || 0}€/h`
                    : `Precio fijo: ${formatCurrency(p.fixed_price)}`}
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))
          }
        </div>
      )}

      {tab === 'invoices' && (
        <div>
          <div className={s.tabAction}>
            <Btn small icon={<FileText size={13}/>}
              onClick={() => navigate(`/facturas?client=${id}`)}>Nueva factura</Btn>
          </div>
          {invoices.length === 0
            ? <Empty message="Sin facturas para este cliente." />
            : invoices.map(inv => (
              <div key={inv.id} className={s.invRow}
                onClick={() => navigate('/facturas')}>
                <div>
                  <span className={s.invNum}>{inv.number}</span>
                  <SeriesBadge series={inv.series} />
                </div>
                <div className={s.invMeta}>{formatDate(inv.date)}</div>
                <div className={s.invTotal}>{formatCurrency(inv.total)}</div>
                <StatusBadge status={inv.status} />
              </div>
            ))
          }
        </div>
      )}

      {tab === 'notes' && (
        <div className={s.notes}>{client.notes || <span style={{color:'var(--muted)'}}>Sin notas.</span>}</div>
      )}

      {editModal && (
        <ClientModal initial={client}
          onSave={async d => { await updateClient(id, d); setEdit(false) }}
          onClose={() => setEdit(false)} />
      )}
      {projModal && (
        <ProjectModal initial={{ client_id: id }} clients={[client]}
          onSave={async d => { await addProject(d); setProj(false) }}
          onClose={() => setProj(false)} />
      )}
    </div>
  )
}
