import React, { useState } from 'react';
import { 
  CreditCard, CheckCircle2, AlertTriangle, ShieldCheck, 
  Hourglass, Flame, FileSpreadsheet, KeyRound, Sparkles, X
} from 'lucide-react';
import { UserProfile } from '../types';
import { formatDateIndonesian } from '../utils';
import QrisPaymentBox from './QrisPaymentBox';
import PaymentHistorySection from './PaymentHistorySection';

interface SubscriptionPageProps {
  user: UserProfile;
  currentClientCount?: number;
  currentInvoiceCount?: number;
  onUpgradePlan: (plan: 'starter' | 'professional' | 'enterprise', isYearly?: boolean) => void;
  onRenewSubscription: () => void;
  onSimulateExpiry: (expire: boolean) => void;
  onSimulateQuota?: (type: 'clients' | 'invoices', max: number) => void;
  onRefreshUserStatus?: () => void;
}

export default function SubscriptionPage({
  user, currentClientCount = 0, currentInvoiceCount = 0, onUpgradePlan, onRenewSubscription, onSimulateExpiry, onSimulateQuota, onRefreshUserStatus
}: SubscriptionPageProps) {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | 'enterprise'>(user.subscription.plan);
  const [simulationStatus, setSimulationStatus] = useState(user.subscription.status === 'expired');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>((user.subscription.billingCycle as any) || 'monthly');
  const [checkout, setCheckout] = useState<{ plan: 'starter' | 'professional' | 'enterprise'; amount: number; isYearly?: boolean } | null>(null);

  // Days remaining calculation
  const getDaysRemaining = () => {
    const expiry = new Date(user.subscription.expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();

  const toggleSimulateExpiry = () => {
    const nextVal = !simulationStatus;
    setSimulationStatus(nextVal);
    onSimulateExpiry(nextVal);
  };

  const handleRenewClick = () => {
    const currentPlan = user.subscription.plan;
    const isYearly = billingPeriod === 'yearly';
    const amount = currentPlan === 'enterprise'
      ? (isYearly ? 1900000 : 199000)
      : currentPlan === 'professional'
        ? (isYearly ? 950000 : 99000)
        : (isYearly ? 450000 : 49000);
    setCheckout({ plan: currentPlan, amount, isYearly });
  };

  const handleSelectPlan = (plan: 'starter' | 'professional' | 'enterprise') => {
    if (plan === 'starter') {
      onUpgradePlan('starter');
    } else {
      const isYearly = billingPeriod === 'yearly';
      const amount = plan === 'professional' 
        ? (isYearly ? 950000 : 99000) 
        : (isYearly ? 1900000 : 199000);
      setCheckout({ plan, amount, isYearly });
    }
  };

  const handlePaymentSuccess = () => {
    if (checkout) {
      onUpgradePlan(checkout.plan, checkout.isYearly);
      setCheckout(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans text-left pb-16">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-display font-extrabold text-brand-dark">Langganan FID INVOICE Anda</h1>
        <p className="text-xs text-gray-400 mt-1">Kelola lisensi , siklus pembayaran, dan kuota fitur Anda</p>
      </div>

      {/* Expiry Simulator Box (Secret Control Panel for evaluation) */}
      {(import.meta as any).env?.DEV && (
        <div className="p-5 bg-slate-900 text-white rounded-2xl border border-brand-gold/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-brand-gold text-brand-dark text-[10px] font-black uppercase font-mono tracking-widest animate-pulse">Simulator Evaluasi</span>
              <h4 className="text-sm font-bold text-brand-gold">Uji Auto-Expiry Penyelamat Bisnis</h4>
            </div>
            <p className="text-xs text-slate-300">
              Aktifkan opsi di bawah untuk menguji pembatasan fitur (Expiry / Kuota). Sistem akan merespon sesuai aturan paket yang sedang berjalan.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={toggleSimulateExpiry}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer ${simulationStatus ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-brand-primary hover:bg-brand-primary-dark text-white'}`}
            >
              {simulationStatus ? '🔴 Simulasikan Aktif Kembali' : '⚡ Simulasikan Lisensi Habis'}
            </button>
            {onSimulateQuota && (
              <>
                <button 
                  onClick={() => onSimulateQuota('clients', user.subscription.plan === 'starter' ? 1 : user.subscription.plan === 'professional' ? 50 : 100)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer bg-slate-700 hover:bg-slate-600 text-white"
                >
                  👥 Penuhi Kuota Klien
                </button>
                <button 
                  onClick={() => onSimulateQuota('invoices', 5)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer bg-slate-700 hover:bg-slate-600 text-white"
                >
                  🧾 Penuhi Kuota Invoice (5)
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Current Subscription Status Badge */}
      <div className="grid md:grid-cols-12 gap-8">
        
        {/* Left Stats Info */}
        <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-50">Siklus Lisensi Aktif</h3>
          
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2.5 py-1 rounded-full bg-brand-primary-light text-brand-primary font-black text-[10px] uppercase font-mono tracking-widest">{user.subscription.plan} Plan</span>
              <h2 className="text-2xl font-extrabold text-brand-dark pt-1.5 capitalize">Paket {user.subscription.plan}</h2>
              <p className="text-xs text-gray-500">
                Lisensi berlaku sampai dengan: <strong className="text-brand-dark">
                  {formatDateIndonesian(user.subscription.expiryDate)}
                </strong>
              </p>
            </div>

            {/* Countdown Badge */}
                        <div className="p-4 rounded-xl bg-brand-primary-light/40 border border-brand-primary/5 text-center shrink-0 min-w-[100px] flex flex-col justify-center items-center">
                <>
                  <p className="text-2xl font-black font-display text-brand-primary">{daysRemaining}</p>
                  <p className="text-[9px] text-brand-primary font-bold uppercase tracking-wider mt-0.5">Hari Tersisa</p>
                </>
            </div>
          </div>

          {/* Usage quota stats */}
          <div className="space-y-4 pt-6 border-t border-gray-50">
            <h4 className="text-xs font-bold text-gray-600 uppercase">Kuota Penggunaan Fitur</h4>
            
            {/* Quota bar 1: Clients */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Kontak Klien Aktif</span>
                <span className="font-bold text-brand-dark">{currentClientCount} / {user.subscription.plan === 'starter' ? '1' : user.subscription.plan === 'professional' ? '50' : 'Unlimited'} Klien</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${user.subscription.plan === 'starter' ? Math.min((currentClientCount/1)*100, 100) : user.subscription.plan === 'professional' ? Math.min((currentClientCount/50)*100, 100) : 10}%` }}
                  className="h-full bg-brand-primary transition-all duration-500"
                ></div>
              </div>
            </div>

            {/* Quota bar 2: Invoices */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">{user.subscription.plan === 'starter' ? 'Penerbitan Invoice (Bulan Ini)' : 'Penerbitan Invoice Keseluruhan'}</span>
                <span className="font-bold text-brand-dark">{user.subscription.plan === 'starter' ? `${currentInvoiceCount} / 5` : 'Tak Terbatas (Unlimited)'}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${user.subscription.plan === 'starter' ? Math.min((currentInvoiceCount/5)*100, 100) : 10}%` }}
                  className="h-full bg-brand-primary transition-all duration-500"
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Renewal instructions / Payment card */}
        <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-50">Pembayaran Cepat</h3>
            
            <div className="space-y-3.5 text-xs">
              <p className="text-gray-500 leading-relaxed">
                Anda dapat memperpanjang lisensi secara aman menggunakan <strong>Gerbang Otomatis (QRIS / VA / CC)</strong> maupun <strong>Transfer Manual (BCA, Mandiri, BSN)</strong>.
              </p>
              
              <div className="p-3.5 rounded-xl bg-brand-light border border-brand-primary/5 text-xs text-brand-dark font-medium flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                <span>Transaksi diamankan SSL 256-bit</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleRenewClick}
            className="w-full mt-6 py-3.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all duration-200"
          >
            Perpanjang Langganan Sekarang
          </button>
        </div>

      </div>

      {/* Upgrade pricing options */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-50">
          <div>
            <h3 className="font-display font-extrabold text-base text-brand-dark">Upgrade Paket & Tingkatkan Limitasi</h3>
            <p className="text-xs text-gray-400 mt-1">Beralih ke lisensi profesional untuk mengembangkan jangkauan bisnis Anda</p>
          </div>
          
          {/* Gorgeous Sliding Toggle */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center shrink-0 self-start sm:self-center">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${billingPeriod === 'monthly' ? 'bg-white text-brand-primary shadow-xs' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${billingPeriod === 'yearly' ? 'bg-brand-primary text-white shadow-xs' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Tahunan
              <span className="bg-red-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
                Hemat 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {/* Starter Plan option */}
          <div className={`p-5 rounded-2xl border-2 flex flex-col justify-between text-left ${user.subscription.plan === 'starter' ? 'border-brand-primary bg-brand-primary-light/10' : 'border-gray-100'}`}>
            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase font-mono">TRIAL</span>
                <h4 className="font-bold text-sm text-brand-dark mt-1">Starter Free</h4>
                <ul className="text-[10px] text-gray-500 mt-2 space-y-1 list-disc list-inside"><li>Max 5 Invoice / bulan</li><li>Max 1 Klien Aktif</li><li>Template Invoice Dasar</li><li>Ekspor PDF Instan</li></ul>
              </div>
              <div>
                <span className="text-xl font-black text-brand-dark">Rp 0</span>
                <span className="text-[10px] text-gray-400 ml-1">/ selamanya</span>
              </div>
            </div>
            <button 
              disabled={user.subscription.plan === 'starter'}
              onClick={() => handleSelectPlan('starter')}
              className="mt-6 w-full py-2 bg-gray-50 disabled:bg-brand-primary-light disabled:text-brand-primary text-gray-600 font-bold text-xs rounded-lg border border-gray-200 disabled:border-none cursor-pointer"
            >
              {user.subscription.plan === 'starter' ? 'Aktif Saat Ini' : 'Pilih Starter'}
            </button>
          </div>

          {/* Professional Plan option */}
          <div className={`p-5 rounded-2xl border-2 flex flex-col justify-between text-left ${user.subscription.plan === 'professional' ? 'border-brand-primary bg-brand-primary-light/10' : 'border-gray-100'}`}>
            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black tracking-widest text-brand-primary uppercase font-mono">MOST POPULAR</span>
                <h4 className="font-bold text-sm text-brand-dark mt-1">Professional <br/><span className="text-[10px] text-gray-500 font-normal">Bisnis Lancar</span></h4>
                <ul className="text-[10px] text-gray-500 mt-2 space-y-1 list-disc list-inside"><li>Unlimited Invoice</li><li>Maksimal 50 Klien</li><li>10 Template Premium</li><li>Ekspor PDF + Excel</li><li>Pengingat WhatsApp Otomatis</li><li>Laporan Grafik Keuangan Dasar</li></ul>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-brand-dark">
                    {billingPeriod === 'yearly' ? 'Rp 950.000' : 'Rp 99.000'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {billingPeriod === 'yearly' ? '/ tahun' : '/ bulan'}
                  </span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="text-[9px] text-green-600 font-black mt-0.5">Hemat Rp 238.000 / tahun</p>
                )}
              </div>
            </div>
            <button 
              disabled={user.subscription.plan === 'professional'}
              onClick={() => handleSelectPlan('professional')}
              className="mt-6 w-full py-2 bg-gray-50 disabled:bg-brand-primary-light disabled:text-brand-primary text-gray-600 font-bold text-xs rounded-lg border border-gray-200 disabled:border-none cursor-pointer"
            >
              {user.subscription.plan === 'professional' ? 'Aktif Saat Ini' : 'Pilih Professional'}
            </button>
          </div>

          {/* Enterprise Plan option */}
          <div className={`p-5 rounded-2xl border-2 flex flex-col justify-between text-left ${user.subscription.plan === 'enterprise' ? 'border-brand-primary bg-brand-primary-light/10' : 'border-gray-100'}`}>
            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black tracking-widest text-brand-gold uppercase font-mono">BIG SCALE</span>
                <h4 className="font-bold text-sm text-brand-dark mt-1">Enterprise <br/><span className="text-[10px] text-gray-500 font-normal">Kustom Skala Besar</span></h4>
                <ul className="text-[10px] text-gray-500 mt-2 space-y-1 list-disc list-inside"><li>Unlimited Invoice & Klien</li><li>Custom Template & Branding Anda</li><li>White-Label (Hapus Brand FID)</li><li>Akses API khusus</li><li>Dedicated Support CS Prioritas</li></ul>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-brand-dark">
                    {billingPeriod === 'yearly' ? 'Rp 1.900.000' : 'Rp 199.000'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {billingPeriod === 'yearly' ? '/ tahun' : '/ bulan'}
                  </span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="text-[9px] text-green-600 font-black mt-0.5">Hemat Rp 488.000 / tahun</p>
                )}
              </div>
            </div>
            <button 
              disabled={user.subscription.plan === 'enterprise'}
              onClick={() => handleSelectPlan('enterprise')}
              className="mt-6 w-full py-2 bg-gray-50 disabled:bg-brand-primary-light disabled:text-brand-primary text-gray-600 font-bold text-xs rounded-lg border border-gray-200 disabled:border-none cursor-pointer"
            >
              {user.subscription.plan === 'enterprise' ? 'Aktif Saat Ini' : 'Pilih Enterprise'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment History and Verification Panel */}
      <PaymentHistorySection 
        userId={user.id} 
        onRefreshUserStatus={() => {
          if (onRefreshUserStatus) {
            onRefreshUserStatus();
          } else {
            window.dispatchEvent(new Event('storage'));
          }
        }} 
        isDarkMode={false}
      />

      {/* Checkout BCA Transfer Modal */}
      {checkout && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 overflow-y-auto flex justify-center items-start p-4 sm:p-6 md:p-8">
          <div className="relative w-full max-w-lg my-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl">
            <button 
              onClick={() => setCheckout(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full transition-all duration-200 z-50 cursor-pointer shadow-lg"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
            <QrisPaymentBox 
              amount={checkout.amount}
              planName={checkout.isYearly ? `${checkout.plan} (Yearly)` : checkout.plan}
              onPaymentSuccess={handlePaymentSuccess}
              onClose={() => setCheckout(null)}
              isDarkMode={false}
              userName={user?.fullName || 'Tamu'}
              userEmail={user?.email}
              userId={user?.id}
            />
          </div>
        </div>
      )}

    </div>
  );
}
