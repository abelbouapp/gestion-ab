import { useState } from 'react'
import { Modal, Field, Row, Btn } from './UI'
import { calcInvoice, formatCurrency } from '../utils/helpers'
import LinesEditor from './LinesEditor'

export default function QuoteModal({ initial = {}, clients, onSave, onClose }) {
  const [clientMode, setClientMode] = useState('saved')
  const [oc, setOc] = useState({ name: '', nif: '', address: '', email: '', phone: '' })
  const [f, setF] = useState({
    client_id:    initial.clientId || '',
    date:         new Date().toISOString().split('T')[0],
    valid_until:  '',
    iva_rate:     21,
    irpf_rate:    7,
    applies_irpf: false,
    notes:        '',
    status:       'draft',
    ...initial,
  })
  const [lines, setLines] = useState(
    initial.lines || [{ desc: '', qty: 1, unit: 'ud', price: 0 }]
  )
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const setOcField = (k, v) => setOc(p => ({ ...p, [k]: v }))
  const setLine = (i, k, v) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l))

  const { subtotal, ivaAmount, irpfAmount, total } = calcInvoice({
    lines, ivaRate: f.iva_rate, irpfRate: f.irpf_rate, appliesIrpf: f.applies_irpf
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (clientMode === 'saved' && !f.client_id) return alert('Selecciona un cliente')
    if (clientMode === 'occasional' && !oc.name.trim()) return alert('Introduce el nombre del cliente')

    let finalClientId = f.client_id
    let finalNotes = f.notes
    if (clientMode === 'occasional') {
      finalClientId = null
      const ocHeader = `_oc_:${JSON.stringify(oc)}`
      finalNotes = f.notes ? `${ocHeader}\n${f.notes}` : ocHeader
    }

    onSave({
      ...f,
      client_id:    finalClientId,
      valid_until:  f.valid_until || null,
      notes:        finalNotes,
      lines,
      subtotal,
      iva_amount:   ivaAmount,
      irpf_amount:  irpfAmount,
      total,
    })
  }

  const tabStyle = (active) => ({
    padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: active ? 'var(--brand)' : 'transparent',
    color: active ? 'var(--text)' : 'var(--text2)',
  })

  return (
    <Modal title={initial.id ? 'Editar presupuesto' : 'Nuevo presupuesto'} onClose={onClose} wide>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ background: 'rgba(109,207,148,0.1)', border: '1px solid rgba(109,207,148,0.3)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, color: '#1a5c34' }}>
          💡 Un presupuesto <strong>no tiene número fiscal</strong>. Cuando el cliente lo acepte, conviértelo en factura con un clic.
        </div>

        {/* Cliente */}
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
            <select value={f.client_id} onChange={e => set('client_id', e.target.value)}>
              <option value="">Seleccionar…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Row>
                <Field label="Nombre / Empresa *">
                  <input value={oc.name} onChange={e => setOcField('name', e.target.value)} placeholder="Nombre del cliente u empresa" />
                </Field>
                <Field label="NIF / CIF">
                  <input value={oc.nif} onChange={e => setOcField('nif', e.target.value)} placeholder="12345678A" />
                </Field>
              </Row>
              <Row>
                <Field label="Email">
                  <input type="email" value={oc.email} onChange={e => setOcField('email', e.target.value)} placeholder="cliente@email.com" />
                </Field>
                <Field label="Teléfono">
                  <input value={oc.phone} onChange={e => setOcField('phone', e.target.value)} placeholder="+34 600 000 000" />
                </Field>
              </Row>
              <Field label="Dirección">
                <input value={oc.address} onChange={e => setOcField('address', e.target.value)} placeholder="Calle, nº, ciudad…" />
              </Field>
            </div>
          )}
        </div>

        <Row>
          <Field label="Estado">
            <select value={f.status} onChange={e => set('status', e.target.value)}>
              <option value="draft">Borrador</option>
              <option value="sent">Enviado al cliente</option>
              <option value="accepted">Aceptado ✓</option>
              <option value="rejected">Rechazado ✗</option>
            </select>
          </Field>
          <Field label="Fecha">
            <input type="date" value={f.date} onChange={e => set('date', e.target.value)} required />
          </Field>
          <Field label="Válido hasta" hint="opcional">
            <input type="date" value={f.valid_until} onChange={e => set('valid_until', e.target.value)} />
          </Field>
        </Row>

        <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '12px 14px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>IVA (%)</label>
            <input type="number" min="0" max="100" value={f.iva_rate}
              onChange={e => set('iva_rate', e.target.value)} style={{ width: 70, textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>IRPF (%)</label>
            <input type="number" min="0" max="100" value={f.irpf_rate}
              onChange={e => set('irpf_rate', e.target.value)} style={{ width: 70, textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="quote_irpf_chk" checked={!!f.applies_irpf}
              onChange={e => set('applies_irpf', e.target.checked)}
              style={{ width: 'auto', accentColor: 'var(--brand)' }} />
            <label htmlFor="quote_irpf_chk" style={{ fontSize: 13, cursor: 'pointer' }}>
              Aplicar retención IRPF {f.irpf_rate}%
              <span style={{ color: 'var(--muted)', fontSize: 11, marginLeft: 5 }}>
                {f.applies_irpf ? '(empresa/autónomo)' : '(marcar si el cliente es empresa o autónomo)'}
              </span>
            </label>
          </div>
        </div>

        {/* Líneas */}
        <LinesEditor lines={lines} setLines={setLines} setLine={setLine} />

        {/* Totales */}
        <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
          {[
            ['Base imponible', formatCurrency(subtotal)],
            [`IVA (${f.iva_rate}%)`, formatCurrency(ivaAmount)],
            ...(f.applies_irpf ? [[`IRPF (-${f.irpf_rate}%)`, `-${formatCurrency(irpfAmount)}`]] : []),
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: label.includes('IRPF') ? 'var(--danger)' : 'var(--text2)', marginBottom: 5 }}>
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
