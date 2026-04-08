import { useState } from 'react'
import { Modal, Field, Row, Btn } from './UI'

export default function TaskModal({ initial = {}, clients = [], onSave, onClose }) {
  const [form, setForm] = useState({
    clientId: '', title: '', description: '',
    type: 'hourly', price: '', dueDate: '',
    hasTimer: true, ...initial
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // If type changes to fixed, disable timer by default
  function handleTypeChange(v) {
    set('type', v)
    if (v === 'fixed') set('hasTimer', false)
    if (v === 'hourly') set('hasTimer', true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.clientId) return
    onSave(form)
  }

  return (
    <Modal title={initial.id ? 'Editar tarea' : 'Nueva tarea'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!initial.clientId && (
          <Field label="Cliente *">
            <select value={form.clientId} onChange={e => set('clientId', e.target.value)} required>
              <option value="">Seleccionar cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}

        <Field label="Título *">
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Descripción breve de la tarea" required autoFocus />
        </Field>

        <Field label="Descripción">
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Detalles adicionales..." />
        </Field>

        <Row>
          <Field label="Tipo de tarea">
            <select value={form.type} onChange={e => handleTypeChange(e.target.value)}>
              <option value="hourly">Por hora (con timer)</option>
              <option value="fixed">Precio fijo</option>
              <option value="free">Sin precio</option>
            </select>
          </Field>
          {form.type === 'fixed' && (
            <Field label="Precio (€)">
              <input type="number" min="0" step="0.01" value={form.price}
                onChange={e => set('price', e.target.value)} placeholder="250" />
            </Field>
          )}
          <Field label="Fecha de entrega">
            <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
          </Field>
        </Row>

        {form.type === 'hourly' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="hasTimer" checked={form.hasTimer}
              onChange={e => set('hasTimer', e.target.checked)}
              style={{ width: 'auto', accentColor: 'var(--accent)' }} />
            <label htmlFor="hasTimer" style={{ fontSize: 14, cursor: 'pointer' }}>
              Activar control de tiempo con timer
            </label>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit">{initial.id ? 'Guardar cambios' : 'Crear tarea'}</Btn>
        </div>
      </form>
    </Modal>
  )
}
