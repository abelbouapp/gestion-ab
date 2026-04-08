import { useState } from 'react'
import { Plus, Trash2, Package, List } from 'lucide-react'
import { Btn } from './UI'
import { formatCurrency } from '../utils/helpers'

/**
 * LinesEditor — dos modos:
 *   - "detail": cada línea tiene cantidad, unidad y precio unitario (comportamiento estándar)
 *   - "package": las líneas son items descriptivos, el precio total es único al final
 */
export default function LinesEditor({ lines, setLines, setLine }) {
  const [mode, setMode] = useState('detail') // 'detail' | 'package'
  const [pkgPrice, setPkgPrice] = useState('')

  function addLine() {
    setLines(ls => [...ls, { desc: '', qty: 1, unit: 'ud', price: 0 }])
  }

  // En modo paquete, reescribimos las líneas para que calcInvoice dé bien el total:
  // una sola línea con qty=1 y price=pkgPrice, las demás con price=0
  function syncPackagePrice(val) {
    setPkgPrice(val)
    setLines(ls => ls.map((l, i) => i === 0 ? { ...l, qty: 1, price: parseFloat(val) || 0 } : { ...l, price: 0 }))
  }

  const btnMode = (m) => ({
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: mode === m ? 'var(--brand)' : 'var(--bg3)',
    color: mode === m ? 'var(--text)' : 'var(--text2)',
    fontFamily: 'var(--font)',
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Líneas
        </label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" style={btnMode('detail')} onClick={() => setMode('detail')}>
            <List size={12} /> Detallado
          </button>
          <button type="button" style={btnMode('package')} onClick={() => setMode('package')}>
            <Package size={12} /> Precio paquete
          </button>
        </div>
      </div>

      {mode === 'package' && (
        <div style={{ background: 'rgba(109,207,148,0.08)', border: '1px solid rgba(109,207,148,0.25)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 8, fontSize: 13, color: 'var(--text2)' }}>
          💡 <strong>Modo paquete:</strong> añade los conceptos incluidos (sin precio individual). El importe total se pone abajo.
        </div>
      )}

      <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {/* Cabecera */}
        {mode === 'detail' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 60px 90px 32px', gap: 6, padding: '8px 10px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Descripción</span><span>Cant.</span><span>Ud.</span><span>Precio</span><span />
          </div>
        ) : (
          <div style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Conceptos incluidos en el paquete
          </div>
        )}

        {/* Filas */}
        {lines.map((l, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: mode === 'detail' ? '1fr 72px 60px 90px 32px' : '1fr 32px',
            gap: 6, padding: '4px 10px', alignItems: 'center'
          }}>
            <input
              value={l.desc}
              onChange={e => setLine(i, 'desc', e.target.value)}
              placeholder={mode === 'package' ? `Concepto ${i + 1} (ej: Diseño web, Logo…)` : 'Descripción del servicio…'}
            />
            {mode === 'detail' && (
              <>
                <input type="number" min="0" step="0.01" value={l.qty}
                  onChange={e => setLine(i, 'qty', e.target.value)} style={{ textAlign: 'right' }} />
                <select value={l.unit} onChange={e => setLine(i, 'unit', e.target.value)}>
                  <option value="ud">ud</option>
                  <option value="h">h</option>
                  <option value="mes">mes</option>
                  <option value="año">año</option>
                </select>
                <input type="number" min="0" step="0.01" value={l.price}
                  onChange={e => setLine(i, 'price', e.target.value)}
                  placeholder="0,00" style={{ textAlign: 'right' }} />
              </>
            )}
            <button type="button" onClick={() => setLines(ls => ls.filter((_, idx) => idx !== i))}
              style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <Btn small variant="secondary" icon={<Plus size={12} />} onClick={addLine}>
          {mode === 'package' ? 'Añadir concepto' : 'Añadir línea'}
        </Btn>

        {mode === 'package' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
              Precio total del paquete (€):
            </label>
            <input
              type="number" min="0" step="0.01"
              value={pkgPrice}
              onChange={e => syncPackagePrice(e.target.value)}
              placeholder="0,00"
              style={{ width: 100, textAlign: 'right' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
