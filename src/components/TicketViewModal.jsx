import { Modal, Btn, Badge } from './UI'
import { formatCurrency, formatDate } from '../utils/helpers'
import { ExternalLink, Trash2 } from 'lucide-react'
import s from './TicketViewModal.module.css'

export default function TicketViewModal({ ticket: t, onClose, onDelete }) {
  const isImage = t.file_url && /\.(jpe?g|png|gif|webp)$/i.test(t.file_name || t.file_url)
  const isPdf   = t.file_url && /\.pdf$/i.test(t.file_name || t.file_url)

  return (
    <Modal title="Detalle del ticket" onClose={onClose} wide>
      <div className={s.root}>
        {/* Left: preview */}
        <div className={s.previewCol}>
          {isImage ? (
            <img src={t.file_url} alt={t.description} className={s.previewImg} />
          ) : isPdf ? (
            <iframe src={t.file_url} className={s.previewPdf} title="PDF preview" />
          ) : (
            <div className={s.noPreview}>Sin archivo adjunto</div>
          )}
          {t.file_url && (
            <a href={t.file_url} target="_blank" rel="noopener noreferrer" className={s.openLink}>
              <ExternalLink size={14} /> Abrir archivo original
            </a>
          )}
        </div>

        {/* Right: details */}
        <div className={s.detailsCol}>
          <div className={s.field}>
            <span className={s.label}>Descripción</span>
            <span className={s.value}>{t.description || '—'}</span>
          </div>
          <div className={s.row2}>
            <div className={s.field}>
              <span className={s.label}>Fecha</span>
              <span className={s.value}>{formatDate(t.date)}</span>
            </div>
            <div className={s.field}>
              <span className={s.label}>Categoría</span>
              <span className={s.value}><Badge>{t.category || 'Otros'}</Badge></span>
            </div>
          </div>

          <div className={s.amountsBox}>
            <div className={s.amountRow}>
              <span>Importe total</span>
              <span className={s.big}>{formatCurrency(t.amount)}</span>
            </div>
            <div className={s.amountRow}>
              <span>IVA ({t.iva_rate || 21}%) — deducible</span>
              <span className={s.green}>{formatCurrency(t.iva_amount)}</span>
            </div>
            <div className={s.amountRow}>
              <span>Base sin IVA</span>
              <span>{formatCurrency((Number(t.amount) || 0) - (Number(t.iva_amount) || 0))}</span>
            </div>
          </div>

          {t.file_name && (
            <div className={s.field}>
              <span className={s.label}>Archivo</span>
              <span className={s.value}>{t.file_name}</span>
            </div>
          )}

          <div className={s.actions}>
            <Btn variant="danger" icon={<Trash2 size={14} />}
              onClick={() => { if (window.confirm('¿Eliminar este ticket?')) onDelete() }}>
              Eliminar ticket
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  )
}
