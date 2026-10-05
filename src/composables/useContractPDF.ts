import { jsPDF } from 'jspdf'

export interface ContractPDFData {
  name: string
  email: string
  phone: string
  organizationName: string
  contractSignature: string
  contractSignatureImage?: string
  signedAt?: string
  idDocumentType?: string
}

const CLAUSES = [
  "1. L'organisateur s'engage à fournir des informations exactes sur ses événements (date, lieu, tarifs, stock).",
  "2. Les tickets numériques sont générés par la plateforme (+500 XOF de frais format). Les tickets physiques sont gérés via WhatsApp entre client et organisateur.",
  "3. Jin'ckets peut retenir une commission sur les ventes (conditions détaillées avec le backend).",
  "4. L'organisateur est responsable du respect de la réglementation ivoirienne applicable aux événements publics.",
  "5. Les commandes physiques passent par discussion WhatsApp ; les numériques sont confirmées avec QR code.",
  "6. Jin'ckets se réserve le droit de suspendre un compte en cas de fraude ou d'abus.",
  "7. En signant ci-dessous (signature manuscrite), l'organisateur accepte ces conditions et autorise Jin'ckets à afficher ses événements après validation admin.",
  "8. Pour les tickets au format physique : un compte cumulé est effectué à hauteur de 500 XOF par commande. Le total est facturé à l'organisateur en fin de mois et doit être réglé obligatoirement dans un délai maximum d'une (1) semaine après émission de la facture.",
  "9. Une pièce d'identité valide (CNI ou passeport uniquement) doit être fournie avant la signature du présent contrat."
]

export function downloadContractPDF(data: ContractPDFData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 18
  let y = 20

  // Header
  doc.setFillColor(5, 5, 16)
  doc.rect(0, 0, pageWidth, 32, 'F')
  doc.setTextColor(232, 197, 71)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text("Jin'ckets", margin, 16)
  doc.setFontSize(10)
  doc.setTextColor(184, 176, 208)
  doc.text("Contrat de partenariat organisateur", margin, 24)

  y = 42
  doc.setTextColor(30, 30, 50)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text("Contrat d'annonciateur d'événements", margin, y)
  y += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 80)
  doc.text(`Date: ${data.signedAt || new Date().toLocaleString('fr-FR')}`, margin, y)
  y += 8

  // Parties
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 50)
  doc.text('Organisateur', margin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 80)
  const info = [
    `Nom: ${data.name}`,
    `Structure: ${data.organizationName}`,
    `Email: ${data.email}`,
    `WhatsApp: ${data.phone}`
  ]
  info.forEach(line => {
    doc.text(line, margin, y)
    y += 5.5
  })
  y += 4

  doc.setDrawColor(201, 162, 39)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 50)
  doc.text('Articles', margin, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(50, 50, 70)

  CLAUSES.forEach(clause => {
    const lines = doc.splitTextToSize(clause, pageWidth - margin * 2)
    if (y + lines.length * 4.5 > 270) {
      doc.addPage()
      y = 20
    }
    doc.text(lines, margin, y)
    y += lines.length * 4.5 + 2
  })

  y += 6
  if (y > 230) {
    doc.addPage()
    y = 20
  }

  doc.setDrawColor(201, 162, 39)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 50)
  doc.text('Signature', margin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 80)
  doc.text(`Signataire: ${data.contractSignature}`, margin, y)
  y += 8

  if (data.contractSignatureImage) {
    try {
      const imgW = 70
      const imgH = 28
      doc.setDrawColor(200, 200, 210)
      doc.rect(margin, y, imgW + 4, imgH + 4)
      doc.addImage(data.contractSignatureImage, 'PNG', margin + 2, y + 2, imgW, imgH)
      y += imgH + 10
    } catch {
      doc.text('(Signature manuscrite jointe)', margin, y)
      y += 6
    }
  }

  y += 4
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 130)
  doc.text("Plateforme Jin'ckets — Contact: +225 07 59 12 80 35", pageWidth / 2, 285, { align: 'center' })
  doc.text('Document généré électroniquement — valeur de preuve de signature numérique', pageWidth / 2, 290, { align: 'center' })

  const safeName = (data.organizationName || data.name || 'contrat').replace(/[^\w\-]+/g, '_')
  doc.save(`Jinckets-Contrat-Organisateur-${safeName}.pdf`)
}
