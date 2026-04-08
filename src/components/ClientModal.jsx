import { useState } from 'react'
import { Modal, Field, Row, Btn } from './UI'

export default function ClientModal({ initial = {}, onSave, onClose }) {
  const [f, setF] = useState({
    name: '', email: '', phone: '', nif: '',
    address: '', is_company: false, notes: '', ...initial
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <Modal title={initial.id ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(f) }}
        style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Field label="Nombre *">
          <input value={f.name} onChange={e => set('name', e.target.value)}
            placeholder="Nombre o razón social" required autoFocus />
        </Field>
        <Row>
          <Field label="Email">
            <input type="email" value={f.email} onChange={e => set('email', e.target.value)}
              placeholder="email@ejemplo.com" />
          </Field>
          <Field label="Teléfono">
            <input value={f.phone} onChange={e => set('phone', e.target.value)}
              placeholder="+34 600 000 000" />
          </Field>
        </Row>
        <Row>
          <Field label="NIF / CIF">
            <input value={f.nif} onChange={e => set('nif', e.target.value)}
              placeholder="B12345678" />
          </Field>
          <Field label="Dirección">
            <input value={f.address} onChange={e => set('address', e.target.value)}
              placeholder="Calle, Ciudad, CP" />
          </Field>
        </Row>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="checkbox" id="is_company" checked={!!f.is_company}
            onChange={e => set('is_company', e.target.checked)}
            style={{ width:'auto', accentColor:'var(--brand)' }} />
          <label htmlFor="is_company" style={{ fontSize:14, cursor:'pointer', color:'var(--text2)' }}>
            Es empresa o autónomo (aplica IRPF en facturas Serie D)
          </label>
        </div>

        <Field label="Notas internas">
          <textarea value={f.notes} onChange={e => set('notes', e.target.value)}
            placeholder="Observaciones, condiciones..." />
        </Field>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit">{initial.id ? 'Guardar' : 'Crear cliente'}</Btn>
        </div>
      </form>
    </Modal>
  )
}
