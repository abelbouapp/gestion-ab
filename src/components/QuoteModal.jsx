import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Modal, Field, Row, Btn } from './UI'
import { calcInvoice, formatCurrency } from '../utils/helpers'

export default function QuoteModal({ initial = {}, clients, onSave, onClose }) {
  const [f, setF] = useState({
    client_id: initial.clientId || '',
    date:        new Date().toISOString().split('T')[0],
    valid_until: '',
    iva_rate:    21,
    notes:       '',
    status:      'draft',
    ...initial,
  })
  const [lines, setLines] = useState(
    initial.lines || [{ desc: '', qty: 1, unit: 'ud', price: 0 }]
  )
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const setLine = (i, k, v) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l))

  const { subtotal, ivaAmount, total } = calcInvoice({ lines, ivaRate: f.iva_rate, appliesIrpf: false })

  function handleSubmit(e) {
    e.preventDefault()
    if (!f.client_id) return alert('Selecciona un cliente')
    onSave({ ...f, lines, subtotal, iva_amount: ivaAmount, irpf_amount: 0, total })
  }

  return (
    <Modal title={initial.id ? 'Editar presupuesto' : 'Nuevo presupuesto'} onClose={onClose} wide>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ background: 'rgba(109,207,148,0.1)', border: '1px solid rgba(109,207,148,0.3)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, color: '#1a5c34' }}>
          💡 Un presupuesto <strong>no tiene número fiscal</strong>. Cuando el cliente lo acepte, podrás convertirlo en factura real con un clic.
        </div>

        <Row>
          <Field label="Cliente *">
            <select value={f.client_id} onChange={e => set('client_id', e.target.value)} required>
              <option value="">Seleccionar…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Estado">
            <select value={f.status} onChange={e => set('status', e.target.value)}>
              <option value="draft">Borrador</option>
              <option value="sent">Enviado al cliente</option>
              <option value="accepted">Aceptado ✓</option>
              <option value="rejected">Rechazado ✗</option>
            </select>
          </Field>
        </Row>

        <Row>
          <Field label="Fecha">
            <input type="date" value={f.date} onChange={e => set('date', e.target.value)} required />
          </Field>
          <Field label="Válido hasta" hint="opcional">
            <input type="date" value={f.valid_until} onChange={e => set('valid_until', e.target.value)} />
          </Field>
          <Field label="IVA (%)">
            <input type="number" min="0" max="100" value={f.iva_rate}
              onChange={e => set('iva_rate', e.target.value)} />
          </Field>
        </Row>

        {/* Lines */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Líneas del presupuesto
            </label>
            <Btn small variant="secondary" icon={<Plus size={12} />}
              onClick={() => setLines(ls => [...ls, { desc: '', qty: 1, unit: 'ud', price: 0 }])}>
              Añadir línea
            </Btn>
          </div>
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 60px 90px 32px', gap: 6, padding: '8px 10px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Descripción</span><span>Cant.</span><span>Ud.</span><span>Precio</span><span />
            </div>
            {lines.map((l, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 72px 60px 90px 32px', gap: 6, padding: '4px 10px', alignItems: 'center' }}>
                <input value={l.desc} onChange={e => setLine(i, 'desc', e.target.value)} placeholder="Descripción del servicio…" />
                <input type="number" min="0" step="0.01" value={l.qty} onChange={e => setLine(i, 'qty', e.target.value)} style={{ textAlign: 'right' }} />
                <select value={l.unit} onChange={e => setLine(i, 'unit', e.target.value)}>
                  <option value="ud">ud</option>
                  <option value="h">h</option>
                  <option value="mes">mes</option>
                  <option value="año">año</option>
                </select>
                <input type="number" min="0" step="0.01" value={l.price} onChange={e => setLine(i, 'price', e.target.value)} placeholder="0,00" style={{ textAlign: 'right' }} />
                <button type="button" onClick={() => setLines(ls => ls.filter((_, idx) => idx !== i))}
                  style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
          {[
            ['Base imponible', formatCurrency(subtotal)],
            [`IVA (${f.iva_rate}%)`, formatCurrency(ivaAmount)],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 5 }}>
              <span>{label}</span><span>{val}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
            <span>TOTAL PRESUPUESTADO</span><span>{formatCurrency(total)}</span>
          </div>
        </div>

        <Field label="Notas / Condiciones" hint="aparecen en el PDF">
          <textarea value={f.notes} onChange={e => set('notes', e.target.value)}
            placeholder="Condiciones, plazo de entrega, forma de pago…" />
        </Field>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit">{initial.id ? 'Guardar cambios' : 'Crear presupuesto'}</Btn>
        </div>
      </form>
    </Modal>
  )
}
