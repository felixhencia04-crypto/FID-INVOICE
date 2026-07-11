import React, { useState, useEffect } from 'react';
import { 
  X, Printer, Download, CornerUpLeft, ShieldCheck, 
  TrendingUp, CheckCircle, Clock, AlertCircle, RefreshCw
} from 'lucide-react';
import { Invoice, UserProfile, Client } from '../types';
import { formatCurrency, formatDateIndonesian } from '../utils';
import { 
  fetchImageAsBase64, 
  sanitizeBase64, 
  getFormatFromBase64,
  preloadCompanyAssets,
  waitForImagesToLoad
} from '../utils/assetHelper';

interface InvoiceBatchReportPdfProps {
  invoices: Invoice[];
  user: UserProfile;
  clients: Client[];
  onClose: () => void;
}

// Global Toast function
function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  // Remove existing toast if any
  const existing = document.getElementById('fid-toast');
  if (existing) existing.remove();
  
  const colors = {
    success: { bg: '#D1FAE5', border: '#34D399', text: '#065F46', icon: '✓' },
    error:   { bg: '#FEE2E2', border: '#F87171', text: '#991B1B', icon: '✕' },
    info:    { bg: '#DBEAFE', border: '#60A5FA', text: '#1E40AF', icon: 'ℹ' }
  };
  const c = colors[type] || colors.info;
  
  const toast = document.createElement('div');
  toast.id = 'fid-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: ${c.bg};
    border: 1.5px solid ${c.border};
    color: ${c.text};
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    z-index: 9999;
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    max-width: 380px;
    font-family: inherit;
  `;
  
  toast.innerHTML = `
    <span style="font-size:18px;line-height:1">${c.icon}</span>
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" style="
      margin-left: auto; background: none; border: none; cursor: pointer;
      color: ${c.text}; font-size: 16px; padding: 0; opacity: 0.6;
    ">×</button>
  `;
  
  document.body.appendChild(toast);
  
  // Slide in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Dynamic Script Loader helper
const loadJsPdfAndAutoTable = async (): Promise<any> => {
  if ((window as any).jspdf && (window as any).jspdf.jsPDF) {
    return (window as any).jspdf;
  }

  // 1. Load jsPDF from CDN
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });

  // 2. Load jsPDF-AutoTable from CDN
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });

  return (window as any).jspdf;
};

export default function InvoiceBatchReportPdf({
  invoices, user, clients, onClose
}: InvoiceBatchReportPdfProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [preloadedLogoBase64, setPreloadedLogoBase64] = useState<string>('');
  const [preloadedSignatureBase64, setPreloadedSignatureBase64] = useState<string>('');
  const [preloadedStampBase64, setPreloadedStampBase64] = useState<string>('');
  const [isPreloadingAssets, setIsPreloadingAssets] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const preload = async () => {
      setIsPreloadingAssets(true);
      try {
        const assets = await preloadCompanyAssets(user);
        if (active) {
          setPreloadedLogoBase64(assets.businessLogo);
          setPreloadedSignatureBase64(assets.signatureImage);
          setPreloadedStampBase64(assets.stampImage);
        }
      } catch (err) {
        console.error('[InvoiceBatchReportPdf] Asset preloading failed:', err);
      } finally {
        if (active) {
          setIsPreloadingAssets(false);
        }
      }
    };
    preload();
    return () => {
      active = false;
    };
  }, [user.businessLogo, user.signatureImage, user.stampImage]);

  useEffect(() => {
    if (isPreloadingAssets) return;

    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');

    const autoPrintSession = sessionStorage.getItem('autoPrint') === 'true';
    const autoDownloadSession = sessionStorage.getItem('autoDownloadPdf') === 'true';

    // Clear right away to avoid multiple triggers
    if (autoPrintSession) sessionStorage.removeItem('autoPrint');
    if (autoDownloadSession) sessionStorage.removeItem('autoDownloadPdf');

    if (action === 'print' || autoPrintSession) {
      handleCetakLaporan();
    } else if (action === 'download' || autoDownloadSession) {
      handleDownloadPDF();
    }
  }, [invoices, isPreloadingAssets]);

  // Real data calculations
  const totalNominal = invoices.reduce((s, i) => s + i.subtotal, 0);
  const totalDiskon = invoices.reduce((s, i) => s + i.discountAmount || 0, 0);
  const totalPPN = invoices.reduce((s, i) => s + i.taxAmount || 0, 0);
  const totalPPh = invoices.reduce((s, i) => s + i.tax2Amount || 0, 0);
  const totalTagihan = invoices.reduce((s, i) => s + i.total, 0);
  const jumlahLunas = invoices.filter(i => i.status === 'Lunas').length;
  const jumlahMenunggu = invoices.filter(i => i.status === 'Draft' || i.status === 'Dikirim' || i.status === 'Sebagian').length;
  const jumlahOverdue = invoices.filter(i => i.status === 'Jatuh Tempo').length;

  const bisnisData = {
    nama: user.businessName || 'FID INVOICE Business',
    alamat: user.address || 'Alamat tidak ditentukan',
    telepon: user.phone || '-',
    email: user.email || '-',
    npwp: user.taxNumber || '-',
    website: 'www.fidinvoice.com'
  };

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const today = new Date();
  const currentMonthName = months[today.getMonth()] + ' ' + today.getFullYear();
  const dateStrCetak = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const periodeData = {
    bulan: currentMonthName,
    tanggalCetak: dateStrCetak,
    tanggalAwal: invoices[invoices.length - 1]?.date ? formatDateIndonesian(invoices[invoices.length - 1].date) : '-',
    tanggalAkhir: invoices[0]?.date ? formatDateIndonesian(invoices[0].date) : '-'
  };

  // Format IDR helper
  function formatRupiah(angka: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(angka);
  }

  // === EXPORT TO PDF VIA jspdf + jspdf-autotable ===
  const generatePDF = async () => {
    const { jsPDF } = await loadJsPdfAndAutoTable();

    // Pre-resolve all dynamic image assets to Base64 to ensure they are fully loaded for jsPDF
    let logoBase64 = sanitizeBase64(preloadedLogoBase64);
    if (user.businessLogo && !logoBase64) {
      try {
        logoBase64 = sanitizeBase64(await fetchImageAsBase64(user.businessLogo));
      } catch (err) {
        console.error('Error pre-loading business logo Base64:', err);
      }
    }

    let signatureBase64 = sanitizeBase64(preloadedSignatureBase64);
    if (user.signatureImage && !signatureBase64) {
      try {
        signatureBase64 = sanitizeBase64(await fetchImageAsBase64(user.signatureImage));
      } catch (err) {
        console.error('Error pre-loading signature Base64:', err);
      }
    }

    let stampBase64 = sanitizeBase64(preloadedStampBase64);
    if (user.stampImage && !stampBase64) {
      try {
        stampBase64 = sanitizeBase64(await fetchImageAsBase64(user.stampImage));
      } catch (err) {
        console.error('Error pre-loading stamp Base64:', err);
      }
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const BLUE = [26, 79, 191];      // #1A4FBF warna utama FID
    const DARK = [13, 27, 62];       // #0D1B3E warna gelap
    const GOLD = [245, 166, 35];     // #F5A623 warna aksen
    const GRAY = [107, 114, 128];    // #6B7280 teks sekunder
    const LIGHT = [248, 250, 255];   // #F8FAFF background
    const WHITE = [255, 255, 255];
    const GREEN = [39, 174, 96];     // #27AE60 status lunas
    const RED = [231, 76, 60];       // #E74C3C status overdue
    const ORANGE = [245, 166, 35];   // status menunggu

    // Data invoice terpilih mapped
    const mappedInvoiceData = invoices.map(inv => ({
      no: inv.invoiceNumber,
      klien: inv.clientName,
      tanggal: formatDateIndonesian(inv.date),
      jatuhTempo: formatDateIndonesian(inv.dueDate),
      nominal: inv.subtotal,
      discountAmount: inv.discountAmount || 0,
      ppn: inv.taxAmount || 0,
      tax2Amount: inv.tax2Amount || 0,
      total: inv.total,
      status: inv.status === 'Dikirim' || inv.status === 'Sebagian' ? 'Menunggu' : inv.status,
      metodeBayar: inv.paymentMethodInfo || '-'
    }));

    let y = 0;
    const pageW = 210;
    const pageH = 297;
    const margin = 15;
    const contentW = pageW - (margin * 2);

    // === BLOK HEADER (y: 0–45mm) ===
    doc.setFillColor(...DARK);
    doc.rect(0, 0, pageW, 45, 'F');

    // Logo & Business Name
    let headerStartX = margin;
    if (logoBase64) {
      try {
        const props = doc.getImageProperties(logoBase64);
        const maxW = 32;
        const maxH = 16;
        const ratio = Math.min(maxW / props.width, maxH / props.height);
        const logoW = props.width * ratio;
        const logoH = props.height * ratio;

        const format = getFormatFromBase64(logoBase64);
        doc.addImage(logoBase64, format, margin, 10, logoW, logoH);
        headerStartX += logoW + 4;
      } catch (err) {
        console.error('Error drawing business logo in batch report header:', err);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...WHITE);
    doc.text((user.businessName || 'FID INVOICE').toUpperCase(), headerStartX, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 196, 230);
    doc.text('Laporan Ringkasan Resmi', headerStartX, 23);

    // Judul Laporan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...WHITE);
    doc.text('LAPORAN RINGKASAN INVOICE', pageW - margin, 15, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(180, 196, 230);
    doc.text('Periode: ' + periodeData.bulan, pageW - margin, 21, { align: 'right' });
    doc.text('Dicetak: ' + periodeData.tanggalCetak, pageW - margin, 26, { align: 'right' });

    // Garis pemisah emas di bawah header
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1);
    doc.line(0, 45, pageW, 45);

    y = 52;

    // === INFO BISNIS ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text('INFORMASI BISNIS', margin, y);

    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, margin + 40, y + 2);

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(bisnisData.nama, margin, y);

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(bisnisData.alamat, margin, y);
    y += 4.5;
    doc.text('Tel: ' + bisnisData.telepon + '  |  Email: ' + bisnisData.email, margin, y);
    y += 4.5;
    doc.text('NPWP: ' + bisnisData.npwp, margin, y);

    y += 10;

    // === 4 KARTU STATISTIK RINGKASAN ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text('RINGKASAN EKSEKUTIF', margin, y);
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, margin + 50, y + 2);

    y += 7;

    const cardW = (contentW - 9) / 4;
    const cardH = 22;
    const cards = [
      { label: 'Total Tagihan', value: formatRupiah(totalTagihan), sub: mappedInvoiceData.length + ' invoice', color: BLUE },
      { label: 'Invoice Lunas', value: jumlahLunas + ' invoice', sub: 'Terbayar', color: GREEN },
      { label: 'Menunggu Bayar', value: jumlahMenunggu + ' invoice', sub: 'Belum dibayar', color: ORANGE },
      { label: 'Jatuh Tempo', value: jumlahOverdue + ' invoice', sub: 'Perlu tindakan', color: RED }
    ];

    cards.forEach((card, idx) => {
      const cx = margin + idx * (cardW + 3);

      doc.setFillColor(248, 250, 255);
      doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'F');

      doc.setFillColor(...card.color);
      doc.rect(cx, y, 2, cardH, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text(card.label, cx + 5, y + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      const valLines = doc.splitTextToSize(card.value, cardW - 6);
      doc.text(valLines, cx + 5, y + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text(card.sub, cx + 5, y + 19);
    });

    y += cardH + 10;

    // === TABEL DETAIL INVOICE ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text('DETAIL INVOICE TERPILIH', margin, y);
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, margin + 55, y + 2);

    y += 6;

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [[
        'No. Invoice',
        'Nama Klien',
        'Tgl Invoice',
        'Subtotal',
        'Diskon',
        'PPN (11%)',
        'PPh 23 (2%)',
        'Total',
        'Metode',
        'Status'
      ]],
      body: mappedInvoiceData.map(inv => [
        inv.no,
        inv.klien,
        inv.tanggal,
        formatRupiah(inv.nominal),
        inv.discountAmount > 0 ? `-${formatRupiah(inv.discountAmount)}` : '-',
        inv.ppn > 0 ? formatRupiah(inv.ppn) : '-',
        inv.tax2Amount > 0 ? `-${formatRupiah(inv.tax2Amount)}` : '-',
        formatRupiah(inv.total),
        inv.metodeBayar,
        inv.status
      ]),
      foot: [[
        { content: 'TOTAL KESELURUHAN', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
        formatRupiah(totalNominal),
        totalDiskon > 0 ? `-${formatRupiah(totalDiskon)}` : '-',
        formatRupiah(totalPPN),
        totalPPh > 0 ? `-${formatRupiah(totalPPh)}` : '-',
        { content: formatRupiah(totalTagihan), styles: { fontStyle: 'bold', textColor: BLUE } },
        '',
        ''
      ]],
      headStyles: {
        fillColor: DARK,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        lineColor: [229, 231, 235],
        lineWidth: 0.3
      },
      alternateRowStyles: {
        fillColor: [248, 250, 255]
      },
      footStyles: {
        fillColor: [240, 244, 255],
        textColor: DARK,
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 24 },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 18, halign: 'right' },
        4: { cellWidth: 16, halign: 'right' },
        5: { cellWidth: 16, halign: 'right' },
        6: { cellWidth: 16, halign: 'right' },
        7: { cellWidth: 20, halign: 'right' },
        8: { cellWidth: 18, halign: 'center' },
        9: { cellWidth: 16, halign: 'center' }
      },
      didDrawCell: function(data: any) {
        if (data.column.index === 9 && data.section === 'body') {
          const status = data.cell.text[0];
          let color = WHITE;
          let textColor = DARK;
          if (status === 'Lunas') { color = [240, 253, 244]; textColor = GREEN; }
          else if (status === 'Jatuh Tempo') { color = [254, 242, 242]; textColor = RED; }
          else if (status === 'Menunggu' || status === 'Dikirim' || status === 'Sebagian') { color = [255, 251, 235]; textColor = [146, 64, 14]; }
          else if (status === 'Draft') { color = [249, 250, 251]; textColor = GRAY; }
          
          doc.setFillColor(...color);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setTextColor(...textColor);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text(status, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' });
        }
      }
    });

    y = doc.lastAutoTable.finalY + 10;

    // === REKAP PER KLIEN ===
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text('REKAP PER KLIEN', margin, y);
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, margin + 42, y + 2);

    y += 6;

    const rekapKlien: Record<string, { jumlah: number; total: number }> = {};
    mappedInvoiceData.forEach(inv => {
      if (!rekapKlien[inv.klien]) {
        rekapKlien[inv.klien] = { jumlah: 0, total: 0 };
      }
      rekapKlien[inv.klien].jumlah += 1;
      rekapKlien[inv.klien].total += inv.total;
    });

    const rekapData = Object.entries(rekapKlien).map(([klien, data]) => [
      klien,
      data.jumlah + ' invoice',
      formatRupiah(data.total),
      ((data.total / totalTagihan) * 100).toFixed(1) + '%'
    ]);

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Nama Klien', 'Jumlah Invoice', 'Total Nominal', '% Kontribusi']],
      body: rekapData,
      foot: [[
        { content: 'TOTAL', styles: { fontStyle: 'bold', halign: 'right' } },
        mappedInvoiceData.length + ' invoice',
        { content: formatRupiah(totalTagihan), styles: { fontStyle: 'bold' } },
        '100%'
      ]],
      headStyles: { fillColor: BLUE, textColor: WHITE, fontSize: 8, fontStyle: 'bold', cellPadding: 3 },
      bodyStyles: { fontSize: 8, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: [248, 250, 255] },
      footStyles: { fillColor: [240, 244, 255], textColor: DARK, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 65 },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 45, halign: 'right' },
        3: { cellWidth: 35, halign: 'center' }
      }
    });

    y = doc.lastAutoTable.finalY + 10;

    // === REKAP PAJAK ===
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text('RINGKASAN PAJAK', margin, y);
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, margin + 42, y + 2);

    y += 7;

    const pajakRows = [
      ['Dasar Pengenaan Pajak (DPP)', formatRupiah(totalNominal)],
      ['Diskon / Potongan Harga', totalDiskon > 0 ? `-${formatRupiah(totalDiskon)}` : '-'],
      ['PPN 11%', formatRupiah(totalPPN)],
      ['PPh 23 (2%)', totalPPh > 0 ? `-${formatRupiah(totalPPh)}` : '-'],
      ['TOTAL NETTO (pajak terbayar)', formatRupiah(totalPPN - totalPPh)],
      ['TOTAL TAGIHAN (termasuk pajak & diskon)', formatRupiah(totalTagihan)]
    ];

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      body: pajakRows,
      bodyStyles: { fontSize: 8.5, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 255] },
      columnStyles: {
        0: { cellWidth: 110, fontStyle: 'normal' },
        1: { cellWidth: 70, halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: function(data: any) {
        if (data.row.index === 5) {
          data.cell.styles.fillColor = DARK;
          data.cell.styles.textColor = WHITE;
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 9.5;
        }
      }
    });

    y = doc.lastAutoTable.finalY + 15;

    // === TANDA TANGAN ===
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    const signX = pageW - margin - 70;
    doc.setDrawColor(...GRAY);
    doc.setLineWidth(0.3);
    doc.rect(signX, y, 70, 35);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text('Disetujui oleh,', signX + 5, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK);
    doc.text(periodeData.tanggalCetak, signX + 5, y + 10);

    // DRAW DIGITAL SIGNATURE FIRST (Draw first so stamp overlaps on top)
    if (signatureBase64) {
      try {
        const format = getFormatFromBase64(signatureBase64);
        doc.addImage(signatureBase64, format, signX + 24, y + 11, 26, 14);
      } catch (sigErr) {
        console.error('Error drawing signature inside batch report PDF:', sigErr);
      }
    }

    // DRAW DIGITAL STAMP SECOND (Overlaps the signature perfectly)
    if (stampBase64) {
      try {
        const format = getFormatFromBase64(stampBase64);
        // Positioned at signX + 18 to overlap the signature beautifully
        doc.addImage(stampBase64, format, signX + 18, y + 10, 16, 14);
      } catch (stampErr) {
        console.error('Error drawing stamp inside batch report PDF:', stampErr);
      }
    }

    doc.setDrawColor(...DARK);
    doc.setLineWidth(0.4);
    doc.line(signX + 5, y + 27, signX + 65, y + 27);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK);
    doc.text(user.fullName || '', signX + 35, y + 31, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text(bisnisData.nama, signX + 35, y + 34, { align: 'center' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    const disclaimer = 'Dokumen ini digenerate secara otomatis oleh sistem FID INVOICE.\nLaporan pajak bersifat informatif — konsultasikan dengan konsultan pajak Anda.';
    doc.text(disclaimer, margin, y + 12, { maxWidth: signX - margin - 5 });

    // === FOOTER SEMUA HALAMAN ===
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);

      doc.setDrawColor(...BLUE);
      doc.setLineWidth(0.5);
      doc.line(margin, pageH - 12, pageW - margin, pageH - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text('FID INVOICE  |  ' + bisnisData.email + '  |  ' + bisnisData.website, margin, pageH - 8);

      doc.text('Halaman ' + p + ' dari ' + totalPages, pageW - margin, pageH - 8, { align: 'right' });
    }

    const todayDate = new Date();
    const dateStrFile = todayDate.getFullYear() + '-' + 
      String(todayDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(todayDate.getDate()).padStart(2, '0');
    const fileName = 'FID-Laporan-Invoice-' + dateStrFile + '.pdf';

    doc.save(fileName);
  };

  const handleDownloadPDF = async () => {
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      const ids = invoices.map(inv => inv.id).join(',');
      const downloadUrl = `${window.location.origin}${window.location.pathname}?batchReport=true&ids=${ids}&action=download`;
      window.open(downloadUrl, '_blank');
      return;
    }

    setIsDownloading(true);

    // Setup CSS anim spin if not exists
    if (!document.getElementById('spin-style')) {
      const style = document.createElement('style');
      style.id = 'spin-style';
      style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    setTimeout(async () => {
      try {
        await generatePDF();
        showToast('PDF berhasil diunduh!', 'success');
      } catch (err) {
        showToast('Gagal membuat PDF. Coba lagi.', 'error');
        console.error('PDF Error:', err);
      } finally {
        setIsDownloading(false);
      }
    }, 400);
  };

  // === EXPORT TO PRINT LAYOUT VIA window.open() ===
  const generatePrintHTML = () => {
    function getBadgeClass(status: string) {
      const map: Record<string, string> = {
        'Lunas': 'badge-lunas',
        'Menunggu': 'badge-menunggu',
        'Jatuh Tempo': 'badge-overdue',
        'Draft': 'badge-draft'
      };
      const clean = status === 'Dikirim' || status === 'Sebagian' ? 'Menunggu' : status;
      return `<span class="badge ${map[clean] || 'badge-draft'}">${clean}</span>`;
    }

    const tableRows = invoices.map(inv => {
      return `
        <tr>
          <td class="center font-mono" style="font-weight:bold">${inv.invoiceNumber}</td>
          <td style="font-weight:500">${inv.clientName}</td>
          <td class="center">${formatDateIndonesian(inv.date)}</td>
          <td class="right">${formatRupiah(inv.subtotal)}</td>
          <td class="right" style="color: #E74C3C;">${inv.discountAmount > 0 ? `-${formatRupiah(inv.discountAmount)}` : '-'}</td>
          <td class="right" style="color: #27AE60;">${inv.taxAmount > 0 ? formatRupiah(inv.taxAmount) : '-'}</td>
          <td class="right" style="color: #E74C3C;">${inv.tax2Amount > 0 ? `-${formatRupiah(inv.tax2Amount)}` : '-'}</td>
          <td class="right" style="font-weight:bold; color: #0D1B3E;">${formatRupiah(inv.total)}</td>
          <td class="center">${getBadgeClass(inv.status)}</td>
        </tr>
      `;
    }).join('');

    const rekapKlien: Record<string, { jumlah: number; total: number }> = {};
    invoices.forEach(inv => {
      if (!rekapKlien[inv.clientName]) {
        rekapKlien[inv.clientName] = { jumlah: 0, total: 0 };
      }
      rekapKlien[inv.clientName].jumlah += 1;
      rekapKlien[inv.clientName].total += inv.total;
    });

    const rekapKlienRows = Object.entries(rekapKlien).map(([klien, data]) => {
      const kontribusi = ((data.total / totalTagihan) * 100).toFixed(1) + '%';
      return `
        <tr>
          <td>${klien}</td>
          <td class="center">${data.jumlah} invoice</td>
          <td class="right">${formatRupiah(data.total)}</td>
          <td class="center">${kontribusi}</td>
        </tr>
      `;
    }).join('');

    return `
      <!-- HEADER -->
      <div class="doc-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div class="doc-header-left" style="display: flex; align-items: center; gap: 12px;">
          ${user.businessLogo ? `<img src="${preloadedLogoBase64 || user.businessLogo}" style="height: 44px; max-width: 120px; object-fit: contain; background: rgba(255,255,255,0.08); padding: 4px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15);" />` : ''}
          <div>
            <div class="app-name" style="text-transform: uppercase;">${user.businessName || 'FID INVOICE'}</div>
            <div class="app-tagline">Laporan Ringkasan Resmi</div>
          </div>
        </div>
        <div class="doc-header-right" style="text-align: right;">
          <div class="report-title">LAPORAN RINGKASAN INVOICE</div>
          <div class="report-meta">Periode: ${periodeData.bulan}</div>
          <div class="report-meta">Dicetak: ${periodeData.tanggalCetak}</div>
        </div>
      </div>
      <div class="header-accent"></div>
      
      <!-- INFO BISNIS -->
      <div class="biz-section" style="padding-top:14px">
        <div class="section-heading">Informasi Bisnis</div>
        <div class="biz-name">${bisnisData.nama}</div>
        <div class="biz-detail">${bisnisData.alamat}</div>
        <div class="biz-detail">Tel: ${bisnisData.telepon} &nbsp;|&nbsp; Email: ${bisnisData.email}</div>
        <div class="biz-detail">NPWP: ${bisnisData.npwp}</div>
      </div>
      
      <!-- STATISTIK -->
      <div class="section-heading">Ringkasan Eksekutif</div>
      <div class="stats-grid" style="margin-top:8px">
        <div class="stat-card blue">
          <div class="stat-label">Total Tagihan</div>
          <div class="stat-value">${formatRupiah(totalTagihan)}</div>
        </div>
        <div class="stat-card green">
          <div class="stat-label">Invoice Lunas</div>
          <div class="stat-value">${jumlahLunas} invoice</div>
        </div>
        <div class="stat-card orange">
          <div class="stat-label">Menunggu Bayar</div>
          <div class="stat-value">${jumlahMenunggu} invoice</div>
        </div>
        <div class="stat-card red">
          <div class="stat-label">Jatuh Tempo</div>
          <div class="stat-value">${jumlahOverdue} invoice</div>
        </div>
      </div>
      
      <!-- TABEL INVOICE -->
      <div class="table-section">
        <div class="section-heading">Detail Invoice Terpilih (${invoices.length} invoice)</div>
        <table style="margin-top:8px">
          <thead>
            <tr>
              <th class="center" style="width:12%">No. Invoice</th>
              <th style="width:16%">Nama Klien</th>
              <th class="center" style="width:10%">Tgl Invoice</th>
              <th class="right" style="width:11%">Subtotal</th>
              <th class="right" style="width:10%">Diskon</th>
              <th class="right" style="width:10%">PPN 11%</th>
              <th class="right" style="width:10%">PPh 23 (2%)</th>
              <th class="right" style="width:12%">Total</th>
              <th class="center" style="width:9%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align:right;font-weight:bold">TOTAL KESELURUHAN</td>
              <td class="right">${formatRupiah(totalNominal)}</td>
              <td class="right" style="color: #E74C3C;">${totalDiskon > 0 ? `-${formatRupiah(totalDiskon)}` : '-'}</td>
              <td class="right" style="color: #27AE60;">${formatRupiah(totalPPN)}</td>
              <td class="right" style="color: #E74C3C;">${totalPPh > 0 ? `-${formatRupiah(totalPPh)}` : '-'}</td>
              <td class="grand-total">${formatRupiah(totalTagihan)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- REKAP PER KLIEN -->
      <div class="table-section" style="margin-top: 14px; page-break-inside: avoid;">
        <div class="section-heading">Rekap Per Klien</div>
        <table style="margin-top:8px">
          <thead>
            <tr>
              <th>Nama Klien</th>
              <th class="center" style="width:25%">Jumlah Invoice</th>
              <th class="right" style="width:30%">Total Nominal</th>
              <th class="center" style="width:20%">% Kontribusi</th>
            </tr>
          </thead>
          <tbody>
            ${rekapKlienRows}
          </tbody>
          <tfoot>
            <tr>
              <td style="font-weight:bold">TOTAL</td>
              <td class="center" style="font-weight:bold">${invoices.length} invoice</td>
              <td class="right" style="font-weight:bold">${formatRupiah(totalTagihan)}</td>
              <td class="center" style="font-weight:bold">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <!-- REKAP PAJAK -->
      <div class="biz-section" style="margin-top:14px; page-break-inside: avoid;">
        <div class="section-heading">Ringkasan Pajak</div>
        <table class="pajak-table" style="margin-top:8px">
          <tbody>
            <tr><td>Dasar Pengenaan Pajak (DPP)</td><td>${formatRupiah(totalNominal)}</td></tr>
            <tr><td>Diskon / Potongan Harga</td><td style="color: #E74C3C;">${totalDiskon > 0 ? `-${formatRupiah(totalDiskon)}` : '-'}</td></tr>
            <tr><td>PPN 11%</td><td style="color: #27AE60;">${formatRupiah(totalPPN)}</td></tr>
            <tr><td>PPh 23 (2%)</td><td style="color: #E74C3C;">${totalPPh > 0 ? `-${formatRupiah(totalPPh)}` : '-'}</td></tr>
            <tr><td>TOTAL NETTO (pajak terbayar)</td><td>${formatRupiah(totalPPN - totalPPh)}</td></tr>
          </tbody>
          <tfoot>
            <tr class="pajak-total">
              <td>TOTAL TAGIHAN (termasuk pajak & diskon)</td>
              <td>${formatRupiah(totalTagihan)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <!-- TANDA TANGAN & DISCLAIMER -->
      <div class="sign-section">
        <div class="disclaimer">
          Dokumen ini digenerate secara otomatis oleh sistem FID INVOICE.<br>
          Laporan ini bersifat informatif untuk keperluan internal bisnis.<br>
          Konsultasikan laporan pajak dengan konsultan pajak Anda.
        </div>
        <div class="sign-box" style="position: relative; min-height: 120px;">
          <div class="sign-date">${periodeData.tanggalCetak}</div>
          <div class="sign-label" style="font-weight: bold; color: #0D1B3E;">Yang Menyetujui,</div>
          
          <div style="height: 60px; display: flex; align-items: center; justify-content: center; position: relative; margin: 4px 0;">
            ${user.stampImage ? `<img src="${preloadedStampBase64 || user.stampImage}" style="height: 55px; position: absolute; left: 10px; opacity: 0.85; z-index: 1;" />` : `
              <div style="width: 44px; height: 44px; border-radius: 50%; border: 2px dashed rgba(30,144,255,0.45); display: flex; flex-direction: column; align-items: center; justify-content: center; position: absolute; left: 12px; transform: rotate(12deg); opacity: 0.55; z-index: 1;">
                <span style="font-size: 4px; font-weight: bold; color: #1e90ff; font-family: sans-serif; text-transform: uppercase;">${user.businessName ? user.businessName.substring(0,8).toUpperCase() : 'BUANA'}</span>
                <span style="font-size: 3px; color: #1e90ff; font-family: sans-serif; border-top: 1px solid rgba(30,144,255,0.3); margin-top: 1px; padding-top: 1px; transform: scale(0.8);">OFFICIAL</span>
              </div>
            `}
            ${user.signatureImage ? `<img src="${preloadedSignatureBase64 || user.signatureImage}" style="height: 55px; z-index: 2; position: relative;" />` : `
              <span style="font-family: serif; font-style: italic; font-size: 16px; color: #1e3a8a; font-weight: bold; transform: rotate(-5deg); z-index: 2; position: relative; letter-spacing: 2px;">${user.fullName ? user.fullName.split(' ')[0] : 'Authorized'}</span>
            `}
          </div>
          
          <div class="sign-line" style="border-bottom: 1px solid #ccc; width: 85%; margin: 2px auto 4px auto;"></div>
          <div class="sign-label" style="font-size:8.5pt; font-weight: bold; color: #0d1b3e;">${user.fullName}</div>
          <div class="sign-label" style="font-size:7pt; color: #777; text-transform: uppercase; letter-spacing: 0.5px;">${bisnisData.nama}</div>
        </div>
      </div>
      
      <!-- FOOTER -->
      <div class="doc-footer">
        <span>FID INVOICE &nbsp;|&nbsp; ${bisnisData.email} &nbsp;|&nbsp; ${bisnisData.website}</span>
        <span>Dicetak pada: ${new Date().toLocaleString('id-ID')}</span>
      </div>
    `;
  };

  const handleCetakLaporan = () => {
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      const ids = invoices.map(inv => inv.id).join(',');
      const printUrl = `${window.location.origin}${window.location.pathname}?batchReport=true&ids=${ids}&action=print`;
      window.open(printUrl, '_blank');
      return;
    }

    // 1. Remove existing print iframe if it exists
    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.remove();
    }

    // 2. Create a new hidden iframe
    iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // 3. Generate HTML content
    const printContent = generatePrintHTML();
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>Laporan Invoice FID INVOICE</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              font-size: 10pt;
              color: #1A1A2E;
              background: white;
              line-height: 1.4;
              padding: 10px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            img {
              display: block !important;
              opacity: 1 !important;
              visibility: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            @page {
              size: A4 portrait;
              margin: 15mm 15mm 20mm 15mm;
            }
            
            .doc-header {
              background: #0D1B3E;
              color: white;
              padding: 16px 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            
            .doc-header-left .app-name {
              font-size: 18pt;
              font-weight: bold;
              color: white;
              letter-spacing: 0.5px;
            }
            
            .doc-header-left .app-tagline {
              font-size: 8pt;
              color: #B4C6E8;
              margin-top: 2px;
            }
            
            .doc-header-right {
              text-align: right;
            }
            
            .doc-header-right .report-title {
              font-size: 12pt;
              font-weight: bold;
              color: white;
            }
            
            .doc-header-right .report-meta {
              font-size: 8pt;
              color: #B4C6E8;
              margin-top: 3px;
            }
            
            .header-accent {
              height: 3px;
              background: #F5A623;
              width: 100%;
            }
            
            .biz-section {
              padding: 14px 0;
              border-bottom: 1px solid #E5E7EB;
              margin-bottom: 14px;
            }
            
            .section-heading {
              font-size: 9pt;
              font-weight: bold;
              color: #1A4FBF;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              margin-bottom: 6px;
              padding-bottom: 3px;
              border-bottom: 2px solid #1A4FBF;
              display: inline-block;
            }
            
            .biz-name {
              font-size: 12pt;
              font-weight: bold;
              color: #0D1B3E;
              margin-bottom: 3px;
            }
            
            .biz-detail {
              font-size: 8.5pt;
              color: #6B7280;
              margin-bottom: 1.5px;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              margin-bottom: 16px;
            }
            
            .stat-card {
              border: 1px solid #E5E7EB;
              border-radius: 6px;
              padding: 10px 12px;
              background: #F8FAFF;
              border-left: 3px solid;
            }
            
            .stat-card.blue  { border-left-color: #1A4FBF; }
            .stat-card.green { border-left-color: #27AE60; }
            .stat-card.orange{ border-left-color: #F5A623; }
            .stat-card.red   { border-left-color: #E74C3C; }
            
            .stat-label {
              font-size: 7.5pt;
              color: #6B7280;
              margin-bottom: 4px;
            }
            
            .stat-value {
              font-size: 11pt;
              font-weight: bold;
              color: #0D1B3E;
              line-height: 1.2;
            }
            
            .stat-card.blue  .stat-value { color: #1A4FBF; }
            .stat-card.green .stat-value { color: #27AE60; }
            .stat-card.orange .stat-value { color: #B45309; }
            .stat-card.red   .stat-value { color: #E74C3C; }
            
            .table-section {
              margin-bottom: 16px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8.5pt;
            }
            
            thead th {
              background: #0D1B3E;
              color: white;
              padding: 7px 8px;
              text-align: left;
              font-weight: bold;
              font-size: 8pt;
            }
            
            thead th.right { text-align: right; }
            thead th.center { text-align: center; }
            
            tbody tr:nth-child(even) {
              background: #F8FAFF;
            }
            
            tbody td {
              padding: 6px 8px;
              border-bottom: 0.5px solid #E5E7EB;
              vertical-align: middle;
            }
            
            tbody td.right { text-align: right; }
            tbody td.center { text-align: center; }
            
            tfoot td {
              background: #F0F4FF;
              font-weight: bold;
              padding: 7px 8px;
              border-top: 2px solid #1A4FBF;
            }
            
            tfoot td.right { text-align: right; }
            tfoot td.grand-total {
              background: #0D1B3E;
              color: white;
              font-size: 10pt;
              text-align: right;
            }
            
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 10px;
              font-size: 7.5pt;
              font-weight: bold;
            }
            .badge-lunas    { background: #D1FAE5; color: #065F46; }
            .badge-menunggu { background: #FEF3C7; color: #92400E; }
            .badge-overdue  { background: #FEE2E2; color: #991B1B; }
            .badge-draft    { background: #F3F4F6; color: #374151; }
            
            .pajak-table {
              width: 50%;
              margin-left: auto;
              margin-bottom: 16px;
            }
            
            .pajak-table td {
              padding: 5px 10px;
              border-bottom: 0.5px solid #E5E7EB;
              font-size: 9pt;
            }
            
            .pajak-table td:last-child {
              text-align: right;
              font-weight: bold;
            }
            
            .pajak-total td {
              background: #0D1B3E;
              color: white;
              font-size: 10pt;
              font-weight: bold;
              padding: 8px 10px;
            }
            
            .pajak-total td:last-child {
              text-align: right;
            }
            
            .sign-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-top: 20px;
              padding-top: 14px;
              border-top: 1px solid #E5E7EB;
            }
            
            .disclaimer {
              font-size: 7.5pt;
              color: #9CA3AF;
              font-style: italic;
              max-width: 55%;
              line-height: 1.6;
            }
            
            .sign-box {
              border: 1px solid #D1D5DB;
              border-radius: 6px;
              padding: 10px 20px;
              text-align: center;
              width: 160px;
            }
            
            .sign-box .sign-date {
              font-size: 8pt;
              color: #6B7280;
              margin-bottom: 2px;
            }
            
            .sign-box .sign-label {
              font-size: 8pt;
              font-weight: bold;
              color: #0D1B3E;
            }
            
            .sign-line {
              border-top: 1px solid #374151;
              margin: 30px 10px 6px;
            }
            
            .doc-footer {
              border-top: 1px solid #1A4FBF;
              padding-top: 5px;
              display: flex;
              justify-content: space-between;
              font-size: 7.5pt;
              color: #9CA3AF;
              margin-top: 16px;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `);
      iframeDoc.close();

      // 4. Wait for all images to load inside the iframe before printing
      waitForImagesToLoad(iframeDoc).then(() => {
        setTimeout(() => {
          if (iframe.contentWindow) {
            try {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
              showToast('Laporan siap dicetak!', 'success');
            } catch (err) {
              console.error('Iframe print error:', err);
              showToast('Gagal memproses cetak langsung.', 'error');
            }
          }
        }, 200); // 200ms grace period for layout rendering
      });
    } else {
      showToast('Gagal memproses cetak. Silakan coba lagi.', 'error');
    }
  };

  return (
    <div className="space-y-6 font-sans text-left pb-16 no-print">
      
      {/* Container header halaman */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-white rounded-2xl border border-gray-150 shadow-sm">
        {/* Kiri: Judul */}
        <div>
          <button 
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-primary font-bold cursor-pointer mb-2"
          >
            <CornerUpLeft className="w-4 h-4" />
            Kembali ke Daftar
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark tracking-tight">
            Laporan Ringkasan Invoice Terpilih
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Mengekspor {invoices.length} invoice terpilih ke dalam format laporan eksekutif PDF.
          </p>
        </div>
        
        {/* Kanan: Tombol Aksi */}
        <div className="flex flex-wrap gap-2 shrink-0">
          
          {/* TOMBOL UNDUH PDF */}
          <button
            id="btn-download-pdf"
            onClick={handleDownloadPDF}
            disabled={isDownloading || isPreloadingAssets}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A4FBF] hover:bg-[#1540A0] active:scale-95 text-white border-none rounded-xl text-xs font-bold tracking-wide cursor-pointer transition-all disabled:opacity-75"
          >
            {isPreloadingAssets ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isDownloading ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                   stroke="currentColor" stroke-width="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" 
                   stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            )}
            {isPreloadingAssets ? 'Memuat Aset...' : isDownloading ? 'Membuat PDF...' : 'Unduh Dokumen PDF'}
          </button>
          
          {/* TOMBOL CETAK */}
          <button
            id="btn-cetak"
            onClick={handleCetakLaporan}
            disabled={isDownloading || isPreloadingAssets}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 active:scale-95 text-gray-700 border border-gray-350 rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-75"
          >
            {isPreloadingAssets ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" 
                   stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
            )}
            {isPreloadingAssets ? 'Memuat Aset...' : 'Cetak Laporan'}
          </button>
          
        </div>
      </div>

      {/* Informative Tip Banner for iframe and print compatibility */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-3 no-print">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-amber-950">Tips Hasil Cetak & Simpan PDF Maksimal 💡</p>
          <p className="text-amber-950 leading-relaxed font-medium">
            Jika tombol <span className="font-bold">Unduh Dokumen PDF</span> atau <span className="font-bold">Cetak Laporan</span> tidak memunculkan dialog pengunduhan (karena batasan keamanan sistem iframe preview), silakan klik tombol <span className="font-bold text-brand-primary">Buka di Tab Baru ↗</span> di pojok kanan atas layar Anda untuk membukanya secara penuh, lalu jalankan kembali fiturnya. Di tab baru, fitur cetak dan simpan PDF browser dijamin berjalan 100% lancar dan maksimal!
          </p>
        </div>
      </div>

      {/* Real on-screen visual preview (Styled exactly like the print HTML design) */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-xl max-w-5xl mx-auto overflow-hidden relative">
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* Header Preview */}
          <div className="bg-[#0D1B3E] text-white p-6 flex justify-between items-center flex-wrap gap-4 text-left">
            <div className="flex items-center gap-4">
              {user.businessLogo ? (
                <img src={preloadedLogoBase64 || user.businessLogo} alt="Business Logo" className="h-12 max-w-[120px] object-contain bg-white/10 p-1 rounded-xl border border-white/20" />
              ) : null}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-wider text-white uppercase">
                  {user.businessName || 'FID INVOICE'}
                </h2>
                <p className="text-xs text-[#B4C6E8] mt-1">Laporan Ringkasan Resmi</p>
              </div>
            </div>
            <div className="text-right sm:text-right">
              <h3 className="text-sm font-extrabold tracking-wide text-white">LAPORAN RINGKASAN INVOICE</h3>
              <p className="text-xs text-[#B4C6E8] mt-1">Periode: {periodeData.bulan}</p>
              <p className="text-xs text-[#B4C6E8] mt-0.5">Dicetak: {periodeData.tanggalCetak}</p>
            </div>
          </div>
          <div className="h-1.5 bg-[#F5A623]"></div>

          {/* Business Info Section */}
          <div className="p-6 border-b border-gray-150 bg-white text-left">
            <span className="text-[10px] font-bold text-[#1A4FBF] tracking-wider uppercase border-b-2 border-[#1A4FBF] pb-1 inline-block mb-3">Informasi Bisnis</span>
            <h4 className="text-base font-bold text-[#0D1B3E]">{bisnisData.nama}</h4>
            <p className="text-xs text-gray-500 mt-1">{bisnisData.alamat}</p>
            <p className="text-xs text-gray-500 mt-0.5">Tel: {bisnisData.telepon} &nbsp;|&nbsp; Email: {bisnisData.email}</p>
            <p className="text-xs text-gray-500 mt-0.5">NPWP: {bisnisData.npwp}</p>
          </div>

          {/* Executive Summary Cards */}
          <div className="p-6 border-b border-gray-150 bg-white text-left">
            <span className="text-[10px] font-bold text-[#1A4FBF] tracking-wider uppercase border-b-2 border-[#1A4FBF] pb-1 inline-block mb-4">Ringkasan Eksekutif</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-gray-200 rounded-xl p-4 bg-[#F8FAFF] border-l-4 border-l-[#1A4FBF]">
                <p className="text-xs text-gray-500">Total Tagihan</p>
                <p className="text-base font-black text-[#1A4FBF] mt-1.5 font-mono">{formatRupiah(totalTagihan)}</p>
                <p className="text-[10px] text-gray-400 mt-1 font-medium">{invoices.length} invoice terpilih</p>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 bg-[#F8FAFF] border-l-4 border-l-[#27AE60]">
                <p className="text-xs text-gray-500">Invoice Lunas</p>
                <p className="text-base font-black text-[#27AE60] mt-1.5 font-mono">{jumlahLunas} Invoice</p>
                <p className="text-[10px] text-gray-400 mt-1 font-medium">Terbayar penuh</p>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 bg-[#F8FAFF] border-l-4 border-l-[#F5A623]">
                <p className="text-xs text-gray-500">Menunggu Bayar</p>
                <p className="text-base font-black text-[#B45309] mt-1.5 font-mono">{jumlahMenunggu} Invoice</p>
                <p className="text-[10px] text-gray-400 mt-1 font-medium">Belum dibayar</p>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 bg-[#F8FAFF] border-l-4 border-l-[#E74C3C]">
                <p className="text-xs text-gray-500">Jatuh Tempo</p>
                <p className="text-base font-black text-[#E74C3C] mt-1.5 font-mono">{jumlahOverdue} Invoice</p>
                <p className="text-[10px] text-gray-400 mt-1 font-medium">Perlu tindakan</p>
              </div>
            </div>
          </div>

          {/* Table Details */}
          <div className="p-6 bg-white border-b border-gray-150 text-left">
            <span className="text-[10px] font-bold text-[#1A4FBF] tracking-wider uppercase border-b-2 border-[#1A4FBF] pb-1 inline-block mb-4">Detail Invoice Terpilih</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0D1B3E] text-white">
                    <th className="p-3 text-center rounded-tl-lg">No. Invoice</th>
                    <th className="p-3">Nama Klien</th>
                    <th className="p-3 text-center">Tgl Invoice</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-right">Diskon</th>
                    <th className="p-3 text-right">PPN 11%</th>
                    <th className="p-3 text-right">PPh 23 (2%)</th>
                    <th className="p-3 text-right font-bold">Total</th>
                    <th className="p-3 text-center rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv, idx) => {
                    const displayStatus = inv.status === 'Dikirim' || inv.status === 'Sebagian' ? 'Menunggu' : inv.status;
                    return (
                      <tr key={inv.id} className={idx % 2 === 1 ? 'bg-[#F8FAFF]' : 'bg-white'}>
                        <td className="p-3 text-center font-mono font-bold text-gray-800">{inv.invoiceNumber}</td>
                        <td className="p-3 font-bold text-[#0D1B3E]">{inv.clientName}</td>
                        <td className="p-3 text-center text-gray-500">{formatDateIndonesian(inv.date)}</td>
                        <td className="p-3 text-right font-mono text-gray-600">{formatRupiah(inv.subtotal)}</td>
                        <td className="p-3 text-right font-mono text-red-600">{inv.discountAmount > 0 ? `-${formatRupiah(inv.discountAmount)}` : '-'}</td>
                        <td className="p-3 text-right font-mono text-green-600">{inv.taxAmount > 0 ? formatRupiah(inv.taxAmount) : '-'}</td>
                        <td className="p-3 text-right font-mono text-red-600">{inv.tax2Amount > 0 ? `-${formatRupiah(inv.tax2Amount)}` : '-'}</td>
                        <td className="p-3 text-right font-mono font-black text-[#0D1B3E]">{formatRupiah(inv.total)}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${
                            displayStatus === 'Lunas' ? 'bg-green-100 text-green-800' :
                            displayStatus === 'Jatuh Tempo' ? 'bg-red-100 text-red-800' :
                            displayStatus === 'Menunggu' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {displayStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F0F4FF] font-bold text-gray-800">
                    <td colSpan={3} className="p-3 text-right text-xs font-black">TOTAL KESELURUHAN</td>
                    <td className="p-3 text-right font-mono">{formatRupiah(totalNominal)}</td>
                    <td className="p-3 text-right font-mono text-red-600">{totalDiskon > 0 ? `-${formatRupiah(totalDiskon)}` : '-'}</td>
                    <td className="p-3 text-right font-mono text-green-600">{formatRupiah(totalPPN)}</td>
                    <td className="p-3 text-right font-mono text-red-600">{totalPPh > 0 ? `-${formatRupiah(totalPPh)}` : '-'}</td>
                    <td className="p-3 text-right font-mono font-black text-[#1A4FBF] bg-[#DFF0FF]">{formatRupiah(totalTagihan)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Rekap Per Klien Preview */}
          <div className="p-6 bg-white border-b border-gray-150 text-left">
            <span className="text-[10px] font-bold text-[#1A4FBF] tracking-wider uppercase border-b-2 border-[#1A4FBF] pb-1 inline-block mb-4">Rekap Per Klien</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1A4FBF] text-white">
                    <th className="p-3 rounded-tl-lg">Nama Klien</th>
                    <th className="p-3 text-center" style={{ width: '25%' }}>Jumlah Invoice</th>
                    <th className="p-3 text-right" style={{ width: '30%' }}>Total Nominal</th>
                    <th className="p-3 text-center rounded-tr-lg" style={{ width: '20%' }}>% Kontribusi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(
                    invoices.reduce((acc, inv) => {
                      if (!acc[inv.clientName]) acc[inv.clientName] = { count: 0, total: 0 };
                      acc[inv.clientName].count += 1;
                      acc[inv.clientName].total += inv.total;
                      return acc;
                    }, {} as Record<string, { count: number; total: number }>)
                  ).map(([klien, data], idx) => {
                    const kontribusi = ((data.total / totalTagihan) * 100).toFixed(1) + '%';
                    return (
                      <tr key={klien} className={idx % 2 === 1 ? 'bg-[#F8FAFF]' : 'bg-white'}>
                        <td className="p-3 font-bold text-gray-800">{klien}</td>
                        <td className="p-3 text-center text-gray-600">{data.count} invoice</td>
                        <td className="p-3 text-right font-mono font-bold text-[#0D1B3E]">{formatRupiah(data.total)}</td>
                        <td className="p-3 text-center font-medium text-gray-500">{kontribusi}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F0F4FF] font-bold text-gray-800">
                    <td className="p-3">TOTAL</td>
                    <td className="p-3 text-center">{invoices.length} invoice</td>
                    <td className="p-3 text-right font-mono font-bold text-[#1A4FBF]">{formatRupiah(totalTagihan)}</td>
                    <td className="p-3 text-center">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Tax Summary */}
          <div className="p-6 bg-white border-b border-gray-150 flex justify-end text-left">
            <div className="w-full sm:w-1/2">
              <span className="text-[10px] font-bold text-[#1A4FBF] tracking-wider uppercase border-b-2 border-[#1A4FBF] pb-1 inline-block mb-3">Ringkasan Pajak</span>
              <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                <div className="flex justify-between p-2.5 border-b border-gray-100">
                  <span className="text-gray-500">Dasar Pengenaan Pajak (DPP)</span>
                  <span className="font-bold">{formatRupiah(totalNominal)}</span>
                </div>
                <div className="flex justify-between p-2.5 border-b border-gray-100">
                  <span className="text-gray-500">Diskon / Potongan Harga</span>
                  <span className="font-bold text-red-600">{totalDiskon > 0 ? `-${formatRupiah(totalDiskon)}` : '-'}</span>
                </div>
                <div className="flex justify-between p-2.5 border-b border-gray-100">
                  <span className="text-gray-500">PPN 11%</span>
                  <span className="font-bold text-green-600">{formatRupiah(totalPPN)}</span>
                </div>
                <div className="flex justify-between p-2.5 border-b border-gray-100">
                  <span className="text-gray-500">PPh 23 (2%)</span>
                  <span className="font-bold text-red-600">{totalPPh > 0 ? `-${formatRupiah(totalPPh)}` : '-'}</span>
                </div>
                <div className="flex justify-between p-2.5 border-b border-gray-100">
                  <span className="text-gray-500">Total Netto Pajak</span>
                  <span className="font-bold">{formatRupiah(totalPPN - totalPPh)}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-[#0D1B3E] text-white font-bold">
                  <span>TOTAL TAGIHAN (setelah pajak & diskon)</span>
                  <span>{formatRupiah(totalTagihan)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sign & Disclaimer */}
          <div className="p-6 bg-white flex flex-col sm:flex-row justify-between items-start gap-6 text-left">
            <div className="text-[10px] text-gray-400 italic max-w-sm leading-relaxed self-center">
              Dokumen ini digenerate secara otomatis oleh sistem FID INVOICE.<br />
              Laporan ini bersifat informatif untuk keperluan internal bisnis.<br />
              Konsultasikan laporan pajak dengan konsultan pajak Anda.
            </div>
            <div className="border border-gray-300 rounded-xl p-4 text-center w-56 shrink-0 bg-[#FBFBFC] relative overflow-hidden">
              <p className="text-[9px] text-gray-500">{periodeData.tanggalCetak}</p>
              <p className="text-xs font-bold text-[#0D1B3E] mt-0.5">Yang Menyetujui,</p>
              
              <div className="h-16 my-1.5 flex items-center justify-center relative">
                {/* Electronic Stamp (renders below/overlapping signature) */}
                {user.stampImage ? (
                  <img src={preloadedStampBase64 || user.stampImage} alt="Stempel" className="h-14 w-14 object-contain absolute left-4 opacity-80 z-0 pointer-events-none" />
                ) : null}

                {/* Electronic Signature */}
                {user.signatureImage ? (
                  <img src={preloadedSignatureBase64 || user.signatureImage} alt="Tanda Tangan" className="h-14 object-contain z-10 relative" />
                ) : null}
              </div>

              <p className="text-xs font-bold text-[#0D1B3E] border-t border-gray-200 pt-1 mt-1 truncate max-w-full">
                {user.fullName}
              </p>
              <p className="text-[9px] text-gray-400 font-medium truncate max-w-full uppercase tracking-wider">
                {bisnisData.nama}
              </p>
            </div>
          </div>

          {/* Footer Preview */}
          <div className="bg-gray-50 p-4 border-t border-gray-150 flex justify-between items-center text-[10px] text-gray-400">
            <span>FID INVOICE &nbsp;|&nbsp; {bisnisData.email} &nbsp;|&nbsp; {bisnisData.website}</span>
            <span>Pratinjau Layar</span>
          </div>
        </div>
      </div>
      
    </div>
  );
}
