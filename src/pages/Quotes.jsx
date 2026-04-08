import { useState } from 'react'
import { Plus, Download, FileText, Pencil, Trash2, CheckCircle, XCircle, Clock, Send } from 'lucide-react'
import { useClients } from '../hooks/useData'
import { useQuotes } from '../hooks/useQuotes'
import { useInvoices } from '../hooks/useInvoices'
import { Btn, Empty, Spinner, Avatar, Modal } from '../components/UI'
import { formatCurrency, formatDate, calcInvoice } from '../utils/helpers'
import { generateQuotePDF } from '../utils/quotePdfGenerator'
import QuoteModal from '../components/QuoteModal'
import InvoiceModal from '../components/InvoiceModal'
import s from './Quotes.module.css'

const STATUS_META = {
  draft:    { label: 'Borrador',  color: '#94a3b8', icon: Clock },
  sent:     { label: 'Enviado',   color: '#3b82f6', icon: Send },
  accepted: { label: 'Aceptado',  color: '#22c55e', icon: CheckCircle },
  rejected: { label: 'Rechazado', color: '#e5484d', icon: XCircle },
}

export default function Quotes() {
  const { clients }                                     = useClients()
  const { quotes, loading, addQuote, updateQuote, deleteQuote } = useQuotes()
  const { addInvoice }                                  = useInvoices()

  const [modal,     setModal]     = useState(null)   // null | 'new' | quote object (edit)
  const [converting, setConverting] = useState(null) // quote to convert
  const [filterStatus, setFilter] = useState('all')

  const myInfo = (() => { try { return JSON.parse(localStorage.getItem('ab_myinfo') || '{}') } catch { return {} } })()

  const filtered = quotes.filter(q => filterStatus === 'all' || q.status === filterStatus)

  async function handleSave(data) {
    if (modal?.id) {
      const { error } = await updateQuote(modal.id, data)
      if (error) { alert('Error al guardar presupuesto: ' + error.message); return }
    } else {
      const { error } = await addQuote(data)
      if (error) { alert('Error al crear presupuesto: ' + error.message); return }
    }
    setModal(null)
  }

  async function handleConvert(invoiceData) {
    const { error } = await addInvoice(invoiceData)
    if (error) { alert('Error al crear factura: ' + error.message); return }
    await updateQuote(converting.id, { status: 'accepted', converted_to_invoice: true })
    setConverting(null)
    alert('✅ Factura creada. Puedes verla en la sección Facturas.')
  }

  const stats = {
    total:    quotes.length,
    sent:     quotes.filter(q => q.status === 'sent').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    amount:   quotes.filter(q => q.status === 'accepted').reduce((s, q) => s + (q.total || 0), 0),
  }

  if (loading) return <div className={s.page}><Spinner /></div>

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Presupuestos</h1>
          <p className={s.sub}>{quotes.length} presupuestos · {stats.accepted} aceptados</p>
        </div>
        <Btn onClick={() => setModal('new')} disabled={clients.length === 0} icon={<Plus size={15} />}>
          Nuevo presupuesto
        </Btn>
      </div>

      {/* Stats */}
      <div className={s.statsRow}>
        {[
          { label: 'Total',     value: stats.total,               color: '#94a3b8' },
          { label: 'Enviados',  value: stats.sent,                color: '#3b82f6' },
          { label: 'Aceptados', value: stats.accepted,            color: '#22c55e' },
          { label: 'Importe aceptado', value: formatCurrency(stats.amount), color: '#6dcf94' },
        ].map(st => (
          <div key={st.label} className={s.stat} style={{ '--c': st.color }}>
            <div className={s.statVal}>{st.value}</div>
            <div className={s.statLbl}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className={s.filters}>
        {['all', 'draft', 'sent', 'accepted', 'rejected'].map(f => (
          <button key={f}
            className={`${s.fBtn} ${filterStatus === f ? s.fActive : ''}`}
            onClick={() => setFilter(f)}>
            {f === 'all' ? 'Todos' : STATUS_META[f]?.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0
        ? <Empty message={quotes.length === 0 ? 'Sin presupuestos aún. ¡Crea el primero!' : 'Sin resultados.'} />
        : (
          <div className={s.list}>
            {filtered.map(q => {
              const client = clients.find(c => c.id === q.client_id)
              const meta   = STATUS_META[q.status] || STATUS_META.draft
              const Icon   = meta.icon
              return (
                <div key={q.id} className={s.row}>
                  <div className={s.statusBar} style={{ background: meta.color }} />

                  <div className={s.rowMain}>
                    <div className={s.rowTop}>
                      <div className={s.quoteNum}>{q.number}</div>
                      <div className={s.statusChip} style={{ color: meta.color, background: meta.color + '18' }}>
                        <Icon size={12} />
                        {meta.label}
                      </div>
                      {q.converted_to_invoice && (
                        <div className={s.convertedChip}>
                          <FileText size={11} /> Convertido en factura
                        </div>
                      )}
                    </div>

                    <div className={s.rowMid}>
                      {client && <Avatar name={client.name} color={client.color} size={28} />}
                      <div className={s.rowInfo}>
                        <div className={s.clientName}>{client?.name || '—'}</div>
                        <div className={s.rowMeta}>
                          {formatDate(q.date)}
                          {q.valid_until && ` · Válido hasta: ${formatDate(q.valid_until)}`}
                          {q.lines?.length > 0 && ` · ${q.lines.length} línea${q.lines.length > 1 ? 's' : ''}`}
                        </div>
                      </div>
                      <div className={s.amount}>{formatCurrency(q.total)}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={s.actions}>
                    {/* Status changer */}
                    <select className={s.statusSel} value={q.status}
                      onChange={e => updateQuote(q.id, { status: e.target.value })}>
                      <option value="draft">Borrador</option>
                      <option value="sent">Enviado</option>
                      <option value="accepted">Aceptado</option>
                      <option value="rejected">Rechazado</option>
                    </select>

                    {/* Convert to invoice */}
                    {!q.converted_to_invoice && (q.status === 'accepted' || q.status === 'sent') && (
                      <Btn small onClick={() => setConverting(q)} icon={<FileText size={13} />}>
                        Convertir en factura
                      </Btn>
                    )}

                    {/* PDF */}
                    <button className={s.iconBtn}
                      onClick={() => generateQuotePDF(q, client, myInfo)}
                      title="Descargar PDF">
                      <Download size={15} />
                    </button>

                    {/* Edit */}
                    <button className={s.iconBtn}
                      onClick={() => setModal(q)}
                      title="Editar">
                      <Pencil size={14} />
                    </button>

                    {/* Delete */}
                    <button className={`${s.iconBtn} ${s.danger}`}
                      onClick={() => { if (window.confirm('¿Eliminar presupuesto?')) deleteQuote(q.id) }}
                      title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      }

      {/* Create / Edit modal */}
      {modal !== null && (
        <QuoteModal
          initial={modal === 'new' ? {} : modal}
          clients={clients}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Convert to invoice modal */}
      {converting && (
        <InvoiceModal
          initial={{
            clientId: converting.client_id,
            lines:    converting.lines,
            iva_rate: converting.iva_rate,
            notes:    converting.notes,
          }}
          clients={clients}
          onSave={handleConvert}
          onClose={() => setConverting(null)}
          convertingFrom={converting.number}
        />
      )}
    </div>
  )
}
