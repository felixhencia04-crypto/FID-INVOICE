import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, DollarSign, Calendar, FileText, X } from 'lucide-react';
import { Invoice } from '../types';
import { formatCurrency } from '../utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onConfirm: (invoiceId: string, paymentMethod: string, notes: string, date: string) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  invoice,
  onConfirm
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('Pelunasan penuh');

  // Sync state when invoice opens
  useEffect(() => {
    if (isOpen) {
      setPaymentDate(new Date().toISOString().split('T')[0]);
      if (invoice) {
        setPaymentMethod(invoice.paymentMethodInfo || 'Bank Transfer');
      }
    }
  }, [isOpen, invoice]);

  if (!invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(invoice.id, paymentMethod, paymentNotes, paymentDate);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/40 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-150 overflow-hidden text-left"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5.5 h-5.5 text-white" />
                <div>
                  <h3 className="font-display font-extrabold text-sm">Konfirmasi Pelunasan Pembayaran</h3>
                  <p className="text-[10px] text-white/80 font-medium">Ubah status tagihan menjadi LUNAS</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Invoice Summary */}
              <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase font-mono">No. Invoice</span>
                  <span className="font-mono font-bold text-brand-dark">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase">Nama Klien</span>
                  <span className="font-bold text-gray-800">{invoice.clientName}</span>
                </div>
                <div className="h-px bg-gray-200/60 my-1" />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase">Nominal Pelunasan</span>
                  <span className="font-mono font-black text-green-600 text-sm">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
                  Metode Pembayaran Pelunasan
                </label>
                <div className="relative">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all cursor-pointer"
                  >
                    <option value="Bank Transfer">🏛️ Bank Transfer / Transfer Bank</option>
                    <option value="Tunai / Cash">💵 Tunai / Cash</option>
                    <option value="QRIS">📱 QRIS / E-Wallet</option>
                    <option value="Giro">📝 Giro / Cek</option>
                  </select>
                </div>
              </div>

              {/* Payment Date Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
                  Tanggal Diterima
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all cursor-pointer"
                  />
                </div>
              </div>

              {/* Payment Notes Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
                  Catatan Transaksi / Keterangan kuitansi
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <textarea
                    placeholder="Contoh: Pembayaran lunas untuk termin akhir"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={2}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-semibold text-gray-700 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-500 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors text-center"
                >
                  Konfirmasi Lunas ✔
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
