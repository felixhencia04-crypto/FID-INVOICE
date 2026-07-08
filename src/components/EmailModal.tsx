import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Copy, Check, ExternalLink, Inbox, CheckCircle2, AlertCircle, Download, FileText, Receipt, Clock } from 'lucide-react';
import { Invoice, Client, UserProfile } from '../types';
import { formatCurrency, formatDateIndonesian } from '../utils';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  client?: Client;
  user: UserProfile;
}

export default function EmailModal({
  isOpen,
  onClose,
  invoice,
  client,
  user
}: EmailModalProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subjectText, setSubjectText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<'invoice' | 'receipt'>(
    invoice?.status === 'Lunas' ? 'receipt' : 'invoice'
  );
  const [activeTemplate, setActiveTemplate] = useState<'standard' | 'overdue' | 'receipt'>(
    invoice?.status === 'Lunas' ? 'receipt' : 'standard'
  );
  const [copied, setCopied] = useState(false);
  const [successNotif, setSuccessNotif] = useState('');
  const [includeLink, setIncludeLink] = useState(false);
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

  useEffect(() => {
    if (isOpen && invoice) {
      setRecipientEmail(client?.email || '');
    }
  }, [isOpen, invoice, client]);

  useEffect(() => {
    if (isOpen && invoice) {
      generateEmail(activeTemplate, selectedDocType);
    }
  }, [isOpen, activeTemplate, selectedDocType, includeLink, invoice, user]);

  const generateEmail = (templateType: 'standard' | 'overdue' | 'receipt', docType: 'invoice' | 'receipt') => {
    const clientName = invoice.clientName;
    const invNumber = invoice.invoiceNumber;
    const invTotal = formatCurrency(invoice.total, invoice.currency);
    const dueDate = formatDateIndonesian(invoice.dueDate);
    const dateCreated = formatDateIndonesian(invoice.date);
    const bizName = user.businessName || 'Perusahaan Kami';
    
    // Build items list
    const itemsList = invoice.items
      .map(item => `• ${item.description} (${item.qty} ${item.unit || 'x'}) - ${formatCurrency(item.price, invoice.currency)}`)
      .join('\n');

    // Secure online view link
    const secureLink = `${window.location.origin}${window.location.pathname}?print=${invoice.id}&docType=${docType}`;

    const linkSection = includeLink 
      ? `\n🔗 TAUTAN ONLINE ${docType === 'receipt' ? 'KUITANSI' : 'INVOICE'} & CETAK:\n${secureLink}\n` 
      : `\n📎 LAMPIRAN DOKUMEN: Dokumen PDF Resmi ${docType === 'receipt' ? 'Kuitansi Pembayaran' : 'Invoice'} telah diunduh secara otomatis dan siap dilampirkan bersama email ini.\n`;

    const receiptLinkSection = includeLink 
      ? `\n🔗 TAUTAN RESI & CETAK:\n${secureLink}\n` 
      : `\n📎 LAMPIRAN DOKUMEN: Dokumen PDF Bukti Penerimaan / Kuitansi Resmi telah diunduh secara otomatis dan siap dilampirkan bersama email ini.\n`;

    // Bank account instructions
    const bankDetails = user.bankName 
      ? `INFORMASI REKENING PEMBAYARAN:\nBank: ${user.bankName}\nNo. Rekening: ${user.bankAccountNumber}\nAtas Nama: ${user.bankAccountHolder}\n`
      : '';

    const spelledText = invoice.spelledOut 
      ? (invoice.spelledOut.toLowerCase().endsWith('rupiah') 
          ? invoice.spelledOut 
          : `${invoice.spelledOut} ${invoice.currency === 'IDR' ? 'Rupiah' : ''}`.trim())
      : '';

    let subject = '';
    let body = '';

    if (templateType === 'standard') {
      subject = `Tagihan Resmi: Invoice ${invNumber} - ${bizName}`;
      body = `Yth. ${clientName},

Berikut kami kirimkan rincian tagihan resmi Invoice ${invNumber} Anda dari ${bizName}.

Tanggal Tagihan: ${dateCreated}
Batas Jatuh Tempo: ${dueDate}

Rincian Item:
${itemsList}

TOTAL TAGIHAN: ${invTotal} (${spelledText})
${linkSection}
${bankDetails}
Mohon untuk melakukan pembayaran sebelum tanggal jatuh tempo yang tertera. Setelah melakukan pembayaran, harap konfirmasi dengan membalas email ini dengan menyertakan bukti transfer.

Terima kasih banyak atas kerja sama dan kepercayaannya!

Salam hangat,
${bizName}`;
    } else if (templateType === 'overdue') {
      subject = `PENTING: Pengingat Tagihan Jatuh Tempo Invoice ${invNumber} - ${bizName}`;
      body = `Yth. ${clientName},

Kami ingin mengingatkan kembali mengenai tagihan Invoice ${invNumber} dari ${bizName} yang telah melewati batas waktu jatuh tempo pada ${dueDate}.

Total Tagihan Terutang: ${invTotal} (${spelledText})
${linkSection}
Rincian Item:
${itemsList}

${bankDetails}
Kami sangat menghargai jika pembayaran dapat segera diselesaikan untuk menghindari keterlambatan administrasi lebih lanjut. Jika Anda telah melakukan pembayaran, silakan abaikan email ini atau kirimkan konfirmasi bukti transfer kepada kami.

Terima kasih banyak atas perhatian dan pengertian Anda.

Salam hormat,
${bizName}`;
    } else if (templateType === 'receipt') {
      subject = `Tanda Terima Pembayaran: Invoice ${invNumber} LUNAS - ${bizName}`;
      body = `Yth. ${clientName},

Terima kasih banyak! Kami telah menerima pembayaran Anda sebesar ${invTotal} (${spelledText}) untuk pelunasan Invoice ${invNumber}.

Kami konfirmasikan bahwa status invoice Anda saat ini telah:
LUNAS (PAID)
${receiptLinkSection}
Berikut kami lampirkan konfirmasi tanda terima pembayaran resmi ini. Terima kasih atas kerja sama yang luar biasa ini. Semoga bisnis Anda semakin berkembang pesat dan sukses selalu!

Salam hangat,
${bizName}`;
    }

    setSubjectText(subject);
    setBodyText(body);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subjek: ${subjectText}\n\n${bodyText}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMailto = () => {
    // Automatically trigger PDF download first
    handleDownloadPDF();

    const encodedSubject = encodeURIComponent(subjectText);
    const encodedBody = encodeURIComponent(bodyText);
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodedSubject}&body=${encodedBody}`;
    window.location.href = mailtoUrl;
    
    setSuccessNotif(`✓ PDF Berkas ${selectedDocType === 'receipt' ? 'Kuitansi' : 'Invoice'} Otomatis Diunduh! Silakan lampirkan file dari folder Download perangkat Anda ke aplikasi email yang terbuka.`);
    setTimeout(() => setSuccessNotif(''), 8000);
  };

  const handleSendGmail = () => {
    // Automatically trigger PDF download first
    handleDownloadPDF();

    const encodedSubject = encodeURIComponent(subjectText);
    const encodedBody = encodeURIComponent(bodyText);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipientEmail}&su=${encodedSubject}&body=${encodedBody}`;
    window.open(gmailUrl, '_blank');

    setSuccessNotif(`✓ PDF Berkas ${selectedDocType === 'receipt' ? 'Kuitansi' : 'Invoice'} Otomatis Diunduh! Silakan lampirkan file dari folder Download perangkat Anda ke editor Gmail yang terbuka.`);
    setTimeout(() => setSuccessNotif(''), 8000);
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
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-brand-dark text-lg leading-tight">
                    Kirim via Email
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

            {/* Notification Toast */}
            {successNotif && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-xl font-bold flex items-center gap-1.5 animate-pulse">
                <Inbox className="w-4 h-4" />
                <span>{successNotif}</span>
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
                    Email Klien (Penerima)
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="Contoh: client@email.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-800 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">
                    Subjek Email
                  </label>
                  <input
                    type="text"
                    value={subjectText}
                    onChange={(e) => setSubjectText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-gray-800 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all font-medium"
                  />
                </div>
              </div>

              {/* Step-by-Step Professional Integration Guide */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3 shadow-inner">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold">✓</span>
                  <span className="font-extrabold text-brand-dark text-xs uppercase tracking-wider">Kirim Berkas {selectedDocType === 'receipt' ? 'Kuitansi' : 'Invoice'} Langsung</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1">
                  <div className="bg-white border border-gray-150 rounded-xl p-3 flex flex-col justify-between items-start gap-2 shadow-sm">
                    <div>
                      <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold">1</span>
                        Unduh Otomatis Terintegrasi
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                        Saat Anda mengklik tombol <strong>Kirim via Gmail</strong> atau <strong>Aplikasi Email</strong>, berkas PDF {selectedDocType === 'receipt' ? 'Kuitansi' : 'Invoice'} resmi akan langsung diunduh otomatis ke perangkat Anda.
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
                        Email dikirim bersih tanpa dipenuhi link URL eksternal, sehingga pesan terlihat sangat elegan dan profesional.
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
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
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
                      onClick={() => generateEmail('standard', 'invoice')}
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
                      onClick={() => generateEmail('overdue', 'invoice')}
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
                      onClick={() => generateEmail('receipt', 'receipt')}
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
                    Isi Pesan Email (Bisa Diedit Sesuka Hati)
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
                        <span>Salin Pesan & Subjek</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full h-64 px-4 py-3 border border-gray-200 rounded-2xl bg-slate-50 text-slate-800 font-mono text-xs focus:border-brand-primary focus:bg-white focus:ring-1 focus:ring-brand-primary outline-none transition-all resize-none leading-relaxed"
                />
              </div>

            </div>

            {/* Actions Panel Footer */}
            <div className="border-t border-gray-100 pt-4 mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-[10px] text-gray-400 text-center sm:text-left">
                *Sistem akan otomatis mengunduh PDF untuk dilampirkan ke email tujuan.
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
                  onClick={handleSendGmail}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="Kirim menggunakan editor Gmail web"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Kirim via Gmail
                </button>
                <button
                  type="button"
                  onClick={handleSendMailto}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-100 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="Kirim menggunakan aplikasi email lokal perangkat"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Aplikasi Email
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
