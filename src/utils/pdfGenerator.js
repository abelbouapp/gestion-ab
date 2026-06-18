import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, formatCurrency } from './helpers'

// ── Occasional client helpers ──────────────────────────────
// "Cliente ocasional" data is stored inside the `notes` field as:
//   _oc_:{"name":"...","nif":"...","address":"...","email":"...","phone":"..."}
//   <resto de notas reales, si las hay>

export function parseOcClient(notes) {
  if (!notes || !notes.startsWith('_oc_:')) return null
  try {
    const firstLine = notes.split('\n')[0]
    const json = firstLine.replace('_oc_:', '')
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function getRealNotes(notes) {
  if (!notes) return ''
  if (!notes.startsWith('_oc_:')) return notes
  const lines = notes.split('\n')
  return lines.slice(1).join('\n').trim()
}

async function loadLogoBase64() {
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'logo.png')
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

// ── PDF generator ────────────────────────────────────────────
export async function generateInvoicePDF(invoice, client, myInfo = {}) {
  const doc = new jsPDF()
  const isD = invoice.series === 'D'
  const accentR = isD ? 79  : 249
  const accentG = isD ? 127 : 115
  const accentB = isD ? 255 : 22

  const isDraft = !invoice.number

  // Resolve client info — either a saved client, or an "occasional" one stored in notes
  const occasional = !client ? parseOcClient(invoice.notes) : null
  const clientName    = client?.name    || occasional?.name    || '—'
  const clientNif     = client?.nif     || occasional?.nif     || ''
  const clientAddress = client?.address || occasional?.address || ''
  const clientEmail   = client?.email   || occasional?.email   || ''
  const realNotes     = getRealNotes(invoice.notes)

  // ── Background header band
  doc.setFillColor(247, 249, 247)
  doc.rect(0, 0, 210, 55, 'F')

  // ── Accent left stripe
  doc.setFillColor(accentR, accentG, accentB)
  doc.rect(0, 0, 5, 297, 'F')

  // ── Logo o nombre de marca
  const logoSrc = myInfo.logo || await loadLogoBase64()
  if (logoSrc) {
    const fmt = logoSrc.startsWith('data:image/png') ? 'PNG' : 'JPEG'
    doc.addImage(logoSrc, fmt, 14, 8, 0, 28)
  } else {
    doc.setFont('helvetica', 'bolditalic')
    doc.setFontSize(22)
    doc.setTextColor(26, 46, 34)
    doc.text(myInfo.company || myInfo.name || 'Abel Bou', 14, 24)
  }

  // Series badge — solo borde, sin relleno
  const pillW = isD ? 36 : 24
  doc.setDrawColor(accentR, accentG, accentB)
  doc.setLineWidth(0.7)
  doc.roundedRect(14, 38, pillW, 7, 2, 2, 'S')
  doc.setFontSize(6)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(accentR, accentG, accentB)
  doc.text(isD ? 'SERVICIOS DIGITALES' : 'PRODUCTOS', 14 + pillW / 2, 42.7, { align: 'center' })

  // Invoice number & dates (right side) — or "BORRADOR" if not yet numbered
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(26, 46, 34)
  doc.text(isDraft ? 'BORRADOR' : invoice.number, 196, 22, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 120, 110)
  doc.text(`Fecha: ${formatDate(invoice.date)}`, 196, 30, { align: 'right' })
  if (invoice.due_date) {
    doc.text(`Vencimiento: ${formatDate(invoice.due_date)}`, 196, 37, { align: 'right' })
  }

  // Status badge — solo se muestra para borradores (enviada/pagada no necesitan distintivo)
  if (invoice.status === 'draft' || !invoice.status) {
    doc.setFillColor(200, 200, 200)
    doc.roundedRect(163, 40, 33, 8, 2, 2, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('BORRADOR', 179.5, 45.5, { align: 'center' })
  }

  // ── Draft notice banner
  if (isDraft) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    doc.setTextColor(180, 130, 30)
    doc.text('Documento provisional para revisión del cliente — sin número fiscal asignado, no válido como factura oficial.', 14, 50)
  }

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
  doc.text(clientName, 110, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 120, 110)
  let iy = y + 6, cy = y + 6
  if (myInfo.name && myInfo.company && myInfo.name !== myInfo.company) {
    doc.text(myInfo.name, 14, iy); iy += 5
  }
  if (myInfo.nif)     { doc.text(`NIF: ${myInfo.nif}`, 14, iy); iy += 5 }
  if (myInfo.address) { doc.text(myInfo.address, 14, iy); iy += 5 }
  if (myInfo.email)   { doc.text(myInfo.email, 14, iy); iy += 5 }
  if (myInfo.phone)   { doc.text(myInfo.phone, 14, iy); iy += 5 }
  if (clientNif)     { doc.text(`NIF: ${clientNif}`, 110, cy); cy += 5 }
  if (clientAddress) { doc.text(clientAddress, 110, cy); cy += 5 }
  if (clientEmail)   { doc.text(clientEmail, 110, cy); cy += 5 }

  // Lines table
  const tableY = Math.max(iy, cy) + 8
  const lines  = invoice.lines || []
  const isPackage = lines.length > 1 && lines.filter(l => Number(l.price) > 0).length === 1

  if (isPackage) {
    autoTable(doc, {
      startY: tableY,
      head: [['Conceptos incluidos']],
      body: lines.map(l => [l.desc]),
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: [26, 46, 34] },
      headStyles: { fillColor: [26, 46, 34], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [247, 249, 247] },
      columnStyles: { 0: { cellWidth: 166 } },
    })
    const pkgY = doc.lastAutoTable.finalY + 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(accentR, accentG, accentB)
    doc.text(`Precio del paquete: ${formatCurrency(invoice.subtotal)}`, 196, pkgY, { align: 'right' })
    doc.setTextColor(100, 120, 110)
    doc.setFont('helvetica', 'normal')
    var fy = pkgY + 10
  } else {
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
    var fy = doc.lastAutoTable.finalY + 6
  }

  // Totals block
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

  // IBAN — recuadro con borde
  if (myInfo.iban) {
    const ibanY = totalY + 10
    doc.setFillColor(247, 249, 247)
    doc.roundedRect(14, ibanY, 120, 14, 2, 2, 'F')
    doc.setDrawColor(accentR, accentG, accentB)
    doc.setLineWidth(0.6)
    doc.roundedRect(14, ibanY, 120, 14, 2, 2, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(74, 99, 88)
    doc.text('PAGO POR TRANSFERENCIA', 20, ibanY + 5.5)
    doc.setFontSize(9)
    doc.setTextColor(accentR, accentG, accentB)
    doc.text(myInfo.iban, 20, ibanY + 11)
  }

  // Notes (occasional client header already stripped via getRealNotes)
  if (realNotes) {
    const ny = totalY + (myInfo.iban ? 30 : 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(138, 168, 152)
    doc.text(`Notas: ${realNotes}`, 14, ny)
  }

  // Footer
  doc.setDrawColor(226, 234, 228)
  doc.line(14, 283, 196, 283)
  doc.setFontSize(7)
  doc.setTextColor(160, 180, 170)
  doc.text('Abel Bou · Desarrollador web · Diseñador Gráfico · Creativos', 105, 288, { align: 'center' })

  const fileLabel = invoice.number || 'BORRADOR'
  doc.save(`${fileLabel}_${clientName}.pdf`)
}