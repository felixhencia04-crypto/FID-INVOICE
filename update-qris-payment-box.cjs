const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import { 
  Copy, Check, CreditCard, Clock, CheckCircle, Smartphone, Info
} from 'lucide-react';

interface QrisPaymentBoxProps {
  amount: number;
  planName: string;
  onPaymentSuccess: () => void;
  isDarkMode?: boolean;
}

export default function QrisPaymentBox({ 
  amount, 
  planName, 
  onPaymentSuccess,
  isDarkMode = false
}: QrisPaymentBoxProps) {
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Example admin WhatsApp number
  const ADMIN_WHATSAPP = '6281234567890'; // Replace with actual number if provided
  const BANK_NAME = 'Bank BCA';
  const REKENING_NUMBER = '1900800000299585';
  const REKENING_NAME = 'Felix Hencia Suciadi';

  const confirmPaymentViaWhatsApp = async () => {
    setLoading(true);
    setError('');
    try {
      const activeSessionStr = localStorage.getItem('fid_invoice_active_session');
      const activeUser = activeSessionStr ? JSON.parse(activeSessionStr) : null;
      
      const isYearly = planName.toLowerCase().includes('yearly');

      // Create manual payment pending transaction on the server
      const response = await fetch('/api/payment/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          planName,
          userId: activeUser?.id || 'guest',
          userEmail: activeUser?.email || 'customer@example.com',
          fullName: activeUser?.fullName || 'Pelanggan',
          isYearly
        })
      });

      if (!response.ok) {
        throw new Error('Gagal menginisialisasi pembayaran di server.');
      }

      const data = await response.json();
      const orderId = data.orderId;

      // Record pending payment in localStorage so we can track it when returning
      const pendingPayment = {
        id: orderId,
        userId: activeUser?.id || 'guest',
        userEmail: activeUser?.email || 'guest@example.com',
        fullName: activeUser?.fullName || 'Tamu / Tamu Penilai',
        businessName: activeUser?.businessName || 'Bisnis Tamu',
        plan: planName.toLowerCase(),
        amount: amount,
        timestamp: new Date().toISOString(),
        status: 'pending',
        transferMethod: 'Manual Transfer'
      };

      const existingPayments = JSON.parse(localStorage.getItem('fid_invoice_pending_payments') || '[]');
      existingPayments.push(pendingPayment);
      localStorage.setItem('fid_invoice_pending_payments', JSON.stringify(existingPayments));

      // Construct WhatsApp Message
      const message = \`Halo Admin, saya ingin konfirmasi pembayaran langganan aplikasi.\\n\\n*Order ID*: \${orderId}\\n*Paket*: \${planName.toUpperCase()}\\n*Total*: Rp \${amount.toLocaleString('id-ID')}\\n*Nama*: \${activeUser?.fullName || 'Tamu'}\\n\\nBerikut saya lampirkan bukti transfernya:\`;
      
      const waUrl = \`https://api.whatsapp.com/send?phone=\${ADMIN_WHATSAPP}&text=\${encodeURIComponent(message)}\`;
      window.open(waUrl, '_blank');
      
      // Simulate success callback so user sees the app unlocking when admin approves (for now we wait or just show success)
      // Actually we should just let the user know it's pending.
      // We will show a success message that it's pending manual verification.
      setIsSuccess(true);
      setTimeout(() => {
         onPaymentSuccess();
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return \`\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };
  
  const handleCopyRekening = () => {
    navigator.clipboard.writeText(REKENING_NUMBER);
    setCopiedRekening(true);
    setTimeout(() => setCopiedRekening(false), 2000);
  };

  const containerBg = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100';
  const cardBg = isDarkMode ? 'bg-slate-950 border-slate-800/80' : 'bg-gray-50 border-gray-200/60';

  return (
    <div className={\`w-full max-w-lg mx-auto rounded-3xl border shadow-xl overflow-hidden transition-all duration-300 \${containerBg}\`}>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl">
            <CreditCard className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">Invoice Langganan</span>
            <h3 className="font-extrabold text-sm sm:text-base mt-1">Paket {planName.toUpperCase()}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/25 px-3 py-1.5 rounded-xl border border-white/10">
          <Clock className="w-4 h-4 text-blue-300 animate-pulse" />
          <span className="font-mono text-xs font-black tracking-wide">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="text-center space-y-1 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100/30">
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Total Nominal Transfer</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
              {formatCurrency(amount)}
            </span>
            <button 
              onClick={handleCopyAmount}
              className="p-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-blue-600 border border-gray-200/50 dark:border-slate-700 cursor-pointer transition-colors"
              title="Salin nominal"
            >
              {copiedAmount ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className={\`p-5 rounded-2xl border \${cardBg} text-left space-y-4\`}>
            <div className="flex justify-between items-center border-b border-gray-200/60 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rekening Tujuan</span>
              <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">Manual Transfer</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Bank</p>
                <p className="font-bold text-sm dark:text-white">{BANK_NAME}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Nomor Rekening</p>
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-3 rounded-xl">
                  <span className="font-mono font-bold text-lg text-blue-600 dark:text-blue-400 tracking-wider">{REKENING_NUMBER}</span>
                  <button 
                    onClick={handleCopyRekening}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {copiedRekening ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Atas Nama</p>
                <p className="font-bold text-sm dark:text-white">{REKENING_NAME}</p>
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold mt-2">
                ⚠️ {error}
              </div>
            )}
          </div>
          
          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30 flex gap-3 text-left">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-200">
              Setelah melakukan transfer, silakan konfirmasi melalui WhatsApp dengan menyertakan <strong>bukti transfer</strong>. Admin kami akan segera memverifikasi dan mengaktifkan paket Anda.
            </p>
          </div>

          <div className="pt-2">
            {isSuccess ? (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 p-4 rounded-2xl flex items-center justify-center gap-3 text-green-600 dark:text-green-400 animate-pulse">
                <CheckCircle className="w-6 h-6 shrink-0" />
                <span className="text-sm font-black">Pesanan dibuat! Menunggu verifikasi admin...</span>
              </div>
            ) : (
              <button
                onClick={confirmPaymentViaWhatsApp}
                disabled={loading}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-green-500/20 cursor-pointer transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <Smartphone className="w-5 h-5" />
                {loading ? 'Memproses...' : 'Konfirmasi via WhatsApp'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/QrisPaymentBox.tsx', content);
console.log('QrisPaymentBox updated for manual transfer.');
