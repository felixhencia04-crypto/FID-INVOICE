import { useState } from 'react';
import { 
  FileText, Search, Filter, Plus, Trash2, CheckCircle, 
  Send, Edit, Copy, Eye, Download, Calendar, ExternalLink,
  ChevronDown, FileSpreadsheet, RefreshCw, Printer, MessageSquare, Mail, MoreVertical
} from 'lucide-react';
import { Invoice, Client, UserProfile } from '../types';
import { showToast } from '../utils/toast';
import { formatCurrency, formatDateIndonesian } from '../utils';
import ConfirmModal from './ConfirmModal';
import WhatsAppModal from './WhatsAppModal';
import EmailModal from './EmailModal';
import PaymentModal from './PaymentModal';

interface InvoiceListProps {
  user: UserProfile;
  invoices: Invoice[];
  clients: Client[];
  onNavigate: (page: string) => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onSelectBatchInvoices?: (invoices: Invoice[]) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDuplicateInvoice: (invoice: Invoice) => void;
  onMarkAsPaid: (id: string, paymentMethod?: string, notes?: string, date?: string) => void;
  onDeleteInvoice: (id: string) => void;
}

export default function InvoiceList({
  user, invoices, clients, onNavigate, onSelectInvoice, onSelectBatchInvoices, onEditInvoice, onDuplicateInvoice, onMarkAsPaid, onDeleteInvoice
}: InvoiceListProps) {
  
  // States for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [clientFilter, setClientFilter] = useState<string>('Semua');
  const [sortBy, setSortBy] = useState<string>('newest'); // newest, oldest, amountAsc, amountDesc

  // Bulk actions selection state
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  // WhatsApp Modal State
  const [whatsAppModalState, setWhatsAppModalState] = useState<{
    isOpen: boolean;
    invoice: Invoice | null;
  }>({
    isOpen: false,
    invoice: null
  });

  // Email Modal State
  const [emailModalState, setEmailModalState] = useState<{
    isOpen: boolean;
    invoice: Invoice | null;
  }>({
    isOpen: false,
    invoice: null
  });

  // Confirmation Dialog State
  const [confirmDeleteState, setConfirmDeleteState] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    invoiceId?: string;
    message: string;
  }>({
    isOpen: false,
    type: 'single',
    message: ''
  });

  // Payment Modal State
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    invoice: Invoice | null;
  }>({
    isOpen: false,
    invoice: null
  });

  // Track active row dropdown menu ID
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Toggle selection for all row rows
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const visibleIds = filteredInvoices.map(inv => inv.id);
      setSelectedInvoiceIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    } else {
      const visibleIds = filteredInvoices.map(inv => inv.id);
      setSelectedInvoiceIds(prev => prev.filter(id => !visibleIds.includes(id)));
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds([...selectedInvoiceIds, id]);
    } else {
      setSelectedInvoiceIds(selectedInvoiceIds.filter(item => item !== id));
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'Lunas':
        return <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold">🟢 Lunas</span>;
      case 'Dikirim':
        return <span className="px-2.5 py-1 rounded-full bg-blue-50 text-brand-primary text-xs font-bold">🔵 Dikirim</span>;
      case 'Sebagian':
        return <span className="px-2.5 py-1 rounded-full bg-yellow-50 text-brand-gold text-xs font-bold">🟡 Sebagian</span>;
      case 'Jatuh Tempo':
        return <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold inline-flex items-center gap-1">🔴 Jatuh Tempo <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span></span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 text-xs font-bold">🔘 Draft</span>;
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Semua' || inv.status === statusFilter;
    const matchesClient = clientFilter === 'Semua' || inv.clientId === clientFilter;

    return matchesSearch && matchesStatus && matchesClient;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'amountAsc') {
      return a.total - b.total;
    } else if (sortBy === 'amountDesc') {
      return b.total - a.total;
    }
    return 0;
  });

  // Get currently visible selected invoices (intersection of filteredInvoices and selectedInvoiceIds)
  const visibleSelectedInvoices = filteredInvoices.filter(inv => selectedInvoiceIds.includes(inv.id));
  const visibleSelectedIds = visibleSelectedInvoices.map(inv => inv.id);

  // Export selected/filtered invoices to a beautifully structured PDF summary report
  const handleExportPDFBatch = () => {
    const invoicesToExport = visibleSelectedInvoices.length > 0 
      ? visibleSelectedInvoices
      : filteredInvoices;

    if (invoicesToExport.length === 0) return;
    
    if (onSelectBatchInvoices) {
      onSelectBatchInvoices(invoicesToExport);
    }
  };

  // Trigger bulk delete confirmation
  const handleBulkDelete = () => {
    if (visibleSelectedInvoices.length === 0) return;
    setConfirmDeleteState({
      isOpen: true,
      type: 'bulk',
      message: `Apakah Anda yakin ingin menghapus ${visibleSelectedInvoices.length} invoice terpilih secara permanen? Tindakan ini tidak dapat dibatalkan.`
    });
  };

  const executeBulkDelete = () => {
    visibleSelectedInvoices.forEach(inv => onDeleteInvoice(inv.id));
    setSelectedInvoiceIds(prev => prev.filter(id => !visibleSelectedIds.includes(id)));
    showToast('Invoice terpilih berhasil dihapus', 'success');
    setConfirmDeleteState(prev => ({ ...prev, isOpen: false }));
  };

  // Trigger single delete confirmation
  const triggerSingleDelete = (id: string, invoiceNumber: string) => {
    setConfirmDeleteState({
      isOpen: true,
      type: 'single',
      invoiceId: id,
      message: `Apakah Anda yakin ingin menghapus invoice ${invoiceNumber} secara permanen? Tindakan ini tidak dapat dibatalkan.`
    });
  };

  const executeSingleDelete = () => {
    if (confirmDeleteState.invoiceId) {
      onDeleteInvoice(confirmDeleteState.invoiceId);
      setSelectedInvoiceIds(prev => prev.filter(id => id !== confirmDeleteState.invoiceId));
      showToast('Invoice berhasil dihapus', 'success');
      setConfirmDeleteState(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Simulated bulk mark as paid
  const handleBulkMarkPaid = () => {
    if (visibleSelectedInvoices.length === 0) return;
    visibleSelectedInvoices.forEach(inv => onMarkAsPaid(inv.id));
    setSelectedInvoiceIds(prev => prev.filter(id => !visibleSelectedIds.includes(id)));
    showToast('Invoice terpilih berhasil dihapus', 'success');
    setConfirmDeleteState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="space-y-6 font-sans text-left">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-brand-dark">Daftar Invoice Penagihan</h1>
          <p className="text-xs text-gray-400 mt-1">Kelola dan pantau seluruh pembayaran klien Anda</p>
        </div>
        <button 
          onClick={() => onNavigate('create-invoice')}
          className="px-5 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-brand-primary/10 hover:scale-[1.02] transition-all cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4.5 h-4.5" />
          Buat Invoice Baru
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Search box */}
          <div className="md:col-span-4 relative">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari No. Invoice atau Nama Klien..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-brand-primary outline-none transition-all"
            />
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2.5 flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-brand-primary outline-none transition-all"
            >
              <option value="Semua">Semua Status</option>
              <option value="Draft">Draft</option>
              <option value="Dikirim">Dikirim</option>
              <option value="Lunas">Lunas</option>
              <option value="Sebagian">Sebagian</option>
              <option value="Jatuh Tempo">Jatuh Tempo</option>
            </select>
          </div>

          {/* Client Filter */}
          <div className="md:col-span-3">
            <select 
              value={clientFilter} 
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-brand-primary outline-none transition-all"
            >
              <option value="Semua">Semua Klien</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="md:col-span-2.5">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-brand-primary outline-none transition-all"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="amountDesc">Nominal Terbesar</option>
              <option value="amountAsc">Nominal Terkecil</option>
            </select>
          </div>

        </div>

        {/* Bulk Action Buttons (Visible only if items selected) */}
        {visibleSelectedIds.length > 0 && (
          <div className="p-3 bg-brand-primary-light/40 border border-brand-primary/10 rounded-xl flex items-center justify-between gap-4 text-xs">
            <span className="font-bold text-brand-primary flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              {visibleSelectedIds.length} Invoice Terpilih
            </span>
            <div className="flex gap-2">
              <button 
                onClick={handleBulkMarkPaid}
                className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold cursor-pointer"
              >
                Tandai Lunas
              </button>
              <button 
                onClick={handleBulkDelete}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Grid/Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        <div className="p-5 flex justify-between items-center border-b border-gray-50">
          <p className="text-xs text-gray-400 font-bold uppercase font-mono tracking-wider">Hasil Pencarian: {filteredInvoices.length} Dokumen</p>
          {filteredInvoices.length > 0 && (
            <button 
              onClick={handleExportPDFBatch}
              className="px-3.5 py-2 text-xs font-bold text-brand-primary hover:bg-brand-primary-light/10 border border-brand-primary/20 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-4.5 h-4.5" />
              {visibleSelectedIds.length > 0 
                ? `Ekspor Terpilih ke PDF (${visibleSelectedIds.length})` 
                : `Ekspor Semua ke PDF (${filteredInvoices.length})`
              }
            </button>
          )}
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-16 text-center text-gray-500 space-y-3">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">Tidak ada invoice yang cocok dengan kriteria pencarian.</p>
            <p className="text-xs text-gray-400">Silakan ubah kata kunci pencarian atau bersihkan filter Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase border-b border-gray-100">
                  <th className="px-6 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={visibleSelectedIds.length === filteredInvoices.length && filteredInvoices.length > 0}
                      className="rounded border-gray-300 text-brand-primary cursor-pointer" 
                    />
                  </th>
                  <th className="px-6 py-4">No. Invoice</th>
                  <th className="px-6 py-4">Klien</th>
                  <th className="px-6 py-4">Tanggal Buat</th>
                  <th className="px-6 py-4">Jatuh Tempo</th>
                  <th className="px-6 py-4 text-right">Nominal Tagihan</th>
                  <th className="px-6 py-4 text-center">Metode</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInvoices.map((inv) => {
                  const isChecked = selectedInvoiceIds.includes(inv.id);
                  const method = inv.paymentMethodInfo || 'Bank Transfer';
                  const isCash = method.toLowerCase().includes('tunai') || method.toLowerCase().includes('cash');
                  const isQris = method.toLowerCase().includes('qris') || method.toLowerCase().includes('wallet');
                  const isGiro = method.toLowerCase().includes('giro') || method.toLowerCase().includes('cek');
                  
                  return (
                    <tr key={inv.id} className={`hover:bg-gray-50/50 transition-colors ${isChecked ? 'bg-brand-primary-light/10' : ''}`}>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(inv.id, e.target.checked)}
                          className="rounded border-gray-300 text-brand-primary" 
                        />
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-brand-dark text-xs">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4 font-semibold text-brand-dark">{inv.clientName}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{formatDateIndonesian(inv.date)}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{formatDateIndonesian(inv.dueDate)}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-brand-dark">{formatCurrency(inv.total, inv.currency)}</td>
                      <td className="px-6 py-4 text-center">
                        {isCash ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-md border border-green-100 whitespace-nowrap">
                            💵 Tunai / Cash
                          </span>
                        ) : isQris ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-md border border-purple-100 whitespace-nowrap">
                            📱 QRIS / E-Wallet
                          </span>
                        ) : isGiro ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md border border-amber-100 whitespace-nowrap">
                            📝 Giro / Cek
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-100 whitespace-nowrap">
                            🏛️ Bank Transfer
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(inv.status)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 relative">
                          
                          {/* Main Action: Open Preview/Receipt */}
                          <button 
                            onClick={() => onSelectInvoice(inv)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs border border-brand-primary/10"
                            title="Pratinjau / Tanda Terima"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Buka</span>
                          </button>

                          {/* Secondary Action: Edit */}
                          <button 
                            onClick={() => onEditInvoice(inv)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 border border-gray-200 rounded-lg transition-colors cursor-pointer"
                            title="Edit Invoice"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* More actions dropdown */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownId(activeDropdownId === inv.id ? null : inv.id);
                              }}
                              className={`p-1.5 text-gray-500 hover:text-brand-dark hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer ${activeDropdownId === inv.id ? 'bg-gray-100 text-brand-dark' : ''}`}
                              title="Aksi Lainnya"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Menu Portal-like layout */}
                            {activeDropdownId === inv.id && (
                              <>
                                {/* Click overlay to close dropdown */}
                                <div 
                                  className="fixed inset-0 z-45 cursor-default" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdownId(null);
                                  }}
                                />
                                <div className="absolute right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-50 text-left font-sans text-[11px] animate-in fade-in-50 duration-100">
                                  <div className="px-3 py-1 text-[9px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
                                    Unduh & Cetak Berkas
                                  </div>
                                  
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdownId(null);
                                      sessionStorage.setItem('autoDownloadPdf', 'true');
                                      onSelectInvoice(inv);
                                    }}
                                    className="w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-2 transition-colors text-left font-semibold cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Simpan sebagai PDF</span>
                                  </button>

                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdownId(null);
                                      sessionStorage.setItem('autoPrint', 'true');
                                      onSelectInvoice(inv);
                                    }}
                                    className="w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 hover:text-emerald-600 flex items-center gap-2 transition-colors text-left font-semibold cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Cetak Langsung</span>
                                  </button>

                                  <div className="px-3 py-1 text-[9px] font-black text-gray-400 uppercase tracking-wider border-y border-gray-50 my-1 pt-2">
                                    Bagikan Ke Klien
                                  </div>

                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdownId(null);
                                      setWhatsAppModalState({ isOpen: true, invoice: inv });
                                    }}
                                    className="w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 hover:text-green-600 flex items-center gap-2 transition-colors text-left font-semibold cursor-pointer"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                                    <span>Kirim via WhatsApp</span>
                                  </button>

                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdownId(null);
                                      setEmailModalState({ isOpen: true, invoice: inv });
                                    }}
                                    className="w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 flex items-center gap-2 transition-colors text-left font-semibold cursor-pointer"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Kirim via Email</span>
                                  </button>

                                  <div className="px-3 py-1 text-[9px] font-black text-gray-400 uppercase tracking-wider border-y border-gray-50 my-1 pt-2">
                                    Sistem & Status
                                  </div>

                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdownId(null);
                                      onDuplicateInvoice(inv);
                                    }}
                                    className="w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 hover:text-slate-900 flex items-center gap-2 transition-colors text-left font-semibold cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Duplikat Invoice</span>
                                  </button>

                                  {inv.status !== 'Lunas' && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveDropdownId(null);
                                        setPaymentModalState({ isOpen: true, invoice: inv });
                                      }}
                                      className="w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 hover:text-green-600 flex items-center gap-2 transition-colors text-left font-semibold cursor-pointer"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                      <span>Tandai Lunas</span>
                                    </button>
                                  )}

                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdownId(null);
                                      triggerSingleDelete(inv.id, inv.invoiceNumber);
                                    }}
                                    className="w-full px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors text-left font-bold cursor-pointer border-t border-gray-100 mt-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus Permanen</span>
                                  </button>

                                </div>
                              </>
                            )}
                          </div>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      <ConfirmModal
        isOpen={confirmDeleteState.isOpen}
        onClose={() => setConfirmDeleteState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDeleteState.type === 'bulk' ? executeBulkDelete : executeSingleDelete}
        title={confirmDeleteState.type === 'bulk' ? 'Hapus Invoice Beruntun' : 'Hapus Invoice'}
        message={confirmDeleteState.message}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
      />

      {whatsAppModalState.isOpen && whatsAppModalState.invoice && (
        <WhatsAppModal
          isOpen={whatsAppModalState.isOpen}
          onClose={() => setWhatsAppModalState({ isOpen: false, invoice: null })}
          invoice={whatsAppModalState.invoice}
          client={clients.find(c => c.id === whatsAppModalState.invoice?.clientId)}
          user={user}
        />
      )}

      {emailModalState.isOpen && emailModalState.invoice && (
        <EmailModal
          isOpen={emailModalState.isOpen}
          onClose={() => setEmailModalState({ isOpen: false, invoice: null })}
          invoice={emailModalState.invoice}
          client={clients.find(c => c.id === emailModalState.invoice?.clientId)}
          user={user}
        />
      )}

      <PaymentModal
        isOpen={paymentModalState.isOpen}
        onClose={() => setPaymentModalState({ isOpen: false, invoice: null })}
        invoice={paymentModalState.invoice}
        onConfirm={(invoiceId, paymentMethod, notes, date) => {
          onMarkAsPaid(invoiceId, paymentMethod, notes, date);
        }}
      />

    </div>
  );
}
