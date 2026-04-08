import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, formatCurrency } from './helpers'
import { parseOcClient } from './pdfGenerator'

const MINT  = [109, 207, 148]
const DARK  = [17,  28,  22]
const GRAY  = [74, 106,  88]
const LGRAY = [200, 215, 207]

function getPeriodLabel(period, date = new Date()) {
  const y = date.getFullYear()
  const m = date.getMonth()
  if (period === 'month') {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  }
  if (period === 'quarter') {
    const q = Math.floor(m / 3) + 1
    return `${q}T ${y}`
  }
  return `Año ${y}`
}

export function exportGestorPDF({ invoices, tickets, clients, period, myInfo = {} }) {
  const doc = new jsPDF()
  const periodLabel = getPeriodLabel(period)

  // ── Cabecera
  doc.setFillColor(...DARK)
  doc.rect(0, 0, 210, 40, 'F')

  doc.setFillColor(...MINT)
  doc.rect(0, 0, 6, 40, 'F')

  doc.setFont('helvetica', 'bolditalic')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text('Abel Bou', 16, 18)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...MINT)
  doc.text('INFORME PARA GESTORÍA', 16, 28)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(200, 215, 207)
  doc.text(`Período: ${periodLabel}`, 16, 36)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 196, 36, { align: 'right' })

  // ── Resumen fiscal
  const ivaCollected  = invoices.reduce((s, i) => s + (i.iva_amount || 0), 0)
  const irpfRetained  = invoices.reduce((s, i) => s + (i.irpf_amount || 0), 0)
  const totalBilled   = invoices.reduce((s, i) => s + (i.total || 0), 0)
  const ivaDeductible = tickets.reduce((s, t) => s + (t.iva_amount || 0), 0)
  const totalGastos   = tickets.reduce((s, t) => s + (t.amount || 0), 0)
  const ivaAPagar     = Math.max(0, ivaCollected - ivaDeductible)
  const liquido       = totalBilled - ivaAPagar - irpfRetained

  let y = 52
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...DARK)
  doc.text('RESUMEN FISCAL', 14, y)
  doc.setFillColor(...MINT)
  doc.rect(14, y + 1.5, 32, 1, 'F')
  y += 10

  const summaryRows = [
    ['Facturado total (con IVA)',     formatCurrency(totalBilled)],
    ['IVA repercutido (cobrado)',     formatCurrency(ivaCollected)],
    ['IVA soportado (gastos)',        `-${formatCurrency(ivaDeductible)}`],
    ['IVA neto a declarar',          formatCurrency(ivaAPagar)],
    ['IRPF retenido en facturas',    formatCurrency(irpfRetained)],
    ['Total gastos deducibles',      formatCurrency(totalGastos)],
    ['Líquido estimado para ti',     formatCurrency(liquido)],
  ]

  autoTable(doc, {
    startY: y,
    body: summaryRows,
    styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'normal', textColor: GRAY },
      1: { fontStyle: 'bold',   textColor: DARK, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [243, 248, 245] },
    theme: 'plain',
  })

  // Caja IVA a pagar destacada
  const sy = doc.lastAutoTable.finalY + 4
  doc.setFillColor(...DARK)
  doc.roundedRect(14, sy, 182, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...MINT)
  doc.text('IVA A INGRESAR EN HACIENDA:', 20, sy + 7.8)
  doc.setTextColor(255, 255, 255)
  doc.text(formatCurrency(ivaAPagar), 192, sy + 7.8, { align: 'right' })

  // ── Facturas emitidas
  y = sy + 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...DARK)
  doc.text(`FACTURAS EMITIDAS (${invoices.length})`, 14, y)
  doc.setFillColor(...MINT)
  doc.rect(14, y + 1.5, 42, 1, 'F')
  y += 8

  if (invoices.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY)
    doc.text('Sin facturas en este período.', 14, y + 6)
    y += 12
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Nº Factura', 'Cliente', 'Fecha', 'Base', 'IVA', 'IRPF', 'Total']],
      body: invoices.map(inv => {
        const client = clients.find(c => c.id === inv.client_id)
        const ocClient = !client ? parseOcClient(inv.notes) : null
        const name = client?.name || ocClient?.name || '—'
        return [
          inv.number,
          name,
          formatDate(inv.date),
          formatCurrency(inv.subtotal),
          formatCurrency(inv.iva_amount),
          inv.irpf_amount > 0 ? `-${formatCurrency(inv.irpf_amount)}` : '—',
          formatCurrency(inv.total),
        ]
      }),
      styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 3.5 },
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [243, 248, 245] },
      columnStyles: {
        0: { fontStyle: 'bold' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' },
      },
    })
    y = doc.lastAutoTable.finalY + 12
  }

  // ── Gastos / Tickets
  if (y > 240) { doc.addPage(); y = 20 }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...DARK)
  doc.text(`GASTOS / TICKETS (${tickets.length})`, 14, y)
  doc.setFillColor(...MINT)
  doc.rect(14, y + 1.5, 38, 1, 'F')
  y += 8

  if (tickets.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY)
    doc.text('Sin gastos registrados en este período.', 14, y + 6)
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Descripción', 'Fecha', 'Categoría', 'Importe', 'IVA deducible']],
      body: tickets.map(t => [
        t.description || '—',
        formatDate(t.date),
        t.category || '—',
        formatCurrency(t.amount),
        formatCurrency(t.iva_amount),
      ]),
      styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 3.5 },
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [243, 248, 245] },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' },
      },
    })
  }

  // ── Footer en todas las páginas
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(...DARK)
    doc.rect(0, 284, 210, 13, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MINT)
    doc.text('Abel Bou — Informe Gestoría', 14, 292)
    doc.setTextColor(...LGRAY)
    doc.text(`Página ${i} de ${pageCount}`, 196, 292, { align: 'right' })
  }

  doc.save(`informe-gestoria_${periodLabel.replace(/\s/g, '-')}.pdf`)
}
