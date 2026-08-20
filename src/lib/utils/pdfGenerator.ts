import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generatePaymentReceipt(payment: any) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(22)
  doc.setTextColor(234, 179, 8) // Gold color
  doc.text('ALTREX FITNESS', 105, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text('Payment Receipt', 105, 28, { align: 'center' })
  doc.text(`Receipt ID: ${payment.id.substring(0, 8).toUpperCase()}`, 105, 34, { align: 'center' })
  
  // Date and Time
  doc.setFontSize(10)
  doc.setTextColor(0)
  doc.text(`Date: ${new Date(payment.created_at).toLocaleDateString()}`, 20, 50)
  doc.text(`Time: ${new Date(payment.created_at).toLocaleTimeString()}`, 140, 50)

  // Member Details
  doc.setFontSize(12)
  doc.text(`Member Name: ${payment.members?.full_name || 'N/A'}`, 20, 65)

  // Payment Details Table
  autoTable(doc, {
    startY: 75,
    head: [['Description', 'Payment Method', 'Amount (INR)']],
    body: [
      [
        payment.description || 'Gym Payment', 
        payment.method.toUpperCase(), 
        `Rs. ${payment.amount}`
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  })
  
  // Footer
  doc.setFontSize(10)
  doc.setTextColor(150)
  const finalY = (doc as any).lastAutoTable.finalY || 100
  doc.text('Thank you for your payment!', 105, finalY + 20, { align: 'center' })
  doc.text('For any queries, contact support.', 105, finalY + 26, { align: 'center' })

  // Save the PDF
  doc.save(`Receipt_${payment.members?.full_name?.replace(/[^a-zA-Z0-9]/g, '') || 'Member'}_${payment.id.substring(0,6)}.pdf`)
}
