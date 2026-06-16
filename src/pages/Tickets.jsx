import { useState, useRef } from 'react'
import { Upload, Trash2, ExternalLink, Receipt, FileImage, File } from 'lucide-react'
import { useTickets } from '../hooks/useTickets'
import { Btn, Empty, Spinner, SectionCard } from '../components/UI'
import { formatCurrency, formatDate } from '../utils/helpers'
import TicketViewModal from '../components/TicketViewModal'
import s from './Tickets.module.css'

const CATEGORIES = ['Suministros','Software/SaaS','Material oficina','Transporte','Formación','Publicidad','Otros']

// ✅ Helper: always convert to a safe number (MySQL returns decimals as strings)
const n = (v) => {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

export default function Tickets() {
  const { tickets, loading, uploading, uploadTicket, addTicketNoFile, deleteTicket, ivaDeductible, totalGastos } = useTickets()
  const [form, setForm] = useState({ description:'', amount:'', iva_rate:21, iva_amount:'', date: new Date().toISOString().split('T')[0], category:'Otros' })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [viewing, setViewing] = useState(null)
  const fileRef = useRef()
  const set = (k,v) => setForm(p => ({...p,[k]:v}))

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = ev => setPreview(ev.target.result)
      reader.readAsDataURL(f)
    } else {
      setPreview('pdf')
    }
  }

  function handleAmount(val) {
    set('amount', val)
    const iva = (parseFloat(val)||0) * (parseFloat(form.iva_rate)||21) / (100 + parseFloat(form.iva_rate||21))
    set('iva_amount', iva.toFixed(2))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const fields = {
      description: form.description,
      amount:      parseFloat(form.amount) || 0,
      iva_amount:  parseFloat(form.iva_amount) || 0,
      iva_rate:    parseFloat(form.iva_rate) || 21,
      date:        form.date,
      category:    form.category,
    }
    if (file) await uploadTicket(file, fields)
    else      await addTicketNoFile(fields)
    setForm({ description:'', amount:'', iva_rate:21, iva_amount:'', date: new Date().toISOString().split('T')[0], category:'Otros' })
    setFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  if (loading) return <div className={s.page}><Spinner /></div>

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Tickets y Gastos</h1>
          <p className={s.sub}>Registro de gastos para deducir IVA con tu gestora</p>
        </div>
      </div>

      {/* Summary */}
      <div className={s.summary}>
        <div className={s.sumCard}>
          <div className={s.sumLabel}>Total gastos</div>
          <div className={s.sumVal}>{formatCurrency(totalGastos)}</div>
        </div>
        <div className={`${s.sumCard} ${s.sumGreen}`}>
          <div className={s.sumLabel}>IVA deducible</div>
          <div className={s.sumVal}>{formatCurrency(ivaDeductible)}</div>
          <div className={s.sumSub}>Resta de tu IVA a pagar</div>
        </div>
        <div className={s.sumCard}>
          <div className={s.sumLabel}>Tickets registrados</div>
          <div className={s.sumVal}>{tickets.length}</div>
        </div>
      </div>

      <div className={s.cols}>
        {/* Upload form */}
        <SectionCard title="Añadir ticket / gasto">
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div
              className={`${s.dropZone} ${file ? s.dropZoneActive : ''}`}
              onClick={() => fileRef.current?.click()}
            >
              {preview === 'pdf' ? (
                <div className={s.previewPdf}><Receipt size={32}/><span>{file.name}</span></div>
              ) : preview ? (
                <img src={preview} alt="preview" className={s.previewImg} />
              ) : (
                <>
                  <Upload size={22} color="var(--muted)" />
                  <p className={s.dropText}>Foto o PDF del ticket</p>
                  <p className={s.dropSub}>JPG, PNG, PDF</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*,.pdf"
                style={{ display:'none' }} onChange={handleFile} />
            </div>
            {file && (
              <button type="button" className={s.removeFile}
                onClick={() => { setFile(null); setPreview(null); fileRef.current.value='' }}>
                Quitar archivo
              </button>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label className={s.lbl}>Descripción *</label>
                <input value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Ej: Factura Adobe Creative Cloud" required />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div>
                  <label className={s.lbl}>Importe total (€) *</label>
                  <input type="number" step="0.01" min="0" value={form.amount}
                    onChange={e => handleAmount(e.target.value)} placeholder="0.00" required />
                </div>
                <div>
                  <label className={s.lbl}>IVA (%)</label>
                  <input type="number" min="0" max="100" value={form.iva_rate}
                    onChange={e => { set('iva_rate', e.target.value); handleAmount(form.amount) }} />
                </div>
              </div>
              <div style={{ background:'var(--brand-light)', borderRadius:'var(--radius)', padding:'8px 12px', fontSize:13, color:'#1a5c34' }}>
                IVA deducible calculado: <strong>{formatCurrency(parseFloat(form.iva_amount)||0)}</strong>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div>
                  <label className={s.lbl}>Fecha</label>
                  <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                </div>
                <div>
                  <label className={s.lbl}>Categoría</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <Btn type="submit" disabled={uploading} full icon={<Upload size={14}/>}>
              {uploading ? 'Subiendo…' : 'Guardar ticket'}
            </Btn>
          </form>
        </SectionCard>

        {/* List */}
        <div>
          {tickets.length === 0
            ? <Empty message="Sin tickets registrados aún." />
            : tickets.map(t => (
              <div key={t.id} className={s.ticketRow} onClick={() => setViewing(t)}>
                <div className={s.ticketIcon}>
                  {t.file_url
                    ? /\.pdf$/i.test(t.file_name || '') ? <File size={18}/> : <FileImage size={18}/>
                    : <Receipt size={18}/>
                  }
                </div>
                <div className={s.ticketInfo}>
                  <div className={s.ticketDesc}>{t.description}</div>
                  <div className={s.ticketMeta}>
                    {formatDate(t.date)} · {t.category}
                  </div>
                </div>
                <div className={s.ticketAmounts}>
                  <div className={s.ticketTotal}>{formatCurrency(n(t.amount))}</div>
                  <div className={s.ticketIva}>IVA: {formatCurrency(n(t.iva_amount))}</div>
                </div>
                <div style={{ display:'flex', gap:4 }} onClick={e => e.stopPropagation()}>
                  {t.file_url && (
                    <a href={t.file_url} target="_blank" rel="noopener noreferrer" className={s.iconBtn}>
                      <ExternalLink size={14}/>
                    </a>
                  )}
                  <button className={`${s.iconBtn} ${s.danger}`}
                    onClick={() => { if(window.confirm('¿Eliminar?')) deleteTicket(t.id, t.file_path) }}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {viewing && (
        <TicketViewModal
          ticket={viewing}
          onClose={() => setViewing(null)}
          onDelete={() => { deleteTicket(viewing.id, viewing.file_path); setViewing(null) }}
        />
      )}
    </div>
  )
}
