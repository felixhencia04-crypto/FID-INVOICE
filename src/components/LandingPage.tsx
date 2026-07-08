import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, BarChart3, Users, Bell, Globe, Shield, Download, 
  DollarSign, ArrowRight, CheckCircle2, ChevronDown, HelpCircle, 
  Star, User, Menu, X, Landmark, Smartphone, RefreshCw,
  Share2, Layers, Sparkles, Copy, Check, ExternalLink, Send, Building2
} from 'lucide-react';
import { showToast } from '../utils/toast';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  onSelectPlan: (plan: 'starter' | 'professional' | 'enterprise') => void;
}

export default function LandingPage({ onNavigate, onSelectPlan }: LandingPageProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // States for interactive demo simulation
  const [activeDemoTab, setActiveDemoTab] = useState<'quotation' | 'share' | 'multiprofile' | 'receipt'>('quotation');
  const [demoQuoteConverted, setDemoQuoteConverted] = useState(false);
  const [demoTemplate, setDemoTemplate] = useState<'standard' | 'followup'>('standard');
  const [demoCopied, setDemoCopied] = useState(false);
  const [demoActiveBrand, setDemoActiveBrand] = useState<'brandA' | 'brandB'>('brandA');

  const features = [
    {
      icon: <FileText className="w-6 h-6 text-brand-primary" />,
      title: "📄 Penawaran Cerdas & Konversi",
      desc: "Buat Surat Penawaran Harga (Quotation) profesional, dan ubah menjadi Invoice Resmi hanya dengan 1 klik tanpa harus menginput ulang data."
    },
    {
      icon: <Share2 className="w-6 h-6 text-brand-primary" />,
      title: "💬 WA & Email Share Engine",
      desc: "Kirim tagihan via WhatsApp & Email dengan Template Standar (detail formal) atau Template Follow-Up (persuasif negosiasi) yang meningkatkan kesepakatan."
    },
    {
      icon: <Layers className="w-6 h-6 text-brand-primary" />,
      title: "🏢 Multi-Profil Bisnis Owner",
      desc: "Kelola banyak entitas usaha, logo, rekening, stempel, dan database keuangan yang terisolasi secara mandiri dalam satu dashboard terpadu."
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-brand-primary" />,
      title: "🧾 Kuitansi Sah Otomatis",
      desc: "Saat invoice klien ditandai lunas, sistem instan memproduksi dokumen Kuitansi Resmi bertanda tangan & berstempel basah siap kirim."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-brand-primary" />,
      title: "📊 Laporan Real-Time Cerdas",
      desc: "Pantau omzet kotor, total piutang macet, invoice berjalan, pengeluaran, serta performa bulanan melalui grafik analisis visual."
    },
    {
      icon: <Users className="w-6 h-6 text-brand-primary" />,
      title: "👥 Manajemen Klien Presisi",
      desc: "Rekam jejak database klien lengkap dengan nomor kontak telepon, alamat email, draf surat penawaran, serta riwayat kuitansi lunas."
    },
    {
      icon: <Download className="w-6 h-6 text-brand-primary" />,
      title: "📤 Ekspor PDF & Cetak A4",
      desc: "Format cetak didesain dengan presisi tinggi untuk kertas A4 fisik ataupun format digital PDF, rapi, elegan, dan profesional."
    },
    {
      icon: <DollarSign className="w-6 h-6 text-brand-primary" />,
      title: "🌐 Multi-Mata Uang & Pajak",
      desc: "Mendukung IDR, USD, SGD dengan kalkulasi pajak PPN 11% / PPh 23 dan diskon global yang fleksibel sesuai kebutuhan kontrak bisnis."
    }
  ];

  const testimonials = [
    {
      name: "Bambang Pamungkas",
      role: "CEO Solusi Digital Bandung",
      avatar: "BP",
      quote: "Semenjak pakai FID INVOICE, penagihan klien kami jadi 3x lebih cepat. Fitur pengingat otomatisnya sangat membantu meminimalisir piutang macet!"
    },
    {
      name: "Siti Amelia",
      role: "Freelance UI Designer",
      avatar: "SA",
      quote: "Tampilan invoicenya sangat profesional dan berkelas. Klien saya sekarang membayar tepat waktu dan saya terlihat seperti agensi besar."
    },
    {
      name: "Hendra Wijaya",
      role: "Pemilik Ritel Sembako Berkah",
      avatar: "HW",
      quote: "Sangat mudah digunakan bahkan untuk orang awam teknologi seperti saya. Angka terbilang otomatisnya menghindarkan saya dari salah ketik nominal."
    }
  ];

  const faqs = [
    {
      q: "Apakah saya bisa mencoba FID INVOICE secara gratis?",
      a: "Ya! Kami menyediakan uji coba gratis selama 3 hari (Paket Starter) tanpa memerlukan kartu kredit. Anda dapat mencoba semua fitur dasar sebelum memutuskan untuk berlangganan."
    },
    {
      q: "Bagaimana cara melakukan pembayaran langganan?",
      a: "Kami mendukung pembayaran mudah melalui Transfer Bank BCA yang terverifikasi secara otomatis oleh sistem kami dalam hitungan detik."
    },
    {
      q: "Apakah data saya aman di FID INVOICE?",
      a: "Keamanan Anda adalah prioritas utama kami. Semua data dikirimkan melalui enkripsi SSL 256-bit tingkat perbankan dan disimpan secara terisolasi per pengguna untuk menjaga privasi."
    },
    {
      q: "Apa yang terjadi jika langganan saya habis?",
      a: "Jika langganan habis dan tidak diperpanjang, akses Anda ke fitur pembuatan invoice akan dikunci untuk sementara. Namun data klien, invoice lama, dan pengaturan Anda tetap tersimpan dengan aman dan tidak akan dihapus."
    },
    {
      q: "Bisakah saya mengekspor data saya?",
      a: "Tentu saja. Anda bisa mengekspor laporan keuangan, ringkasan transaksi, serta daftar klien ke format Excel (CSV) dan mengekspor seluruh invoice yang telah dibuat ke PDF."
    },
    {
      q: "Apakah FID INVOICE bisa digunakan di HP?",
      a: "Ya! Aplikasi kami dioptimalkan sepenuhnya untuk tampilan mobile. Anda dapat membuat, memantau, dan mengirimkan invoice langsung dari smartphone Anda tanpa kesulitan."
    },
    {
      q: "Bagaimana cara membatalkan langganan?",
      a: "Anda dapat membatalkan atau menurunkan paket langganan Anda kapan saja melalui halaman pengaturan langganan di aplikasi tanpa dikenakan biaya denda."
    },
    {
      q: "Apakah ada biaya tersembunyi?",
      a: "Tidak ada biaya tersembunyi sama sekali. Tarif yang tertera pada paket langganan adalah harga flat bulanan atau tahunan sesuai yang Anda pilih."
    }
  ];

  const handleFreeTrialClick = () => {
    onSelectPlan('starter');
    onNavigate('register');
  };

  const handlePaidPlanClick = (plan: 'professional' | 'enterprise') => {
    onSelectPlan(plan);
    onNavigate('register');
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col selection:bg-brand-primary/20 selection:text-brand-primary">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
              <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center shadow-md shadow-brand-primary/20">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 17V7H15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12H13.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <span className="font-display font-bold text-xl text-brand-dark tracking-tight">FID <span className="text-brand-primary">INVOICE</span></span>
                <p className="text-[9px] text-brand-gold font-bold tracking-widest uppercase -mt-1 font-mono">Invoice Cerdas</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#fitur" className="text-gray-600 hover:text-brand-primary font-medium text-sm transition-colors">Fitur</a>
              <a href="#alur-kerja" className="text-gray-600 hover:text-brand-primary font-medium text-sm transition-colors">Cara Kerja</a>
              <a href="#harga" className="text-gray-600 hover:text-brand-primary font-medium text-sm transition-colors">Harga</a>
              <a href="#faq" className="text-gray-600 hover:text-brand-primary font-medium text-sm transition-colors">FAQ</a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => onNavigate('login')} 
                className="text-gray-700 hover:text-brand-primary font-semibold text-sm px-4 py-2 transition-colors cursor-pointer"
              >
                Masuk
              </button>
              <button 
                onClick={handleFreeTrialClick}
                className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Coba Gratis
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-brand-primary p-2 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 space-y-3 shadow-lg">
            <a href="#fitur" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700 font-medium hover:text-brand-primary">Fitur</a>
            <a href="#alur-kerja" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700 font-medium hover:text-brand-primary">Cara Kerja</a>
            <a href="#harga" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700 font-medium hover:text-brand-primary">Harga</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-700 font-medium hover:text-brand-primary">FAQ</a>
            <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
              <button 
                onClick={() => { setMobileMenuOpen(false); onNavigate('login'); }}
                className="w-full text-center py-2 text-gray-700 font-semibold hover:text-brand-primary"
              >
                Masuk
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); handleFreeTrialClick(); }}
                className="w-full text-center bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2.5 rounded-xl shadow-md"
              >
                Coba Gratis
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative pt-16 pb-24 overflow-hidden bg-gradient-to-b from-white via-brand-light to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/5 border border-brand-primary/10 w-fit mb-6">
                <span className="w-2 h-2 rounded-full bg-brand-gold animate-ping"></span>
                <span className="text-xs font-semibold text-brand-primary">Invoice Cerdas, Bisnis Lancar</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-brand-dark leading-tight tracking-tight mb-6">
                Buat Invoice Profesional <br />
                <span className="text-brand-primary">dalam 60 Detik</span>
              </h1>
              
              <p className="text-gray-600 text-lg sm:text-xl leading-relaxed mb-8 max-w-2xl">
                FID INVOICE membantu bisnis Anda tampil lebih profesional dengan sistem invoice otomatis, pelacakan pembayaran cerdas, dan laporan keuangan real-time. Cocok untuk UMKM, freelancer, dan bisnis berkembang di Indonesia.
              </p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
                <button 
                  onClick={handleFreeTrialClick}
                  className="bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-base px-8 py-4 rounded-xl transition-all shadow-lg shadow-brand-primary/30 hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  Mulai Gratis 3 Hari
                  <ArrowRight className="w-5 h-5" />
                </button>
                <a 
                  href="#harga"
                  className="bg-white hover:bg-gray-50 border border-gray-200 text-brand-dark font-bold text-base px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 hover:border-gray-300"
                >
                  Lihat Paket Harga
                </a>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-8 max-w-lg">
                <div>
                  <h4 className="text-2xl font-bold font-display text-brand-dark">10,000+</h4>
                  <p className="text-xs text-gray-500">Pengguna Aktif</p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold font-display text-brand-dark">4.9 ★</h4>
                  <p className="text-xs text-gray-500">Rating Kepuasan</p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold font-display text-brand-dark">SSL</h4>
                  <p className="text-xs text-gray-500">Enkripsi Secured</p>
                </div>
              </div>
            </div>

            {/* Right Dashboard Mockup Illustration */}
            <div className="lg:col-span-5 relative mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/10 to-brand-gold/10 rounded-3xl filter blur-2xl"></div>
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 hover:rotate-1 transition-transform duration-500"
              >
                {/* Simulated App Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                    <span className="w-3 h-3 rounded-full bg-green-400"></span>
                    <span className="text-xs font-mono text-gray-400 ml-2">App Preview</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-green-50 text-[10px] font-bold text-green-600">LUNAS</span>
                </div>

                {/* Invoice Mockup content */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-brand-dark">PT Creative Digital Indonesia</h4>
                      <p className="text-[10px] text-gray-400">Jakarta, Indonesia</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-brand-primary">INVOICE</p>
                      <p className="text-[9px] font-mono text-gray-500 font-bold">FID-2026-0001</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-brand-light/50 border border-brand-primary/5 flex justify-between items-center text-[10px]">
                    <div>
                      <p className="text-gray-400 text-[9px]">Ditujukan Untuk:</p>
                      <p className="font-bold text-brand-dark">Budi Santoso</p>
                      <p className="text-gray-400">Toko Berkah Abadi</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-[9px]">Jatuh Tempo:</p>
                      <p className="font-bold text-brand-dark">30 Juni 2026</p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-gray-500 uppercase">Item Transaksi</p>
                    <div className="border border-gray-100 rounded-lg overflow-hidden text-[10px]">
                      <div className="bg-gray-50 p-1.5 flex justify-between font-bold text-gray-600">
                        <span>Deskripsi</span>
                        <span>Total</span>
                      </div>
                      <div className="p-1.5 flex justify-between border-b border-gray-50">
                        <span>Jasa Pembuatan Website Custom</span>
                        <span className="font-mono">Rp 8.500.000</span>
                      </div>
                      <div className="p-1.5 flex justify-between">
                        <span>UI/UX Desain Dashboard Figma</span>
                        <span className="font-mono">Rp 3.500.000</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Subtotals */}
                  <div className="border-t border-gray-100 pt-3 space-y-1 text-right text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal:</span>
                      <span className="font-mono text-gray-700">Rp 12.000.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">PPN (11%):</span>
                      <span className="font-mono text-gray-700">Rp 1.320.000</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-brand-dark pt-1 border-t border-dashed border-gray-100">
                      <span>Total Tagihan:</span>
                      <span className="font-mono text-brand-primary">Rp 13.320.000</span>
                    </div>
                  </div>

                  {/* Terbilang */}
                  <div className="bg-brand-primary/5 p-2 rounded text-[9px] text-brand-primary italic">
                    <strong>Terbilang:</strong> Tiga Belas Juta Tiga Ratus Dua Puluh Ribu Rupiah
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </header>

      {/* Social Proof Marquee */}
      <section className="py-12 bg-white border-y border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold tracking-wider text-gray-400 uppercase mb-8">
            Dipercaya oleh lebih dari 10.000 bisnis, UMKM, dan Freelancer di Indonesia
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all">
            <span className="font-display font-black text-2xl text-brand-dark tracking-wider">CREATIVE.CO</span>
            <span className="font-display font-black text-2xl text-brand-dark tracking-wider">BERKAH_MART</span>
            <span className="font-display font-black text-2xl text-brand-dark tracking-wider">ANDALAS_MEDIA</span>
            <span className="font-display font-black text-2xl text-brand-dark tracking-wider">HEALTHY_BITE</span>
            <span className="font-display font-black text-2xl text-brand-dark tracking-wider">INDOTECH</span>
          </div>
        </div>
      </section>

      {/* Interactive Feature Demo Section */}
      <section className="py-24 bg-gradient-to-b from-white to-brand-light border-b border-gray-100 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/5 border border-brand-primary/10 text-brand-primary text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BARU: FITUR PREMIUM TERINTEGRASI</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-brand-dark tracking-tight">
              Eksplorasi Fitur Terkuat Kami Secara Instan
            </h2>
            <p className="text-gray-500 text-sm sm:text-base mt-4">
              Coba langsung kecanggihan sistem penawaran, kustomisasi chat pengingat, kuitansi resmi, dan multi-profil langsung dari website kami di bawah ini.
            </p>
          </div>

          {/* Interactive Demo Tab Bar */}
          <div className="flex flex-wrap justify-center gap-2 mb-12 max-w-4xl mx-auto">
            <button
              onClick={() => { setActiveDemoTab('quotation'); setDemoQuoteConverted(false); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDemoTab === 'quotation'
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                  : 'bg-white text-gray-500 hover:text-brand-dark border border-gray-100 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" /> 📄 Penawaran & Konversi
            </button>
            <button
              onClick={() => { setActiveDemoTab('share'); setDemoCopied(false); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDemoTab === 'share'
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                  : 'bg-white text-gray-500 hover:text-brand-dark border border-gray-100 hover:bg-gray-50'
              }`}
            >
              <Share2 className="w-4 h-4" /> 💬 WA & Email Share
            </button>
            <button
              onClick={() => { setActiveDemoTab('multiprofile'); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDemoTab === 'multiprofile'
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                  : 'bg-white text-gray-500 hover:text-brand-dark border border-gray-100 hover:bg-gray-50'
              }`}
            >
              <Building2 className="w-4 h-4" /> 🏢 Multi-Profil Bisnis
            </button>
            <button
              onClick={() => { setActiveDemoTab('receipt'); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDemoTab === 'receipt'
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                  : 'bg-white text-gray-500 hover:text-brand-dark border border-gray-100 hover:bg-gray-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" /> 🧾 Kuitansi & Laporan
            </button>
          </div>

          {/* Interactive Demo Content Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-0">
              
              {/* Left Column: Descriptions & Live controls */}
              <div className="lg:col-span-5 p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col justify-between text-left">
                {activeDemoTab === 'quotation' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-brand-gold uppercase tracking-widest">SISTEM PENAWARAN HARGA</span>
                      <h3 className="text-xl sm:text-2xl font-display font-extrabold text-brand-dark leading-snug">
                        Buat Surat Penawaran, Konversi ke Invoice Sekali Klik!
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Sebelum menagih invoice, mulailah dengan mengajukan <strong>Penawaran Harga Resmi (Quotation)</strong>. Saat klien menyetujui, Anda tidak perlu mengetik ulang semua data. Cukup klik tombol konversi untuk menjadikannya draf Invoice dalam sekejap.
                      </p>
                    </div>

                    <ul className="space-y-3.5 text-xs text-gray-600">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Layout A4 Siap Cetak:</strong> Format cetakan PDF kami otomatis disesuaikan secara visual untuk margin, tabel, dan tanda tangan profesional tanpa acak-acakan.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Masa Berlaku Penawaran:</strong> Lengkap dengan tanggal jatuh tempo penawaran untuk memotivasi kesepakatan lebih cepat.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Konversi Otomatis:</strong> Nilai nominal, detail barang/jasa, syarat & catatan otomatis disalin secara presisi.</span>
                      </li>
                    </ul>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aksi Live Demo:</p>
                      {!demoQuoteConverted ? (
                        <button
                          onClick={() => setDemoQuoteConverted(true)}
                          className="w-full py-3 bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                        >
                          🔄 Simulasikan Konversi ke Invoice
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Berhasil! Penawaran Menjadi Invoice
                          </div>
                          <button
                            onClick={() => setDemoQuoteConverted(false)}
                            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            Reset Demo Penawaran
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeDemoTab === 'share' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-brand-gold uppercase tracking-widest">ADVANCED SHARING ENGINE</span>
                      <h3 className="text-xl sm:text-2xl font-display font-extrabold text-brand-dark leading-snug">
                        Kirim Lewat WhatsApp & Email Menggunakan Template Cerdas
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Kini Anda dapat memilih template pesan yang disesuaikan untuk setiap momen penting: <strong>Template Standar</strong> untuk penagihan formal lengkap, atau <strong>Template Follow-Up</strong> yang persuasif untuk mempercepat persetujuan & negosiasi klien.
                      </p>
                    </div>

                    <ul className="space-y-3.5 text-xs text-gray-600">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Pengubah Otomatis Detail:</strong> Sistem secara dinamis menyuntikkan nama klien, nomor dokumen, daftar pekerjaan, rincian harga, serta tanda tangan pengirim.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Integrasi WhatsApp Web & App:</strong> Sistem otomatis mendeteksi perangkat Anda untuk mengarahkan ke WhatsApp Web atau aplikasi mobile secara lancar.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Editor Kustom Sebelum Mengirim:</strong> Sesuaikan draf pesan sesuka Anda di dalam aplikasi sebelum meluncurkannya ke penerima.</span>
                      </li>
                    </ul>

                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Aksi Live Demo: Pilih Template</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => { setDemoTemplate('standard'); setDemoCopied(false); }}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            demoTemplate === 'standard'
                              ? 'bg-white border-brand-primary text-brand-primary shadow-sm'
                              : 'bg-transparent border-gray-100 text-gray-500 hover:bg-white'
                          }`}
                        >
                          Standard Template
                        </button>
                        <button
                          onClick={() => { setDemoTemplate('followup'); setDemoCopied(false); }}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            demoTemplate === 'followup'
                              ? 'bg-white border-brand-primary text-brand-primary shadow-sm'
                              : 'bg-transparent border-gray-100 text-gray-500 hover:bg-white'
                          }`}
                        >
                          Follow-Up / Negosiasi
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeDemoTab === 'multiprofile' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-brand-gold uppercase tracking-widest">MULTI-PROFIL BISNIS</span>
                      <h3 className="text-xl sm:text-2xl font-display font-extrabold text-brand-dark leading-snug">
                        Kelola Banyak Bisnis dalam Satu Akun Owner
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Apakah Anda memiliki agensi digital sekaligus bisnis kuliner? Jangan campurkan catatan keuangan mereka! Fitur <strong>Multi-Profil</strong> kami memungkinkan Anda berpindah profil bisnis hanya dalam 2 detik. Setiap profil memiliki database klien, kuitansi, nomor invoice, logo, stempel, dan laporan keuangan tersendiri secara independen.
                      </p>
                    </div>

                    <ul className="space-y-3.5 text-xs text-gray-600">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Isolasi Data Sempurna:</strong> Tidak ada risiko invoice PT A tertukar atau dikirimkan dengan logo PT B.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Stempel & Tanda Tangan Unik:</strong> Setel stempel fisik digital dan tanda tangan penanggung jawab berbeda untuk setiap bisnis.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Satu Akun SaaS Komplit:</strong> Menghemat biaya pendaftaran berlangganan tambahan karena bisa dikelola dari satu control center.</span>
                      </li>
                    </ul>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Aksi Live Demo: Ganti Profil Bisnis</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setDemoActiveBrand('brandA')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            demoActiveBrand === 'brandA'
                              ? 'bg-white border-brand-primary text-brand-primary shadow-sm'
                              : 'bg-transparent border-gray-100 text-gray-500 hover:bg-white'
                          }`}
                        >
                          🖥️ Agensi Digital (IDR)
                        </button>
                        <button
                          onClick={() => setDemoActiveBrand('brandB')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            demoActiveBrand === 'brandB'
                              ? 'bg-white border-amber-500 text-amber-600 shadow-sm'
                              : 'bg-transparent border-gray-100 text-gray-500 hover:bg-white'
                          }`}
                        >
                          ☕ Cafe & Roastery (USD/IDR)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeDemoTab === 'receipt' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-brand-gold uppercase tracking-widest">KUITANSI & LAPORAN REAL-TIME</span>
                      <h3 className="text-xl sm:text-2xl font-display font-extrabold text-brand-dark leading-snug">
                        Terbitkan Kuitansi Pembayaran Sah Secara Otomatis
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Saat invoice klien ditandai lunas, sistem secara otomatis merancang dokumen <strong>Kuitansi Resmi</strong> yang sah, lengkap dengan bukti pembayaran terperinci, nomor kuitansi unik, serta tanda terima digital siap kirim. Laporan keuangan real-time kami juga otomatis diupdate untuk analisis laba-rugi bisnis.
                      </p>
                    </div>

                    <ul className="space-y-3.5 text-xs text-gray-600">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Stempel Basah Digital:</strong> Menyediakan visualisasi kuitansi bertanda tangan basah dan stempel perusahaan agar kredibel secara komersial.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Suku Kata Terbilang Otomatis:</strong> Menerjemahkan angka tagihan menjadi teks bahasa Indonesia formal ("Satu Juta Rupiah") otomatis tanpa salah ketik.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Laporan Buku Kas Instan:</strong> Monitor arus kas masuk, pengeluaran, tagihan berjalan, dan statistik piutang secara mendalam di dashboard.</span>
                      </li>
                    </ul>

                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-left">
                      <p className="text-xs font-bold text-emerald-800">💡 Arus Kas Terintegrasi</p>
                      <p className="text-[11px] text-emerald-600 leading-relaxed mt-1">
                        Sistem mencatat transaksi masuk secara instan, menghemat waktu pembukuan manual agensi Anda hingga 8 jam per bulan!
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-gray-100">
                  <button
                    onClick={handleFreeTrialClick}
                    className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Coba Fitur Ini Sekarang (Gratis)
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Column: High-fidelity interactive mock-up browser */}
              <div className="lg:col-span-7 bg-slate-50 p-6 sm:p-10 flex flex-col justify-center border-t lg:border-t-0 border-gray-100">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-150 overflow-hidden w-full flex flex-col animate-fade-in text-left max-h-[600px] overflow-y-auto">
                  
                  {/* Browser simulated bar */}
                  <div className="bg-gray-100/80 px-4 py-3 border-b border-gray-150 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                    </div>
                    <div className="bg-white/90 border border-gray-200 px-8 py-0.5 rounded-lg text-[9px] text-gray-400 font-mono select-none">
                      https://app.fidinvoice.com/workspace
                    </div>
                    <span className="px-2 py-0.5 bg-brand-primary-light text-[9px] font-bold text-brand-primary rounded font-mono uppercase tracking-wider">Demo Live</span>
                  </div>

                  {/* Dynamic Tab Panel Content */}
                  <div className="p-6 space-y-4">
                    
                    {/* DEMO: QUOTATION TAB */}
                    {activeDemoTab === 'quotation' && (
                      <div className="space-y-4">
                        {!demoQuoteConverted ? (
                          // Shows active penawaran harga
                          <div className="space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                              <div>
                                <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">Surat Penawaran Harga Resmi</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">Diterbitkan oleh: <span className="font-semibold text-slate-700">PT Sinergi Kreatif</span></p>
                              </div>
                              <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[9px] font-bold rounded-full border border-amber-100">Status: Draf Penawaran</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <div>
                                <p className="text-gray-400 text-[9px]">Klien Tujuan:</p>
                                <p className="font-bold text-slate-800">PT Hencia Digital Perkasa</p>
                                <p className="text-gray-400">Jakarta, ID</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-[9px]">Detail Dokumen:</p>
                                <p className="font-mono font-bold text-slate-800">QT-2026-0089</p>
                                <p className="text-gray-400">Berlaku s/d: 30 Juli 2026</p>
                              </div>
                            </div>

                            <div className="border border-gray-100 rounded-xl overflow-hidden text-[10px]">
                              <table className="w-full text-left my-0 border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-500 font-bold">
                                    <th className="p-2 border-none">Deskripsi Jasa</th>
                                    <th className="p-2 text-right border-none">Jumlah</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-t border-gray-50">
                                    <td className="p-2 border-none">
                                      <p className="font-bold text-slate-800">UI/UX Design & Branding Identity</p>
                                      <p className="text-[9px] text-gray-400">Desain 12 modul web Figma lengkap</p>
                                    </td>
                                    <td className="p-2 text-right font-mono text-slate-700 border-none">Rp 12.500.000</td>
                                  </tr>
                                  <tr className="border-t border-gray-50">
                                    <td className="p-2 border-none">
                                      <p className="font-bold text-slate-800">Custom Web Development</p>
                                      <p className="text-[9px] text-gray-400">React + Express Integration, Deployment</p>
                                    </td>
                                    <td className="p-2 text-right font-mono text-slate-700 border-none">Rp 18.000.000</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            <div className="space-y-1 text-right text-[10px] border-t border-gray-100 pt-3">
                              <p className="flex justify-between"><span className="text-gray-400">Subtotal:</span> <span className="font-mono font-bold">Rp 30.500.000</span></p>
                              <p className="flex justify-between"><span className="text-gray-400">PPN (11%):</span> <span className="font-mono font-bold">Rp 3.355.000</span></p>
                              <p className="flex justify-between font-bold text-xs text-brand-primary pt-1.5 border-t border-dashed border-gray-100"><span className="text-brand-dark">Total Penawaran:</span> <span className="font-mono">Rp 33.885.000</span></p>
                            </div>
                          </div>
                        ) : (
                          // Shows converted invoice
                          <div className="space-y-3 font-sans">
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-150 flex items-center justify-between text-emerald-800 text-[11px] font-bold animate-bounce">
                              <span>🎉 Selamat! Penawaran QT-2026-0089 berhasil dikonversi ke Invoice Resmi.</span>
                              <Sparkles className="w-4 h-4 text-emerald-500" />
                            </div>

                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                              <div>
                                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">🧾 INVOICE TAGIHAN RESMI</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">Disalin otomatis dari penawaran</p>
                              </div>
                              <span className="px-2 py-1 bg-brand-primary-light text-brand-primary text-[9px] font-bold rounded-full">Status: Draf Invoice (Siap Kirim)</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-[10px] bg-emerald-50/20 p-2.5 rounded-xl border border-emerald-100/30">
                              <div>
                                <p className="text-gray-400 text-[9px]">Ditagihkan Ke:</p>
                                <p className="font-bold text-slate-800">PT Hencia Digital Perkasa</p>
                                <p className="text-gray-400">Jakarta, ID</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-[9px]">Detail Invoice Baru:</p>
                                <p className="font-mono font-bold text-brand-primary">FID-2026-1024</p>
                                <p className="text-gray-400">Jatuh Tempo: 15 Juli 2026</p>
                              </div>
                            </div>

                            {/* Unaltered Table indicating precise copy */}
                            <div className="border border-gray-100 rounded-xl overflow-hidden text-[10px] bg-slate-50/50">
                              <div className="bg-slate-50 p-2 flex justify-between font-bold text-slate-500">
                                <span>Deskripsi Tagihan</span>
                                <span>Total</span>
                              </div>
                              <div className="p-2 border-t border-gray-50 flex justify-between text-slate-700">
                                <span>UI/UX Design & Branding Identity</span>
                                <span className="font-mono">Rp 12.500.000</span>
                              </div>
                              <div className="p-2 border-t border-gray-50 flex justify-between text-slate-700">
                                <span>Custom Web Development</span>
                                <span className="font-mono">Rp 18.000.000</span>
                              </div>
                            </div>

                            <div className="space-y-1 text-right text-[10px] border-t border-gray-100 pt-3">
                              <p className="flex justify-between font-bold text-xs text-brand-primary pt-1.5 border-t border-dashed border-gray-100"><span className="text-brand-dark">Total Tagihan Invoice:</span> <span className="font-mono">Rp 33.885.000</span></p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* DEMO: SHARE ENGINGE TAB */}
                    {activeDemoTab === 'share' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <div>
                            <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">Kirim lewat WhatsApp & Email</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">Template Aktif: <span className="font-bold text-brand-primary uppercase">{demoTemplate}</span></p>
                          </div>
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-full font-mono uppercase">Direct Send</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400">Penerima</span>
                            <span className="text-[10px] text-slate-500 font-mono">0812-3456-7890</span>
                          </div>
                          <div className="bg-slate-900 rounded-xl p-4 font-mono text-[10px] text-slate-100 leading-relaxed shadow-inner overflow-x-auto min-h-[160px] max-h-[220px] whitespace-pre-line border border-slate-800">
                            {demoTemplate === 'standard' ? (
                              `*PENAWARAN HARGA RESMI*\n\n` +
                              `Yth. *PT Hencia Digital Perkasa*\n` +
                              `Dari: *PT Sinergi Kreatif*\n\n` +
                              `Bersama pesan ini kami mengirimkan dokumen Penawaran Harga Resmi dengan rincian berikut:\n\n` +
                              `📄 *Nomor:* QT-2026-0089\n` +
                              `📅 *Tanggal:* 30 Juni 2026\n` +
                              `⏳ *Berlaku s/d:* 30 Juli 2026\n\n` +
                              `*Rincian Pekerjaan:*\n` +
                              `• *UI/UX Design* (1 Paket) - Rp 12.500.000\n` +
                              `• *Web Development* (1 Paket) - Rp 18.000.000\n\n` +
                              `💰 *TOTAL PENAWARAN: Rp 33.885.000*\n\n` +
                              `Terima kasih atas perhatian Anda. Silakan hubungi kami untuk berdiskusi lebih lanjut.\n\n` +
                              `Salam hangat,\n` +
                              `*PT Sinergi Kreatif*`
                            ) : (
                              `Halo *PT Hencia Digital Perkasa*,\n\n` +
                              `Bagaimana kabar Anda? Kami harap semua berjalan lancar.\n\n` +
                              `Menindaklanjuti rencana kerja sama kita, berikut kami lampirkan draf Penawaran Harga Resmi *#QT-2026-0089* senilai *Rp 33.885.000*.\n\n` +
                              `Apakah rincian dan nilai penawaran di atas sudah sesuai dengan kebutuhan proyek Anda?\n\n` +
                              `Jika Anda memerlukan revisi atau ingin berdiskusi mengenai anggaran, silakan kabari kami. Apabila sudah sesuai, mohon balas pesan ini dengan konfirmasi *"SETUJU"*. Terima kasih!\n\n` +
                              `Hormat kami,\n` +
                              `*PT Sinergi Kreatif*`
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                demoTemplate === 'standard' 
                                  ? 'Penawaran Harga Resmi PT Sinergi Kreatif senilai Rp 33.885.000' 
                                  : 'Follow-up Penawaran Resmi senilai Rp 33.885.000'
                              );
                              setDemoCopied(true);
                              setTimeout(() => setDemoCopied(false), 2000);
                            }}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                              demoCopied 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {demoCopied ? 'Tersalin! ✓' : '📋 Salin Pesan'}
                          </button>

                          <button
                            onClick={() => showToast('WhatsApp Web dibuka dengan parameter text otomatis! Di app asli, ini langsung meluncur ke aplikasi klien.', 'info')}
                            className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" /> Kirim via WhatsApp
                          </button>
                        </div>
                      </div>
                    )}

                    {/* DEMO: MULTI-PROFILE TAB */}
                    {activeDemoTab === 'multiprofile' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-brand-primary flex items-center justify-center text-white font-black text-[10px]">
                              {demoActiveBrand === 'brandA' ? 'SD' : 'CR'}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                                {demoActiveBrand === 'brandA' ? 'PT Sinergi Digital Agency' : 'Hencia Cafe & Roastery'}
                              </h4>
                              <p className="text-[9px] text-gray-400 -mt-0.5">Status Profil: <span className="text-emerald-500 font-bold">Aktif & Sinkron</span></p>
                            </div>
                          </div>
                          
                          {/* Simulated Dropdown Switcher */}
                          <div className="relative">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[9px] font-bold rounded-lg flex items-center gap-1 cursor-pointer hover:bg-slate-200 border border-slate-200">
                              Ganti Profil <ChevronDown className="w-3 h-3 text-slate-400" />
                            </span>
                          </div>
                        </div>

                        {demoActiveBrand === 'brandA' ? (
                          // Brand A Data State
                          <div className="space-y-3 animate-fade-in">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                                <p className="text-gray-400 text-[8px] uppercase font-bold">TOTAL PENDAPATAN</p>
                                <p className="text-xs font-mono font-black text-brand-primary mt-1">Rp 128.500.000</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-gray-400 text-[8px] uppercase font-bold">KLIEN AKTIF</p>
                                <p className="text-xs font-bold text-slate-800 mt-1">14 Perusahaan</p>
                              </div>
                              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                                <p className="text-gray-400 text-[8px] uppercase font-bold">DRAFT PENAWARAN</p>
                                <p className="text-xs font-bold text-amber-700 mt-1">8 Quotations</p>
                              </div>
                            </div>

                            <p className="text-[9px] font-bold text-gray-500 uppercase mt-2">Daftar Tagihan Klien Terkini</p>
                            <div className="space-y-2">
                              <div className="p-2.5 bg-white border border-gray-150 rounded-xl flex justify-between items-center text-[10px]">
                                <div>
                                  <p className="font-bold text-slate-800">PT Telkom Indonesia</p>
                                  <p className="text-[9px] text-gray-400">Invoice: FID-2026-0811</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-mono font-bold text-brand-primary">Rp 45.000.000</p>
                                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-600 font-bold font-mono">Belum Bayar</span>
                                </div>
                              </div>
                              <div className="p-2.5 bg-white border border-gray-150 rounded-xl flex justify-between items-center text-[10px]">
                                <div>
                                  <p className="font-bold text-slate-800">PT Astra International</p>
                                  <p className="text-[9px] text-gray-400">Invoice: FID-2026-0809</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-mono font-bold text-brand-primary">Rp 83.500.000</p>
                                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold font-mono">Lunas</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Brand B Data State
                          <div className="space-y-3 animate-fade-in">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                                <p className="text-gray-400 text-[8px] uppercase font-bold">TOTAL REVENUE (USD/IDR)</p>
                                <p className="text-xs font-mono font-black text-amber-600 mt-1">$4,850 <span className="text-[8px] text-gray-400">/ Rp 72jt</span></p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-gray-400 text-[8px] uppercase font-bold">SUBSCRIBERS / MEMBERS</p>
                                <p className="text-xs font-bold text-slate-800 mt-1">112 Pengunjung</p>
                              </div>
                              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                                <p className="text-gray-400 text-[8px] uppercase font-bold">TRANSAKSI KOPI HARI INI</p>
                                <p className="text-xs font-bold text-emerald-700 mt-1">42 Kuitansi Sah</p>
                              </div>
                            </div>

                            <p className="text-[9px] font-bold text-amber-600 uppercase mt-2">Daftar Transaksi Kasir Terkini</p>
                            <div className="space-y-2">
                              <div className="p-2.5 bg-white border border-amber-100 rounded-xl flex justify-between items-center text-[10px]">
                                <div>
                                  <p className="font-bold text-slate-800">Mr. Johnathan Smith</p>
                                  <p className="text-[9px] text-gray-400">Coffee Beans Supply (B2B)</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-mono font-bold text-amber-600">$1,200</p>
                                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold font-mono">Lunas</span>
                                </div>
                              </div>
                              <div className="p-2.5 bg-white border border-gray-150 rounded-xl flex justify-between items-center text-[10px]">
                                <div>
                                  <p className="font-bold text-slate-800">Toko Ritel Kopi Jaya</p>
                                  <p className="text-[9px] text-gray-400">Bubuk Kopi Arabika Premium</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-mono font-bold text-amber-600">Rp 4.500.000</p>
                                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold font-mono">Lunas</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* DEMO: RECEIPTS TAB */}
                    {activeDemoTab === 'receipt' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <div>
                            <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">Kuitansi Pembayaran Sah (Receipt)</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">Otomatisasi Sistem FID INVOICE</p>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-150 text-emerald-700 text-[9px] font-bold rounded-xl flex items-center gap-0.5">
                            ✔ VERIFIED TRANSACTION
                          </span>
                        </div>

                        {/* Kuitansi design mockup */}
                        <div className="bg-amber-50/10 p-4 rounded-2xl border border-amber-200/50 text-[10px] space-y-3 relative overflow-hidden">
                          {/* Digital watermark */}
                          <div className="absolute right-4 top-8 opacity-10 rotate-12 select-none border-4 border-emerald-600 p-2 text-[14px] font-black text-emerald-600 uppercase tracking-widest rounded-xl">
                            PAID LUNAS
                          </div>

                          <div className="flex justify-between text-slate-700 font-mono text-[9px]">
                            <span>No. Kuitansi: <strong className="text-slate-800">K-2026-0819</strong></span>
                            <span>Tanggal: 30 Juni 2026</span>
                          </div>

                          <div className="border-t border-dashed border-gray-200 pt-3 space-y-2">
                            <p className="flex justify-between border-b border-gray-100 pb-1.5"><span className="text-gray-400">Sudah Terima Dari:</span> <strong className="text-slate-800 text-right">Felix Hencia</strong></p>
                            <p className="flex justify-between border-b border-gray-100 pb-1.5"><span className="text-gray-400">Jumlah Uang:</span> <strong className="font-mono text-brand-primary text-xs">Rp 8.500.000</strong></p>
                            <p className="flex justify-between border-b border-gray-100 pb-1.5"><span className="text-gray-400">Terbilang:</span> <span className="italic text-slate-600 text-right">Delapan Juta Lima Ratus Ribu Rupiah</span></p>
                            <p className="flex justify-between border-b border-gray-100 pb-1.5"><span className="text-gray-400">Untuk Pembayaran:</span> <span className="text-slate-800 font-bold text-right font-sans">Pembuatan Website Corporate & E-Commerce PT ABC</span></p>
                          </div>

                          {/* Cash receipt signature with digital stamp mockup */}
                          <div className="flex justify-between items-end pt-3">
                            <div className="text-[8px] text-gray-400">
                              *Kuitansi ini sah & diterbitkan secara digital<br />oleh sistem cloud FID INVOICE.
                            </div>
                            <div className="text-right w-36 relative font-sans">
                              <p className="text-[9px] text-gray-500 mb-6">Penerima Kuasa,</p>
                              
                              {/* Simulated blue business stamp */}
                              <div className="absolute right-6 top-2 w-10 h-10 border-2 border-blue-500/30 rounded-full flex items-center justify-center rotate-12 opacity-80 pointer-events-none select-none text-[8px] font-black text-blue-500/50 uppercase font-mono tracking-tighter">
                                LUNAS PT
                              </div>
                              
                              <p className="font-bold text-slate-800 border-t border-slate-300 pt-1">PT Sinergi Kreatif</p>
                            </div>
                          </div>
                        </div>

                        {/* Kasir / Revenue Growth Indicator */}
                        <div className="bg-slate-900 rounded-2xl p-3 text-white flex justify-between items-center text-[10px] font-sans">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span>Penerimaan Kasir Hari Ini</span>
                          </div>
                          <span className="font-mono font-black text-emerald-400">+Rp 8.500.000 <span className="text-[8px] text-gray-400">(Bank BCA)</span></span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-24 bg-brand-light/30 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-base font-bold text-brand-primary tracking-wide uppercase mb-3">Solusi Bisnis Komplit</h2>
            <p className="text-3xl sm:text-4xl font-display font-extrabold text-brand-dark tracking-tight">
              Semua yang Anda Butuhkan untuk Kelola Invoice Bisnis
            </p>
            <p className="text-gray-500 text-lg mt-4">
              Didesain khusus untuk mempermudah operasional keuangan bisnis Anda tanpa ribet, aman, dan efisien.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feat, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -6 }}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-primary-light flex items-center justify-center mb-5 shadow-inner">
                  {feat.icon}
                </div>
                <h3 className="font-display font-bold text-lg text-brand-dark mb-2">{feat.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="alur-kerja" className="py-24 bg-white border-b border-gray-100 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-base font-bold text-brand-primary tracking-wide uppercase mb-3">Proses Sangat Cepat</h2>
            <p className="text-3xl sm:text-4xl font-display font-extrabold text-brand-dark tracking-tight">
              Mulai Penagihan Profesional dalam 3 Langkah Mudah
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 relative">
              <div className="w-16 h-16 rounded-full bg-brand-primary text-white flex items-center justify-center font-display font-extrabold text-2xl shadow-lg shadow-brand-primary/25 mb-6 relative z-10">
                1
              </div>
              <h3 className="font-display font-bold text-xl text-brand-dark mb-3">Daftar & Pilih Paket</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                Buat akun FID INVOICE Anda secara instan dalam hitungan detik. Coba gratis paket Starter selama 3 hari penuh.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 relative">
              <div className="w-16 h-16 rounded-full bg-brand-gold text-white flex items-center justify-center font-display font-extrabold text-2xl shadow-lg shadow-brand-gold/25 mb-6 relative z-10">
                2
              </div>
              <h3 className="font-display font-bold text-xl text-brand-dark mb-3">Tambahkan Klien & Produk</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                Masukkan katalog produk/jasa beserta daftar kontak klien Anda untuk mempercepat pembuatan invoice kedepannya.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 relative">
              <div className="w-16 h-16 rounded-full bg-brand-dark text-white flex items-center justify-center font-display font-extrabold text-2xl shadow-lg shadow-brand-dark/25 mb-6 relative z-10">
                3
              </div>
              <h3 className="font-display font-bold text-xl text-brand-dark mb-3">Buat & Kirim Invoice</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                Gunakan editor seret-lepas kami untuk menyusun item tagihan, lalu unduh PDF atau kirimkan via WhatsApp / Email sekali klik.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="harga" className="py-24 bg-brand-light/20 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-base font-bold text-brand-primary tracking-wide uppercase mb-3">Investasi Bisnis Terbaik</h2>
            <p className="text-3xl sm:text-4xl font-display font-extrabold text-brand-dark tracking-tight">
              Pilih Paket yang Sesuai Kebutuhan Anda
            </p>
            <p className="text-gray-500 mt-4">
              Hemat hingga 20% dengan beralih ke pembayaran tahunan. Batalkan kapan saja tanpa komitmen.
            </p>

            {/* Billing Switcher */}
            <div className="inline-flex items-center gap-3 mt-8 bg-white p-1.5 rounded-full border border-gray-200 shadow-sm">
              <button 
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all cursor-pointer ${billingPeriod === 'monthly' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Bulanan
              </button>
              <button 
                onClick={() => setBillingPeriod('annually')}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all cursor-pointer flex items-center gap-1.5 ${billingPeriod === 'annually' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Tahunan 
                <span className="px-2 py-0.5 rounded-full bg-brand-gold text-[10px] font-black text-brand-dark font-mono uppercase">Hemat 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col text-left">
              <div className="mb-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Starter</span>
                <h3 className="text-2xl font-bold font-display text-brand-dark mt-1">Uji Coba Gratis</h3>
                <p className="text-xs text-gray-400 mt-1">Masa uji coba 3 hari penuh fitur dasar</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-extrabold font-display text-brand-dark">Rp 0</span>
                <span className="text-xs text-gray-500"> / 3 hari</span>
              </div>

              <button 
                onClick={handleFreeTrialClick}
                className="w-full bg-gray-100 hover:bg-gray-200 text-brand-dark font-bold py-3.5 px-4 rounded-xl text-center mb-8 transition-colors cursor-pointer"
              >
                Coba Gratis Sekarang
              </button>

              <ul className="space-y-4 text-sm text-gray-600 flex-1">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>Max 5 Invoice / bulan</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>Max 1 Klien Aktif</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>Template Invoice Dasar</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>Ekspor PDF Instan</span>
                </li>
              </ul>
            </div>

            {/* Professional Plan */}
            <div className="bg-white p-8 rounded-2xl border-2 border-brand-primary shadow-xl flex flex-col text-left relative transform md:scale-[1.03]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-primary text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                Paling Populer
              </div>
              
              <div className="mb-6 mt-2">
                <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">Professional</span>
                <h3 className="text-2xl font-bold font-display text-brand-dark mt-1">SaaS Bisnis Lancar</h3>
                <p className="text-xs text-gray-400 mt-1">Solusi komplit bagi para profesional & UMKM</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-extrabold font-display text-brand-dark">
                  {billingPeriod === 'monthly' ? 'Rp 99.000' : 'Rp 79.000'}
                </span>
                <span className="text-xs text-gray-500"> / bulan</span>
                {billingPeriod === 'annually' && <p className="text-[10px] text-brand-gold font-bold font-mono mt-1">Ditagih tahunan Rp 948.000</p>}
              </div>

              <button 
                onClick={() => handlePaidPlanClick('professional')}
                className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-3.5 px-4 rounded-xl text-center mb-8 transition-colors shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Pilih Professional
              </button>

              <ul className="space-y-4 text-sm text-gray-600 flex-1">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <strong className="text-brand-dark">Unlimited Invoice</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>Maksimal 50 Klien</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>10 Template Premium</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>Ekspor PDF + Excel</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>Pengingat WhatsApp Otomatis</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>Laporan Grafik Keuangan Dasar</span>
                </li>
              </ul>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col text-left">
              <div className="mb-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Enterprise</span>
                <h3 className="text-2xl font-bold font-display text-brand-dark mt-1">Kustom Skala Besar</h3>
                <p className="text-xs text-gray-400 mt-1">Untuk perusahaan mapan & agensi multi-klien</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-extrabold font-display text-brand-dark">
                  {billingPeriod === 'monthly' ? 'Rp 199.000' : 'Rp 159.000'}
                </span>
                <span className="text-xs text-gray-500"> / bulan</span>
                {billingPeriod === 'annually' && <p className="text-[10px] text-brand-gold font-bold font-mono mt-1">Ditagih tahunan Rp 1.908.000</p>}
              </div>

              <button 
                onClick={() => handlePaidPlanClick('enterprise')}
                className="w-full bg-brand-dark hover:bg-gray-800 text-white font-bold py-3.5 px-4 rounded-xl text-center mb-8 transition-colors cursor-pointer"
              >
                Pilih Enterprise
              </button>

              <ul className="space-y-4 text-sm text-gray-600 flex-1">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <strong className="text-brand-dark">Unlimited Invoice</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <strong className="text-brand-dark">Unlimited Klien</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>Custom Template & Branding Anda</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>White-Label (Hapus Brand FID)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>Akses API khusus</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>Dedicated Support CS Prioritas</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center flex justify-center items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold text-xs font-bold font-mono uppercase">100% Money-Back Guarantee</span>
            <p className="text-xs text-gray-500 max-w-md">Garansi uang kembali 30 hari penuh apabila Anda tidak merasa puas dengan layanan kami.</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-base font-bold text-brand-primary tracking-wide uppercase mb-3">Testimonial Nyata</h2>
            <p className="text-3xl sm:text-4xl font-display font-extrabold text-brand-dark tracking-tight">
              Cerita Sukses dari Pengusaha Indonesia
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((test, idx) => (
              <div key={idx} className="bg-brand-light/30 p-8 rounded-2xl border border-gray-50 flex flex-col text-left">
                <div className="flex gap-1 text-brand-gold mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-brand-gold" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed italic mb-6 flex-1">
                  "{test.quote}"
                </p>
                <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                  <div className="w-10 h-10 rounded-full bg-brand-primary-light text-brand-primary flex items-center justify-center font-display font-bold text-sm">
                    {test.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-dark">{test.name}</h4>
                    <p className="text-xs text-gray-400">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-brand-light/20 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base font-bold text-brand-primary tracking-wide uppercase mb-3">Ada Pertanyaan?</h2>
            <p className="text-3xl sm:text-4xl font-display font-extrabold text-brand-dark tracking-tight">
              Pertanyaan yang Sering Diajukan
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
                  <button 
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex justify-between items-center font-display font-semibold text-brand-dark hover:text-brand-primary transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`transition-all duration-300 ${isOpen ? 'max-h-60 border-t border-gray-50 opacity-100 p-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand-dark to-brand-primary text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,166,35,0.15),transparent)]"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold mb-6 leading-tight">
            Siap Membuat Bisnis Anda <br className="hidden sm:inline" /> Lebih Profesional?
          </h2>
          <p className="text-brand-primary-light text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Bergabung dengan 10.000+ pengusaha Indonesia yang sudah menggunakan FID INVOICE untuk menghemat waktu penagihan dan menaikkan prestise bisnis mereka.
          </p>
          
          <button 
            onClick={handleFreeTrialClick}
            className="bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-black text-base px-8 py-4 rounded-xl transition-all shadow-lg shadow-brand-gold/30 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            Mulai Sekarang — Gratis 3 Hari
          </button>
          
          <p className="text-xs text-brand-primary-light/70 mt-4 font-mono uppercase tracking-wider">TIDAK MEMERLUKAN KARTU KREDIT • BATALKAN KAPAN SAJA</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-dark text-gray-400 pt-16 pb-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-12 gap-10 pb-12 border-b border-white/5">
          {/* Logo & Tagline */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 17V7H15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12H13.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-display font-bold text-lg text-white tracking-tight">FID <span className="text-brand-primary">INVOICE</span></span>
            </div>
            <p className="text-sm text-gray-400">
              Platform billing & manajemen invoice premium nomor satu di Indonesia. Bekerja cerdas, bayaran lancar.
            </p>
            <p className="text-xs text-brand-gold font-bold italic font-mono uppercase">"Invoice Cerdas, Bisnis Lancar"</p>
          </div>

          {/* Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-white font-bold text-sm">Produk</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#fitur" className="hover:text-white transition-colors">Fitur Invoice</a></li>
              <li><a href="#harga" className="hover:text-white transition-colors">Paket Harga</a></li>
              <li><a href="#alur-kerja" className="hover:text-white transition-colors">Integrasi</a></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-white font-bold text-sm">Legalitas</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Syarat Penggunaan</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Ketentuan Lisensi</a></li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-4">
            <h4 className="text-white font-bold text-sm">Metode Pembayaran Resmi</h4>
            <div className="flex flex-wrap gap-2 text-white opacity-70">
              <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] font-bold tracking-widest uppercase font-mono">BCA TRANSFER</span>
              <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] font-bold tracking-widest uppercase font-mono">KONFIRMASI OTOMATIS</span>
            </div>
            <p className="text-[10px] text-gray-500">Pembayaran aman dengan enkripsi mutakhir dan notifikasi real-time instan.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500 border-t border-white/5 mt-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p>© 2026 FID INVOICE. All rights reserved. Terdaftar secara resmi di Indonesia.</p>
            <button 
              onClick={() => onNavigate('admin-panel')}
              className="text-brand-gold hover:text-white transition-colors font-black uppercase tracking-wider font-mono text-[10px] flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded cursor-pointer"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-gold animate-ping shrink-0" />
              Masuk Panel Pemilik Aplikasi
            </button>
          </div>
          <div className="flex gap-4 font-bold">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-white transition-colors">YouTube</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
