import { jsPDF } from 'jspdf'
import type { Order } from '@/types'
import { DIGITAL_FEE } from '@/types'
import { generateQRDataURL } from './useQRCode'

function money(n: number) {
  return `${Number(n || 0).toLocaleString('fr-FR')} XOF`
}

export async function generateInvoicePDF(order: Order) {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = doc.internal.pageSize.getWidth()
    const H = doc.internal.pageSize.getHeight()
    const isDigital = order.format === 'digital'
    const margin = 20

    // Fond blanc épuré
    doc.setFillColor(252, 251, 248)
    doc.rect(0, 0, W, H, 'F')

    // Ligne or fine en haut
    doc.setFillColor(184, 148, 48)
    doc.rect(0, 0, W, 2.5, 'F')

    // En-tête minimal
    doc.setTextColor(30, 28, 40)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text("Jin'ckets", margin, 22)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 118, 130)
    doc.text('Facture', W - margin, 18, { align: 'right' })
    doc.setTextColor(40, 38, 50)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(order.code || '—', W - margin, 25, { align: 'right' })

    // Ligne séparatrice
    doc.setDrawColor(220, 218, 210)
    doc.setLineWidth(0.3)
    doc.line(margin, 32, W - margin, 32)

    // Deux colonnes : date / client
    let y = 42
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(140, 138, 150)
    doc.text('DATE', margin, y)
    doc.text('CLIENT', W / 2, y)
    y += 6
    doc.setFontSize(10)
    doc.setTextColor(30, 28, 40)
    doc.text(new Date(order.createdAt).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    }), margin, y)
    doc.setFont('helvetica', 'bold')
    doc.text(order.userName || '—', W / 2, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(90, 88, 100)
    if (order.userPhone) doc.text(order.userPhone, W / 2, y)
    y += 5
    const place = [order.userCommune, order.userCity, order.userCountry].filter(Boolean).join(', ')
    if (place) {
      doc.text(place, W / 2, y)
      y += 5
    }
    if (order.userEmail) {
      doc.text(order.userEmail, W / 2, y)
      y += 5
    }

    y += 6
    doc.setFontSize(8)
    doc.setTextColor(140, 138, 150)
    doc.text(
      `Format · ${isDigital ? 'Numérique (QR)' : 'Physique'}  ·  Statut · ${(order.status || '').toUpperCase()}`,
      margin,
      y
    )
    y += 8

    // Tableau
    doc.setFillColor(245, 243, 238)
    doc.rect(margin, y, W - margin * 2, 9, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(100, 98, 110)
    doc.text('DÉSIGNATION', margin + 3, y + 6)
    doc.text('QTÉ', 125, y + 6)
    doc.text('P.U.', 145, y + 6)
    doc.text('MONTANT', W - margin - 3, y + 6, { align: 'right' })
    y += 14

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(35, 33, 45)
    ;(order.items || []).forEach((item) => {
      doc.setFontSize(10)
      doc.text(item.ticketName || 'Ticket', margin + 3, y)
      doc.setFontSize(8)
      doc.setTextColor(130, 128, 140)
      doc.text(item.eventTitle || '', margin + 3, y + 4.5)
      doc.setTextColor(35, 33, 45)
      doc.setFontSize(10)
      doc.text(String(item.quantity ?? 0), 125, y)
      doc.text(money(item.unitPrice), 145, y)
      doc.text(money((item.unitPrice || 0) * (item.quantity || 0)), W - margin - 3, y, {
        align: 'right'
      })
      y += 12
      doc.setDrawColor(235, 233, 228)
      doc.line(margin, y - 3, W - margin, y - 3)
    })

    y += 4
    if (isDigital) {
      doc.setFontSize(9)
      doc.setTextColor(100, 98, 110)
      doc.text('Frais format numérique', margin + 3, y)
      doc.text(money(DIGITAL_FEE), W - margin - 3, y, { align: 'right' })
      y += 7
      if (order.paymentMethod) {
        doc.text(`Paiement · ${order.paymentMethod}`, margin + 3, y)
        y += 7
      }
    } else if (order.deliveryMethod) {
      doc.setFontSize(9)
      doc.setTextColor(100, 98, 110)
      doc.text(`Réception · ${order.deliveryMethod.name}`, margin + 3, y)
      y += 6
      if (order.deliveryAddress) {
        doc.text(order.deliveryAddress, margin + 3, y)
        y += 6
      }
    }

    y += 6
    // Total sobre
    doc.setDrawColor(184, 148, 48)
    doc.setLineWidth(0.6)
    doc.line(W / 2, y, W - margin, y)
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(30, 28, 40)
    doc.text('Total', W / 2, y)
    doc.setTextColor(160, 120, 30)
    doc.text(money(order.total), W - margin, y, { align: 'right' })
    y += 16

    // QR discret
    if (order.qrData) {
      try {
        const qr = await generateQRDataURL(order.qrData, 240)
        if (qr) {
          doc.addImage(qr, 'PNG', margin, y, 32, 32)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(120, 118, 130)
          doc.text('Code de validation', margin + 38, y + 12)
          doc.setTextColor(40, 38, 50)
          doc.setFontSize(10)
          doc.text(order.code || '', margin + 38, y + 20)
        }
      } catch {
        /* ignore */
      }
    }

    // Pied de page minimal
    doc.setDrawColor(220, 218, 210)
    doc.setLineWidth(0.3)
    doc.line(margin, H - 18, W - margin, H - 18)
    doc.setFontSize(7)
    doc.setTextColor(150, 148, 160)
    doc.text("Jin'ckets  ·  +225 07 59 12 80 35", W / 2, H - 12, { align: 'center' })
    doc.text('Document de preuve d\'achat', W / 2, H - 7, { align: 'center' })

    doc.save(`Jinckets-Facture-${order.code || Date.now()}.pdf`)
  } catch (err) {
    console.error('Erreur génération facture PDF:', err)
    alert('Impossible de générer la facture PDF.')
    throw err
  }
}
