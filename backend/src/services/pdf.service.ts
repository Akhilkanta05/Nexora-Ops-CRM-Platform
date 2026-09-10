import PDFDocument from 'pdfkit';
import { Response } from 'express';

export class PdfService {
  static generateChallanInvoice(challan: any, res: Response) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Parse snapshot
    let customerSnapshot: any = {};
    try {
      customerSnapshot = typeof challan.customerSnapshot === 'string'
        ? JSON.parse(challan.customerSnapshot)
        : challan.customerSnapshot;
    } catch {
      customerSnapshot = { name: challan.customer?.name || 'Valued Customer' };
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Challan_${challan.challanNumber}.pdf"`
    );

    doc.pipe(res);

    // Header styling
    doc.fillColor('#1e293b').fontSize(20).text('FUNSROOMS WHOLESALE ERP', 50, 50, { bold: true } as any);
    doc.fontSize(10).fillColor('#64748b').text('Industrial Goods & Equipment Distribution Hub', 50, 75);
    doc.text('GSTIN: 27AABCF1234F1Z8 | Email: billing@funsrooms.com | Tel: +91 22 4000 8888', 50, 90);

    // Divider
    doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#cbd5e1').stroke();

    // Document Title & Metadata
    doc.fillColor('#0f172a').fontSize(16).text('DELIVERY CHALLAN & TAX INVOICE', 50, 125, { bold: true } as any);

    // Left block: Customer Details
    doc.fontSize(10).fillColor('#334155');
    doc.text('BILL TO & DELIVER TO:', 50, 155, { underline: true } as any);
    doc.fontSize(11).fillColor('#0f172a').text(customerSnapshot.businessName || customerSnapshot.name || 'N/A', 50, 170, { bold: true } as any);
    doc.fontSize(9).fillColor('#475569');
    doc.text(`Contact: ${customerSnapshot.name || 'N/A'} (${customerSnapshot.mobile || 'N/A'})`, 50, 185);
    doc.text(`Email: ${customerSnapshot.email || 'N/A'}`, 50, 198);
    doc.text(`Address: ${customerSnapshot.address || 'N/A'}`, 50, 211, { width: 240 });
    if (customerSnapshot.gstNumber) {
      doc.text(`GSTIN: ${customerSnapshot.gstNumber}`, 50, 235);
    }

    // Right block: Challan Info
    const rightX = 350;
    doc.fontSize(10).fillColor('#334155');
    doc.text('CHALLAN DETAILS:', rightX, 155, { underline: true } as any);
    doc.fontSize(10).fillColor('#0f172a');
    doc.text(`Challan No:`, rightX, 170);
    doc.text(challan.challanNumber, rightX + 80, 170, { bold: true } as any);

    doc.text(`Date:`, rightX, 185);
    doc.text(new Date(challan.createdAt).toLocaleDateString('en-GB'), rightX + 80, 185);

    doc.text(`Status:`, rightX, 200);
    doc.text(challan.status.toUpperCase(), rightX + 80, 200, { bold: true } as any);

    doc.text(`Created By:`, rightX, 215);
    doc.text(challan.createdByName || 'Sales Staff', rightX + 80, 215);

    // Items Table Header
    const tableTop = 270;
    doc.rect(50, tableTop, 495, 22).fill('#f1f5f9');

    doc.fillColor('#1e293b').fontSize(9);
    doc.text('#', 55, tableTop + 6, { width: 25, bold: true } as any);
    doc.text('SKU / Code', 85, tableTop + 6, { width: 85, bold: true } as any);
    doc.text('Product Description', 175, tableTop + 6, { width: 170, bold: true } as any);
    doc.text('Unit Price', 350, tableTop + 6, { width: 60, align: 'right', bold: true } as any);
    doc.text('Qty', 415, tableTop + 6, { width: 40, align: 'right', bold: true } as any);
    doc.text('Total (INR)', 465, tableTop + 6, { width: 75, align: 'right', bold: true } as any);

    let y = tableTop + 26;
    let index = 1;

    for (const item of challan.items) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.fillColor('#334155').fontSize(9);
      doc.text(index.toString(), 55, y, { width: 25 });
      doc.text(item.sku || '-', 85, y, { width: 85 });
      doc.text(item.productName || 'Item', 175, y, { width: 170 });
      doc.text(`₹${Number(item.unitPrice).toFixed(2)}`, 350, y, { width: 60, align: 'right' });
      doc.text(item.quantity.toString(), 415, y, { width: 40, align: 'right' });
      doc.text(`₹${Number(item.totalPrice).toFixed(2)}`, 465, y, { width: 75, align: 'right' });

      // Subtle row bottom line
      doc.moveTo(50, y + 16).lineTo(545, y + 16).strokeColor('#f1f5f9').stroke();
      y += 22;
      index++;
    }

    // Totals Section
    y += 10;
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#cbd5e1').stroke();
    y += 8;

    doc.fontSize(10).fillColor('#0f172a');
    doc.text('Total Items Quantity:', 300, y, { align: 'right', width: 150 });
    doc.text(challan.totalQuantity.toString(), 465, y, { align: 'right', width: 75, bold: true } as any);

    y += 18;
    doc.fontSize(12).fillColor('#0f172a');
    doc.text('Grand Total Amount:', 300, y, { align: 'right', width: 150, bold: true } as any);
    doc.text(`₹${Number(challan.totalAmount).toFixed(2)}`, 465, y, { align: 'right', width: 75, bold: true } as any);

    // Footer & Signature
    const footerY = 680;
    doc.rect(50, footerY, 495, 65).strokeColor('#e2e8f0').stroke();
    doc.fontSize(8).fillColor('#64748b').text('Terms & Conditions:', 60, footerY + 8, { bold: true } as any);
    doc.text('1. Goods once sold will not be taken back or exchanged without prior written authorization.', 60, footerY + 20);
    doc.text('2. Disputes, if any, are subject to local jurisdiction only.', 60, footerY + 30);
    doc.text('3. This is a computer generated document and valid upon confirmation.', 60, footerY + 40);

    doc.fontSize(9).fillColor('#0f172a').text('For FUNSROOMS ENTERPRISES', 370, footerY + 12, { align: 'center', width: 160 });
    doc.fontSize(8).fillColor('#64748b').text('Authorised Signatory', 370, footerY + 46, { align: 'center', width: 160 });

    doc.end();
  }
}
