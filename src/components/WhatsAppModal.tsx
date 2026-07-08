import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Copy, Check, ExternalLink, Smartphone, Clock, CheckCircle2, Download, FileText, Receipt } from 'lucide-react';
import { Invoice, Client, UserProfile } from '../types';
import { formatCurrency, formatDateIndonesian } from '../utils';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  client?: Client;
  user: UserProfile;
}

export default function WhatsAppModal({
  isOpen,
  onClose,
  invoice,
  client,
  user
}: WhatsAppModalProps) {
  const [recipientPhone, setRecipientPhone] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<'invoice' | 'receipt'>(
    invoice?.status === 'Lunas' ? 'receipt' : 'invoice'
  );
  const [activeTemplate, setActiveTemplate] = useState<'standard' | 'overdue' | 'receipt'>(
    invoice?.status === 'Lunas' ? 'receipt' : 'standard'
  );
  const [copied, setCopied] = useState(false);
  const [includeLink, setIncludeLink] = useState(false);
  const [showDownloadAlert, setShowDownloadAlert] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

  const handleDownloadPDF = () => {
    const downloadUrl = `${window.location.origin}${window.location.pathname}?print=${invoice.id}&action=download&docType=${selectedDocType}&fromModal=true`;
    
    // Create hidden iframe to trigger download silently without popups
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = downloadUrl;
    document.body.appendChild(iframe);
    
    // Remove after 10 seconds
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 10000);
  };

  // Helper to format phone to Indonesian country code standard for WhatsApp Link
  const formatWhatsAppPhone = (phoneNum: string): string => {
    if (!phoneNum) return '';
    let cleaned = phoneNum.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  };

  useEffect(() => {
    if (isOpen && invoice) {
      // Find recipient phone: prefer client prop phone, fallback to invoice client phone search or empty
      const phone = client?.phone || invoice.paymentMethodInfo || '';
      setRecipientPhone(phone);
    }
  }, [isOpen, invoice, client]);

  useEffect(() => {
    if (isOpen && invoice) {
      generateMessage(activeTemplate, selectedDocType);
    }
  }, [isOpen, activeTemplate, selectedDocType, includeLink, invoice, user]);

  const generateMessage = (templateType: 'standard' | 'overdue' | 'receipt', docType: 'invoice' | 'receipt') => {
    const clientName = invoice.clientName;
    const invNumber = invoice.invoiceNumber;
    const invTotal = formatCurrency(invoice.total, invoice.currency);
    const dueDate = formatDateIndonesian(invoice.dueDate);
    const dateCreated = formatDateIndonesian(invoice.date);
    const bizName = user.businessName || 'Perusahaan Kami';
    
    // Build items list
    const itemsList = invoice.items
      .map(item => `  • ${item.description} (${item.qty} ${item.unit || 'x'}) - ${formatCurrency(item.price, invoice.currency)}`)
      .join('\n');

    // Secure online view link
    const secureLink = `${window.location.origin}${window.location.pathname}?print=${invoice.id}&docType=${docType}`;

    const linkSection = includeLink 
      ? `\n🔗 *TAUTAN ONLINE ${docType === 'receipt' ? 'KUITANSI' : 'INVOICE'} & CETAK:*\n${secureLink}\n` 
      : `\n📎 *LAMPIRAN DOKUMEN:* Dokumen PDF Resmi ${docType === 'receipt' ? 'Kuitansi Pembayaran' : 'Invoice'} telah otomatis diunduh dan siap dikirim bersama pesan ini.\n`;

    const receiptLinkSection = includeLink 
      ? `\n🔗 *TAUTAN RESI & CETAK:*\n${secureLink}\n` 
      : `\n📎 *LAMPIRAN DOKUMEN:* Dokumen PDF Bukti Penerimaan / Kuitansi Resmi telah otomatis diunduh dan siap dikirim bersama pesan ini.\n`;

    // Bank account instructions
    const bankDetails = user.bankName 
      ? `\n💳 *INFORMASI REKENING PEMBAYARAN:*\n  Bank: *${user.bankName}*\n  No. Rekening: *${user.bankAccountNumber}*\n  Atas Nama: *${user.bankAccountHolder}*\n`
      : '';

    const spelledText = invoice.spelledOut 
      ? (invoice.spelledOut.toLowerCase().endsWith('rupiah') 
          ? invoice.spelledOut 
          : `${invoice.spelledOut} ${invoice.currency === 'IDR' ? 'Rupiah' : ''}`.trim())
      : '';

    let text = '';

    if (templateType === 'standard') {
      text = `Halo *${clientName}*, 👋
 
Berikut kami kirimkan rincian tagihan resmi *Invoice ${invNumber}* Anda dari *${bizName}*.
 
📅 *Tanggal Tagihan:* ${dateCreated}
⏳ *Batas Jatuh Tempo:* *${dueDate}*
 
📋 *Rincian Item:*
${itemsList}
 
💵 *TOTAL TAGIHAN:* *${invTotal}*
🗣️ *Terbilang:* _"${spelledText}"_
${bankDetails}${linkSection}
Mohon untuk melakukan pembayaran sebelum tanggal jatuh tempo yang tertera. Setelah melakukan transfer, Anda dapat membalas pesan ini dengan menyertakan bukti pembayaran.
 
Terima kasih banyak atas kerja sama dan kepercayaannya! 🙏✨
--
*${bizName}*`;
    } else if (templateType === 'overdue') {
      text = `Yth. *${clientName}*, 🙏
 
Kami ingin mengingatkan kembali mengenai tagihan *Invoice ${invNumber}* dari *${bizName}* yang telah melewati batas waktu jatuh tempo pada *${dueDate}*.
 
💵 *Total Tagihan:* *${invTotal}*
🗣️ *Terbilang:* _"${spelledText}"_
 
📋 *Rincian Item:*
${itemsList}
${bankDetails}${linkSection}
Kami sangat menghargai jika pembayaran dapat segera diselesaikan untuk menghindari keterlambatan administrasi lebih lanjut. Jika Anda sudah melakukan pembayaran, silakan abaikan pesan ini atau kirimkan bukti transfer kepada kami.
 
Terima kasih atas perhatian dan pengertiannya. 😊
--
*${bizName}*`;
    } else if (templateType === 'receipt') {
      text = `Halo *${clientName}*, 😊
 
Terima kasih banyak! Kami telah menerima pembayaran Anda sebesar *${invTotal}* (_${spelledText}_) untuk pelunasan *Invoice ${invNumber}*.
 
Kami konfirmasikan bahwa status invoice Anda saat ini telah:
 🟢 *LUNAS (PAID)*
${receiptLinkSection}
Terima kasih atas kerja sama yang luar biasa ini. Semoga bisnis Anda semakin sukses dan lancar! 🚀💼
 
Salam hangat,
*${bizName}*`;
    }

    setMessageText(text);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = (useWeb: boolean = false) => {
    // Automatically trigger PDF download of selected doc type
    handleDownloadPDF();
    
    setShowDownloadAlert(true);
    setTimeout(() => {
      setShowDownloadAlert(false);
    }, 6000);

    const cleanedPhone = formatWhatsAppPhone(recipientPhone);
    const encodedText = encodeURIComponent(messageText);
    const baseUrl = useWeb ? 'https://web.whatsapp.com/send' : 'https://api.whatsapp.com/send';
    const finalUrl = `${baseUrl}?phone=${cleanedPhone}&text=${encodedText}`;
    window.open(finalUrl, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />

          {/* Dialog Body */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.35 }}
            className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-150 p-6 overflow-hidden text-left flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-brand-dark text-lg leading-tight">
                    Kirim via WhatsApp
                  </h3>
                  <p className="text-xs text-gray-500">
                    Kirim rincian tagihan atau tanda terima dengan berkas PDF otomatis.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Iframe Notice */}
            {isInIframe && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2.5 shadow-xs leading-relaxed">
                <span className="text-sm">💡</span>
                <div>
                  <p className="font-extrabold text-amber-900">Menggunakan Mode Preview AI Studio?</p>
                  <p className="text-[10px] text-amber-700 mt-0.5 font-medium">
                    Keamanan browser membatasi pembukaan tab otomatis (seperti WhatsApp / Email) langsung dari dalam bingkai (iframe) tinjauan ini. 
                    <a 
                      href={window.location.href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="ml-1 font-bold text-amber-950 underline inline-flex items-center gap-0.5 hover:text-amber-900"
                    >
                      Buka di Tab Baru <ExternalLink className="w-2.5 h-2.5 inline" />
                    </a> untuk pengalaman yang lancar dan instan!
                  </p>
                </div>
              </div>
            )}

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              
              {/* Document Selector Card Option */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Pilih Dokumen yang Ingin Dikirim
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDocType('invoice');
                      setActiveTemplate('standard');
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      selectedDocType === 'invoice'
                        ? 'border-brand-primary bg-blue-50/50 text-brand-dark font-bold shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedDocType === 'invoice' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black">Dokumen Invoice</p>
                      <p className="text-[9px] text-gray-400 font-medium">Tagihan resmi transaksi</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDocType('receipt');
                      setActiveTemplate('receipt');
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      selectedDocType === 'receipt'
                        ? 'border-emerald-500 bg-emerald-50/30 text-brand-dark font-bold shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedDocType === 'receipt' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black">Dokumen Kuitansi</p>
                      <p className="text-[9px] text-gray-400 font-medium">Bukti pelunasan lunas</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recipient Details Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">
                    Nama Klien (Penerima)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={invoice.clientName}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">
                    No. WhatsApp / Telepon
                  </label>
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="Contoh: 08123456789 atau 628123456789"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-800 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all font-mono"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Sistem akan otomatis memformat nomor ke standar internasional (+62).
                  </span>
                </div>
              </div>

              {/* Step-by-Step Professional Integration Guide */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3 shadow-inner">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold">✓</span>
                  <span className="font-extrabold text-brand-dark text-xs uppercase tracking-wider">Kirim Berkas {selectedDocType === 'receipt' ? 'Kuitansi' : 'Invoice'} Langsung</span>
                </div>
                
                {showDownloadAlert && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-start gap-2 text-[11px]"
                  >
                    <span className="text-base">🚀</span>
                    <div>
                      <p className="font-bold">Berkas PDF Sedang Diunduh Otomatis!</p>
                      <p className="text-[10px] text-green-700 mt-0.5 leading-tight">
                        Dokumen {selectedDocType === 'receipt' ? 'Kuitansi' : 'Invoice'} resmi telah disimpan di perangkat Anda. Di jendela WhatsApp yang terbuka, silakan klik ikon klip kertas/tambah (+) lalu lampirkan file PDF tersebut langsung ke klien Anda.
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1">
                  <div className="bg-white border border-gray-150 rounded-xl p-3 flex flex-col justify-between items-start gap-2 shadow-sm">
                    <div>
                      <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-green-100 text-green-700 text-[9px] font-bold">1</span>
                        Unduh Otomatis Terintegrasi
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                        Saat Anda mengklik tombol <strong>Kirim Pesan</strong> di bawah, sistem secara otomatis akan mengunduh berkas PDF {selectedDocType === 'receipt' ? 'Kuitansi' : 'Invoice'} resmi ke perangkat Anda.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-150 rounded-xl p-3 flex flex-col justify-between items-start gap-2 shadow-sm">
                    <div>
                      <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[9px] font-bold">2</span>
                        Bebas Clutter Link (Bersih)
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                        Format teks pesan bersih tanpa menyertakan link URL eksternal yang mengganggu, memberikan tampilan yang jauh lebih rapi dan profesional.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Toggle include link */}
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-150 shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-gray-800 block">Sertakan Tautan Web (Opsional)</span>
                    <span className="text-[10px] text-gray-500 block">Aktifkan jika klien juga membutuhkan link web interaktif untuk melihat invoice online.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={includeLink} 
                      onChange={(e) => setIncludeLink(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>

              {/* Template Selector Options */}
              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1.5">
                  Pilih Format Template Pesan
                </label>
                {selectedDocType === 'invoice' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => generateMessage('standard', 'invoice')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        activeTemplate === 'standard'
                          ? 'border-brand-primary bg-brand-primary-light/10 text-brand-primary font-bold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>Tagihan Baru / Normal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => generateMessage('overdue', 'invoice')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        activeTemplate === 'overdue'
                          ? 'border-red-500 bg-red-50 text-red-600 font-bold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <X className="w-4 h-4 text-red-400" />
                      <span>Tagihan Jatuh Tempo</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1">
                    <button
                      type="button"
                      onClick={() => generateMessage('receipt', 'receipt')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        activeTemplate === 'receipt'
                          ? 'border-green-600 bg-green-50 text-green-700 font-bold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Tanda Terima / Lunas</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Message Textarea Container */}
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase">
                    Isi Pesan (Bisa Diedit Sesuka Hati)
                  </label>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[10px] text-brand-primary hover:underline font-bold cursor-pointer bg-brand-primary-light/10 px-2 py-0.5 rounded-md"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-green-600" />
                        <span className="text-green-600">Berhasil Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin Pesan</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full h-64 px-4 py-3 border border-gray-200 rounded-2xl bg-slate-50 text-slate-800 font-mono text-xs focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary outline-none transition-all resize-none leading-relaxed"
                />
              </div>

            </div>

            {/* Actions Panel Footer */}
            <div className="border-t border-gray-100 pt-4 mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-[10px] text-gray-400 text-center sm:text-left">
                *Pastikan aplikasi WhatsApp Anda aktif, atau gunakan WhatsApp Web di browser.
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-4 py-2 font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(true)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="Kirim menggunakan WhatsApp Web"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  WA Web
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md shadow-green-100 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="Kirim menggunakan WhatsApp Application / HP"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Kirim Pesan
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
