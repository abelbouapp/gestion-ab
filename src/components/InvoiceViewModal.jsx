import { Modal, Btn, StatusBadge, SeriesBadge } from './UI'
import { formatCurrency, formatDate } from '../utils/helpers'
import { generateInvoicePDF, parseOcClient, getRealNotes } from '../utils/pdfGenerator'
import { Download, Trash2 } from 'lucide-react'
import s from './InvoiceViewModal.module.css'

export default function InvoiceViewModal({ invoice: inv, clients, myInfo = {}, onClose, onStatusChange, onDelete }) {
  const client   = clients.find(c => c.id === inv.client_id)
  const ocClient = !client ? parseOcClient(inv.notes) : null
  const realNotes = getRealNotes(inv.notes)
  const clientObj = client || ocClient || {}
  const isD    = inv.series === 'D'

  return (
    <Modal title={`Factura ${inv.number}`} onClose={onClose} wide>
      <div className={s.root}>
        <div className={s.topRow}>
          <div>
            <div className={s.num} style={{ color: isD?'var(--series-d)':'var(--series-p)' }}>{inv.number}</div>
            <div className={s.dates}>
              {formatDate(inv.date)}
              {inv.due_date && ` · Vence: ${formatDate(inv.due_date)}`}
            </div>
            <div style={{ marginTop:6 }}><SeriesBadge series={inv.series} /></div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'flex-start', flexWrap:'wrap' }}>
            <select className={s.statusSel} value={inv.status}
              onChange={e => onStatusChange(e.target.value)}>
              <option value="draft">Borrador</option>
              <option value="sent">Enviada</option>
              <option value="paid">Pagada</option>
            </select>
            <Btn small onClick={() => generateInvoicePDF(inv, client, myInfo).catch(console.error)} icon={<Download size={13}/>}>
              PDF
            </Btn>
            <Btn small variant="danger" icon={<Trash2 size={13}/>}
              onClick={() => { if (window.confirm(`¿Eliminar la factura ${inv.number}? Esta acción no se puede deshacer.`)) onDelete() }}>
              Eliminar
            </Btn>
          </div>
        </div>

        <div className={s.parties}>
          {[
            { label:'Emisor',  name: myInfo.company||myInfo.name||'—', nif: myInfo.nif,      addr: myInfo.address,      email: myInfo.email,      phone: myInfo.phone },
            { label:'Cliente', name: clientObj.name||'—',              nif: clientObj.nif,   addr: clientObj.address,   email: clientObj.email,   phone: clientObj.phone,
              occasional: !!ocClient },
          ].map(p => (
            <div key={p.label} className={s.party}>
              <div className={s.partyLabel}>
                {p.label}
                {p.occasional && <span style={{ marginLeft:6, fontSize:10, color:'var(--muted)', fontWeight:400 }}>ocasional</span>}
              </div>
              <div className={s.partyName}>{p.name}</div>
              {p.nif   && <div className={s.partyInfo}>NIF: {p.nif}</div>}
              {p.addr  && <div className={s.partyInfo}>{p.addr}</div>}
              {p.email && <div className={s.partyInfo}>{p.email}</div>}
              {p.phone && <div className={s.partyInfo}>{p.phone}</div>}
            </div>
          ))}
        </div>

        <table className={s.table}>
          <thead>
            <tr><th>Descripción</th><th>Cant.</th><th>Ud.</th><th>Precio</th><th>Total</th></tr>
          </thead>
          <tbody>
            {(inv.lines||[]).map((l,i) => (
              <tr key={i}>
                <td>{l.desc}</td>
                <td>{Number(l.qty).toFixed(2)}</td>
                <td>{l.unit}</td>
                <td>{formatCurrency(l.price)}</td>
                <td>{formatCurrency(l.qty*l.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={s.totals}>
          <div className={s.tRow}><span>Base imponible</span><span>{formatCurrency(inv.subtotal)}</span></div>
          <div className={s.tRow}><span>IVA ({inv.iva_rate||21}%)</span><span>{formatCurrency(inv.iva_amount)}</span></div>
          {inv.applies_irpf && inv.irpf_amount > 0 && (
            <div className={`${s.tRow} ${s.irpf}`}>
              <span>IRPF (-{inv.irpf_rate||7}%) — retención</span>
              <span>-{formatCurrency(inv.irpf_amount)}</span>
            </div>
          )}
          <div className={`${s.tRow} ${s.grand}`}>
            <span>TOTAL</span><span>{formatCurrency(inv.total)}</span>
          </div>
        </div>

        {realNotes && <div className={s.notes}><strong>Notas:</strong> {realNotes}</div>}
      </div>
    </Modal>
  )
}
