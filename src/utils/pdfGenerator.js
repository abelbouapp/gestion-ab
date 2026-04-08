import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, formatCurrency } from './helpers'

export function generateInvoicePDF(invoice, client, myInfo = {}) {
  const doc = new jsPDF()
  const isD = invoice.series === 'D'
  const accentR = isD ? 79  : 249
  const accentG = isD ? 127 : 115
  const accentB = isD ? 255 : 22

  // ── Background header band
  doc.setFillColor(247, 249, 247)
  doc.rect(0, 0, 210, 55, 'F')

  // ── Accent left stripe
  doc.setFillColor(accentR, accentG, accentB)
  doc.rect(0, 0, 5, 297, 'F')

  // ── Logo text (Abel Bou branding)
  doc.setFont('helvetica', 'bolditalic')
  doc.setFontSize(22)
  doc.setTextColor(26, 46, 34)
  doc.text('Abel Bou', 14, 22)

  // Series badge
  doc.setFillColor(accentR, accentG, accentB)
  doc.roundedRect(14, 26, isD ? 36 : 40, 9, 2, 2, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(isD ? 'SERVICIOS DIGITALES' : 'PRODUCTOS', 16, 32)

  // Invoice number & dates (right side)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(26, 46, 34)
  doc.text(invoice.number, 196, 22, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 120, 110)
  doc.text(`Fecha: ${formatDate(invoice.date)}`, 196, 30, { align: 'right' })
  if (invoice.due_date) {
    doc.text(`Vencimiento: ${formatDate(invoice.due_date)}`, 196, 37, { align: 'right' })
  }

  // Status badge
  const statusMap = { draft: 'BORRADOR', sent: 'ENVIADA', paid: 'PAGADA' }
  const statusColors = {
    draft: [200, 200, 200],
    sent:  [accentR, accentG, accentB],
    paid:  [34, 197, 94]
  }
  const sc = statusColors[invoice.status] || statusColors.draft
  doc.setFillColor(...sc)
  doc.roundedRect(155, 40, 41, 9, 2, 2, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(statusMap[invoice.status] || 'BORRADOR', 175.5, 46, { align: 'center' })

  // Divider
  doc.setDrawColor(226, 234, 228)
  doc.setLineWidth(0.5)
  doc.line(14, 58, 196, 58)

  // Issuer + Client
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
  doc.text(client?.name || '—', 110, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 120, 110)
  let iy = y + 6, cy = y + 6
  if (myInfo.nif)     { doc.text(`NIF: ${myInfo.nif}`, 14, iy); iy += 5 }
  if (myInfo.address) { doc.text(myInfo.address, 14, iy); iy += 5 }
  if (myInfo.email)   { doc.text(myInfo.email, 14, iy); iy += 5 }
  if (myInfo.phone)   { doc.text(myInfo.phone, 14, iy); iy += 5 }
  if (client?.nif)     { doc.text(`NIF: ${client.nif}`, 110, cy); cy += 5 }
  if (client?.address) { doc.text(client.address, 110, cy); cy += 5 }
  if (client?.email)   { doc.text(client.email, 110, cy); cy += 5 }

  // Lines table
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
    styles: {
      font: 'helvetica', fontSize: 9, cellPadding: 5,
      textColor: [26, 46, 34]
    },
    headStyles: {
      fillColor: [26, 46, 34], textColor: [255, 255, 255],
      fontStyle: 'bold', fontSize: 8
    },
    alternateRowStyles: { fillColor: [247, 249, 247] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'right' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
  })

  // Totals block
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

  // Total box
  totalY += 4
  doc.setFillColor(accentR, accentG, accentB)
  doc.roundedRect(rx - 76, totalY, 76, 13, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL:', rx - 50, totalY + 8.5, { align: 'right' })
  doc.text(formatCurrency(invoice.total), rx - 3, totalY + 8.5, { align: 'right' })

  // IBAN
  if (myInfo.iban) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(138, 168, 152)
    doc.text(`Transferencia a: ${myInfo.iban}`, 14, totalY + 14)
  }

  // Notes
  if (invoice.notes) {
    const ny = totalY + (myInfo.iban ? 22 : 16)
    doc.setFontSize(8)
    doc.setTextColor(138, 168, 152)
    doc.text(`Notas: ${invoice.notes}`, 14, ny)
  }

  // Footer
  doc.setDrawColor(226, 234, 228)
  doc.line(14, 283, 196, 283)
  doc.setFontSize(7)
  doc.setTextColor(160, 180, 170)
  doc.text('Abel Bou — Gestión de clientes', 105, 288, { align: 'center' })

  doc.save(`${invoice.number}_${client?.name || 'factura'}.pdf`)
}
