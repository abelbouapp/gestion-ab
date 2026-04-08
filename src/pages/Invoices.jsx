import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Download } from 'lucide-react'
import { useClients } from '../hooks/useData'
import { useInvoices } from '../hooks/useInvoices'
import { Btn, Empty, Spinner, StatusBadge, SeriesBadge } from '../components/UI'
import { formatCurrency, formatDate } from '../utils/helpers'
import { generateInvoicePDF, parseOcClient } from '../utils/pdfGenerator'
import InvoiceModal from '../components/InvoiceModal'
import InvoiceViewModal from '../components/InvoiceViewModal'
import s from './Invoices.module.css'

export default function Invoices() {
  const [params] = useSearchParams()
  const { clients } = useClients()
  const { invoices, loading, addInvoice, updateInvoice, deleteInvoice, finalizeInvoice } = useInvoices()

  async function handleStatusChange(inv, newStatus) {
    // Si pasa de borrador a enviada/pagada → asignar número fiscal
    if (inv.number === 'BORRADOR' && newStatus !== 'draft') {
      await finalizeInvoice(inv.id, inv.series)
    }
    updateInvoice(inv.id, { status: newStatus })
  }
  const [modal,    setModal]   = useState(params.get('client') ? { clientId: params.get('client') } : null)
  const [viewing,  setViewing] = useState(null)
  const [series,   setSeries]  = useState('all') // all | D | P
  const [status,   setStatus]  = useState('all')

  const myInfo = (() => { try { return JSON.parse(localStorage.getItem('ab_myinfo')||'{}') } catch { return {} } })()

  const filtered = invoices.filter(i => {
    if (series !== 'all' && i.series !== series) return false
    if (status !== 'all' && i.status !== status) return false
    return true
  })

  const ivaD = invoices.filter(i=>i.series==='D').reduce((s,i)=>s+(i.iva_amount||0),0)
  const ivaP = invoices.filter(i=>i.series==='P').reduce((s,i)=>s+(i.iva_amount||0),0)
  const totalD = invoices.filter(i=>i.series==='D').reduce((s,i)=>s+(i.total||0),0)
  const totalP = invoices.filter(i=>i.series==='P').reduce((s,i)=>s+(i.total||0),0)

  if (loading) return <div className={s.page}><Spinner /></div>

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Facturas</h1>
          <p className={s.sub}>{invoices.length} facturas emitidas</p>
        </div>
        <Btn onClick={() => setModal({})} disabled={clients.length===0} icon={<Plus size={15}/>}>
          Nueva factura
        </Btn>
      </div>

      {/* Summary by series */}
      <div className={s.seriesGrid}>
        <div className={`${s.seriesCard} ${s.seriesD}`}>
          <div className={s.seriesLabel}>Serie D — Servicios Digitales</div>
          <div className={s.seriesTotal}>{formatCurrency(totalD)}</div>
          <div className={s.seriesSub}>IVA repercutido: {formatCurrency(ivaD)} · {invoices.filter(i=>i.series==='D').length} facturas</div>
        </div>
        <div className={`${s.seriesCard} ${s.seriesP}`}>
          <div className={s.seriesLabel}>Serie P — Productos</div>
          <div className={s.seriesTotal}>{formatCurrency(totalP)}</div>
          <div className={s.seriesSub}>IVA repercutido: {formatCurrency(ivaP)} · {invoices.filter(i=>i.series==='P').length} facturas</div>
        </div>
      </div>

      {/* Filters */}
      <div className={s.filters}>
        <div className={s.filterGroup}>
          {['all','D','P'].map(f => (
            <button key={f}
              className={`${s.fBtn} ${series===f?s.fActive:''} ${f==='D'?s.fD:f==='P'?s.fP:''}`}
              onClick={() => setSeries(f)}>
              {f==='all'?'Todas':f==='D'?'Serie D':'Serie P'}
            </button>
          ))}
        </div>
        <div className={s.filterGroup}>
          {['all','draft','sent','paid'].map(f => (
            <button key={f}
              className={`${s.fBtn} ${status===f?s.fActive:''}`}
              onClick={() => setStatus(f)}>
              {{ all:'Todas', draft:'Borrador', sent:'Enviadas', paid:'Pagadas' }[f]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0
        ? <Empty message={invoices.length===0 ? 'Sin facturas aún.' : 'Sin resultados con estos filtros.'} />
        : (
          <div className={s.list}>
            {filtered.map(inv => {
              const client = clients.find(c => c.id === inv.client_id)
              const ocClient = !client ? parseOcClient(inv.notes) : null
              const clientName = client?.name || ocClient?.name || '—'
              const isD    = inv.series === 'D'
              return (
                <div key={inv.id}
                  className={`${s.row} ${isD ? s.rowD : s.rowP}`}
                  onClick={() => setViewing(inv)}
                >
                  <div className={s.seriesStripe} style={{ background: isD?'var(--series-d)':'var(--series-p)' }}/>
                  <div className={s.invNum}>{inv.number}</div>
                  <div className={s.invClient}>
                    <div>{clientName}{ocClient && <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 5 }}>ocasional</span>}</div>
                    <SeriesBadge series={inv.series} />
                  </div>
                  <div className={s.invDate}>{formatDate(inv.date)}</div>
                  <div className={s.invAmounts}>
                    <div className={s.invTotal}>{formatCurrency(inv.total)}</div>
                    {inv.applies_irpf && (
                      <div className={s.irpfNote}>IRPF -{formatCurrency(inv.irpf_amount)}</div>
                    )}
                  </div>
                  <StatusBadge status={inv.status} />
                  <select className={s.statusSel} value={inv.status}
                    onClick={e => e.stopPropagation()}
                    onChange={e => { e.stopPropagation(); handleStatusChange(inv, e.target.value) }}>
                    <option value="draft">Borrador</option>
                    <option value="sent">Enviada</option>
                    <option value="paid">Pagada</option>
                  </select>
                  <button className={s.dlBtn}
                    onClick={e => { e.stopPropagation(); generateInvoicePDF(inv, client || null, myInfo).catch(console.error) }}>
                    <Download size={14}/>
                  </button>
                </div>
              )
            })}
          </div>
        )
      }

      {modal !== null && (
        <InvoiceModal
          initial={modal} clients={clients}
          onSave={async data => {
            const { error } = await addInvoice(data)
            if (error) { alert('Error al crear factura: ' + error.message); return }
            setModal(null)
          }}
          onClose={() => setModal(null)}
        />
      )}
      {viewing && (
        <InvoiceViewModal
          invoice={viewing} clients={clients} myInfo={myInfo}
          onClose={() => setViewing(null)}
          onStatusChange={async st => {
            await handleStatusChange(viewing, st)
            setViewing(p => ({ ...p, status: st, number: p.number === 'BORRADOR' && st !== 'draft' ? '...' : p.number }))
          }}
          onDelete={async () => { await deleteInvoice(viewing.id); setViewing(null) }}
        />
      )}
    </div>
  )
}
