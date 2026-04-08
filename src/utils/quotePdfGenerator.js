import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, formatCurrency } from './helpers'

export function generateQuotePDF(quote, client, myInfo = {}) {
  const doc = new jsPDF()

  // ── Header band
  doc.setFillColor(240, 248, 243)
  doc.rect(0, 0, 210, 55, 'F')

  // ── Left accent (green, softer than invoice)
  doc.setFillColor(109, 207, 148)
  doc.rect(0, 0, 5, 297, 'F')

  // ── "PRESUPUESTO" watermark-style text
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(109, 207, 148)
  doc.text('PRESUPUESTO', 14, 13)

  // ── Logo / brand
  doc.setFont('helvetica', 'bolditalic')
  doc.setFontSize(20)
  doc.setTextColor(26, 46, 34)
  doc.text('Abel Bou', 14, 24)

  // ── Number & dates
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.setTextColor(26, 46, 34)
  doc.text(quote.number, 196, 18, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 120, 110)
  doc.text(`Fecha: ${formatDate(quote.date)}`, 196, 26, { align: 'right' })
  if (quote.valid_until) {
    doc.text(`Válido hasta: ${formatDate(quote.valid_until)}`, 196, 33, { align: 'right' })
  }

  // ── Status badge
  const statusMap  = { draft: 'BORRADOR', sent: 'ENVIADO', accepted: 'ACEPTADO', rejected: 'RECHAZADO' }
  const statusClrs = {
    draft:    [180, 180, 180],
    sent:     [109, 207, 148],
    accepted: [34, 197, 94],
    rejected: [229, 72, 77],
  }
  const sc = statusClrs[quote.status] || statusClrs.draft
  doc.setFillColor(...sc)
  doc.roundedRect(148, 39, 48, 9, 2, 2, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(statusMap[quote.status] || 'BORRADOR', 172, 45, { align: 'center' })

  // ── Validity note
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8.5)
  doc.setTextColor(138, 168, 152)
  doc.text('Este documento es un presupuesto, no una factura fiscal.', 14, 35)

  // ── Divider
  doc.setDrawColor(200, 228, 210)
  doc.setLineWidth(0.4)
  doc.line(14, 58, 196, 58)

  // ── Parties
  let y = 66
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(138, 168, 152)
  doc.text('ELABORADO POR', 14, y)
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
  if (myInfo.nif)     { doc.text(`NIF: ${myInfo.nif}`, 14, iy);     iy += 5 }
  if (myInfo.email)   { doc.text(myInfo.email, 14, iy);             iy += 5 }
  if (myInfo.phone)   { doc.text(myInfo.phone, 14, iy);             iy += 5 }
  if (client?.nif)    { doc.text(`NIF: ${client.nif}`, 110, cy);    cy += 5 }
  if (client?.email)  { doc.text(client.email, 110, cy);            cy += 5 }
  if (client?.address){ doc.text(client.address, 110, cy);          cy += 5 }

  // ── Lines table
  const tableY = Math.max(iy, cy) + 8
  autoTable(doc, {
    startY: tableY,
    head: [['Descripción', 'Cant.', 'Ud.', 'Precio unit.', 'Total']],
    body: (quote.lines || []).map(l => [
      l.desc,
      Number(l.qty).toFixed(2),
      l.unit || 'ud',
      formatCurrency(l.price),
      formatCurrency(Number(l.qty) * Number(l.price)),
    ]),
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: [26, 46, 34] },
    headStyles: { fillColor: [26, 46, 34], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [240, 248, 243] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'right' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
  })

  // ── Totals
  const fy = doc.lastAutoTable.finalY + 6
  const rx = 196
  doc.setFontSize(9)
  doc.setTextColor(100, 120, 110)
  doc.text('Base imponible:', rx - 50, fy, { align: 'right' })
  doc.text(formatCurrency(quote.subtotal), rx, fy, { align: 'right' })
  doc.text(`IVA (${quote.iva_rate || 21}%):`, rx - 50, fy + 7, { align: 'right' })
  doc.text(formatCurrency(quote.iva_amount), rx, fy + 7, { align: 'right' })

  // Total box — green
  doc.setFillColor(109, 207, 148)
  doc.roundedRect(rx - 76, fy + 11, 76, 13, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(26, 46, 34)
  doc.text('TOTAL:', rx - 50, fy + 19.5, { align: 'right' })
  doc.text(formatCurrency(quote.total), rx - 3, fy + 19.5, { align: 'right' })

  // ── Notes
  if (quote.notes) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(100, 120, 110)
    const notesY = fy + 28
    doc.text('Notas / Condiciones:', 14, notesY)
    doc.setTextColor(60, 80, 70)
    doc.text(doc.splitTextToSize(quote.notes, 182), 14, notesY + 6)
  }

  // ── Footer
  doc.setDrawColor(200, 228, 210)
  doc.line(14, 283, 196, 283)
  doc.setFontSize(7)
  doc.setTextColor(160, 180, 170)
  doc.text('Abel Bou — Este presupuesto no tiene valor fiscal hasta su conversión en factura.', 105, 288, { align: 'center' })

  doc.save(`${quote.number}_${client?.name || 'presupuesto'}.pdf`)
}
