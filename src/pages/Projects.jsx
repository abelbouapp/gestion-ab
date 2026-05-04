import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Play, Square, ChevronDown, ChevronUp, Pencil, Trash2, Clock, PenLine } from 'lucide-react'
import { useClients, useProjects, useTimerSessions } from '../hooks/useData'
import { Btn, Empty, Spinner, StatusBadge, Avatar, Modal, Field, Row } from '../components/UI'
import { formatCurrency, formatDate, formatMinutes, formatTime, getColor } from '../utils/helpers'
import ProjectModal from '../components/ProjectModal'
import s from './Projects.module.css'

export default function Projects() {
  const [params]  = useSearchParams()
  const { clients } = useClients()
  const { projects, loading, addProject, updateProject, deleteProject } = useProjects()
  const [modal,    setModal]    = useState(false)
  const [editProj, setEditProj] = useState(null)
  const [expanded, setExpanded] = useState(params.get('project') || null)
  const [filterClient, setFC]   = useState(params.get('client') || 'all')

  const filtered = projects.filter(p =>
    filterClient === 'all' || p.client_id === filterClient
  )

  async function handleSave(data) {
    if (editProj) { await updateProject(editProj.id, data); setEditProj(null) }
    else          { await addProject(data); setModal(false) }
  }

  if (loading) return <div className={s.page}><Spinner /></div>

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Proyectos</h1>
          <p className={s.sub}>{projects.length} proyectos</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className={s.clientFilter} value={filterClient}
            onChange={e => setFC(e.target.value)}>
            <option value="all">Todos los clientes</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Btn onClick={() => setModal(true)} disabled={clients.length === 0} icon={<Plus size={15} />}>
            Nuevo proyecto
          </Btn>
        </div>
      </div>

      {filtered.length === 0
        ? <Empty message={projects.length === 0 ? 'Sin proyectos. ¡Crea el primero!' : 'Sin resultados'} />
        : filtered.map(p => {
          const client = clients.find(c => c.id === p.client_id)
          return (
            <ProjectCard
              key={p.id} project={p} client={client}
              expanded={expanded === p.id}
              onToggle={() => setExpanded(expanded === p.id ? null : p.id)}
              onEdit={() => setEditProj(p)}
              onDelete={async () => { if (window.confirm('¿Eliminar proyecto?')) await deleteProject(p.id) }}
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

// ── Project card with fixed timer ─────────────────────────────
function ProjectCard({ project: p, client, expanded, onToggle, onEdit, onDelete, onStatusChange }) {
  const { sessions, totalMinutes, startSession, stopSession, addManualSession } = useTimerSessions(expanded ? p.id : null)

  // Timer state
  const [running,   setRunning]   = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [elapsed,   setElapsed]   = useState(0)
  const [note,      setNote]      = useState('')

  // Manual entry modal
  const [showManual, setShowManual] = useState(false)
  const [manualForm, setManualForm] = useState({ date: new Date().toISOString().split('T')[0], start: '', end: '', note: '' })

  // ✅ Single stable interval ref
  const intervalRef = useRef(null)
  const startTimeRef = useRef(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // ✅ Fixed timer - uses Date.now() diff, not increments, to avoid drift
  function startInterval(startedAt) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 500)
  }

  async function handleStart() {
    const sess = await startSession(p.id)
    if (!sess) return
    setSessionId(sess.id)
    setRunning(true)
    setElapsed(0)
    startTimeRef.current = Date.now()
    startInterval(Date.now())
  }

  async function handleStop() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    const mins = elapsed / 60
    await stopSession(sessionId, mins, note)
    setRunning(false)
    setElapsed(0)
    setSessionId(null)
    setNote('')
  }

  // Manual session entry
  async function handleManualSave(e) {
    e.preventDefault()
    const { date, start, end, note: n } = manualForm
    if (!start || !end) return
    const startDt = new Date(`${date}T${start}:00`)
    const endDt   = new Date(`${date}T${end}:00`)
    if (endDt <= startDt) { alert('La hora de fin debe ser posterior al inicio'); return }
    const mins = (endDt - startDt) / 60000
    await addManualSession(p.id, {
      started_at: startDt.toISOString(),
      ended_at:   endDt.toISOString(),
      minutes:    mins,
      notes:      n,
    })
    setShowManual(false)
    setManualForm({ date: new Date().toISOString().split('T')[0], start: '', end: '', note: '' })
  }

  const color = client?.color || getColor(0)
  const estimatedMins = (p.estimated_hours || 0) * 60
  const progressPct   = estimatedMins > 0 ? Math.min(100, (totalMinutes / estimatedMins) * 100) : 0
  const estimatedEarnings = p.type === 'hourly'
    ? (totalMinutes / 60) * (p.hourly_rate || 0)
    : (p.fixed_price || 0)

  return (
    <>
      <div className={`${s.card} ${expanded ? s.cardExpanded : ''}`}>
        {/* Card header */}
        <div className={s.cardHead} onClick={onToggle}>
          <div className={s.cardLeft}>
            <div className={s.colorBar} style={{ background: color }} />
            <Avatar name={client?.name} color={color} size={34} />
            <div className={s.cardInfo}>
              <div className={s.cardTitle}>{p.title}</div>
              <div className={s.cardMeta}>
                {client?.name} ·{' '}
                {p.type === 'hourly'
                  ? `${p.hourly_rate || 0}€/h · ${formatMinutes(totalMinutes)} registradas`
                  : `Precio fijo: ${formatCurrency(p.fixed_price)}`
                }
                {p.due_date && ` · Entrega: ${formatDate(p.due_date)}`}
              </div>
            </div>
          </div>
          <div className={s.cardRight}>
            {running && <span className={s.timerDisplay}>{formatTime(elapsed)}</span>}
            <StatusBadge status={p.status} />
            <select className={s.statusSel} value={p.status}
              onClick={e => e.stopPropagation()}
              onChange={e => { e.stopPropagation(); onStatusChange(e.target.value) }}>
              <option value="pending">Pendiente</option>
              <option value="active">En curso</option>
              <option value="done">Completado</option>
            </select>
            <button className={s.iconBtn} onClick={e => { e.stopPropagation(); onEdit() }}><Pencil size={14} /></button>
            <button className={`${s.iconBtn} ${s.danger}`} onClick={e => { e.stopPropagation(); onDelete() }}><Trash2 size={14} /></button>
            {expanded ? <ChevronUp size={16} color="var(--muted)" /> : <ChevronDown size={16} color="var(--muted)" />}
          </div>
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div className={s.panel}>
            {/* Progress */}
            {p.type === 'hourly' && estimatedMins > 0 && (
              <div className={s.progress}>
                <div className={s.progressTop}>
                  <span className={s.progressLabel}>
                    <Clock size={12} /> {formatMinutes(totalMinutes)} / {formatMinutes(estimatedMins)} est.
                  </span>
                  <span className={s.progressPct}>{progressPct.toFixed(0)}%</span>
                </div>
                <div className={s.progressBar}>
                  <div className={s.progressFill}
                    style={{ width: `${progressPct}%`, background: progressPct > 100 ? 'var(--danger)' : 'var(--brand)' }} />
                </div>
              </div>
            )}

            {/* Earnings */}
            <div className={s.earnings}>
              <span className={s.earningsLabel}>Importe generado (orientativo)</span>
              <span className={s.earningsVal}>{formatCurrency(estimatedEarnings)}</span>
            </div>

            {/* Timer controls */}
            {p.type === 'hourly' && (
              <div className={s.timerSection}>
                <div className={s.timerControls}>
                  {!running ? (
                    <>
                      <Btn icon={<Play size={14} />} onClick={handleStart}>
                        Iniciar sesión
                      </Btn>
                      <Btn variant="secondary" icon={<PenLine size={14} />} onClick={() => setShowManual(true)}>
                        Entrada manual
                      </Btn>
                    </>
                  ) : (
                    <>
                      <div className={s.runningDisplay}>
                        <span className={s.runningDot} />
                        <span className={s.runningTime}>{formatTime(elapsed)}</span>
                        <span className={s.runningLabel}>en curso</span>
                      </div>
                      <input
                        placeholder="Nota de esta sesión (opcional)"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        style={{ flex: 1 }}
                        onClick={e => e.stopPropagation()}
                      />
                      <Btn variant="danger" icon={<Square size={14} />} onClick={handleStop}>
                        Parar
                      </Btn>
                    </>
                  )}
                </div>

                {/* Sessions table */}
                {sessions.length > 0 && (
                  <div className={s.sessionsTable}>
                    <div className={s.sessHead}>
                      <span>Fecha</span><span>Inicio</span><span>Fin</span><span>Duración</span><span>Nota</span>
                    </div>
                    {sessions.map(sess => (
                      <div key={sess.id} className={s.sessRow}>
                        <span>{formatDate(sess.started_at)}</span>
                        <span>{new Date(sess.started_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>{sess.ended_at ? new Date(sess.ended_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                        <span className={s.sessDur}>{formatMinutes(sess.minutes || 0)}</span>
                        <span className={s.sessNote}>{sess.notes || ''}</span>
                      </div>
                    ))}
                    <div className={s.sessTotal}>
                      <span>Total</span><span /><span />
                      <span className={s.sessDur}>{formatMinutes(totalMinutes)}</span>
                      <span />
                    </div>
                  </div>
                )}
              </div>
            )}

            {p.description && <div className={s.desc}>{p.description}</div>}
          </div>
        )}
      </div>

      {/* Manual entry modal */}
      {showManual && (
        <Modal title="Añadir sesión manual" onClose={() => setShowManual(false)} narrow>
          <form onSubmit={handleManualSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'rgba(109,207,148,0.1)', border: '1px solid rgba(109,207,148,0.3)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, color: '#1a5c34' }}>
              💡 Usa esto si olvidaste arrancar el timer o necesitas corregir horas.
            </div>
            <Field label="Fecha">
              <input type="date" value={manualForm.date}
                onChange={e => setManualForm(p => ({ ...p, date: e.target.value }))} required />
            </Field>
            <Row>
              <Field label="Hora inicio">
                <input type="time" value={manualForm.start}
                  onChange={e => setManualForm(p => ({ ...p, start: e.target.value }))} required />
              </Field>
              <Field label="Hora fin">
                <input type="time" value={manualForm.end}
                  onChange={e => setManualForm(p => ({ ...p, end: e.target.value }))} required />
              </Field>
            </Row>
            {manualForm.start && manualForm.end && manualForm.end > manualForm.start && (
              <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 20, color: 'var(--brand-dark)' }}>
                {formatMinutes((new Date(`2000-01-01T${manualForm.end}`) - new Date(`2000-01-01T${manualForm.start}`)) / 60000)}
              </div>
            )}
            <Field label="Nota (opcional)">
              <input placeholder="¿En qué trabajaste?" value={manualForm.note}
                onChange={e => setManualForm(p => ({ ...p, note: e.target.value }))} />
            </Field>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => setShowManual(false)}>Cancelar</Btn>
              <Btn type="submit">Guardar sesión</Btn>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
