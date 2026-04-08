import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, formatCurrency } from './helpers'

export function parseOcClient(notes) {
  if (!notes?.startsWith('_oc_:')) return null
  try {
    const firstLine = notes.split('\n')[0].replace('_oc_:', '')
    return JSON.parse(firstLine)
  } catch { return null }
}

export function getRealNotes(notes) {
  if (!notes?.startsWith('_oc_:')) return notes || ''
  return notes.split('\n').slice(1).join('\n').trim()
}

async function loadLogoBase64() {
  try {
    const res = await fetch('/logo.png')
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror  = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

export async function generateInvoicePDF(invoice, client, myInfo = {}) {
  const doc = new jsPDF()
  const isD = invoice.series === 'D'
  const accentR = isD ? 79  : 249
  const accentG = isD ? 127 : 115
  const accentB = isD ? 255 : 22

  const ocClient  = !client ? parseOcClient(invoice.notes) : null
  const clientObj = client || ocClient || {}
  const realNotes = getRealNotes(invoice.notes)

  // ── Fondo header
  doc.setFillColor(247, 249, 247)
  doc.rect(0, 0, 210, 55, 'F')

  // ── Barra lateral de color
  doc.setFillColor(accentR, accentG, accentB)
  doc.rect(0, 0, 5, 297, 'F')

  // ── Logo arriba a la izquierda
  const logoB64 = await loadLogoBase64()
  if (logoB64) {
    // Logo cuadrado ~28x28, dejando margen a la barra lateral
    doc.addImage(logoB64, 'PNG', 12, 8, 28, 28)
  } else {
    // Fallback texto si no carga
    doc.setFont('helvetica', 'bolditalic')
    doc.setFontSize(22)
    doc.setTextColor(26, 46, 34)
    doc.text('Abel Bou', 14, 24)
  }

  // ── Píldora de serie debajo del logo — fondo transparente, borde de color
  const pillLabel = isD ? 'SERVICIOS DIGITALES' : 'PRODUCTOS'
  const pillW     = isD ? 36 : 24
  const pillX     = 12
  const pillY     = 38
  // Solo borde, sin relleno
  doc.setDrawColor(accentR, accentG, accentB)
  doc.setLineWidth(0.7)
  doc.roundedRect(pillX, pillY, pillW, 7, 2, 2, 'S')
  doc.setFontSize(6)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(accentR, accentG, accentB)
  doc.text(pillLabel, pillX + pillW / 2, pillY + 4.7, { align: 'center' })

  // ── Número de factura — arriba a la derecha
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(26, 46, 34)
  doc.text(invoice.number, 196, 20, { align: 'right' })

  // ── Fechas debajo del número
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 120, 110)
  doc.text(`Fecha: ${formatDate(invoice.date)}`, 196, 29, { align: 'right' })
  if (invoice.due_date) {
    doc.text(`Vencimiento: ${formatDate(invoice.due_date)}`, 196, 36, { align: 'right' })
  }

  // ── Badge de estado — solo visible si es borrador
  if (invoice.status === 'draft' || !invoice.status) {
    doc.setFillColor(180, 180, 180)
    doc.roundedRect(163, 40, 29, 8, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('BORRADOR', 177.5, 45.5, { align: 'center' })
  }

  // ── Separador
  doc.setDrawColor(226, 234, 228)
  doc.setLineWidth(0.5)
  doc.line(14, 58, 196, 58)

  // ── Emisor / Cliente
  let y = 66
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(138, 168, 152)
  doc.text('EMISOR', 14, y)
  doc.text('CLIENTE', 110, y)

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(26, 46, 34)
  doc.text(myInfo.company || myInfo.name || 'Abel Bou', 14, y)
  doc.text(clientObj.name || '—', 110, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 120, 110)
  let iy = y + 6, cy = y + 6
  if (myInfo.nif)     { doc.text(`NIF: ${myInfo.nif}`, 14, iy); iy += 5 }
  if (myInfo.address) { doc.text(myInfo.address, 14, iy); iy += 5 }
  if (myInfo.email)   { doc.text(myInfo.email, 14, iy); iy += 5 }
  if (myInfo.phone)   { doc.text(myInfo.phone, 14, iy); iy += 5 }
  if (clientObj.nif)     { doc.text(`NIF: ${clientObj.nif}`, 110, cy); cy += 5 }
  if (clientObj.address) { doc.text(clientObj.address, 110, cy); cy += 5 }
  if (clientObj.email)   { doc.text(clientObj.email, 110, cy); cy += 5 }

  // ── Tabla de líneas
  const tableY = Math.max(iy, cy) + 8
  const lines  = invoice.lines || []

  autoTable(doc, {
    startY: tableY,
    head: [['Descripción', 'Cant.', 'Ud.', 'Precio unit.', 'Total']],
    body: lines.map(l => [
      l.desc,
      Number(l.qty).toFixed(2),
      l.unit || 'ud',
      formatCurrency(l.price),
      formatCurrency(Number(l.qty) * Number(l.price)),
    ]),
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: [26, 46, 34] },
    headStyles: { fillColor: [26, 46, 34], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [247, 249, 247] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'right' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
  })

  // ── Totales
  const fy = doc.lastAutoTable.finalY + 6
  const rx = 196

  doc.setFontSize(9)
  doc.setTextColor(100, 120, 110)
  doc.text('Base imponible:', rx - 50, fy, { align: 'right' })
  doc.text(formatCurrency(invoice.subtotal), rx, fy, { align: 'right' })
  doc.text(`IVA (${invoice.iva_rate || 21}%):`, rx - 50, fy + 7, { align: 'right' })
  doc.text(formatCurrency(invoice.iva_amount), rx, fy + 7, { align: 'right' })

  let totalY = fy + 7
  if (invoice.applies_irpf && invoice.irpf_amount > 0) {
    totalY += 7
    doc.setTextColor(229, 72, 77)
    doc.text(`IRPF (-${invoice.irpf_rate || 7}%):`, rx - 50, totalY, { align: 'right' })
    doc.text(`-${formatCurrency(invoice.irpf_amount)}`, rx, totalY, { align: 'right' })
    doc.setTextColor(100, 120, 110)
  }

  totalY += 4
  doc.setFillColor(accentR, accentG, accentB)
  doc.roundedRect(rx - 76, totalY, 76, 13, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL:', rx - 50, totalY + 8.5, { align: 'right' })
  doc.text(formatCurrency(invoice.total), rx - 3, totalY + 8.5, { align: 'right' })

  // ── Notas (justo bajo los totales)
  if (realNotes) {
    const ny = totalY + 18
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(138, 168, 152)
    doc.text(`Notas: ${realNotes}`, 14, ny)
  }

  // ── IBAN — fijo arriba del footer
  if (myInfo.iban) {
    const ibanBoxY = 262
    doc.setFillColor(247, 249, 247)
    doc.roundedRect(14, ibanBoxY, 120, 14, 2, 2, 'F')
    doc.setDrawColor(accentR, accentG, accentB)
    doc.setLineWidth(0.6)
    doc.roundedRect(14, ibanBoxY, 120, 14, 2, 2, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(74, 99, 88)
    doc.text('PAGO POR TRANSFERENCIA', 20, ibanBoxY + 5.5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(accentR, accentG, accentB)
    doc.text(myInfo.iban, 20, ibanBoxY + 11)
  }

  // ── Footer
  doc.setDrawColor(226, 234, 228)
  doc.line(14, 283, 196, 283)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(160, 180, 170)
  doc.text('Abel Bou · Desarrollador web · Diseñador Gráfico · Creativos', 105, 288, { align: 'center' })

  doc.save(`${invoice.number}_${clientObj.name || 'factura'}.pdf`)
}
