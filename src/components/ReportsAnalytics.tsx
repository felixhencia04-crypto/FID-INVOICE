import { useState } from 'react';
import { 
  BarChart3, Calendar, FileText, Download, TrendingUp, 
  CircleDollarSign, ShieldAlert, CheckCircle2, Layers, ArrowUpRight,
  Filter, CalendarCheck, RefreshCw, Printer, Search, ArrowRight,
  TrendingDown, Award, Briefcase, Percent
} from 'lucide-react';
import { Invoice, Client, UserProfile } from '../types';
import { formatCurrency, formatDateIndonesian } from '../utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsAnalyticsProps {
  invoices: Invoice[];
  clients: Client[];
  user?: UserProfile;
}

type FilterPreset = 'all' | 'this-month' | 'q1' | 'q2' | 'q3' | 'q4' | 'this-year' | 'custom';

export default function ReportsAnalytics({ invoices, clients, user }: ReportsAnalyticsProps) {
  const [filterType, setFilterType] = useState<FilterPreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const now = new Date();
  const yearStr = now.getFullYear().toString();
  
  // Calculate computed start and end dates based on filter selection
  let computedStartDate = '';
  let computedEndDate = '';
  
  if (filterType === 'all') {
    computedStartDate = '';
    computedEndDate = '';
  } else if (filterType === 'this-month') {
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    computedStartDate = `${yearStr}-${monthStr}-01`;
    computedEndDate = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
  } else if (filterType === 'q1') {
    computedStartDate = `${yearStr}-01-01`;
    computedEndDate = `${yearStr}-03-31`;
  } else if (filterType === 'q2') {
    computedStartDate = `${yearStr}-04-01`;
    computedEndDate = `${yearStr}-06-30`;
  } else if (filterType === 'q3') {
    computedStartDate = `${yearStr}-07-01`;
    computedEndDate = `${yearStr}-09-30`;
  } else if (filterType === 'q4') {
    computedStartDate = `${yearStr}-10-01`;
    computedEndDate = `${yearStr}-12-31`;
  } else if (filterType === 'this-year') {
    computedStartDate = `${yearStr}-01-01`;
    computedEndDate = `${yearStr}-12-31`;
  } else if (filterType === 'custom') {
    computedStartDate = startDate;
    computedEndDate = endDate;
  }

  // Filter invoices belonging to selected dates
  const filteredInvoices = invoices.filter(inv => {
    if (!inv.date) return false;
    if (computedStartDate && inv.date < computedStartDate) return false;
    if (computedEndDate && inv.date > computedEndDate) return false;
    return true;
  });

  // Basic aggregates from FILTERED list
  const totalRevenue = filteredInvoices
    .filter(inv => inv.status === 'Lunas')
    .reduce((acc, curr) => acc + curr.total, 0);

  const pendingRevenue = filteredInvoices
    .filter(inv => inv.status === 'Dikirim' || inv.status === 'Sebagian')
    .reduce((acc, curr) => acc + curr.total, 0);

  const overdueRevenue = filteredInvoices
    .filter(inv => inv.status === 'Jatuh Tempo')
    .reduce((acc, curr) => acc + curr.total, 0);

  // Tax summaries
  const totalPpn = filteredInvoices
    .filter(inv => inv.status === 'Lunas')
    .reduce((acc, curr) => acc + curr.taxAmount, 0);

  const totalPph = filteredInvoices
    .filter(inv => inv.status === 'Lunas')
    .reduce((acc, curr) => acc + curr.tax2Amount, 0);

  // Average Invoice Total
  const averageInvoiceValue = filteredInvoices.length > 0 
    ? filteredInvoices.reduce((acc, curr) => acc + curr.total, 0) / filteredInvoices.length
    : 0;

  // Search inside filtered invoices for transaction table
  const searchedInvoices = filteredInvoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Top clients logic in filtered period
  const clientRevenueMap: { [key: string]: { name: string, total: number, count: number } } = {};
  
  clients.forEach(c => {
    clientRevenueMap[c.id] = { name: c.name, total: 0, count: 0 };
  });

  filteredInvoices.forEach(inv => {
    if (inv.status === 'Lunas') {
      if (clientRevenueMap[inv.clientId]) {
        clientRevenueMap[inv.clientId].total += inv.total;
        clientRevenueMap[inv.clientId].count += 1;
      } else {
        clientRevenueMap[inv.clientId] = { name: inv.clientName, total: inv.total, count: 1 };
      }
    }
  });

  const topClients = Object.values(clientRevenueMap)
    .sort((a, b) => b.total - a.total)
    .filter(item => item.total > 0)
    .slice(0, 5);

  const getActivePeriodLabel = () => {
    switch (filterType) {
      case 'all':
        return 'Seluruh Periode (Semua Waktu)';
      case 'this-month':
        return `Bulan Ini (${formatDateIndonesian(`${yearStr}-${String(now.getMonth() + 1).padStart(2, '0')}-01`).slice(3)})`;
      case 'q1':
        return `Kuartal I (Januari - Maret ${yearStr})`;
      case 'q2':
        return `Kuartal II (April - Juni ${yearStr})`;
      case 'q3':
        return `Kuartal III (Juli - September ${yearStr})`;
      case 'q4':
        return `Kuartal IV (Oktober - Desember ${yearStr})`;
      case 'this-year':
        return `Tahun Ini (${yearStr})`;
      case 'custom':
        if (!startDate && !endDate) return 'Kustom Periode (Pilih Tanggal)';
        const startLabel = startDate ? formatDateIndonesian(startDate) : 'Mulai Awal';
        const endLabel = endDate ? formatDateIndonesian(endDate) : 'Hingga Akhir';
        return `Periode Kustom: ${startLabel} s/d ${endLabel}`;
      default:
        return 'Laporan Keuangan';
    }
  };

  // Modern PDF Export using jsPDF and jspdf-autotable
  const exportPDFReport = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const businessName = user?.businessName || 'Sistem Invoice Mandiri';
    const ownerName = user?.fullName || 'Mitra Bisnis';
    const email = user?.email || '-';
    const phone = user?.phone || '-';
    const address = user?.address || '-';
    const taxNum = user?.taxNumber || '-';

    // Header styling - Deep corporate slate theme
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, 210, 42, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(businessName.toUpperCase(), 15, 18);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`NPWP/NIB: ${taxNum}`, 15, 24);
    doc.text(`Pemilik: ${ownerName} | Kontak: ${phone} | Email: ${email}`, 15, 29);
    doc.text(`Alamat: ${address}`, 15, 34);

    // Document Meta
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(79, 70, 229);
    doc.text('LAPORAN REKAPITULASI KEUANGAN & OMZET', 15, 52);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text(`Periode Laporan : ${getActivePeriodLabel()}`, 15, 58);
    doc.text(`Tanggal Cetak   : ${formatDateIndonesian(new Date().toISOString().slice(0, 10))}`, 15, 63);

    // Summary Box
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(15, 68, 180, 28, 3, 3, 'FD');
    doc.setDrawColor(229, 231, 235);
    
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('TOTAL PENDAPATAN (LUNAS)', 20, 75);
    doc.text('PIUTANG MENUNGGU', 85, 75);
    doc.text('PIUTANG JATUH TEMPO', 145, 75);

    // Values in Summary Box
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129); // Emerald 600
    doc.text(formatCurrency(totalRevenue), 20, 81);
    
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text(formatCurrency(pendingRevenue), 85, 81);
    
    doc.setTextColor(220, 38, 38); // Red 600
    doc.text(formatCurrency(overdueRevenue), 145, 81);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(`Estimasi Pajak PPN (11%): ${formatCurrency(totalPpn)}   |   Kredit Pemotongan PPh 23 (2%): ${formatCurrency(totalPph)}   |   Jumlah Transaksi: ${filteredInvoices.length} Inv`, 20, 89);

    // Table Section
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text('RINCIAN TRANSAKSI INVOICE PERIODE INI', 15, 105);

    const tableData = filteredInvoices.map((inv, idx) => [
      idx + 1,
      formatDateIndonesian(inv.date),
      inv.invoiceNumber,
      inv.clientName,
      inv.status.toUpperCase(),
      formatCurrency(inv.taxAmount + inv.tax2Amount),
      formatCurrency(inv.total)
    ]);

    autoTable(doc, {
      startY: 109,
      head: [['No', 'Tanggal', 'No. Invoice', 'Klien', 'Status', 'Total Pajak', 'Jumlah Bersih']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [31, 41, 55],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [55, 65, 81],
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 25, halign: 'left' },
        3: { cellWidth: 50, halign: 'left' },
        4: { cellWidth: 22, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 28, halign: 'right' }
      },
      styles: { font: 'Helvetica' }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 12;
    if (finalY > 240) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text('KLIEN BERKONTRIBUSI BESAR PADA PERIODE INI', 15, finalY);

    const clientRows = topClients.slice(0, 3).map((tc, idx) => [
      `${idx + 1}. ${tc.name}`,
      `${tc.count} Invoice Lunas`,
      formatCurrency(tc.total)
    ]);

    autoTable(doc, {
      startY: finalY + 4,
      head: [['Klien Utama', 'Frekuensi Terbayar', 'Total Kontribusi Omzet']],
      body: clientRows,
      theme: 'plain',
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [55, 65, 81],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [55, 65, 81]
      }
    });

    // Signatures and footers on each page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(`Halaman ${i} dari ${pageCount}`, 105, 287, { align: 'center' });
      doc.text('Laporan Keuangan ini dicetak otomatis secara digital dan sah sebagai rekapitulasi performa bisnis.', 15, 287);
    }

    doc.save(`Laporan_Keuangan_${businessName.replace(/\s+/g, '_')}_${filterType}.pdf`);
  };

  return (
    <div className="space-y-6 font-sans text-left">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-brand-primary/5 text-brand-primary rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-brand-dark">Laporan & Analisis Keuangan</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Analisis arus kas, kepatuhan perpajakan, rekapitulasi omzet, dan laporan per periode secara real-time
          </p>
        </div>
        
        <button 
          onClick={exportPDFReport}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-dark hover:bg-brand-dark/95 text-white text-xs font-black rounded-xl transition-all shadow-xs duration-200 shrink-0 self-start md:self-center"
        >
          <Printer className="w-4 h-4" />
          Cetak Laporan Keuangan (PDF)
        </button>
      </div>

      {/* FILTER CONTROL PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-gray-50 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider">Saring Rentang Periode Laporan</h2>
          </div>
          <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-bold">
            {filteredInvoices.length} Terpilih
          </span>
        </div>

        {/* Buttons Preset Row */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Semua Waktu' },
            { id: 'this-month', label: 'Bulan Ini' },
            { id: 'q1', label: 'Q1 (Jan - Mar)' },
            { id: 'q2', label: 'Q2 (Apr - Jun)' },
            { id: 'q3', label: 'Q3 (Jul - Sep)' },
            { id: 'q4', label: 'Q4 (Okt - Des)' },
            { id: 'this-year', label: `Tahun ${yearStr}` },
            { id: 'custom', label: 'Kustom Tanggal 📅' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setFilterType(preset.id as FilterPreset);
                if (preset.id !== 'custom') {
                  setStartDate('');
                  setEndDate('');
                }
              }}
              className={`px-3 py-2 text-xs rounded-xl font-bold border transition-all duration-200 ${
                filterType === preset.id
                  ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* If custom option selected, show Date pickers */}
        {filterType === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 animate-fadeIn text-xs">
            <div className="space-y-1.5 text-left">
              <label className="font-bold text-gray-400 uppercase text-[9px] tracking-wider">Dari Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:border-brand-primary outline-none font-bold"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="font-bold text-gray-400 uppercase text-[9px] tracking-wider">Sampai Tanggal Akhir</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:border-brand-primary outline-none font-bold"
              />
            </div>
          </div>
        )}

        <p className="text-[10px] text-gray-400 italic">
          * Seluruh total performa, rasio piutang, perpajakan, dan rincian transaksi di bawah akan otomatis menyesuaikan dengan rentang waktu yang Anda pilih di atas.
        </p>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 xl:gap-5">
        
        {/* Card 1: Total Lunas */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col text-left justify-between hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 min-w-0">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendapatan Bersih (Lunas)</p>
            <span className="p-1.5 rounded-lg bg-green-50 text-green-600 shrink-0 border border-green-100">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 min-w-0">
            <h3 className="text-sm min-[375px]:text-base sm:text-lg lg:text-sm xl:text-base 2xl:text-lg font-black font-mono text-green-600 leading-tight tracking-tighter whitespace-nowrap overflow-x-auto scrollbar-none" title={formatCurrency(totalRevenue)}>
              {formatCurrency(totalRevenue)}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50">
            <p className="text-[9px] text-gray-400">Total akumulasi tagihan terbayar di rentang ini</p>
          </div>
        </div>

        {/* Card 2: Piutang Menunggu */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col text-left justify-between hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 min-w-0">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Piutang Menunggu (Pending)</p>
            <span className="p-1.5 rounded-lg bg-blue-50 text-brand-primary shrink-0 border border-blue-100">
              <CircleDollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 min-w-0">
            <h3 className="text-sm min-[375px]:text-base sm:text-lg lg:text-sm xl:text-base 2xl:text-lg font-black font-mono text-brand-primary leading-tight tracking-tighter whitespace-nowrap overflow-x-auto scrollbar-none" title={formatCurrency(pendingRevenue)}>
              {formatCurrency(pendingRevenue)}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50">
            <p className="text-[9px] text-gray-400">Tagihan aktif menunggu pembayaran di rentang ini</p>
          </div>
        </div>

        {/* Card 3: Piutang Jatuh Tempo */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col text-left justify-between hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 min-w-0">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Piutang Jatuh Tempo</p>
            <span className="p-1.5 rounded-lg bg-red-50 text-red-500 shrink-0 border border-red-100">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 min-w-0">
            <h3 className="text-sm min-[375px]:text-base sm:text-lg lg:text-sm xl:text-base 2xl:text-lg font-black font-mono text-red-600 leading-tight tracking-tighter whitespace-nowrap overflow-x-auto scrollbar-none" title={formatCurrency(overdueRevenue)}>
              {formatCurrency(overdueRevenue)}
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50">
            <p className="text-[9px] text-gray-400 font-bold text-red-500">⚠️ Butuh pengingat berkala ke klien</p>
          </div>
        </div>

      </div>

      {/* ADDITIONAL PERFORMANCE WIDGETS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Rata-Rata Nilai Invoice */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Rata-Rata Nilai Invoice</p>
            <p className="text-base sm:text-lg font-mono font-black text-brand-dark tracking-tight whitespace-nowrap overflow-x-auto scrollbar-none" title={formatCurrency(averageInvoiceValue)}>
              {formatCurrency(averageInvoiceValue)}
            </p>
            <p className="text-[9px] text-gray-400">Total nilai rata-rata per penagihan transaksi</p>
          </div>
          <div className="p-3 bg-brand-primary/5 text-brand-primary rounded-xl shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        {/* Rasio Penagihan Lancar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Rasio Pembayaran Lunas</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl sm:text-2xl font-display font-extrabold text-emerald-600">
                {Math.round((totalRevenue / (totalRevenue + pendingRevenue + overdueRevenue || 1)) * 100)}%
              </p>
              <p className="text-[10px] text-gray-400 font-medium">dari total omzet</p>
            </div>
            <p className="text-[9px] text-gray-400">Persentase keberhasilan pencairan piutang</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <Percent className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* MID-SECTION ANALYSIS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Tax Summary Report (Left) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-1.5 text-brand-dark">
              <Layers className="w-4.5 h-4.5 text-indigo-600" />
              <h3 className="font-display font-extrabold text-base">Laporan Akuntansi Perpajakan</h3>
            </div>
            <p className="text-xs text-gray-400 mt-1">Estimasi PPN 11% dikumpulkan dan PPh 23 dipotong</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100/80 space-y-2 text-xs">
              <div className="flex justify-between font-bold items-center">
                <span className="text-gray-600">Total Pajak Masukan PPN (11%):</span>
                <span className="font-mono text-brand-dark font-bold whitespace-nowrap overflow-x-auto scrollbar-none">{formatCurrency(totalPpn)}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">PPN yang Anda cantumkan pada invoice penagihan resmi, wajib dilaporkan pada SPT Masa PPN.</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100/80 space-y-2 text-xs">
              <div className="flex justify-between font-bold items-center">
                <span className="text-gray-600">Total Potongan PPh Pasal 23 (2%):</span>
                <span className="font-mono text-red-600 font-bold whitespace-nowrap overflow-x-auto scrollbar-none">-{formatCurrency(totalPph)}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">PPh 23 dipotong oleh klien Anda (pemotong pajak). Pastikan Anda meminta Bukti Potong resmi dari klien untuk kredit pajak tahunan.</p>
            </div>
          </div>
        </div>

        {/* Top Clients by Revenue (Right) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-1.5 text-brand-dark">
              <Award className="w-4.5 h-4.5 text-amber-500" />
              <h3 className="font-display font-extrabold text-base">Kontributor Omzet Terbesar (Lunas)</h3>
            </div>
            <p className="text-xs text-gray-400 mt-1">Daftar klien dengan kontribusi dana cair terbesar pada periode terpilih</p>
          </div>

          <div className="space-y-4">
            {topClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <TrendingDown className="w-8 h-8 text-gray-300" />
                <p className="text-xs text-gray-400 italic mt-2">Belum ada data omzet lunas pada periode ini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topClients.map((tc, index) => (
                  <div key={index} className="flex justify-between items-center text-xs p-3.5 bg-gray-50 rounded-xl hover:bg-brand-primary-light/10 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded bg-brand-primary text-white flex items-center justify-center font-bold text-xs font-mono shrink-0">{index + 1}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-brand-dark truncate">{tc.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{tc.count} Invoice Terbayar</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-brand-dark whitespace-nowrap ml-2 overflow-x-auto scrollbar-none shrink-0">{formatCurrency(tc.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Piutang Aging Report */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div>
          <h3 className="font-display font-extrabold text-base text-brand-dark">Analisis Arus Kas & Estimasi Umur Piutang</h3>
          <p className="text-xs text-gray-400 mt-1">Metrik pemantauan kesehatan likuiditas piutang bisnis Anda</p>
        </div>

        {/* Custom Visual Timeline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-4 bg-green-50 border border-green-150 rounded-xl text-left min-w-0">
            <p className="text-[10px] text-green-700 font-bold uppercase tracking-wider truncate">Lancar / Belum Tempo</p>
            <p className="text-base font-bold text-green-700 font-mono mt-1 truncate" title={formatCurrency(pendingRevenue)}>{formatCurrency(pendingRevenue)}</p>
            <p className="text-[9px] text-gray-400 mt-1">Pembayaran aman.</p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-150 rounded-xl text-left min-w-0">
            <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider truncate">Tertunggak 1-30 Hari</p>
            <p className="text-base font-bold text-amber-700 font-mono mt-1 truncate" title={formatCurrency(overdueRevenue)}>{formatCurrency(overdueRevenue)}</p>
            <p className="text-[9px] text-gray-400 mt-1">Segera kirim pengingat.</p>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-150 rounded-xl text-left min-w-0">
            <p className="text-[10px] text-orange-700 font-bold uppercase tracking-wider truncate">Tertunggak 31-60 Hari</p>
            <p className="text-base font-bold text-orange-700 font-mono mt-1 truncate">{formatCurrency(0)}</p>
            <p className="text-[9px] text-gray-400 mt-1">Hubungi via telepon.</p>
          </div>

          <div className="p-4 bg-red-50 border border-red-150 rounded-xl text-left min-w-0">
            <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider truncate">Tertunggak &gt; 60 Hari</p>
            <p className="text-base font-bold text-red-600 font-mono mt-1 truncate">{formatCurrency(0)}</p>
            <p className="text-[9px] text-gray-400 mt-1">Risiko piutang macet.</p>
          </div>
        </div>
      </div>

      {/* DETAILED TRANSACTION TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left">
            <h3 className="font-display font-extrabold text-base text-brand-dark">Rincian Transaksi Keuangan</h3>
            <p className="text-xs text-gray-400 mt-0.5">Daftar semua invoice yang masuk dalam penyaringan filter aktif</p>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari No. Invoice / Klien..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 focus:border-brand-primary outline-none w-full sm:w-64"
            />
          </div>
        </div>

        {searchedInvoices.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="inline-flex p-3 bg-gray-50 text-gray-400 rounded-full border border-gray-100">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-600">Tidak ada transaksi ditemukan</p>
              <p className="text-[10px] text-gray-400 mt-1">Sesuaikan kata kunci pencarian atau ganti rentang tanggal filter Anda.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 text-gray-400 font-bold uppercase text-[9px] tracking-wider border-b border-gray-100">
                  <th className="px-6 py-3.5 text-center w-12">No</th>
                  <th className="px-6 py-3.5">Tanggal</th>
                  <th className="px-6 py-3.5">No. Invoice</th>
                  <th className="px-6 py-3.5">Nama Klien</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Taxes (PPN+PPh)</th>
                  <th className="px-6 py-3.5 text-right">Total Tagihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {searchedInvoices.map((inv, idx) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 text-center font-mono text-gray-400 font-bold">{idx + 1}</td>
                    <td className="px-6 py-3.5 text-gray-600 font-medium">{formatDateIndonesian(inv.date)}</td>
                    <td className="px-6 py-3.5 font-bold text-brand-dark">{inv.invoiceNumber}</td>
                    <td className="px-6 py-3.5 font-semibold text-brand-dark">{inv.clientName}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        inv.status === 'Lunas' 
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : inv.status === 'Draft'
                          ? 'bg-gray-50 text-gray-500 border border-gray-100'
                          : inv.status === 'Jatuh Tempo'
                          ? 'bg-red-50 text-red-700 border border-red-100'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-medium text-gray-500">
                      {formatCurrency(inv.taxAmount + inv.tax2Amount)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-black text-brand-dark">
                      {formatCurrency(inv.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
