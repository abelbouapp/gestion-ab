import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Play, Square, ChevronDown, ChevronUp, Pencil, Trash2, Clock } from 'lucide-react'
import { useClients, useProjects, useTimerSessions } from '../hooks/useData'
import { Btn, Empty, Spinner, StatusBadge, Avatar, SectionCard } from '../components/UI'
import { formatCurrency, formatDate, formatMinutes, formatTime, getColor } from '../utils/helpers'

function parseOcProject(description) {
  if (!description?.startsWith('_oc_client_:')) return null
  try {
    const firstLine = description.split('\n')[0].replace('_oc_client_:', '')
    return JSON.parse(firstLine)
  } catch { return null }
}
function getRealDescription(description) {
  if (!description?.startsWith('_oc_client_:')) return description || ''
  return description.split('\n').slice(1).join('\n').trim()
}
import ProjectModal from '../components/ProjectModal'
import s from './Projects.module.css'

export default function Projects() {
  const [params]  = useSearchParams()
  const { clients } = useClients()
  const { projects, loading, addProject, updateProject, deleteProject } = useProjects()
  const [modal,    setModal]   = useState(false)
  const [editProj, setEditProj]= useState(null)
  const [expanded, setExpanded]= useState(params.get('project') || null)
  const [filterClient, setFC]  = useState(params.get('client') || 'all')

  const filtered = projects.filter(p =>
    filterClient === 'all' || p.client_id === filterClient
  )

  async function handleSave(data) {
    if (editProj) {
      const { error } = await updateProject(editProj.id, data)
      if (error) { alert('Error al guardar: ' + error.message); return }
      setEditProj(null)
    } else {
      const { error } = await addProject(data)
      if (error) { alert('Error al crear proyecto: ' + error.message); return }
      setModal(false)
    }
  }

  if (loading) return <div className={s.page}><Spinner /></div>

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Proyectos</h1>
          <p className={s.sub}>{projects.length} proyectos</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select className={s.clientFilter} value={filterClient}
            onChange={e => setFC(e.target.value)}>
            <option value="all">Todos los clientes</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Btn onClick={() => setModal(true)} disabled={clients.length===0} icon={<Plus size={15}/>}>
            Nuevo proyecto
          </Btn>
        </div>
      </div>

      {filtered.length === 0
        ? <Empty message={projects.length===0 ? 'Sin proyectos. ¡Crea el primero!' : 'Sin resultados'} />
        : filtered.map(p => {
          const client   = clients.find(c => c.id === p.client_id)
          const ocClient = !client ? parseOcProject(p.description) : null
          return (
            <ProjectCard
              key={p.id} project={p} client={client} ocClient={ocClient}
              expanded={expanded === p.id}
              onToggle={() => setExpanded(expanded === p.id ? null : p.id)}
              onEdit={() => { setEditProj(p); }}
              onDelete={async () => { if(window.confirm('¿Eliminar proyecto?')) await deleteProject(p.id) }}
              onStatusChange={status => updateProject(p.id, { status })}
            />
          )
        })
      }

      {(modal || editProj) && (
        <ProjectModal
          initial={editProj || {}}
          clients={clients}
          onSave={handleSave}
          onClose={() => { setModal(false); setEditProj(null) }}
        />
      )}
    </div>
  )
}

