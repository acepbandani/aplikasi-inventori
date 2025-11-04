
import { Order } from '../types';

declare global {
  interface Window {
    jspdf: any;
  }
}

export const generateInvoicePdf = (order: Order): void => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('🥛 Susu UHT', 14, 22);
  doc.setFontSize(16);
  doc.text('INVOICE', 190, 22, { align: 'right' });
  doc.setLineWidth(0.5);
  doc.line(14, 28, 196, 28);

  // Invoice Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor Invoice: ${order.id}`, 190, 35, { align: 'right' });
  doc.text(`Tanggal Pesan: ${new Date(order.orderDate).toLocaleDateString('id-ID')}`, 190, 40, { align: 'right' });
  
  // Customer Info
  doc.setFont('helvetica', 'bold');
  doc.text('Ditagihkan Kepada:', 14, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(order.customerName, 14, 50);
  doc.text(order.address, 14, 55);
  doc.text(order.phone, 14, 60);

  // Table
  (doc as any).autoTable({
    startY: 70,
    head: [['Produk', 'Jumlah', 'Harga Satuan', 'Total']],
    body: [
      [
        order.productName,
        order.quantity,
        `Rp ${order.totalPrice / order.quantity}`,
        `Rp ${order.totalPrice}`
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 144, 255] },
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Tagihan:', 140, finalY + 10, { align: 'right' });
  doc.text(`Rp ${order.totalPrice}`, 190, finalY + 10, { align: 'right' });

  // Footer
  doc.setFontSize(10);
  doc.setLineWidth(0.5);
  doc.line(14, 270, 196, 270);
  doc.text('Terima kasih telah berbelanja!', 105, 275, { align: 'center' });
  doc.text('Admin Susu UHT', 190, 260, {align: 'right'});
  doc.text('(Tanda Tangan Digital)', 190, 265, {align: 'right'});

  doc.save(`invoice-${order.id}.pdf`);
};


export const generateSalesReportPdf = (orders: Order[], startDate: string, endDate: string): void => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Laporan Penjualan Susu UHT', 14, 22);
    doc.setFontSize(12);
    doc.text(`Periode: ${startDate} - ${endDate}`, 14, 30);

    const tableColumn = ["ID Pesanan", "Pelanggan", "Produk", "Jumlah", "Total Harga", "Tanggal", "Status"];
    const tableRows: (string|number)[][] = [];

    let totalRevenue = 0;
    orders.forEach(order => {
        const orderData = [
            order.id,
            order.customerName,
            order.productName,
            order.quantity,
            `Rp ${order.totalPrice}`,
            new Date(order.orderDate).toLocaleDateString('id-ID'),
            order.status
        ];
        tableRows.push(orderData);
        if (order.status === 'Dikonfirmasi') {
            totalRevenue += order.totalPrice;
        }
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [30, 144, 255] },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(14);
    doc.text(`Total Pendapatan (Dikonfirmasi): Rp ${totalRevenue.toLocaleString('id-ID')}`, 14, finalY + 15);


    doc.save(`laporan-penjualan-${new Date().toISOString().slice(0, 10)}.pdf`);
};
