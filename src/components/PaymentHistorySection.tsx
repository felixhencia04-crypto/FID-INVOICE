import React, { useEffect, useState } from 'react';
import { 
  RefreshCw, CheckCircle2, Clock, CreditCard, AlertCircle, 
  Check, CheckSquare, Sparkles, HelpCircle 
} from 'lucide-react';
import { formatDateIndonesian } from '../utils';

interface TransactionRecord {
  orderId: string;
  userId: string;
  userEmail: string;
  fullName: string;
  planName: string;
  amount: number;
  isYearly: boolean;
  status: 'pending' | 'confirmed' | 'applied';
  paymentType?: string;
  timestamp: string;
}

interface PaymentHistorySectionProps {
  userId: string;
  onRefreshUserStatus: () => void; // Triggered when a payment gets confirmed/applied
  isDarkMode?: boolean;
}

export default function PaymentHistorySection({ 
  userId, onRefreshUserStatus, isDarkMode = false 
}: PaymentHistorySectionProps) {
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/doku/history/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  

  

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const getStatusBadge = (status: 'pending' | 'confirmed' | 'applied') => {
    switch (status) {
      case 'applied':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aktif (Lunas)
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider animate-pulse">
            <Check className="w-3.5 h-3.5" />
            Lunas (Memproses)
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            Menunggu Pembayaran
          </span>
        );
    }
  };

  return (
    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-gray-100 shadow-sm'} space-y-5 text-left`}>
      <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-slate-800">
        <div>
          <h3 className={`font-display font-extrabold text-sm ${isDarkMode ? 'text-white' : 'text-brand-dark'}`}>
            Riwayat Tagihan & Status Aktivasi
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Daftar transaksi perpanjangan beserta verifikasi instan
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-750 hover:bg-slate-700 text-slate-300' 
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-500'
          }`}
          title="Segarkan Riwayat"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl border text-xs leading-relaxed flex items-start gap-3 ${
          statusMessage.type === 'success'
            ? 'bg-green-500/10 border-green-500/20 text-green-500'
            : statusMessage.type === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-500'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">{statusMessage.type === 'success' ? 'Verifikasi Berhasil' : 'Pemberitahuan Sistem'}</p>
            <p className="mt-0.5">{statusMessage.text}</p>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-[10px] font-black uppercase tracking-wider hover:opacity-80 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {history.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <CreditCard className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
          <p className="text-xs text-slate-400">Belum ada riwayat transaksi pembayaran.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-gray-50 text-gray-400'} uppercase tracking-wider font-mono text-[9px]`}>
                <th className="pb-3 font-semibold">Order ID</th>
                <th className="pb-3 font-semibold">Paket</th>
                <th className="pb-3 font-semibold">Total Tagihan</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-850">
              {history.map((tx) => (
                <tr key={tx.orderId} className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  <td className="py-3.5 pr-2 font-mono text-[10px]">
                    <div>{tx.orderId}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {(() => {
                        try {
                          const d = new Date(tx.timestamp);
                          if (!isNaN(d.getTime())) {
                            const dateStr = formatDateIndonesian(tx.timestamp.split('T')[0]);
                            const hours = String(d.getHours()).padStart(2, '0');
                            const minutes = String(d.getMinutes()).padStart(2, '0');
                            const seconds = String(d.getSeconds()).padStart(2, '0');
                            return `${dateStr} pukul ${hours}:${minutes}:${seconds}`;
                          }
                        } catch (err) {}
                        return formatDateIndonesian(tx.timestamp.split('T')[0]);
                      })()}
                    </div>
                  </td>
                  <td className="py-3.5 pr-2 font-bold uppercase text-[10px]">
                    {tx.planName} ({tx.isYearly ? 'Tahunan' : 'Bulanan'})
                  </td>
                  <td className={`py-3.5 pr-2 font-mono font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {formatRupiah(tx.amount)}
                  </td>
                  <td className="py-3.5 pr-2">
                    {getStatusBadge(tx.status)}
                    {tx.paymentType && (
                      <div className="text-[9px] text-slate-400 mt-1">
                        via: {tx.paymentType.replace(/simulasi |simulated /gi, '')}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 text-right space-y-1.5 sm:space-y-0 sm:space-x-2">
                    {tx.status === 'pending' && (
                      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-1.5">
                        <span className="text-[10px] font-bold text-yellow-500 animate-pulse uppercase tracking-wider">Menunggu Konfirmasi Admin</span>
                      </div>
                    )}
                    {tx.status === 'confirmed' && (
                      <button
                        onClick={onRefreshUserStatus}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                      >
                        Aktifkan Sekarang
                      </button>
                    )}
                    {tx.status === 'applied' && (
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        Sudah Aktif
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Guide Card helper */}
      <div className={`p-4 rounded-xl text-xs flex items-start gap-3 leading-relaxed ${
        isDarkMode ? 'bg-slate-950/40 text-slate-300' : 'bg-gray-50 text-gray-500'
      }`}>
        <HelpCircle className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Panduan Pembayaran:</p>
          <p>
            Harap tunggu admin memverifikasi pembayaran Anda setelah Anda melakukan transfer dan konfirmasi via WhatsApp. Status akan otomatis berubah menjadi "Sudah Aktif" jika disetujui.
          </p>
        </div>
      </div>

    </div>
  );
}
