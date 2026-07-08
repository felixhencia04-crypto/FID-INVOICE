import React, { useState } from 'react';
import { 
  Receipt, Plus, Search, Filter, Printer, Download, 
  Smartphone, Mail, CheckCircle, Calendar, DollarSign, 
  AlertCircle, ChevronDown, Check, ArrowRight, Eye, RefreshCw, X,
  Edit3, Trash2, Info
} from 'lucide-react';
import { Invoice, Client, UserProfile } from '../types';
import { formatCurrency, formatDateIndonesian, generateRandomId, terbilang } from '../utils';

interface ReceiptManagementProps {
  user: UserProfile;
  invoices: Invoice[];
  clients: Client[];
  onNavigate: (page: string) => void;
  onSelectInvoice: (invoice: Invoice, docType?: 'invoice' | 'receipt') => void;
  onSaveInvoice: (invoice: Invoice) => void;
  onDeleteInvoice?: (id: string) => void;
  onFeatureBlocked?: (featureName: string) => void;
}

export default function ReceiptManagement({
  user, invoices, clients, onNavigate, onSelectInvoice, onSaveInvoice, onDeleteInvoice, onFeatureBlocked
}: ReceiptManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('Semua');
  const [methodFilter, setMethodFilter] = useState('Semua');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'invoice_link' | 'standalone'>('invoice_link');

  // Form states for Recording Payment on Existing Invoice
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentNotes, setPaymentNotes] = useState('Pembayaran penuh');

  // Form states for Standalone Quick Receipt
  const [standaloneClient, setStandaloneClient] = useState('');
  const [standaloneAmount, setStandaloneAmount] = useState('');
  const [standalonePurpose, setStandalonePurpose] = useState('');
  const [standaloneMethod, setStandaloneMethod] = useState('Bank Transfer');
  const [standaloneTemplate, setStandaloneTemplate] = useState<'corporate' | 'minimalist' | 'premium'>('corporate');

  // Form states for EDITING a Receipt
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Invoice | null>(null);
  const [editReceiptNumber, setEditReceiptNumber] = useState('');
  const [editClient, setEditClient] = useState('');
  const [editAmount, setEditAmount] = useState<number | string>('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editMethod, setEditMethod] = useState('Bank Transfer');
  const [editTemplate, setEditTemplate] = useState<'corporate' | 'minimalist' | 'premium'>('corporate');
  const [editNotes, setEditNotes] = useState('');

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingReceiptId, setDeletingReceiptId] = useState('');

  // List of invoices that can receive payments (not yet fully paid)
  const pendingInvoices = invoices.filter(inv => inv.status !== 'Lunas');

  // Filter invoices to extract receipt logs (all invoices that are Lunas or Sebagian can have receipts,
  // and we can also show drafts/dikirim if we want to preview their receipts)
  const receiptsList = invoices.filter(inv => {
    // Receipts apply to paid and partially paid, but we list them all so they can download receipts for any
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = clientFilter === 'Semua' || inv.clientId === clientFilter;
    
    // Check if there are payment details or mock payment methods
    const paymentMethodRaw = inv.paymentMethodInfo || (inv.notes?.toLowerCase().includes('cash') ? 'Tunai' : 'Bank Transfer');
    const isTunai = paymentMethodRaw.toLowerCase().includes('tunai') || paymentMethodRaw.toLowerCase().includes('cash');
    const isBank = paymentMethodRaw.toLowerCase().includes('bank') || paymentMethodRaw.toLowerCase().includes('transfer');
    
    let method = 'Lainnya';
    if (isTunai) method = 'Tunai';
    else if (isBank) method = 'Bank Transfer';

    const matchesMethod = methodFilter === 'Semua' || method === methodFilter || (methodFilter === 'Lainnya' && method !== 'Tunai' && method !== 'Bank Transfer');

    return matchesSearch && matchesClient && matchesMethod;
  });

  // Calculations for Stat Cards
  const totalReceived = invoices
    .filter(inv => inv.status === 'Lunas')
    .reduce((sum, inv) => sum + inv.total, 0) +
    invoices
    .filter(inv => inv.status === 'Sebagian')
    .reduce((sum, inv) => sum + (inv.total * 0.5), 0); // Estimate partial paid as 50%

  const receiptCount = invoices.filter(inv => inv.status === 'Lunas').length;
  const partialCount = invoices.filter(inv => inv.status === 'Sebagian').length;

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const isExpired = user.subscription.status === 'expired' || new Date(user.subscription.expiryDate) < new Date();
    if (isExpired && onFeatureBlocked) {
      onFeatureBlocked('Pencatatan Kuitansi Baru');
      return;
    }
    if (!selectedInvoiceId) return;

    const matchedInv = invoices.find(inv => inv.id === selectedInvoiceId);
    if (!matchedInv) return;

    // Update status to Paid (Lunas) or Sebagian
    const isFullPayment = paymentAmount >= matchedInv.total || paymentAmount === 0;
    const updatedInvoice: Invoice = {
      ...matchedInv,
      status: isFullPayment ? 'Lunas' : 'Sebagian',
      paymentMethodInfo: paymentMethod,
      notes: `${matchedInv.notes}\n---\nPembayaran diterima via ${paymentMethod} sebesar ${formatCurrency(paymentAmount || matchedInv.total)} pada ${new Date().toLocaleDateString('id-ID')}. Catatan: ${paymentNotes}`.trim(),
    };

    onSaveInvoice(updatedInvoice);
    setShowCreateModal(false);
    
    // Reset form states
    setSelectedInvoiceId('');
    setPaymentAmount(0);
    setPaymentNotes('Pembayaran penuh');
    
    // Directly open the receipt preview for this invoice!
    onSelectInvoice(updatedInvoice, 'receipt');
  };

  const handleCreateStandaloneReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const isExpired = user.subscription.status === 'expired' || new Date(user.subscription.expiryDate) < new Date();
    if (isExpired && onFeatureBlocked) {
      onFeatureBlocked('Pembuatan Kuitansi Mandiri Baru');
      return;
    }
    if (!standaloneClient || !standaloneAmount || !standalonePurpose) return;

    const matchedClientObj = clients.find(c => c.id === standaloneClient);
    const clientName = matchedClientObj ? matchedClientObj.name : 'Klien Umum';
    const numAmount = parseFloat(standaloneAmount);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const kwNumber = `KW-${new Date().getFullYear()}-${randomSuffix}`;
    const generatedInvId = 'stand-' + generateRandomId();

    const newInvoice: Invoice = {
      id: generatedInvId,
      invoiceNumber: kwNumber,
      userId: user.id,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      type: 'Commercial Invoice',
      clientId: standaloneClient,
      clientName: clientName,
      items: [
        {
          id: 'item-1',
          description: standalonePurpose,
          qty: 1,
          unit: 'Sesi',
          price: numAmount,
          discountPercent: 0,
          subtotal: numAmount
        }
      ],
      globalDiscountPercent: 0,
      hasTax: false,
      hasTax2: false,
      subtotal: numAmount,
      discountAmount: 0,
      taxAmount: 0,
      tax2Amount: 0,
      total: numAmount,
      currency: 'IDR',
      status: 'Lunas',
      spelledOut: terbilang(numAmount, 'IDR'),
      templateId: standaloneTemplate,
      paymentMethodInfo: standaloneMethod,
      createdAt: new Date().toISOString(),
      notes: `Kuitansi Pembayaran Langsung via ${standaloneMethod}.`
    };

    onSaveInvoice(newInvoice);
    setShowCreateModal(false);
    
    // Reset form states
    setStandaloneClient('');
    setStandaloneAmount('');
    setStandalonePurpose('');
    
    // Open preview in receipt mode!
    onSelectInvoice(newInvoice, 'receipt');
  };

  // Open Edit Modal and fill form states
  const handleOpenEditModal = (receipt: Invoice) => {
    const mainItem = receipt.items[0];
    setEditingReceipt(receipt);
    setEditReceiptNumber(receipt.invoiceNumber);
    setEditClient(receipt.clientId);
    setEditAmount(receipt.total);
    setEditPurpose(mainItem?.description || 'Pembayaran Jasa / Produk');
    setEditDate(receipt.date);
    setEditMethod(receipt.paymentMethodInfo || 'Bank Transfer');
    setEditTemplate(receipt.templateId || 'corporate');
    setEditNotes(receipt.notes || '');
    setShowEditModal(true);
  };

  // Submit Updated Receipt
  const handleUpdateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceipt) return;

    const matchedClientObj = clients.find(c => c.id === editClient);
    const clientName = matchedClientObj ? matchedClientObj.name : 'Klien Umum';
    const numAmount = typeof editAmount === 'string' ? parseFloat(editAmount) : editAmount;

    // Build updated items array
    const updatedItems = editingReceipt.items.map((item, idx) => {
      if (idx === 0) {
        return {
          ...item,
          description: editPurpose,
          price: numAmount,
          subtotal: numAmount
        };
      }
      return item;
    });

    if (updatedItems.length === 0) {
      updatedItems.push({
        id: 'item-1',
        description: editPurpose,
        qty: 1,
        unit: 'Sesi',
        price: numAmount,
        discountPercent: 0,
        subtotal: numAmount
      });
    }

    const updatedReceipt: Invoice = {
      ...editingReceipt,
      invoiceNumber: editReceiptNumber,
      clientId: editClient,
      clientName: clientName,
      date: editDate,
      items: updatedItems,
      subtotal: numAmount,
      total: numAmount,
      spelledOut: terbilang(numAmount, editingReceipt.currency || 'IDR'),
      paymentMethodInfo: editMethod,
      templateId: editTemplate,
      notes: editNotes
    };

    onSaveInvoice(updatedReceipt);
    setShowEditModal(false);
    setEditingReceipt(null);
  };

  // Confirm Delete Receipt
  const handleDeleteReceipt = () => {
    if (deletingReceiptId && onDeleteInvoice) {
      onDeleteInvoice(deletingReceiptId);
      setShowDeleteConfirm(false);
      setDeletingReceiptId('');
    }
  };

  const isExpired = user.subscription.status === 'expired' || new Date(user.subscription.expiryDate) < new Date();

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-brand-dark tracking-tight">
            Menu Kuitansi Resmi
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Pantau, buat, dan kelola kuitansi digital, tanda tangan elektronik, serta bukti pelunasan klien Anda.
          </p>
        </div>
        <button 
          onClick={() => {
            if (isExpired && onFeatureBlocked) {
              onFeatureBlocked('Pembuatan Kuitansi Baru');
            } else {
              setShowCreateModal(true);
            }
          }}
          className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Buat / Catat Kuitansi
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Pembayaran Diterima</p>
            <h3 className="text-lg font-mono font-black text-gray-800 mt-1">{formatCurrency(totalReceived)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-primary-light/30 text-brand-primary rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Kuitansi Lunas Terverifikasi</p>
            <h3 className="text-lg font-mono font-black text-gray-800 mt-1">{receiptCount} Dokumen</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-brand-gold rounded-xl flex items-center justify-center shrink-0">
            <RefreshCw className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Pelunasan Sebagian</p>
            <h3 className="text-lg font-mono font-black text-gray-800 mt-1">{partialCount} Dokumen</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari nomor kuitansi atau nama klien..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-semibold text-gray-800 outline-none transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end text-xs font-bold">
          {/* Client Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-xl border border-gray-150">
            <span className="text-gray-400 text-[10px] uppercase">Klien:</span>
            <select 
              value={clientFilter} 
              onChange={(e) => setClientFilter(e.target.value)}
              className="bg-transparent text-gray-700 outline-none cursor-pointer text-xs font-bold"
            >
              <option value="Semua">Semua Klien</option>
              {clients.map(cl => (
                <option key={cl.id} value={cl.id}>{cl.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-xl border border-gray-150">
            <span className="text-gray-400 text-[10px] uppercase">Metode:</span>
            <select 
              value={methodFilter} 
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-transparent text-gray-700 outline-none cursor-pointer text-xs font-bold"
            >
              <option value="Semua">Semua Metode</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Tunai">Tunai / Cash</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>
      </div>

      {/* Receipts Table List */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-400 text-[10px] font-black uppercase tracking-wider">
                <th className="py-4 px-6">No. Kuitansi</th>
                <th className="py-4 px-6">Untuk Dokumen</th>
                <th className="py-4 px-6">Penyetor / Klien</th>
                <th className="py-4 px-6">Tanggal</th>
                <th className="py-4 px-6">Nominal Bayar</th>
                <th className="py-4 px-6">Metode</th>
                <th className="py-4 px-6 text-center">Status Bukti</th>
                <th className="py-4 px-6 text-right">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-semibold">
              {receiptsList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Receipt className="w-10 h-10 text-gray-200 mx-auto mb-2.5" />
                    Belum ada kuitansi pelunasan yang diterbitkan.
                  </td>
                </tr>
              ) : (
                receiptsList.map(inv => {
                  const kwNumber = inv.invoiceNumber.startsWith('KW-') 
                    ? inv.invoiceNumber 
                    : `KW-${inv.invoiceNumber.replace('INV-', '')}`;
                  
                  const isPaid = inv.status === 'Lunas';
                  const isPartial = inv.status === 'Sebagian';
                  
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 text-brand-dark font-extrabold">{kwNumber}</td>
                      <td className="py-4 px-6 text-gray-500 font-mono text-[11px]">
                        {inv.invoiceNumber.startsWith('KW-') ? 'Pembayaran Langsung' : inv.invoiceNumber}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-800">{inv.clientName}</td>
                      <td className="py-4 px-6 text-gray-500">{formatDateIndonesian(inv.date)}</td>
                      <td className="py-4 px-6 font-mono font-bold text-gray-800">{formatCurrency(inv.total)}</td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 rounded bg-gray-100 border border-gray-150 text-[10px] text-gray-600 font-bold font-sans">
                          {(() => {
                            const pMethod = inv.paymentMethodInfo || '';
                            if (pMethod.toLowerCase().includes('tunai') || pMethod.toLowerCase().includes('cash') || (!pMethod && inv.notes?.toLowerCase().includes('cash'))) {
                              return '💵 Tunai / Cash';
                            } else if (pMethod.toLowerCase().includes('qris') || pMethod.toLowerCase().includes('wallet')) {
                              return '📱 QRIS / E-Wallet';
                            } else if (pMethod.toLowerCase().includes('giro') || pMethod.toLowerCase().includes('cek') || pMethod.toLowerCase().includes('check')) {
                              return '📝 Giro / Cek';
                            } else {
                              return '🏛️ Transfer Bank';
                            }
                          })()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-[11px] font-bold">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            Telah Lunas
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-brand-gold text-[11px] font-bold">
                            <RefreshCw className="w-3 h-3 animate-spin-slow" />
                            Sebagian
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-400 text-[11px] font-bold">
                            <AlertCircle className="w-3.5 h-3.5 text-gray-300" />
                            Belum Dibayar
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => onSelectInvoice(inv, 'receipt')}
                            className="p-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-all cursor-pointer flex items-center gap-1 px-2.5 py-1.5 font-bold"
                            title="Pratinjau Kuitansi Resmi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Pratinjau</span>
                          </button>
                          
                          <button 
                            onClick={() => handleOpenEditModal(inv)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all cursor-pointer flex items-center gap-1 px-2.5 py-1.5 font-bold"
                            title="Edit Data Kuitansi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {onDeleteInvoice && (
                            <button 
                              onClick={() => {
                                setDeletingReceiptId(inv.id);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                              title="Hapus Kuitansi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Record Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-brand-dark/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-up">
            <div className="bg-gradient-to-r from-brand-primary to-brand-primary-dark p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Receipt className="w-5.5 h-5.5" />
                <h3 className="font-display font-extrabold text-base">Buat / Catat Kuitansi Pelunasan</h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-white/70 hover:text-white hover:bg-white/15 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selection tab */}
            <div className="grid grid-cols-2 border-b border-gray-200">
              <button 
                onClick={() => setCreateType('invoice_link')}
                className={`py-3.5 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${createType === 'invoice_link' ? 'border-brand-primary text-brand-primary font-black bg-brand-primary-light/5' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                🔗 Berdasarkan Invoice Tagihan
              </button>
              <button 
                onClick={() => setCreateType('standalone')}
                className={`py-3.5 text-xs font-bold text-center border-b-2 transition-all cursor-pointer ${createType === 'standalone' ? 'border-brand-primary text-brand-primary font-black bg-brand-primary-light/5' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                🧾 Buat Kuitansi Mandiri (Cepat)
              </button>
            </div>

            <div className="p-6">
              {createType === 'invoice_link' ? (
                /* Link to invoice form */
                <form onSubmit={handleRecordPayment} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Pilih Invoice Penagihan</label>
                    <select 
                      required
                      value={selectedInvoiceId}
                      onChange={(e) => {
                        setSelectedInvoiceId(e.target.value);
                        const matched = invoices.find(inv => inv.id === e.target.value);
                        if (matched) {
                          setPaymentAmount(matched.total);
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all cursor-pointer"
                    >
                      <option value="">-- Pilih Invoice Tagihan --</option>
                      {pendingInvoices.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} - {inv.clientName} ({formatCurrency(inv.total)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Jumlah yang Dibayar</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                        <input 
                          type="number"
                          required
                          placeholder="Nilai Pelunasan"
                          value={paymentAmount || ''}
                          onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Metode Pelunasan</label>
                      <select 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all cursor-pointer"
                      >
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Tunai / Cash">Tunai / Cash</option>
                        <option value="QRIS">QRIS / E-Wallet</option>
                        <option value="Giro">Giro / Cek</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Catatan Tambahan (Keterangan)</label>
                    <textarea 
                      placeholder="Contoh: Pelunasan sisa invoice termin ke-2"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-semibold text-gray-700 outline-none transition-all resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 mt-2 bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Simpan & Cetak Kuitansi Resmi
                  </button>
                </form>
              ) : (
                /* Standalone direct receipt form */
                <form onSubmit={handleCreateStandaloneReceipt} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Pilih Klien</label>
                      <select 
                        required
                        value={standaloneClient}
                        onChange={(e) => setStandaloneClient(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all cursor-pointer"
                      >
                        <option value="">-- Pilih Klien Bisnis --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Jumlah Pembayaran</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                        <input 
                          type="number"
                          required
                          placeholder="Nominal Uang"
                          value={standaloneAmount}
                          onChange={(e) => setStandaloneAmount(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Tujuan Pembayaran (Untuk Pembayaran)</label>
                    <input 
                      type="text"
                      required
                      placeholder="Contoh: Jasa Konsultasi Pajak Bulan Juni 2026"
                      value={standalonePurpose}
                      onChange={(e) => setStandalonePurpose(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Metode Pembayaran</label>
                      <select 
                        value={standaloneMethod}
                        onChange={(e) => setStandaloneMethod(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all cursor-pointer"
                      >
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Tunai">Tunai / Cash</option>
                        <option value="QRIS">QRIS / E-Wallet</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Template Kuitansi</label>
                      <select 
                        value={standaloneTemplate}
                        onChange={(e) => setStandaloneTemplate(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all cursor-pointer"
                      >
                        <option value="corporate">Corporate Blue</option>
                        <option value="minimalist">Minimalist Charcoal</option>
                        <option value="premium">Premium Gold</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 mt-2 bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Terbitkan & Cetak Kuitansi
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT KUITANSI MODAL */}
      {showEditModal && editingReceipt && (
        <div className="fixed inset-0 z-50 bg-brand-dark/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-up">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5.5 h-5.5" />
                <div>
                  <h3 className="font-display font-extrabold text-base">Edit Data Kuitansi Resmi</h3>
                  <p className="text-[10px] text-white/80 font-medium">Ubah rincian pembayaran atau informasi tanda terima kuitansi</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingReceipt(null);
                }}
                className="p-1 text-white/70 hover:text-white hover:bg-white/15 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateReceipt} className="p-6 space-y-4">
              {/* Linked Alert */}
              {!editingReceipt.invoiceNumber.startsWith('KW-') && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-800 font-medium flex gap-2">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    Kuitansi ini **terhubung** dengan Invoice **{editingReceipt.invoiceNumber}**. Beberapa kolom pengenal terkunci demi keandalan data transaksi.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* No. Kuitansi */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">No. Kuitansi</label>
                  <input 
                    type="text"
                    required
                    disabled={!editingReceipt.invoiceNumber.startsWith('KW-')}
                    value={editReceiptNumber}
                    onChange={(e) => setEditReceiptNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Tanggal */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Tanggal Transaksi</label>
                  <input 
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Pembayar / Klien */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Penyetor / Klien</label>
                  <select 
                    required
                    value={editClient}
                    onChange={(e) => setEditClient(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Pilih Klien --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Nominal */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Jumlah Pembayaran</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                    <input 
                      type="number"
                      required
                      placeholder="Nominal"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Deskripsi Pembayaran */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Tujuan Pembayaran (Untuk Pembayaran)</label>
                <input 
                  type="text"
                  required
                  placeholder="Deskripsi jasa atau produk"
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Metode */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Metode Pembayaran</label>
                  <select 
                    value={editMethod}
                    onChange={(e) => setEditMethod(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all cursor-pointer"
                  >
                    <option value="Bank Transfer">🏛️ Bank Transfer</option>
                    <option value="Tunai / Cash">💵 Tunai / Cash</option>
                    <option value="QRIS">📱 QRIS / E-Wallet</option>
                    <option value="Giro">📝 Giro / Cek</option>
                  </select>
                </div>

                {/* Template */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Template Tampilan</label>
                  <select 
                    value={editTemplate}
                    onChange={(e) => setEditTemplate(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-bold text-gray-700 outline-none transition-all cursor-pointer"
                  >
                    <option value="corporate">Corporate Blue</option>
                    <option value="minimalist">Minimalist Charcoal</option>
                    <option value="premium">Premium Gold</option>
                  </select>
                </div>
              </div>

              {/* Catatan */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Catatan Tambahan / Keterangan</label>
                <textarea 
                  placeholder="Keterangan transaksi kuitansi..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-brand-primary rounded-xl text-xs font-semibold text-gray-700 outline-none transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingReceipt(null);
                  }}
                  className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-500 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors text-center"
                >
                  Simpan Perubahan ✔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-brand-dark/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-sm w-full overflow-hidden animate-scale-up text-center p-6 space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-display font-extrabold text-sm text-gray-800">Hapus Dokumen Kuitansi?</h3>
              <p className="text-xs text-gray-500">
                Tindakan ini tidak dapat dibatalkan. Menghapus kuitansi juga akan mengubah status invoice terkait jika terhubung.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingReceiptId('');
                }}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteReceipt}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
