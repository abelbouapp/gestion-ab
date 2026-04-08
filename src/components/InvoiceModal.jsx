import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Modal, Field, Row, Btn } from './UI'
import { calcInvoice, formatCurrency } from '../utils/helpers'

export default function InvoiceModal({ initial = {}, clients, onSave, onClose, convertingFrom }) {
  const [f, setF] = useState({
    client_id: initial.clientId || '',
    series: 'D',
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    iva_rate: 21,
    irpf_rate: 7,
    applies_irpf: false,
    notes: '',
    status: 'draft',
  })
  const [lines, setLines] = useState([
    { desc:'', qty:1, unit:'ud', price:0 }
  ])

  const set = (k,v) => setF(p => ({...p,[k]:v}))

  // Auto-detect IRPF based on client type & series
  useEffect(() => {
    if (f.series !== 'D') { set('applies_irpf', false); return }
    const client = clients.find(c => c.id === f.client_id)
    if (client?.is_company) set('applies_irpf', true)
    else set('applies_irpf', false)
  }, [f.client_id, f.series])

  function setLine(i,k,v) {
    setLines(ls => ls.map((l,idx) => idx===i ? {...l,[k]:v} : l))
  }

  const { subtotal, ivaAmount, irpfAmount, total } = calcInvoice({
    lines, ivaRate: f.iva_rate, irpfRate: f.irpf_rate, appliesIrpf: f.applies_irpf
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!f.client_id) return alert('Selecciona un cliente')
    if (lines.every(l => !l.desc)) return alert('Añade al menos una línea')
    onSave({
      ...f,
      lines,
      subtotal, iva_amount: ivaAmount,
      irpf_amount: irpfAmount, total,
    })
  }

  return (
    <Modal title="Nueva factura" onClose={onClose} wide>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>

        {convertingFrom && (
          <div style={{ background:'rgba(79,127,255,0.08)', border:'1px solid rgba(79,127,255,0.25)', borderRadius:'var(--radius)', padding:'10px 14px', fontSize:13, color:'var(--series-d)', display:'flex', alignItems:'center', gap:8 }}>
            📄 Convirtiendo presupuesto <strong>{convertingFrom}</strong> en factura. Revisa los datos y elige la serie.
          </div>
        )}

        <Row>
          <Field label="Cliente *">
            <select value={f.client_id} onChange={e => set('client_id', e.target.value)} required>
              <option value="">Seleccionar…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Serie de factura">
            <select value={f.series} onChange={e => set('series', e.target.value)}>
              <option value="D">Serie D — Servicios Digitales</option>
              <option value="P">Serie P — Productos</option>
            </select>
          </Field>
        </Row>

        <Row>
          <Field label="Fecha de emisión">
            <input type="date" value={f.date} onChange={e => set('date', e.target.value)} required />
          </Field>
          <Field label="Fecha de vencimiento">
            <input type="date" value={f.due_date} onChange={e => set('due_date', e.target.value)} />
          </Field>
          <Field label="Estado">
            <select value={f.status} onChange={e => set('status', e.target.value)}>
              <option value="draft">Borrador</option>
              <option value="sent">Enviada</option>
              <option value="paid">Pagada</option>
            </select>
          </Field>
        </Row>

        {/* Tax info */}
        <div style={{ background:'var(--bg3)', borderRadius:'var(--radius)', padding:'12px 14px', display:'flex', gap:20, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:11, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>IVA (%)</label>
            <input type="number" min="0" max="100" value={f.iva_rate}
              onChange={e => set('iva_rate', e.target.value)}
              style={{ width:70, textAlign:'center' }} />
          </div>
          {f.series === 'D' && (
            <>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>IRPF (%)</label>
                <input type="number" min="0" max="100" value={f.irpf_rate}
                  onChange={e => set('irpf_rate', e.target.value)}
                  style={{ width:70, textAlign:'center' }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type="checkbox" id="irpf_chk" checked={!!f.applies_irpf}
                  onChange={e => set('applies_irpf', e.target.checked)}
                  style={{ width:'auto', accentColor:'var(--brand)' }} />
                <label htmlFor="irpf_chk" style={{ fontSize:13, cursor:'pointer' }}>
                  Aplicar retención IRPF {f.irpf_rate}%
                  <span style={{ color:'var(--muted)', fontSize:11, marginLeft:5 }}>
                    {f.applies_irpf ? '(cliente empresa/autónomo)' : '(cliente particular — no aplica)'}
                  </span>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Lines */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
              Líneas de factura
            </label>
            <Btn small variant="secondary" icon={<Plus size={12}/>}
              onClick={() => setLines(ls => [...ls, { desc:'', qty:1, unit:'ud', price:0 }])}>
              Añadir línea
            </Btn>
          </div>
          <div style={{ background:'var(--bg3)', borderRadius:'var(--radius)', overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 72px 60px 90px 32px', gap:6, padding:'8px 10px', fontSize:11, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
              <span>Descripción</span><span>Cant.</span><span>Ud.</span><span>Precio</span><span/>
            </div>
            {lines.map((l,i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 72px 60px 90px 32px', gap:6, padding:'4px 10px', alignItems:'center' }}>
                <input value={l.desc} onChange={e => setLine(i,'desc',e.target.value)} placeholder="Descripción del servicio…" />
                <input type="number" min="0" step="0.01" value={l.qty} onChange={e => setLine(i,'qty',e.target.value)} style={{ textAlign:'right' }}/>
                <select value={l.unit} onChange={e => setLine(i,'unit',e.target.value)}>
                  <option value="ud">ud</option>
                  <option value="h">h</option>
                  <option value="mes">mes</option>
                  <option value="año">año</option>
                </select>
                <input type="number" min="0" step="0.01" value={l.price} onChange={e => setLine(i,'price',e.target.value)} placeholder="0,00" style={{ textAlign:'right' }}/>
                <button type="button" onClick={() => setLines(ls => ls.filter((_,idx)=>idx!==i))}
                  style={{ color:'var(--danger)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Trash2 size={14}/>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div style={{ background:'var(--bg3)', borderRadius:'var(--radius)', padding:'14px 16px' }}>
          {[
            ['Base imponible', formatCurrency(subtotal)],
            [`IVA (${f.iva_rate}%)`, formatCurrency(ivaAmount)],
            ...(f.applies_irpf ? [[`IRPF (-${f.irpf_rate}%)`, `-${formatCurrency(irpfAmount)}`]] : []),
          ].map(([label, val]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text2)', marginBottom:6, ...(label.includes('IRPF')?{color:'var(--danger)'}:{}) }}>
              <span>{label}</span><span>{val}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:16, color:'var(--text)', borderTop:'1px solid var(--border)', paddingTop:8, marginTop:4 }}>
            <span>TOTAL</span><span>{formatCurrency(total)}</span>
          </div>
        </div>

        <Field label="Notas">
          <textarea value={f.notes} onChange={e => set('notes', e.target.value)}
            placeholder="Condiciones de pago, observaciones…" />
        </Field>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn type="submit">Generar factura</Btn>
        </div>
      </form>
    </Modal>
  )
}
