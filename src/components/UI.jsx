import { X } from 'lucide-react'
import s from './UI.module.css'

export function Modal({ title, onClose, children, wide, narrow }) {
  return (
    <div className={s.overlay} onClick={onClose}>
      <div
        className={`${s.modal} ${wide ? s.wide : ''} ${narrow ? s.narrow : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={s.mHead}>
          <h2 className={s.mTitle}>{title}</h2>
          <button className={s.mClose} onClick={onClose}><X size={16} /></button>
        </div>
        <div className={s.mBody}>{children}</div>
      </div>
    </div>
  )
}

export function Btn({ children, variant = 'primary', onClick, type = 'button', disabled, small, icon, full }) {
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      className={`${s.btn} ${s['v_' + variant]} ${small ? s.sm : ''} ${full ? s.full : ''}`}
    >
      {icon && <span className={s.btnIcon}>{icon}</span>}
      {children}
    </button>
  )
}

export function Field({ label, hint, children }) {
  return (
    <div className={s.field}>
      {label && <label className={s.label}>{label}{hint && <span className={s.hint}> — {hint}</span>}</label>}
      {children}
    </div>
  )
}

export function Row({ children, gap = 12 }) {
  return <div className={s.row} style={{ gap }}>{children}</div>
}

export function Badge({ children, color, bg }) {
  return (
    <span className={s.badge} style={color ? { color, background: bg || color + '18' } : {}}>
      {children}
    </span>
  )
}

export function Avatar({ name, color, size = 38 }) {
  const txt = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'
  return (
    <div className={s.avatar} style={{
      width: size, height: size,
      fontSize: size * 0.36,
      background: color || 'var(--brand)',
    }}>
      {txt}
    </div>
  )
}

export function Empty({ message, icon }) {
  return (
    <div className={s.empty}>
      {icon && <div className={s.emptyIcon}>{icon}</div>}
      <p>{message || 'Sin datos'}</p>
    </div>
  )
}

export function Spinner() {
  return <div className={s.spinner} />
}

export function StatusBadge({ status }) {
  const MAP = {
    pending:  { label: 'Pendiente',  color: '#f59e0b' },
    active:   { label: 'En curso',   color: '#3b82f6' },
    done:     { label: 'Completado', color: '#22c55e' },
    draft:    { label: 'Borrador',   color: '#94a3b8' },
    sent:     { label: 'Enviada',    color: '#3b82f6' },
    paid:     { label: 'Pagada',     color: '#22c55e' },
    cancelled:{ label: 'Cancelada',  color: '#e5484d' },
  }
  const m = MAP[status] || { label: status, color: '#94a3b8' }
  return <Badge color={m.color}>{m.label}</Badge>
}

export function SeriesBadge({ series }) {
  if (series === 'D') return <Badge color="var(--series-d)" bg="var(--series-d-bg)">Serie D — Digital</Badge>
  if (series === 'P') return <Badge color="var(--series-p)" bg="var(--series-p-bg)">Serie P — Producto</Badge>
  return null
}

export function SectionCard({ title, children, action }) {
  return (
    <div className={s.scard}>
      {(title || action) && (
        <div className={s.scardHead}>
          {title && <h3 className={s.scardTitle}>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
