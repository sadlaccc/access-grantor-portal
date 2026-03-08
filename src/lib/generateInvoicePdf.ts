import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoiceData {
  invoice_number: string;
  client_name: string;
  client_email: string | null;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  due_date: string;
  created_at: string;
  items?: InvoiceItem[];
}

export function generateInvoicePdf(invoice: InvoiceData) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(24);
  doc.setTextColor(30, 58, 138);
  doc.text('INVOICE', 14, 25);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Intellinks East Africa', 14, 35);
  doc.text('Nairobi, Kenya', 14, 41);

  // Invoice info
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`Invoice #: ${invoice.invoice_number}`, 140, 25);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 140, 31);
  doc.text(`Due: ${new Date(invoice.due_date).toLocaleDateString()}`, 140, 37);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 140, 43);

  // Bill To
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('Bill To:', 14, 58);
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(invoice.client_name, 14, 65);
  if (invoice.client_email) {
    doc.text(invoice.client_email, 14, 71);
  }

  // Line Items table
  const items = invoice.items?.length
    ? invoice.items.map(i => [i.description, String(i.quantity), `KES ${i.unit_price.toLocaleString()}`, `KES ${i.total.toLocaleString()}`])
    : [['Services rendered', '1', `KES ${invoice.subtotal.toLocaleString()}`, `KES ${invoice.subtotal.toLocaleString()}`]];

  autoTable(doc, {
    startY: 80,
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: items,
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138], textColor: 255 },
    styles: { fontSize: 9 },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text('Subtotal:', 140, finalY);
  doc.text(`KES ${invoice.subtotal.toLocaleString()}`, 175, finalY, { align: 'right' });
  doc.text(`VAT (${invoice.tax_rate}%):`, 140, finalY + 7);
  doc.text(`KES ${invoice.tax_amount.toLocaleString()}`, 175, finalY + 7, { align: 'right' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 140, finalY + 17);
  doc.text(`KES ${invoice.total_amount.toLocaleString()}`, 175, finalY + 17, { align: 'right' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Thank you for your business — Intellinks East Africa', 105, 280, { align: 'center' });

  doc.save(`${invoice.invoice_number}.pdf`);
}

export function generateExpenseReportPdf(expenses: Array<{ description: string | null; category: string; amount: number; expense_date: string | null; vendor: string | null; status: string }>) {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('Expense Report', 14, 25);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 33);
  doc.text('Intellinks East Africa', 14, 39);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  autoTable(doc, {
    startY: 50,
    head: [['Description', 'Category', 'Vendor', 'Date', 'Amount', 'Status']],
    body: expenses.map(e => [
      e.description || '-',
      e.category,
      e.vendor || '-',
      e.expense_date ? new Date(e.expense_date).toLocaleDateString() : '-',
      `KES ${e.amount.toLocaleString()}`,
      e.status,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138] },
    styles: { fontSize: 8 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: KES ${total.toLocaleString()}`, 14, finalY);

  doc.save(`expense-report-${new Date().toISOString().split('T')[0]}.pdf`);
}
