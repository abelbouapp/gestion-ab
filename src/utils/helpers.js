export const BRAND_COLORS = [
  '#6dcf94','#4f7fff','#f97316','#a78bfa',
  '#f43f5e','#06b6d4','#eab308','#10b981'
]

export function formatCurrency(n) {
  return Number(n || 0).toLocaleString('es-ES', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  })
}

export function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function formatMinutes(mins) {
  if (!mins) return '0 min'
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

export function formatHours(h) {
  if (!h || h === 0) return '0h'
  const hours = Math.floor(h)
  const mins  = Math.round((h - hours) * 60)
  if (hours === 0) return `${mins}min`
  if (mins  === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

export function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function getColor(index) {
  return BRAND_COLORS[index % BRAND_COLORS.length]
}

// Invoice number helpers
export function buildInvoiceNumber(series, seq) {
  return `${String(seq).padStart(3, '0')}${series}`
}

// Calculate invoice totals
export function calcInvoice({ lines = [], ivaRate = 21, irpfRate = 0, appliesIrpf = false }) {
  const subtotal   = lines.reduce((s, l) => s + Number(l.qty || 0) * Number(l.price || 0), 0)
  const ivaAmount  = subtotal * (ivaRate / 100)
  const irpfAmount = appliesIrpf ? subtotal * (irpfRate / 100) : 0
  const total      = subtotal + ivaAmount - irpfAmount
  return { subtotal, ivaAmount, irpfAmount, total }
}
