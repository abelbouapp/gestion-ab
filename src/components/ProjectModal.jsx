import { useState } from 'react'
import { Modal, Field, Row, Btn } from './UI'

export default function ProjectModal({ initial = {}, clients = [], onSave, onClose }) {
  const [clientMode, setClientMode] = useState(initial.client_id ? 'saved' : 'saved')
  const [oc, setOc] = useState({ name: '', email: '', phone: '' })
  const [f, setF] = useState({
    client_id: '', title: '', description: '',
    type: 'hourly', estimated_hours: '', hourly_rate: '',
    fixed_price: '', start_date: '', estimated_days: '', status: 'pending',
    ...initial
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const setOcField = (k, v) => setOc(p => ({ ...p, [k]: v }))

  const tabStyle = (active) => ({
    padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: active ? 'var(--brand)' : 'transparent',
    color: active ? 'var(--text)' : 'var(--text2)',
  })

  function handleSave(e) {
    e.preventDefault()
    if (clientMode === 'saved' && !f.client_id && !initial.client_id) return alert('Selecciona un cliente')
    if (clientMode === 'occasional' && !oc.name.trim()) return alert('Introduce el nombre del cliente ocasional')

    let payload = {
      ...f,
      estimated_hours: f.estimated_hours !== '' ? parseFloat(f.estimated_hours) : null,
      hourly_rate:     f.hourly_rate     !== '' ? parseFloat(f.hourly_rate)     : null,
      fixed_price:     f.fixed_price     !== '' ? parseFloat(f.fixed_price)     : null,
      estimated_days:  f.estimated_days  !== '' ? parseInt(f.estimated_days)    : null,
      start_date:      f.start_date      || null,
    }

    if (clientMode === 'occasional') {
      payload.client_id = null
      // guardamos los datos en description como prefijo _oc_
      const ocHeader = `_oc_client_:${JSON.stringify(oc)}`
      payload.description = payload.description
        ? `${ocHeader}\n${payload.description}`
        : ocHeader
    }

    onSave(payload)
  }

  return (
    <Modal title={initial.id ? 'Editar proyecto' : 'Nuevo proyecto / servicio'} onClose={onClose}>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Cliente */}
        {!initial.client_id && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Cliente
            </div>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', padding: 4, borderRadius: 8, marginBottom: 10, width: 'fit-content' }}>
              <button type="button" style={tabStyle(clientMode === 'saved')} onClick={() => setClientMode('saved')}>
                Mis clientes
              </button>
              <button type="button" style={tabStyle(clientMode === 'occasional')} onClick={() => setClientMode('occasional')}>
                Cliente ocasional
              </button>
            </div>

            {clientMode === 'saved' ? (
              <select value={f.client_id} onChange={e => set('client_id', e.target.value)} required>
                <option value="">Seleccionar cliente…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Field label="Nombre / Empresa *">
                  <input value={oc.name} onChange={e => setOcField('name', e.target.value)} placeholder="Nombre del cliente" />
                </Field>
                <Row>
                  <Field label="Email">
                    <input type="email" value={oc.email} onChange={e => setOcField('email', e.target.value)} placeholder="cliente@email.com" />
                  </Field>
                  <Field label="Teléfono">
                    <input value={oc.phone} onChange={e => setOcField('phone', e.target.value)} placeholder="+34 600 000 000" />
                  </Field>
                </Row>
              </div>
            )}
          </div>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Field label="Estado" hint="del proyecto">
            <select value={f.status} onChange={e => set('status', e.target.value)}>
              <option value="pending">Pendiente</option>
              <option value="active">En curso</option>
              <option value="done">Completado</option>
            </select>
          </Field>
          <Field label="Fecha de inicio" hint="opcional">
            <input type="date" value={f.start_date || ''} onChange={e => set('start_date', e.target.value)} />
          </Field>
          <Field label="Días estimados" hint="orientativo">
            <input type="number" min="0" step="1" value={f.estimated_days || ''}
              onChange={e => set('estimated_days', e.target.value)} placeholder="Ej: 14" />
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit">{initial.id ? 'Guardar' : 'Crear proyecto'}</Btn>
        </div>
      </form>
    </Modal>
  )
}
