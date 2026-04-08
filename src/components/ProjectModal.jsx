import { useState } from 'react'
import { Modal, Field, Row, Btn } from './UI'

export default function ProjectModal({ initial = {}, clients = [], onSave, onClose }) {
  const [f, setF] = useState({
    client_id: '', title: '', description: '',
    type: 'hourly', estimated_hours: '', hourly_rate: '',
    fixed_price: '', due_date: '', status: 'pending', ...initial
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <Modal title={initial.id ? 'Editar proyecto' : 'Nuevo proyecto / servicio'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(f) }}
        style={{ display:'flex', flexDirection:'column', gap:14 }}>

        {!initial.client_id && (
          <Field label="Cliente *">
            <select value={f.client_id} onChange={e => set('client_id', e.target.value)} required>
              <option value="">Seleccionar cliente…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}

        <Field label="Título del proyecto / servicio *">
          <input value={f.title} onChange={e => set('title', e.target.value)}
            placeholder="Ej: Diseño web, Mantenimiento mensual…" required autoFocus />
        </Field>

        <Field label="Descripción">
          <textarea value={f.description} onChange={e => set('description', e.target.value)}
            placeholder="Detalla el alcance, entregables…" />
        </Field>

        <Field label="Tipo de facturación">
          <select value={f.type} onChange={e => set('type', e.target.value)}>
            <option value="hourly">Por hora (con timer de sesiones)</option>
            <option value="fixed">Precio cerrado / fijo</option>
          </select>
        </Field>

        {f.type === 'hourly' && (
          <Row>
            <Field label="Horas estimadas" hint="orientativo">
              <input type="number" min="0" step="0.5" value={f.estimated_hours}
                onChange={e => set('estimated_hours', e.target.value)} placeholder="10" />
            </Field>
            <Field label="Precio por hora (€)">
              <input type="number" min="0" step="0.5" value={f.hourly_rate}
                onChange={e => set('hourly_rate', e.target.value)} placeholder="50" />
            </Field>
          </Row>
        )}

        {f.type === 'fixed' && (
          <Field label="Precio cerrado (€)">
            <input type="number" min="0" step="0.01" value={f.fixed_price}
              onChange={e => set('fixed_price', e.target.value)} placeholder="500" />
          </Field>
        )}

        <Row>
          <Field label="Estado">
            <select value={f.status} onChange={e => set('status', e.target.value)}>
              <option value="pending">Pendiente</option>
              <option value="active">En curso</option>
              <option value="done">Completado</option>
            </select>
          </Field>
          <Field label="Fecha de entrega">
            <input type="date" value={f.due_date} onChange={e => set('due_date', e.target.value)} />
          </Field>
        </Row>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit">{initial.id ? 'Guardar' : 'Crear proyecto'}</Btn>
        </div>
      </form>
    </Modal>
  )
}
