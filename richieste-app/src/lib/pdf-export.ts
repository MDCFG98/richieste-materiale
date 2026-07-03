// Modulo PDF per Richieste Materiale.
// jsPDF viene importato dinamicamente per non appesantire il bundle principale.
//
// ⚠️ LOGO PLACEHOLDER: il cerchio arancione "RM" qui sotto è un segnaposto.
// Sostituiscilo con i loghi reali dell'azienda convertendoli in base64
// (stesso procedimento usato in Magazzino Smart) e incollando la stringa
// al posto di LOGO_B64.

const LOGO_B64 = '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'

interface RichiestaData {
  id: string
  text: string
  authorName: string
  status: string
  createdAt?: { toDate?: () => Date }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'In attesa',
  consegnato: 'Consegnato',
  ordinato: 'Ordinato',
  in_lavorazione: 'In lavorazione',
  non_approvato: 'Non approvata',
}

// ── EXPORT 1: STORICO COMPLETO IN TABELLA ──────────────────────────────────
export async function exportHistoryPDF(richieste: RichiestaData[]) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const docPDF = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297
  const margin = 12

  // Header
  try {
    docPDF.addImage(`data:image/png;base64,${LOGO_B64}`, 'PNG', margin, 8, 14, 14)
  } catch (_) {}

  docPDF.setFont('helvetica', 'bold')
  docPDF.setFontSize(16)
  docPDF.setTextColor(20, 20, 20)
  docPDF.text('Storico Richieste Materiale', margin + 18, 14)

  docPDF.setFont('helvetica', 'normal')
  docPDF.setFontSize(9)
  docPDF.setTextColor(120, 120, 120)
  docPDF.text('Construction & Drilling — Lavori Elettrici', margin + 18, 19)

  docPDF.setFontSize(8)
  docPDF.text(`Esportato il ${new Date().toLocaleString('it-IT')}`, W - margin, 12, { align: 'right' })
  docPDF.text(`Totale richieste: ${richieste.length}`, W - margin, 17, { align: 'right' })

  docPDF.setDrawColor(230, 230, 230)
  docPDF.setLineWidth(0.3)
  docPDF.line(margin, 26, W - margin, 26)

  // Tabella
  const rows = richieste.map((r) => {
    const d = r.createdAt?.toDate?.()
    return [
      d ? d.toLocaleDateString('it-IT') : '—',
      d ? d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '—',
      r.authorName || '—',
      r.text || '—',
      STATUS_LABELS[r.status] || r.status,
    ]
  })

  autoTable(docPDF, {
    startY: 32,
    head: [['Data', 'Ora', 'Operaio', 'Richiesta', 'Stato']],
    body: rows,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [30, 30, 30],
      lineColor: [225, 225, 225],
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [235, 235, 235],
      textColor: [30, 30, 30],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 16 },
      2: { cellWidth: 35, fontStyle: 'bold' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 32 },
    },
    didParseCell: (data) => {
      // Colora la colonna Stato in base al valore
      if (data.column.index === 4 && data.cell.section === 'body') {
        const val = data.cell.raw as string
        if (val === 'Consegnato') data.cell.styles.textColor = [34, 139, 34]
        else if (val === 'Ordinato') data.cell.styles.textColor = [37, 99, 235]
        else if (val === 'In lavorazione') data.cell.styles.textColor = [180, 140, 0]
        else if (val === 'Non approvata') data.cell.styles.textColor = [200, 40, 40]
        else data.cell.styles.textColor = [140, 140, 140]
        data.cell.styles.fontStyle = 'bold'
      }
    },
    didDrawPage: () => {
      const pageH = 210
      docPDF.setDrawColor(220, 220, 220)
      docPDF.line(margin, pageH - 10, W - margin, pageH - 10)
      docPDF.setFontSize(7)
      docPDF.setTextColor(150, 150, 150)
      docPDF.text('Richieste Materiale — Construction & Drilling', margin, pageH - 5)
    },
  })

  docPDF.save(`storico_richieste_${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ── EXPORT 2: MODULO DI CONSEGNA SINGOLO CON FIRME ─────────────────────────
export async function exportModuloConsegnaPDF(richiesta: RichiestaData, statusLabel: string) {
  const { default: jsPDF } = await import('jspdf')

  const docPDF = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 14

  // ── HEADER ──────────────────────────────────────────────────────────────
  try {
    docPDF.addImage(`data:image/png;base64,${LOGO_B64}`, 'PNG', margin, 4, 18, 18)
  } catch (_) {}

  docPDF.setFont('helvetica', 'bold')
  docPDF.setFontSize(10)
  docPDF.setTextColor(249, 115, 22) // orange
  const label = 'MODULO CONSEGNA MATERIALE'
  const labelW = docPDF.getTextWidth(label)
  docPDF.text(label, W - margin - labelW, 12)

  docPDF.setDrawColor(249, 115, 22)
  docPDF.setLineWidth(0.8)
  docPDF.line(margin, 26, W - margin, 26)

  // ── TITOLO ──────────────────────────────────────────────────────────────
  docPDF.setFont('helvetica', 'bold')
  docPDF.setFontSize(20)
  docPDF.setTextColor(20, 20, 20)
  docPDF.text('MODULO DI CONSEGNA', margin, 40)

  docPDF.setFont('helvetica', 'normal')
  docPDF.setFontSize(10)
  docPDF.setTextColor(140, 140, 140)
  docPDF.text('Lavori Elettrici — Rete ENEL', margin, 46)

  // ── INFO BOX ────────────────────────────────────────────────────────────
  const d = richiesta.createdAt?.toDate?.() || new Date()
  const boxY = 54
  docPDF.setFillColor(248, 248, 248)
  docPDF.roundedRect(margin, boxY, W - margin * 2, 24, 2, 2, 'F')

  docPDF.setFont('helvetica', 'bold')
  docPDF.setFontSize(8)
  docPDF.setTextColor(100, 100, 100)
  docPDF.text('DATA RICHIESTA', margin + 6, boxY + 7)
  docPDF.text('ORA', margin + 55, boxY + 7)
  docPDF.text('OPERAIO RICHIEDENTE', margin + 85, boxY + 7)
  docPDF.text('N° DOCUMENTO', margin + 145, boxY + 7)

  docPDF.setFont('helvetica', 'normal')
  docPDF.setFontSize(10)
  docPDF.setTextColor(20, 20, 20)
  docPDF.text(d.toLocaleDateString('it-IT'), margin + 6, boxY + 15)
  docPDF.text(d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }), margin + 55, boxY + 15)
  docPDF.setFont('helvetica', 'bold')
  docPDF.text(richiesta.authorName || '—', margin + 85, boxY + 15)
  docPDF.setFont('helvetica', 'normal')
  docPDF.setFontSize(9)
  docPDF.text(`RM-${richiesta.id.slice(0, 8).toUpperCase()}`, margin + 145, boxY + 15)

  // ── DESCRIZIONE MATERIALE RICHIESTO ────────────────────────────────────
  const descY = boxY + 34
  docPDF.setFont('helvetica', 'bold')
  docPDF.setFontSize(9)
  docPDF.setTextColor(100, 100, 100)
  docPDF.text('MATERIALE RICHIESTO', margin, descY)

  docPDF.setDrawColor(220, 220, 220)
  docPDF.setLineWidth(0.3)
  docPDF.roundedRect(margin, descY + 4, W - margin * 2, 45, 2, 2, 'D')

  docPDF.setFont('helvetica', 'normal')
  docPDF.setFontSize(10)
  docPDF.setTextColor(30, 30, 30)
  const testoRighe = docPDF.splitTextToSize(richiesta.text || '—', W - margin * 2 - 12)
  docPDF.text(testoRighe, margin + 6, descY + 12)

  // ── STATO ESITO ─────────────────────────────────────────────────────────
  const esitoY = descY + 56
  docPDF.setFont('helvetica', 'bold')
  docPDF.setFontSize(9)
  docPDF.setTextColor(100, 100, 100)
  docPDF.text('ESITO', margin, esitoY)

  const esitoColors: Record<string, [number, number, number]> = {
    'Consegnato': [34, 139, 34],
    'Ordinato': [37, 99, 235],
    'In lavorazione': [180, 140, 0],
    'Non approvata': [200, 40, 40],
    'In attesa': [140, 140, 140],
  }
  const [er, eg, eb] = esitoColors[statusLabel] || [140, 140, 140]
  docPDF.setFillColor(er, eg, eb)
  docPDF.roundedRect(margin, esitoY + 4, 55, 10, 2, 2, 'F')
  docPDF.setFont('helvetica', 'bold')
  docPDF.setFontSize(10)
  docPDF.setTextColor(255, 255, 255)
  docPDF.text(statusLabel.toUpperCase(), margin + 27.5, esitoY + 10.5, { align: 'center' })

  // ── FIRME ────────────────────────────────────────────────────────────────
  const firmeY = esitoY + 30
  const firmaW = (W - margin * 2 - 10) / 2

  docPDF.setFillColor(255, 255, 255)
  docPDF.setDrawColor(180, 180, 180)
  docPDF.setLineWidth(0.3)
  docPDF.roundedRect(margin, firmeY, firmaW, 36, 2, 2, 'FD')
  docPDF.setFont('helvetica', 'bold')
  docPDF.setFontSize(8)
  docPDF.setTextColor(100, 100, 100)
  docPDF.text('FIRMA MAGAZZINIERE', margin + firmaW / 2, firmeY + 7, { align: 'center' })
  docPDF.setFont('helvetica', 'normal')
  docPDF.setFontSize(8)
  docPDF.setTextColor(180, 180, 180)
  docPDF.text('_______________________________', margin + firmaW / 2, firmeY + 27, { align: 'center' })

  const firma2X = margin + firmaW + 10
  docPDF.roundedRect(firma2X, firmeY, firmaW, 36, 2, 2, 'FD')
  docPDF.setFont('helvetica', 'bold')
  docPDF.setFontSize(8)
  docPDF.setTextColor(100, 100, 100)
  docPDF.text('FIRMA OPERATORE RICEVENTE', firma2X + firmaW / 2, firmeY + 7, { align: 'center' })
  docPDF.setFont('helvetica', 'normal')
  docPDF.setTextColor(180, 180, 180)
  docPDF.text('_______________________________', firma2X + firmaW / 2, firmeY + 27, { align: 'center' })

  // ── FOOTER ──────────────────────────────────────────────────────────────
  const pageH = 297
  docPDF.setDrawColor(220, 220, 220)
  docPDF.setLineWidth(0.2)
  docPDF.line(margin, pageH - 12, W - margin, pageH - 12)
  docPDF.setFont('helvetica', 'normal')
  docPDF.setFontSize(7)
  docPDF.setTextColor(150, 150, 150)
  docPDF.text('Documento generato da Richieste Materiale — Construction & Drilling', margin, pageH - 5)
  docPDF.text(`Stampato il ${new Date().toLocaleString('it-IT')}`, W - margin, pageH - 5, { align: 'right' })

  docPDF.save(`modulo_consegna_${richiesta.authorName?.replace(/\s+/g, '_') || 'operaio'}_${d.toISOString().slice(0, 10)}.pdf`)
}
