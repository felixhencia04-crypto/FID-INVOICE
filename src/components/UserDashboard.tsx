import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, CheckCircle, Clock, AlertCircle, Plus, 
  Download, ArrowUpRight, ArrowDownRight, Bell, Calendar,
  TrendingUp, Users, Package, ChevronRight, HelpCircle,
  Search, Filter, Sparkles, ArrowRight, ShieldCheck, RefreshCw
} from 'lucide-react';
import { Invoice, Client, UserProfile } from '../types';
import { formatCurrency, formatDateIndonesian } from '../utils';

interface UserDashboardProps {
  user: UserProfile;
  invoices: Invoice[];
  clients: Client[];
  onNavigate: (page: string) => void;
  onSelectInvoice: (invoice: Invoice) => void;
}

export default function UserDashboard({ user, invoices, clients, onNavigate, onSelectInvoice }: UserDashboardProps) {
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(5); // Default to latest month (Index 5 / June)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInsightTip, setShowInsightTip] = useState(true);

  // Calculate stats based on current user invoices
  const totalInvoicesCount = invoices.length;
  
  const paidInvoices = invoices.filter(inv => inv.status === 'Lunas');
  const paidSum = paidInvoices.reduce((acc, curr) => acc + curr.total, 0);

  const pendingInvoices = invoices.filter(inv => inv.status === 'Dikirim' || inv.status === 'Sebagian');
  const pendingSum = pendingInvoices.reduce((acc, curr) => acc + curr.total, 0);

  const overdueInvoices = invoices.filter(inv => inv.status === 'Jatuh Tempo');
  const overdueSum = overdueInvoices.reduce((acc, curr) => acc + curr.total, 0);

  const totalOutstanding = pendingSum + overdueSum;

  // Calculate Collection Success Rate
  const totalInvoicedSum = paidSum + pendingSum + overdueSum;
  const collectionRate = totalInvoicedSum > 0 ? Math.round((paidSum / totalInvoicedSum) * 100) : 100;

  // Monthly data calculation
  const getMonthlyData = () => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const currentMonthIdx = new Date().getMonth();
    
    // Create an array of the last 6 months
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIdx - i + 12) % 12;
      last6Months.push({
        month: months[idx],
        monthIdx: idx,
        year: new Date().getFullYear() - (currentMonthIdx - i < 0 ? 1 : 0)
      });
    }

    return last6Months.map(m => {
      const monthInvoices = invoices.filter(inv => {
        const d = new Date(inv.date);
        return d.getMonth() === m.monthIdx && d.getFullYear() === m.year;
      });

      const total = monthInvoices.reduce((acc, curr) => acc + curr.total, 0);
      const paid = monthInvoices.filter(inv => inv.status === 'Lunas').length;
      const rate = monthInvoices.length > 0 ? Math.round((paid / monthInvoices.length) * 100) : 0;

      // Find top client for this month
      const clientMap = new Map<string, number>();
      monthInvoices.forEach(inv => {
        clientMap.set(inv.clientName, (clientMap.get(inv.clientName) || 0) + inv.total);
      });
      let topClient = 'Belum ada data';
      let maxVal = 0;
      clientMap.forEach((v, k) => {
        if (v > maxVal) {
          maxVal = v;
          topClient = k;
        }
      });

      return {
        m: m.month,
        val: total,
        invoicesCount: monthInvoices.length,
        topClient: topClient,
        status: monthInvoices.length > 0 ? `Lunas ${rate}%` : 'Tanpa Transaksi'
      };
    });
  };

  const monthlyRevenueData = getMonthlyData();
  const activeMonth = monthlyRevenueData[selectedMonthIdx];

  // Search & Filter Recent Invoices
  const filteredRecentInvoices = invoices
    .filter(inv => {
      const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            inv.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'Lunas':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider border border-green-200">🟢 Lunas</span>;
      case 'Dikirim':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-brand-primary text-[10px] font-black uppercase tracking-wider border border-blue-200">🔵 Dikirim</span>;
      case 'Sebagian':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-brand-gold text-[10px] font-black uppercase tracking-wider border border-yellow-200">🟡 Sebagian</span>;
      case 'Jatuh Tempo':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-wider border border-red-200">
            🔴 Jatuh Tempo <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          </span>
        );
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-wider border border-gray-200">Draft</span>;
    }
  };

  return (
    <div className="space-y-8 font-sans pb-12">
      
      {/* Top Professional Welcome Section */}
      <div className="relative overflow-hidden bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="space-y-2 text-left relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-brand-primary-light text-brand-primary text-[10px] font-black rounded-full uppercase tracking-wider">
              Dasbor Eksekutif
            </span>
            <span className="flex items-center gap-1 text-[11px] text-brand-gold font-bold">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              Sistem Penagihan Pintar
            </span>
          </div>
          <h1 className="text-2xl sm:text-3.5xl font-display font-black text-brand-dark tracking-tight leading-none mt-1">
            Selamat Datang, {user.fullName}! 👋
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
            Kelola piutang, cetak invoice, dan pantau kesehatan keuangan bisnis <span className="font-extrabold text-brand-primary">{user.businessName}</span> secara otomatis di satu tempat.
          </p>
        </div>

        <div className="flex items-center gap-3.5 bg-gray-50/80 border border-gray-100 p-4 rounded-2xl shrink-0 self-start md:self-center">
          <div className="p-3 rounded-xl bg-brand-primary text-white shadow-md shadow-brand-primary/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-[9px] text-gray-400 font-extrabold uppercase font-mono tracking-widest">Tanggal Hari Ini</p>
            <p className="text-sm font-black text-brand-dark">{formatDateIndonesian(new Date().toISOString().split('T')[0])}</p>
            <span className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3" /> Sinkronisasi Bank Aktif
            </span>
          </div>
        </div>
      </div>

      {/* Trial Expiry Warning Banner */}
      {user.subscription.status === 'trial' && (
        <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl mt-0.5 sm:mt-0 shrink-0">
              <AlertCircle className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-900 uppercase tracking-wider">Masa Uji Coba (Trial Plan) Sedang Aktif</p>
              <p className="text-xs text-amber-700 font-medium mt-1 leading-relaxed">
                Anda memiliki sisa waktu <strong className="text-amber-900 font-extrabold">{user.subscription.trialDaysRemaining} hari</strong> lagi. Upgrade ke paket pembayaran profesional sekarang untuk menghilangkan seluruh limit transaksi dan membuka fitur penuh.
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('subscription')} 
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/15 transition-all transform hover:-translate-y-0.5 cursor-pointer text-center shrink-0"
          >
            Sewa / Berlangganan Sekarang
          </button>
        </div>
      )}

      {/* QUICK ACTIONS PANEL (Beautiful Modern Styling) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-2xl pointer-events-none -mr-10"></div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-brand-primary" />
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Aksi Cepat Bisnis Anda</h3>
        </div>
        <div className="flex flex-wrap gap-3.5 relative z-10">
          <button 
            onClick={() => onNavigate('create-invoice')}
            className="px-5 py-3.5 rounded-2xl bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-brand-primary/10 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Buat Invoice Baru
          </button>
          
          <button 
            onClick={() => onNavigate('clients')}
            className="px-5 py-3.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-brand-dark font-extrabold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4 text-brand-primary" />
            Kelola Klien
          </button>

          <button 
            onClick={() => onNavigate('reports')}
            className="px-5 py-3.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-brand-dark font-extrabold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-brand-primary" />
            Laporan Keuangan
          </button>
          
          <button 
            onClick={() => onNavigate('products')}
            className="px-5 py-3.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-brand-dark font-extrabold text-xs flex items-center gap-2 transition-colors cursor-pointer sm:ml-auto"
          >
            <Package className="w-4 h-4 text-brand-primary" />
            Produk & Jasa
          </button>
        </div>
      </div>

      {/* 4 STUNNING STATS CARDS WITH GLYPHS AND PROGRESS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5">
        
        {/* Card 1: Total Invoice */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col text-left justify-between hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Invoice</p>
            <div className="p-1.5 rounded-lg bg-brand-primary/5 text-brand-primary border border-brand-primary/10 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl sm:text-3xl font-black font-display text-brand-dark leading-none">{totalInvoicesCount}</h3>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-semibold text-green-600 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +15.2%
              </span>
              <span>vs bulan lalu</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Lunas */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col text-left justify-between hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 min-w-0">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dana Lunas</p>
            <div className="p-1.5 rounded-lg bg-green-50 text-green-600 border border-green-100 shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 min-w-0">
            <h3 className="text-sm min-[375px]:text-base sm:text-lg lg:text-sm xl:text-base 2xl:text-lg font-black font-mono text-green-600 leading-tight tracking-tighter whitespace-nowrap overflow-x-auto scrollbar-none" title={formatCurrency(paidSum)}>{formatCurrency(paidSum)}</h3>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-semibold text-green-600 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +18.4%
              </span>
              <span>Arus Kas Masuk</span>
            </div>
          </div>
        </div>

        {/* Card 3: Menunggu Pembayaran */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col text-left justify-between hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 min-w-0">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Piutang Menunggu</p>
            <div className="p-1.5 rounded-lg bg-blue-50 text-brand-primary border border-blue-100 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 min-w-0">
            <h3 className="text-sm min-[375px]:text-base sm:text-lg lg:text-sm xl:text-base 2xl:text-lg font-black font-mono text-brand-primary leading-tight tracking-tighter whitespace-nowrap overflow-x-auto scrollbar-none" title={formatCurrency(pendingSum)}>{formatCurrency(pendingSum)}</h3>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-bold text-brand-primary">{pendingInvoices.length} Invoice Aktif</span>
              <span>Tertunda</span>
            </div>
          </div>
        </div>

        {/* Card 4: Jatuh Tempo */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col text-left justify-between hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 min-w-0">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jatuh Tempo ⚠️</p>
            <div className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 min-w-0">
            <h3 className="text-sm min-[375px]:text-base sm:text-lg lg:text-sm xl:text-base 2xl:text-lg font-black font-mono text-red-600 leading-tight tracking-tighter whitespace-nowrap overflow-x-auto scrollbar-none" title={formatCurrency(overdueSum)}>{formatCurrency(overdueSum)}</h3>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between text-xs text-red-500 font-bold">
              <span>{overdueInvoices.length} Tagihan Terlewat</span>
              <span className="animate-pulse">Segera Tindak!</span>
            </div>
          </div>
        </div>
      </div>

      {/* DUAL COLUMN: ADVANCED FINANCIAL HEALTH AND INTERACTIVE MONTHLY TRENDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Arus Pendapatan Bulanan (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs text-left space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-brand-primary-light text-brand-primary rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <h3 className="font-display font-black text-lg text-brand-dark">Arus Pendapatan Bulanan</h3>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Klik salah satu kolom bulan untuk melihat ringkasan performa rinci</p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-center bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping"></span>
              <span>Analisis Bisnis Real-Time</span>
            </div>
          </div>

          {/* Simple Interactive SVG Bar Chart */}
          <div className="h-64 w-full flex items-end justify-between pt-6 relative px-4 border-b border-gray-100">
            {/* Grid Line lines */}
            <div className="absolute inset-x-0 top-1/4 border-t border-gray-50/80"></div>
            <div className="absolute inset-x-0 top-2/4 border-t border-gray-50/80"></div>
            <div className="absolute inset-x-0 top-3/4 border-t border-gray-50/80"></div>
            
            {/* Bars */}
            {monthlyRevenueData.map((bar, idx) => {
              const maxVal = 18000000;
              const heightPercent = Math.min(100, (bar.val / maxVal) * 100);
              const isSelected = selectedMonthIdx === idx;
              
              return (
                <div 
                  key={idx} 
                  className="flex-1 flex flex-col items-center group z-10 relative cursor-pointer"
                  onClick={() => setSelectedMonthIdx(idx)}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-dark text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-mono shadow-md z-20 pointer-events-none whitespace-nowrap">
                    {formatCurrency(bar.val)}
                  </div>
                  
                  {/* Bar column */}
                  <div className={`w-9 sm:w-12 rounded-t-xl h-48 flex items-end overflow-hidden transition-all duration-300 ${isSelected ? 'bg-brand-primary/10 border border-brand-primary/30 shadow-xs' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <div 
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${isSelected ? 'bg-gradient-to-t from-indigo-600 to-brand-primary' : 'bg-gray-300 group-hover:bg-brand-primary/65'}`}
                    ></div>
                  </div>
                  
                  <span className={`text-xs font-bold mt-3 font-display transition-colors ${isSelected ? 'text-brand-primary font-black' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {bar.m.substring(0,3)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Interactive Monthly Detail Card underneath the chart */}
          <div className="bg-gradient-to-r from-gray-50 to-brand-primary-light/10 border border-gray-100 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-brand-primary bg-brand-primary-light px-2.5 py-0.5 rounded-full tracking-wider">
                Analisis Bulanan: {activeMonth.m}
              </span>
              <p className="text-sm font-black text-brand-dark mt-1">
                Omzet Bulanan: <span className="text-brand-primary font-mono text-base">{formatCurrency(activeMonth.val)}</span>
              </p>
              <p className="text-xs text-gray-500 font-medium">
                Pencetak Invoice Terbanyak: <strong className="text-gray-700">{activeMonth.topClient}</strong>
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 shrink-0 bg-white p-3 rounded-xl border border-gray-100 text-xs shadow-xs">
              <div>
                <p className="text-[9px] text-gray-400 font-bold uppercase">Volume Invoice</p>
                <p className="font-extrabold text-brand-dark">{activeMonth.invoicesCount} Tagihan</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 font-bold uppercase">Efektivitas Koleksi</p>
                <p className="font-extrabold text-green-600">{activeMonth.status}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Collection Efficiency & Business Health Score (4 cols) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
          
          {/* Health Score Widget */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs text-left flex-1 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-black text-base text-brand-dark">Kesehatan Piutang</h3>
                <span className="p-1 rounded-lg bg-green-50 text-green-600">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Rasio efisiensi penagihan piutang usaha Anda</p>
            </div>

            <div className="flex flex-col items-center justify-center py-4 relative">
              {/* Radial Circle Indicator */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="58" fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
                  <circle 
                    cx="72" 
                    cy="72" 
                    r="58" 
                    fill="transparent" 
                    stroke={collectionRate > 80 ? '#10B981' : collectionRate > 50 ? '#F59E0B' : '#EF4444'} 
                    strokeWidth="12" 
                    strokeDasharray="364.4" 
                    strokeDashoffset={364.4 - (364.4 * (collectionRate / 100))}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black font-display text-brand-dark leading-none">{collectionRate}%</span>
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mt-1">Sukses Lunas</span>
                </div>
              </div>

              <div className="text-center mt-4">
                <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {collectionRate > 80 ? 'Sangat Sehat 🟢' : collectionRate > 50 ? 'Cukup Sehat 🟡' : 'Butuh Tindak Lanjut 🔴'}
                </span>
              </div>
            </div>

            <div className="space-y-3.5 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-500">Omzet Tertagih Lunas</span>
                <span className="font-bold text-green-600 font-mono">{formatCurrency(paidSum)}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${collectionRate}%` }}></div>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-500">Piutang Menggantung</span>
                <span className="font-bold text-brand-primary font-mono">{formatCurrency(totalOutstanding)}</span>
              </div>
            </div>
          </div>

          {/* Tips / Notification Panel */}
          {showInsightTip && (
            <div className="bg-gradient-to-r from-brand-primary to-indigo-700 p-5 rounded-3xl text-white text-left relative overflow-hidden shadow-md">
              <div className="absolute -top-5 -right-5 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <button 
                onClick={() => setShowInsightTip(false)}
                className="absolute top-3 right-3 text-white/60 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
              <div className="space-y-2">
                <span className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">Insight Cerdas</span>
                <h4 className="text-xs font-black">Optimalkan Arus Kas Anda</h4>
                <p className="text-[11px] text-blue-100 leading-relaxed font-medium">
                  {overdueSum > 0 ? 
                    `Anda memiliki piutang jatuh tempo senilai ${formatCurrency(overdueSum)}. Gunakan fitur ekspor WhatsApp PDF untuk menindaklanjuti pembayaran klien secara profesional.` :
                    'Luar biasa! Seluruh piutang jatuh tempo terpantau aman. Pertahankan performa penagihan bisnis Anda dengan mengirimkan invoice tepat waktu!'
                  }
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* RECENT INVOICES TABLE WITH LIVE INSTANT FILTER AND SEARCH */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden text-left space-y-4 p-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-primary" />
              <h3 className="font-display font-black text-lg text-brand-dark">Aktivitas Invoice Terbaru</h3>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Pantau dan cari status penagihan invoice terbaru Anda secara instan</p>
          </div>
          <button 
            onClick={() => onNavigate('invoice-list')}
            className="text-xs font-black text-brand-primary hover:text-brand-primary-dark flex items-center gap-1 cursor-pointer bg-brand-primary-light/50 px-3.5 py-2 rounded-xl transition-all self-start sm:self-center"
          >
            Kelola Semua Invoice <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Live Search and Quick Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Search box */}
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input 
              type="text"
              placeholder="Cari nomor invoice atau nama klien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200/80 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-brand-primary focus:border-brand-primary bg-gray-50/50"
            />
          </div>
          
          {/* Status selector */}
          <div className="sm:col-span-5 flex gap-2">
            <div className="relative flex-1">
              <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-3.5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200/80 text-xs font-extrabold focus:outline-hidden focus:ring-1 focus:ring-brand-primary focus:border-brand-primary bg-gray-50/50 text-gray-600 appearance-none cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="Lunas">Lunas</option>
                <option value="Dikirim">Dikirim</option>
                <option value="Sebagian">Sebagian</option>
                <option value="Jatuh Tempo">Jatuh Tempo</option>
              </select>
            </div>
            
            {/* Reset button if active */}
            {(searchQuery !== '' || statusFilter !== 'all') && (
              <button 
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                className="p-2.5 bg-gray-50 border border-gray-200 text-gray-400 hover:text-brand-primary rounded-xl cursor-pointer"
                title="Reset Pencarian"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Table content */}
        {filteredRecentInvoices.length === 0 ? (
          <div className="py-12 text-center text-gray-500 space-y-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-brand-dark">Invoice Tidak Ditemukan</p>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">Tidak ada hasil yang cocok dengan kata kunci atau filter yang Anda pilih.</p>
            </div>
            <button 
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
              className="px-4 py-2 bg-brand-primary-light text-brand-primary font-bold text-xs rounded-xl"
            >
              Lihat Seluruh Aktivitas
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-inner bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-black uppercase border-b border-gray-100">
                  <th className="px-6 py-4">No. Invoice</th>
                  <th className="px-6 py-4">Klien Penagihan</th>
                  <th className="px-6 py-4">Tanggal Buat</th>
                  <th className="px-6 py-4 text-right">Nominal Tagihan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRecentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-black text-brand-dark text-xs">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-brand-dark">{inv.clientName}</div>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {clients.find(c => c.id === inv.clientId)?.email || 'Klien Terdaftar'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs font-medium">{formatDateIndonesian(inv.date)}</td>
                    <td className="px-6 py-4 text-right font-mono font-black text-brand-dark text-sm" title={formatCurrency(inv.total, inv.currency)}>
                      {formatCurrency(inv.total, inv.currency)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => onSelectInvoice(inv)}
                        className="px-3 py-1.5 rounded-lg bg-brand-primary/5 hover:bg-brand-primary text-brand-primary hover:text-white text-xs font-bold transition-all cursor-pointer border border-brand-primary/10 hover:border-brand-primary"
                      >
                        Pratinjau / Bayar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PROFESSIONAL ACTIVITY TIMELINE FEED AND CLIENT STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Lini Masa Aktivitas Bisnis */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs text-left space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4.5 h-4.5 text-brand-primary" />
            <h3 className="font-display font-black text-base text-brand-dark">Aktivitas Keuangan Terkini</h3>
          </div>
          
          <div className="space-y-4 relative before:absolute before:inset-y-1 before:left-3.5 before:w-0.5 before:bg-gray-100 pl-1.5">
            {/* Activity 1 */}
            <div className="flex gap-4 relative">
              <div className="w-7 h-7 rounded-full bg-green-50 border border-green-200 text-green-500 flex items-center justify-center shrink-0 z-10">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5 text-xs">
                <p className="text-gray-500 font-medium">Pembayaran masuk berhasil diverifikasi oleh sistem otomatis</p>
                <p className="font-extrabold text-brand-dark">Invoice #INV-001 senilai Rp 500.000 lunas via QRIS / BCA</p>
                <span className="text-[10px] text-gray-400 font-mono">Baru saja • Sistem Otomatis</span>
              </div>
            </div>

            {/* Activity 2 */}
            <div className="flex gap-4 relative">
              <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 text-brand-primary flex items-center justify-center shrink-0 z-10">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5 text-xs">
                <p className="text-gray-500 font-medium">Invoice penagihan baru telah dibuat & dikirim</p>
                <p className="font-extrabold text-brand-dark">Invoice #INV-003 kepada PT Sinar Mentari Utama</p>
                <span className="text-[10px] text-gray-400 font-mono">1 jam yang lalu • {user.fullName}</span>
              </div>
            </div>

            {/* Activity 3 */}
            <div className="flex gap-4 relative">
              <div className="w-7 h-7 rounded-full bg-brand-gold/10 border border-brand-gold/30 text-brand-gold flex items-center justify-center shrink-0 z-10">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5 text-xs">
                <p className="text-gray-500 font-medium">Mitra klien bisnis baru berhasil terdaftar di database</p>
                <p className="font-extrabold text-brand-dark">Menambahkan CV Sukses Abadi Pratama</p>
                <span className="text-[10px] text-gray-400 font-mono">Kemarin • {user.fullName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Analisis Konsentrasi Klien */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs text-left flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-brand-primary" />
                <h3 className="font-display font-black text-base text-brand-dark">Konsentrasi Klien Aktif</h3>
              </div>
              <span className="text-[10px] text-gray-400 font-black uppercase font-mono">{clients.length} Klien Terdaftar</span>
            </div>
            
            <div className="space-y-4 py-2">
              {clients.slice(0, 3).map((client, idx) => {
                // Approximate client weight
                const clientInvoices = invoices.filter(i => i.clientName === client.name);
                const clientSum = clientInvoices.reduce((acc, curr) => acc + curr.total, 0);
                const totalSumAll = invoices.reduce((acc, curr) => acc + curr.total, 0) || 1;
                const percentage = Math.round((clientSum / totalSumAll) * 100) || (idx === 0 ? 55 : idx === 1 ? 30 : 15);
                
                return (
                  <div key={client.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-brand-dark truncate pr-4">{client.name}</span>
                      <span className="font-extrabold text-brand-primary font-mono">{percentage}% Kontribusi</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${idx === 0 ? 'bg-brand-primary' : idx === 1 ? 'bg-indigo-500' : 'bg-brand-gold'}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 mt-4">
            <button 
              onClick={() => onNavigate('clients')}
              className="w-full py-2.5 bg-gray-50 hover:bg-brand-primary-light/30 text-brand-primary font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-gray-100"
            >
              Lihat Detail Rekapitulasi Klien <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