// ── Project card with embedded timer ──────────────────────
function ProjectCard({ project: p, client, ocClient, expanded, onToggle, onEdit, onDelete, onStatusChange }) {
  const { sessions, totalMinutes, startSession, stopSession } = useTimerSessions(expanded ? p.id : null)
  const [running,    setRunning]   = useState(false)
  const [sessionId,  setSessionId] = useState(null)
  const [elapsed,    setElapsed]   = useState(0)
  const [sessionNote, setSNote]    = useState('')
  const intervalRef = useRef(null)
  const color       = client?.color || getColor(0)
  const clientName  = client?.name || ocClient?.name || '—'
  const cleanDesc   = getRealDescription(p.description)

  useEffect(() => {
    return () => clearInterval(intervalRef.current)
  }, [])

  async function handleStart() {
    const sess = await startSession(p.id)
    setSessionId(sess.id)
    setRunning(true)
    setElapsed(0)
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }

  async function handleStop() {
    clearInterval(intervalRef.current)
    const mins = elapsed / 60
    await stopSession(sessionId, mins)
    setRunning(false)
    setElapsed(0)
    setSessionId(null)
    setSNote('')
  }

  const estimatedMins = (p.estimated_hours || 0) * 60
  const progressPct   = estimatedMins > 0 ? Math.min(100, (totalMinutes / estimatedMins) * 100) : 0
  const estimatedEarnings = p.type === 'hourly'
    ? (totalMinutes / 60) * (p.hourly_rate || 0)
    : (p.fixed_price || 0)

  return (
    <div className={`${s.card} ${expanded ? s.cardExpanded : ''}`}>
      {/* Card header */}
      <div className={s.cardHead} onClick={onToggle}>
        <div className={s.cardLeft}>
          <div className={s.colorBar} style={{ background: color }} />
          <Avatar name={clientName} color={color} size={34} />
          <div className={s.cardInfo}>
            <div className={s.cardTitle}>{p.title}</div>
            <div className={s.cardMeta}>
              {clientName} ·{' '}
              {p.type === 'hourly'
                ? `${p.hourly_rate || 0}€/h · ${formatMinutes(totalMinutes)} registradas`
                : `Precio fijo: ${formatCurrency(p.fixed_price)}`
              }
              {p.due_date && ` · Entrega: ${formatDate(p.due_date)}`}
            </div>
          </div>
        </div>
        <div className={s.cardRight}>
          {running && (
            <span className={s.timerDisplay}>{formatTime(elapsed)}</span>
          )}
          <StatusBadge status={p.status} />
          <select className={s.statusSel} value={p.status}
            onClick={e => e.stopPropagation()}
            onChange={e => { e.stopPropagation(); onStatusChange(e.target.value) }}>
            <option value="pending">Pendiente</option>
            <option value="active">En curso</option>
            <option value="done">Completado</option>
          </select>
          <button className={s.iconBtn} onClick={e => { e.stopPropagation(); onEdit() }}><Pencil size={14}/></button>
          <button className={`${s.iconBtn} ${s.danger}`} onClick={e => { e.stopPropagation(); onDelete() }}><Trash2 size={14}/></button>
          {expanded ? <ChevronUp size={16} color="var(--muted)"/> : <ChevronDown size={16} color="var(--muted)"/>}
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className={s.panel}>
          {/* Progress bar (hourly only) */}
          {p.type === 'hourly' && estimatedMins > 0 && (
            <div className={s.progress}>
              <div className={s.progressTop}>
                <span className={s.progressLabel}>
                  <Clock size={12}/> {formatMinutes(totalMinutes)} / {formatMinutes(estimatedMins)} est.
                </span>
                <span className={s.progressPct}>{progressPct.toFixed(0)}%</span>
              </div>
              <div className={s.progressBar}>
                <div className={s.progressFill}
                  style={{ width:`${progressPct}%`, background: progressPct>100?'var(--danger)':'var(--brand)' }}/>
              </div>
            </div>
          )}

          {/* Earnings */}
          <div className={s.earnings}>
            <span className={s.earningsLabel}>Importe generado (orientativo)</span>
            <span className={s.earningsVal}>{formatCurrency(estimatedEarnings)}</span>
          </div>

          {/* Timer controls (hourly only) */}
          {p.type === 'hourly' && (
            <div className={s.timerSection}>
              <div className={s.timerControls}>
                {!running ? (
                  <Btn icon={<Play size={14}/>} onClick={handleStart}>
                    Iniciar sesión de trabajo
                  </Btn>
                ) : (
                  <>
                    <div className={s.runningDisplay}>
                      <span className={s.runningDot}/>
                      <span className={s.runningTime}>{formatTime(elapsed)}</span>
                      <span className={s.runningLabel}>en curso</span>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flex:1 }}>
                      <input
                        placeholder="Nota de esta sesión (opcional)"
                        value={sessionNote}
                        onChange={e => setSNote(e.target.value)}
                        style={{ flex:1 }}
                      />
                      <Btn variant="danger" icon={<Square size={14}/>} onClick={handleStop}>
                        Parar
                      </Btn>
                    </div>
                  </>
                )}
              </div>

              {/* Sessions table */}
              {sessions.length > 0 && (
                <div className={s.sessionsTable}>
                  <div className={s.sessHead}>
                    <span>Fecha</span><span>Inicio</span><span>Fin</span><span>Duración</span>
                  </div>
                  {sessions.map(sess => (
                    <div key={sess.id} className={s.sessRow}>
                      <span>{formatDate(sess.started_at)}</span>
                      <span>{new Date(sess.started_at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</span>
                      <span>{sess.ended_at ? new Date(sess.ended_at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : '—'}</span>
                      <span className={s.sessDur}>{formatMinutes(sess.minutes || 0)}</span>
                    </div>
                  ))}
                  <div className={s.sessTotal}>
                    <span>Total registrado</span>
                    <span /><span />
                    <span className={s.sessDur}>{formatMinutes(totalMinutes)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {cleanDesc && (
            <div className={s.desc}>{cleanDesc}</div>
          )}
        </div>
      )}
    </div>
  )
}
