import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, User, ShoppingBag, Plus, Trash2, 
  ChevronRight, ChevronLeft, Save, Eye, Send, Printer, 
  Percent, DollarSign, Check, Landmark, AlertCircle, RefreshCw
} from 'lucide-react';
import { Invoice, Client, Product, InvoiceItem, UserProfile } from '../types';
import { formatCurrency, terbilang, calculateDueDate, generateRandomId } from '../utils';
import { preloadCompanyAssets } from '../utils/assetHelper';
import { showToast } from '../utils/toast';

interface CreateInvoiceProps {
  user: UserProfile;
  clients: Client[];
  products: Product[];
  onAddClient: (client: Client) => void;
  onAddProduct: (product: Product) => void;
  onSaveInvoice: (invoice: Invoice) => void;
  onNavigate: (page: string) => void;
  initialInvoiceToEdit?: Invoice | null;
  onFeatureBlocked?: (featureName: string) => void;
}

export default function CreateInvoice({ 
  user, clients, products, onAddClient, onAddProduct, onSaveInvoice, onNavigate, initialInvoiceToEdit, onFeatureBlocked 
}: CreateInvoiceProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const isExpired = user.subscription.status === 'expired' || new Date(user.subscription.expiryDate) < new Date();
  
  // Quick clients / products modals
  const [quickClientModal, setQuickClientModal] = useState(false);
  const [quickProductModal, setQuickProductModal] = useState(false);
  
  // Quick Client form state
  const [qcName, setQcName] = useState('');
  const [qcBusiness, setQcBusiness] = useState('');
  const [qcEmail, setQcEmail] = useState('');
  const [qcPhone, setQcPhone] = useState('');
  const [qcAddress, setQcAddress] = useState('');

  // Quick Product form state
  const [qpName, setQpName] = useState('');
  const [qpPrice, setQpPrice] = useState(0);
  const [qpUnit, setQpUnit] = useState('Pcs');
  const [qpDesc, setQpDesc] = useState('');

  // Step 1: Info Dasar states
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [invoiceType, setInvoiceType] = useState<Invoice['type']>('Commercial Invoice');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [currency, setCurrency] = useState<Invoice['currency']>('IDR');

  // Step 2: Line Items states
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [hasTax, setHasTax] = useState(false); // PPN 11%
  const [hasTax2, setHasTax2] = useState(false); // PPh 2%
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [paymentMethodInfo, setPaymentMethodInfo] = useState<string>('Bank Transfer');

  // Step 3: Template state
  const [templateId, setTemplateId] = useState<Invoice['templateId']>('corporate');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preload Assets State
  const [preloadedLogoBase64, setPreloadedLogoBase64] = useState<string>('');
  const [preloadedSignatureBase64, setPreloadedSignatureBase64] = useState<string>('');
  const [preloadedStampBase64, setPreloadedStampBase64] = useState<string>('');
  const [isPreloadingAssets, setIsPreloadingAssets] = useState(true);

  useEffect(() => {
    let active = true;
    const loadImages = async () => {
      console.log('[CreateInvoice] Preloading company assets...');
      try {
        const assets = await preloadCompanyAssets(user);
        if (active) {
          setPreloadedLogoBase64(assets.businessLogo);
          setPreloadedSignatureBase64(assets.signatureImage);
          setPreloadedStampBase64(assets.stampImage);
        }
      } catch (e) {
        console.error('[CreateInvoice] Error preloading profile assets:', e);
      } finally {
        if (active) {
          setIsPreloadingAssets(false);
        }
      }
    };
    loadImages();
    return () => {
      active = false;
    };
  }, [user.businessLogo, user.signatureImage, user.stampImage]);


  // Load defaults or edit states
  useEffect(() => {
    if (initialInvoiceToEdit) {
      setInvoiceNumber(initialInvoiceToEdit.invoiceNumber);
      setInvoiceDate(initialInvoiceToEdit.date);
      setDueDate(initialInvoiceToEdit.dueDate);
      setInvoiceType(initialInvoiceToEdit.type);
      setSelectedClientId(initialInvoiceToEdit.clientId);
      setCurrency(initialInvoiceToEdit.currency);
      setItems(initialInvoiceToEdit.items);
      setGlobalDiscount(initialInvoiceToEdit.globalDiscountPercent);
      setHasTax(initialInvoiceToEdit.hasTax);
      setHasTax2(initialInvoiceToEdit.hasTax2);
      setNotes(initialInvoiceToEdit.notes || '');
      setTerms(initialInvoiceToEdit.terms || '');
      setTemplateId(initialInvoiceToEdit.templateId);
      setPaymentMethodInfo(initialInvoiceToEdit.paymentMethodInfo || 'Bank Transfer');
    } else {
      // Auto-generate invoice number
      const countStr = localStorage.getItem(`fid_invoice_count_${user.id}`) || '1';
      const count = parseInt(countStr);
      const currentYear = new Date().getFullYear();
      const paddedNum = String(count).padStart(4, '0');
      setInvoiceNumber(`FID-${currentYear}-${paddedNum}`);
      
      const today = new Date().toISOString().split('T')[0];
      setInvoiceDate(today);
      setDueDate(calculateDueDate(today, 15)); // Default Net 15
      setItems([
        {
          id: generateRandomId(),
          description: 'Contoh Item Transaksi Cerdas',
          qty: 1,
          unit: 'Paket',
          price: 1500000,
          discountPercent: 0,
          subtotal: 1500000
        }
      ]);
      setNotes('Terima kasih atas kerja sama Anda.');
      setTerms(user.bankName ? `Pembayaran ditransfer ke rekening:\n${user.bankName} - ${user.bankAccountNumber}\na/n ${user.bankAccountHolder || user.businessName}` : 'Pembayaran penuh.');
    }
  }, [initialInvoiceToEdit, user]);

  const handleNetDaysSelect = (days: number) => {
    if (invoiceDate) {
      setDueDate(calculateDueDate(invoiceDate, days));
    }
  };

  // Dynamic calculations for totals
  const itemsSubtotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);
  const discountAmount = Math.round((globalDiscount / 100) * itemsSubtotal);
  const netSubtotal = itemsSubtotal - discountAmount;
  
  const taxAmount = hasTax ? Math.round(0.11 * netSubtotal) : 0; // PPN 11%
  const tax2Amount = hasTax2 ? Math.round(0.02 * netSubtotal) : 0; // PPh 2%
  
  // Total = NetSubtotal + PPN - PPh (withholding tax reduces physical payout)
  // or + PPh if it's additional. Indonesian standard: PPh 23 is a deduction. 
  // Let's do: total = netSubtotal + PPN - PPh
  const total = netSubtotal + taxAmount - tax2Amount;
  const spelling = terbilang(total, currency);

  // Item additions & modifications
  const addEmptyItem = () => {
    const newItem: InvoiceItem = {
      id: generateRandomId(),
      description: '',
      qty: 1,
      unit: 'Pcs',
      price: 0,
      discountPercent: 0,
      subtotal: 0
    };
    setItems([...items, newItem]);
  };

  const addFromCatalog = (product: Product) => {
    const newItem: InvoiceItem = {
      id: generateRandomId(),
      description: `${product.name} - ${product.description}`,
      qty: 1,
      unit: product.unit,
      price: product.price,
      discountPercent: 0,
      subtotal: product.price
    };
    setItems([...items, newItem]);
    setQuickProductModal(false);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Recalculate subtotal
        const qtyNum = field === 'qty' ? Number(value) : updatedItem.qty;
        const priceNum = field === 'price' ? Number(value) : updatedItem.price;
        const discNum = field === 'discountPercent' ? Number(value) : updatedItem.discountPercent;
        
        const lineTotal = qtyNum * priceNum;
        const lineDiscount = (discNum / 100) * lineTotal;
        updatedItem.subtotal = lineTotal - lineDiscount;
        
        return updatedItem;
      }
      return item;
    });
    setItems(updated);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // Submit quick client creation
  const handleQuickClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired && onFeatureBlocked) {
      onFeatureBlocked('Penambahan Klien Baru');
      return;
    }
    if (!qcName) return;
    const newClient: Client = {
      id: 'client_' + Math.random().toString(36).substring(2, 9),
      name: qcName,
      businessName: qcBusiness,
      email: qcEmail,
      phone: qcPhone,
      address: qcAddress,
      createdAt: new Date().toISOString()
    };
    onAddClient(newClient);
    setSelectedClientId(newClient.id);
    
    // reset form
    setQcName('');
    setQcBusiness('');
    setQcEmail('');
    setQcPhone('');
    setQcAddress('');
    setQuickClientModal(false);
  };

  // Submit quick product creation
  const handleQuickProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired && onFeatureBlocked) {
      onFeatureBlocked('Penambahan Produk atau Jasa Baru');
      return;
    }
    if (!qpName) return;
    const newProd: Product = {
      id: 'prod_' + Math.random().toString(36).substring(2, 9),
      name: qpName,
      price: qpPrice,
      unit: qpUnit,
      description: qpDesc
    };
    onAddProduct(newProd);
    addFromCatalog(newProd);
  };

  const handleSave = (status: Invoice['status']) => {
    if (isExpired && !initialInvoiceToEdit) {
      if (onFeatureBlocked) {
        onFeatureBlocked(invoiceType === 'Credit Note' ? 'Pembuatan Nota Kredit Baru' : 'Pembuatan Invoice Baru');
      }
      return;
    }

    if (!selectedClientId) {
      showToast('Pilih klien terlebih dahulu.', 'warning');
      return;
    }
    if (items.length === 0 || items.some(it => !it.description.trim())) {
      showToast('Tolong lengkapi semua item deskripsi transaksi.', 'warning');
      return;
    }
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      const clientObj = clients.find(c => c.id === selectedClientId);
      const invoiceData: Invoice = {
        id: initialInvoiceToEdit?.id || 'inv_' + Math.random().toString(36).substring(2, 9),
        invoiceNumber,
        userId: user.id,
        clientId: selectedClientId,
        clientName: clientObj?.name || 'Klien Baru',
        date: invoiceDate,
        dueDate,
        type: invoiceType,
        items,
        globalDiscountPercent: globalDiscount,
        hasTax,
        hasTax2,
        subtotal: itemsSubtotal,
        discountAmount,
        taxAmount,
        tax2Amount,
        total,
        spelledOut: spelling,
        status,
        notes,
        terms,
        templateId,
        currency,
        paymentMethodInfo,
        createdAt: initialInvoiceToEdit?.createdAt || new Date().toISOString()
      };

      onSaveInvoice(invoiceData);
      
      // Increment invoice sequence count for user
      if (!initialInvoiceToEdit) {
        const countStr = localStorage.getItem(`fid_invoice_count_${user.id}`) || '1';
        localStorage.setItem(`fid_invoice_count_${user.id}`, String(parseInt(countStr) + 1));
      }

      setIsSubmitting(false);
      onNavigate('invoice-list');
    }, 1000);
  };

  // Find currently selected client
  const currentClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans pb-16">
      
      {/* Page Title with Steps Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-brand-dark">
            {initialInvoiceToEdit ? 'Ubah Invoice' : 'Buat Invoice Baru'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">Susun invoice penagihan profesional Anda</p>
        </div>
        
        {/* Step Wizard Header */}
        <div className="flex items-center gap-2 text-xs font-bold font-display">
          <button 
            onClick={() => setStep(1)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${step === 1 ? 'bg-brand-primary text-white' : 'bg-gray-50 text-gray-500'}`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 text-center leading-5 text-[10px]">1</span>
            Info Dasar
          </button>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <button 
            disabled={!selectedClientId}
            onClick={() => setStep(2)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${step === 2 ? 'bg-brand-primary text-white' : 'bg-gray-50 text-gray-500 disabled:opacity-50'}`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 text-center leading-5 text-[10px]">2</span>
            Detail Item
          </button>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <button 
            disabled={!selectedClientId || items.length === 0}
            onClick={() => setStep(3)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${step === 3 ? 'bg-brand-primary text-white' : 'bg-gray-50 text-gray-500 disabled:opacity-50'}`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 text-center leading-5 text-[10px]">3</span>
            Pratinjau
          </button>
        </div>
      </div>

      {/* STEP 1: Info Dasar */}
      {step === 1 && (
        <div className="grid lg:grid-cols-12 gap-8 text-left">
          {/* Main Info Columns */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-50">1. Data Dasar Dokumen</h3>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">No. Invoice</label>
                <input 
                  type="text" 
                  value={invoiceNumber} 
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Jenis Invoice</label>
                <select 
                  value={invoiceType} 
                  onChange={(e) => setInvoiceType(e.target.value as Invoice['type'])}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                >
                  <option value="Commercial Invoice">Commercial Invoice (Utama)</option>
                  <option value="Tax Invoice">Tax Invoice (Faktur Pajak)</option>
                  <option value="Proforma">Proforma Invoice</option>
                  <option value="Credit Note">Credit Note (Nota Kredit)</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Tanggal Invoice</label>
                <input 
                  type="date" 
                  value={invoiceDate} 
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Tanggal Jatuh Tempo</label>
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                />
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => handleNetDaysSelect(7)} className="px-2 py-1 text-[10px] font-bold bg-gray-50 hover:bg-gray-100 text-gray-600 rounded">Net 7</button>
                  <button type="button" onClick={() => handleNetDaysSelect(15)} className="px-2 py-1 text-[10px] font-bold bg-gray-50 hover:bg-gray-100 text-gray-600 rounded">Net 15</button>
                  <button type="button" onClick={() => handleNetDaysSelect(30)} className="px-2 py-1 text-[10px] font-bold bg-gray-50 hover:bg-gray-100 text-gray-600 rounded">Net 30</button>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Pilih Mata Uang</label>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value as Invoice['currency'])}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all cursor-pointer"
                >
                  <option value="IDR">Rupiah Indonesia (IDR)</option>
                  <option value="USD">Dolar Amerika Serikat (USD)</option>
                  <option value="SGD">Dolar Singapura (SGD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Metode Pembayaran (Default)</label>
                <select 
                  value={paymentMethodInfo} 
                  onChange={(e) => setPaymentMethodInfo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all cursor-pointer"
                >
                  <option value="Bank Transfer">Bank Transfer (Transfer Bank)</option>
                  <option value="Tunai">Tunai / Cash</option>
                  <option value="QRIS">QRIS / E-Wallet</option>
                  <option value="Giro">Giro / Cek</option>
                </select>
              </div>
            </div>
          </div>

          {/* Client Selector Column */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-50">2. Informasi Klien</h3>
              <p className="text-xs text-gray-400 mt-1.5">Tujukan invoice ini ke siapa</p>
            </div>

            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Pilih Klien</label>
                  <select 
                    value={selectedClientId} 
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                  >
                    <option value="">-- Pilih Klien Terdaftar --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.businessName || 'Freelance'})</option>
                    ))}
                  </select>
                </div>

                <div className="relative flex py-2 items-center text-xs text-gray-400">
                  <div className="flex-grow border-t border-gray-150"></div>
                  <span className="flex-shrink mx-3 font-semibold">atau</span>
                  <div className="flex-grow border-t border-gray-150"></div>
                </div>

                <button 
                  type="button" 
                  onClick={() => setQuickClientModal(true)}
                  className="w-full py-2.5 bg-brand-primary-light hover:bg-brand-primary/10 text-brand-primary text-xs font-bold rounded-xl border border-dashed border-brand-primary/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Klien Baru
                </button>
              </div>

              {currentClient && (
                <div className="p-4 rounded-xl bg-brand-light/40 border border-brand-primary/5 text-xs text-left space-y-2 mt-4">
                  <p className="font-bold text-brand-dark uppercase tracking-wider text-[10px]">Detail Penerima Tagihan</p>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{currentClient.name}</p>
                    {currentClient.businessName && <p className="text-gray-500">{currentClient.businessName}</p>}
                  </div>
                  <p className="text-gray-500">📧 {currentClient.email}</p>
                  <p className="text-gray-500">📞 {currentClient.phone}</p>
                  <p className="text-gray-400 leading-relaxed pt-1 border-t border-gray-100">{currentClient.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Detail Item Penjualan */}
      {step === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6 text-left">
          <div className="flex justify-between items-center pb-3 border-b border-gray-50">
            <div>
              <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider">3. Baris Item Transaksi</h3>
              <p className="text-xs text-gray-400 mt-0.5">Masukkan seluruh detail layanan atau produk yang ditagih</p>
            </div>
            
            <button 
              type="button" 
              onClick={() => setQuickProductModal(true)}
              className="px-3.5 py-1.5 bg-brand-primary-light hover:bg-brand-primary text-brand-primary hover:text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              Pilih dari Katalog
            </button>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase border-b border-gray-100">
                  <th className="px-4 py-3 text-left w-12">#</th>
                  <th className="px-4 py-3 text-left">Deskripsi Transaksi</th>
                  <th className="px-4 py-3 text-center w-24">Jumlah</th>
                  <th className="px-4 py-3 text-center w-28">Satuan</th>
                  <th className="px-4 py-3 text-right w-44">Harga Satuan ({currency})</th>
                  <th className="px-4 py-3 text-center w-24">Diskon %</th>
                  <th className="px-4 py-3 text-right w-36">Subtotal</th>
                  <th className="px-4 py-3 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item, idx) => (
                  <tr key={item.id} className="align-middle">
                    <td className="px-4 py-3 font-mono font-bold text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <input 
                        type="text" 
                        value={item.description} 
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="e.g. Jasa Desain UI/UX Landing Page" 
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-brand-primary"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="number" 
                        min="1"
                        value={item.qty} 
                        onChange={(e) => updateItem(item.id, 'qty', Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-center outline-none focus:border-brand-primary font-mono font-bold"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select 
                        value={item.unit} 
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-brand-primary"
                      >
                        <option value="Pcs">Pcs</option>
                        <option value="Paket">Paket</option>
                        <option value="Jam">Jam</option>
                        <option value="Hari">Hari</option>
                        <option value="Bulan">Bulan</option>
                        <option value="Proyek">Proyek</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input 
                        type="number" 
                        min="0"
                        value={item.price} 
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-right outline-none focus:border-brand-primary font-mono font-bold"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={item.discountPercent} 
                        onChange={(e) => updateItem(item.id, 'discountPercent', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-center outline-none focus:border-brand-primary font-mono"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-brand-dark">
                      {formatCurrency(item.subtotal, currency)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        type="button" 
                        disabled={items.length === 1}
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button 
            type="button" 
            onClick={addEmptyItem}
            className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-brand-dark text-xs font-bold rounded-xl border border-dashed border-gray-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-brand-primary" />
            Tambah Baris Transaksi Baru
          </button>

          {/* Subtotals & Taxes calculation */}
          <div className="grid lg:grid-cols-12 gap-8 pt-6 border-t border-gray-100">
            {/* Notes and terms column */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Catatan Khusus (Untuk Klien)</label>
                <textarea 
                  rows={2} 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Pembayaran DP 50% paling lambat H+3..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-brand-primary outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Syarat & Ketentuan / Instruksi Pembayaran</label>
                <textarea 
                  rows={3} 
                  value={terms} 
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="e.g. Pembayaran ditransfer ke rekening BCA..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-brand-primary outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Calculations column */}
            <div className="lg:col-span-5 p-5 bg-brand-light/30 border border-gray-100 rounded-2xl text-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Subtotal Item:</span>
                <span className="font-mono font-bold text-gray-700">{formatCurrency(itemsSubtotal, currency)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-150">
                <span className="text-gray-500 font-medium flex items-center gap-1">Diskon Global (%):</span>
                <div className="flex items-center gap-1.5 w-20">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={globalDiscount}
                    onChange={(e) => setGlobalDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-1.5 py-1 border border-gray-200 rounded font-mono font-bold text-center text-xs"
                  />
                  <span>%</span>
                </div>
              </div>

              {globalDiscount > 0 && (
                <div className="flex justify-between items-center text-red-600">
                  <span>Potongan Diskon Global:</span>
                  <span className="font-mono font-bold">-{formatCurrency(discountAmount, currency)}</span>
                </div>
              )}

              {/* Tax togglers */}
              <div className="pt-2 border-t border-dashed border-gray-150 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-600">
                    <input 
                      type="checkbox" 
                      checked={hasTax} 
                      onChange={(e) => setHasTax(e.target.checked)}
                      className="rounded border-gray-300 text-brand-primary" 
                    />
                    <span>Terapkan PPN (11%)</span>
                  </label>
                  {hasTax && <span className="font-mono font-bold text-gray-700">+{formatCurrency(taxAmount, currency)}</span>}
                </div>

                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-600">
                    <input 
                      type="checkbox" 
                      checked={hasTax2} 
                      onChange={(e) => setHasTax2(e.target.checked)}
                      className="rounded border-gray-300 text-brand-primary" 
                    />
                    <span>Terapkan PPh 23 (2% Potongan)</span>
                  </label>
                  {hasTax2 && <span className="font-mono font-bold text-red-600">-{formatCurrency(tax2Amount, currency)}</span>}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-sm font-extrabold text-brand-dark">
                <span>TOTAL AKHIR TAGIHAN:</span>
                <span className="font-mono text-base text-brand-primary">{formatCurrency(total, currency)}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white/70 border border-brand-primary/5 italic text-brand-primary text-[10px] text-left leading-relaxed">
                <strong>Terbilang:</strong> {spelling}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Pratinjau & Template Selector */}
      {step === 3 && (
        <div className="grid lg:grid-cols-12 gap-8 text-left">
          {/* Template Picker (Left) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider pb-3 border-b border-gray-50">4. Desain & Penerbitan</h3>
              <p className="text-xs text-gray-400 mt-1.5">Pilih tampilan invoice resmi Anda</p>
            </div>

            {/* Visual template options */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-600 uppercase">Pilih Template</label>
              
              {/* Option 1: Corporate Blue */}
              <div 
                onClick={() => setTemplateId('corporate')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${templateId === 'corporate' ? 'border-brand-primary bg-brand-primary-light/10' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-brand-dark">Corporate Blue</span>
                  {templateId === 'corporate' && <span className="w-2 h-2 rounded-full bg-brand-primary"></span>}
                </div>
                <div className="mt-2 h-10 w-full bg-slate-50 border border-gray-100 rounded flex flex-col justify-between p-1.5 text-[6px] text-gray-300">
                  <div className="w-1/3 h-1 bg-brand-primary"></div>
                  <div className="space-y-0.5">
                    <div className="w-full h-1 bg-gray-100"></div>
                    <div className="w-5/6 h-1 bg-gray-100"></div>
                  </div>
                </div>
              </div>

              {/* Option 2: Minimalist White */}
              <div 
                onClick={() => setTemplateId('minimalist')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${templateId === 'minimalist' ? 'border-brand-primary bg-brand-primary-light/10' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-brand-dark">Minimalist White</span>
                  {templateId === 'minimalist' && <span className="w-2 h-2 rounded-full bg-brand-primary"></span>}
                </div>
                <div className="mt-2 h-10 w-full bg-white border border-gray-100 rounded flex flex-col justify-between p-1.5 text-[6px] text-gray-300">
                  <div className="w-1/4 h-1 bg-gray-600"></div>
                  <div className="space-y-0.5">
                    <div className="w-full h-1 bg-gray-100"></div>
                    <div className="w-full h-1 bg-gray-100"></div>
                  </div>
                </div>
              </div>

              {/* Option 3: Premium Gold */}
              <div 
                onClick={() => setTemplateId('premium')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${templateId === 'premium' ? 'border-brand-primary bg-brand-primary-light/10' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-brand-dark">Premium Gold Accent</span>
                  {templateId === 'premium' && <span className="w-2 h-2 rounded-full bg-brand-primary"></span>}
                </div>
                <div className="mt-2 h-10 w-full bg-slate-900 border border-gray-100 rounded flex flex-col justify-between p-1.5 text-[6px] text-gray-300">
                  <div className="w-1/3 h-1 bg-brand-gold"></div>
                  <div className="space-y-0.5">
                    <div className="w-full h-1 bg-white/20"></div>
                    <div className="w-2/3 h-1 bg-white/20"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions block */}
            <div className="pt-6 border-t border-gray-50 space-y-3">
              <button 
                type="button" 
                onClick={() => handleSave('Draft')}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-brand-dark font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Simpan sebagai Draft
              </button>
              
              <button 
                type="button" 
                onClick={() => handleSave('Dikirim')}
                className="w-full py-3 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs rounded-xl shadow-md shadow-brand-primary/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Terbitkan & Kirim Ke Klien
              </button>

              <button 
                type="button" 
                onClick={() => handleSave('Lunas')}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Terbitkan & Langsung Lunas
              </button>
            </div>
          </div>

          {/* Simulated A4 Paper (Right) */}
          <div className="lg:col-span-8 bg-white p-8 rounded-2xl border border-gray-200 shadow-lg relative min-h-[700px] flex flex-col justify-between text-xs max-w-2xl mx-auto overflow-hidden">
            
            {/* Watermark paid (simulated logic) */}
            <div className="absolute top-1/3 left-1/4 transform -rotate-45 text-gray-100 text-7xl font-black font-display tracking-widest uppercase pointer-events-none select-none select-none opacity-20">
              PREVIEW ONLY
            </div>

            {/* Core A4 contents based on Template Style */}
            <div className="space-y-6">
              
              {/* Style Header */}
              {templateId === 'corporate' && (
                <div className="flex justify-between items-start border-b-2 border-brand-primary pb-4">
                  <div>
                    {user.businessLogo ? (
                      <img src={preloadedLogoBase64 || user.businessLogo} alt="Logo" className="h-10 max-w-[140px] object-contain mb-2" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-brand-primary flex items-center justify-center font-bold text-white text-xs mb-2">LOGO</div>
                    )}
                    <h2 className="text-lg font-black text-brand-dark uppercase tracking-tight">{user.businessName}</h2>
                    <p className="text-[10px] text-gray-500">{user.address || 'Alamat Perusahaan Belum Dilengkapi'}</p>
                    {user.taxNumber && <p className="text-[10px] text-gray-500 font-mono">NPWP: {user.taxNumber}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black tracking-widest text-brand-primary uppercase">INVOICE RESMI</span>
                    <h3 className="text-sm font-bold font-mono text-gray-800 mt-1">{invoiceNumber || 'FID-XXXX-XXXX'}</h3>
                  </div>
                </div>
              )}

              {templateId === 'minimalist' && (
                <div className="flex justify-between items-start border-b border-gray-150 pb-4">
                  <div>
                    {user.businessLogo ? (
                      <img src={preloadedLogoBase64 || user.businessLogo} alt="Logo" className="h-10 max-w-[140px] object-contain mb-2" />
                    ) : null}
                    <h2 className="text-base font-extrabold text-gray-800 tracking-tight">{user.businessName}</h2>
                    <p className="text-[9px] text-gray-400 mt-0.5">{user.address}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">NO. DOKUMEN</p>
                    <p className="text-sm font-mono font-bold text-gray-800">{invoiceNumber}</p>
                  </div>
                </div>
              )}

              {templateId === 'premium' && (
                <div className="space-y-3 pb-4 border-b border-gray-100">
                  <div className="h-2 bg-brand-gold -mx-8 -mt-8"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      {user.businessLogo ? (
                        <img src={preloadedLogoBase64 || user.businessLogo} alt="Logo" className="h-10 max-w-[140px] object-contain mb-2" />
                      ) : null}
                      <h2 className="text-lg font-extrabold text-slate-800 font-display tracking-tight">{user.businessName}</h2>
                      <p className="text-[10px] text-gray-500">{user.address}</p>
                    </div>
                    <div className="text-right bg-slate-900 text-white p-3 rounded-xl">
                      <p className="text-[8px] font-mono font-bold text-brand-gold tracking-widest uppercase">Tagihan Invoice</p>
                      <p className="text-xs font-mono font-bold mt-1">{invoiceNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sender & Receiver metadata */}
              <div className="grid grid-cols-2 gap-4 text-[10px]">
                <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                  <p className="text-[8px] font-bold text-gray-400 uppercase">Ditagihkan Oleh:</p>
                  <p className="font-bold text-gray-800">{user.fullName}</p>
                  <p className="text-gray-500">{user.email}</p>
                  <p className="text-gray-500">{user.phone}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                  <p className="text-[8px] font-bold text-gray-400 uppercase">Ditujukan Kepada:</p>
                  {currentClient ? (
                    <>
                      <p className="font-bold text-gray-800">{currentClient.name}</p>
                      {currentClient.businessName && <p className="text-gray-500">{currentClient.businessName}</p>}
                      <p className="text-gray-500">{currentClient.email}</p>
                      <p className="text-gray-400 line-clamp-1">{currentClient.address}</p>
                    </>
                  ) : (
                    <p className="text-red-500 italic">⚠️ Penerima belum ditentukan.</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="flex justify-between text-[10px] text-gray-600 border-y border-gray-50 py-2.5 px-1">
                <span><strong>Tanggal Invoice:</strong> {invoiceDate || '-'}</span>
                <span><strong>Mata Uang:</strong> {currency}</span>
                <span className="text-red-600"><strong>Tanggal Jatuh Tempo:</strong> {dueDate || '-'}</span>
              </div>

              {/* Invoice Lines */}
              <div className="space-y-2">
                <div className="bg-gray-50 p-2.5 rounded-lg flex justify-between font-bold text-gray-500 text-[9px] uppercase tracking-wider">
                  <span className="w-1/2">Deskripsi Layanan / Produk</span>
                  <span className="w-12 text-center">Qty</span>
                  <span className="w-24 text-right">Harga</span>
                  <span className="w-24 text-right">Total</span>
                </div>

                <div className="divide-y divide-gray-50 text-[10px] space-y-2">
                  {items.map((it) => (
                    <div key={it.id} className="flex justify-between py-2 items-center">
                      <div className="w-1/2 text-left">
                        <p className="font-bold text-gray-800">{it.description || 'Layanan Tanpa Nama'}</p>
                        {it.discountPercent > 0 && <p className="text-[9px] text-red-500">Potongan Diskon: {it.discountPercent}%</p>}
                      </div>
                      <span className="w-12 text-center text-gray-600">{it.qty} {it.unit}</span>
                      <span className="w-24 text-right font-mono text-gray-600">{formatCurrency(it.price, currency)}</span>
                      <span className="w-24 text-right font-mono font-bold text-gray-800">{formatCurrency(it.subtotal, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtotals calculation */}
              <div className="border-t border-gray-100 pt-4 flex flex-col items-end text-[10px] space-y-1.5">
                <div className="flex justify-between w-64">
                  <span className="text-gray-500">Subtotal Item:</span>
                  <span className="font-mono text-gray-800">{formatCurrency(itemsSubtotal, currency)}</span>
                </div>
                {globalDiscount > 0 && (
                  <div className="flex justify-between w-64 text-red-600">
                    <span>Diskon Global ({globalDiscount}%):</span>
                    <span className="font-mono">-{formatCurrency(discountAmount, currency)}</span>
                  </div>
                )}
                {hasTax && (
                  <div className="flex justify-between w-64">
                    <span>PPN (11%):</span>
                    <span className="font-mono text-gray-800">+{formatCurrency(taxAmount, currency)}</span>
                  </div>
                )}
                {hasTax2 && (
                  <div className="flex justify-between w-64 text-red-600">
                    <span>PPh 23 (2% Potongan):</span>
                    <span className="font-mono">-{formatCurrency(tax2Amount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between w-64 font-bold text-sm text-brand-dark pt-2 border-t border-gray-200">
                  <span>Grand Total Tagihan:</span>
                  <span className="font-mono text-brand-primary text-base">{formatCurrency(total, currency)}</span>
                </div>
                <div className="flex justify-between w-64 text-gray-500 text-[10px] pt-1 border-t border-gray-100 border-dashed">
                  <span>Jumlah Dibayar (Amount Paid):</span>
                  <span className="font-mono text-green-600 font-bold">
                    {formatCurrency(initialInvoiceToEdit?.status === 'Lunas' ? total : 0, currency)}
                  </span>
                </div>
                <div className="flex justify-between w-64 font-bold text-xs pt-1 border-t border-gray-100">
                  <span className="text-gray-700">Sisa Tagihan (Amount Due):</span>
                  <span className={`font-mono ${initialInvoiceToEdit?.status === 'Lunas' ? 'text-green-600 font-bold' : 'text-red-600 font-extrabold'}`}>
                    {formatCurrency(initialInvoiceToEdit?.status === 'Lunas' ? 0 : total, currency)}
                  </span>
                </div>
              </div>

              {/* Terbilang */}
              <div className="bg-brand-primary-light/10 p-3 rounded-lg border border-brand-primary/5 italic text-brand-primary text-[10px] text-left leading-relaxed">
                <strong>Terbilang:</strong> {spelling}
              </div>

              {/* Terms & notes */}
              <div className="grid grid-cols-2 gap-4 text-[9px] text-left pt-4 border-t border-gray-100">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="font-bold text-gray-400 uppercase text-[8px]">Catatan Penting:</p>
                    <p className="text-gray-500 leading-relaxed whitespace-pre-wrap">{notes || 'Tidak ada catatan khusus.'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-gray-400 uppercase text-[8px]">Syarat Pembayaran:</p>
                    <p className="text-gray-500 leading-relaxed whitespace-pre-wrap">{terms || 'Tidak ada instruksi khusus.'}</p>
                  </div>
                </div>
                <div className="text-center space-y-2 flex flex-col items-center justify-end">
                  <p className="text-gray-500 font-bold mb-4">{user.businessName}</p>
                  <div className="relative w-40 h-16 flex items-center justify-center">
                    {user.signatureImage && (
                      <img src={preloadedSignatureBase64 || user.signatureImage} alt="Tanda Tangan" className="h-14 object-contain relative z-10" />
                    )}
                    {user.stampImage && (
                      <img src={preloadedStampBase64 || user.stampImage} alt="Cap Stempel" className="h-16 w-16 object-contain absolute z-20 opacity-80 mix-blend-multiply translate-x-[20px] translate-y-[5px]" />
                    )}
                  </div>
                  <div className="w-40 border-b border-gray-400 mt-2"></div>
                  <p className="font-bold text-gray-700 mt-1">{user.fullName}</p>
                </div>
              </div>

            </div>

            {/* Footer paper */}
            <div className="border-t border-gray-50 pt-6 flex justify-between items-center text-[9px] text-gray-400">
              <p>Terima kasih atas kepercayaan bisnis Anda.</p>
              <div className="flex items-center gap-1">
                <span className="font-display font-black tracking-tight text-[10px] text-brand-dark">FID <span className="text-brand-primary">INVOICE</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons bottom */}
      <div className="flex justify-between pt-6 border-t border-gray-100 text-xs font-bold">
        <button 
          type="button" 
          disabled={step === 1}
          onClick={() => setStep((step - 1) as any)}
          className="px-5 py-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-brand-dark flex items-center gap-1 disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Sebelumnya
        </button>

        {step < 3 ? (
          <button 
            type="button" 
            disabled={step === 1 ? !selectedClientId : items.length === 0}
            onClick={() => setStep((step + 1) as any)}
            className="px-6 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-dark text-white flex items-center gap-1 shadow-md shadow-brand-primary/10 cursor-pointer disabled:opacity-50"
          >
            Lanjutkan
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button 
            type="button" 
            disabled={isSubmitting || !selectedClientId}
            onClick={() => handleSave('Dikirim')}
            className="px-8 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-dark text-white flex items-center gap-1.5 shadow-lg shadow-brand-primary/20 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Terbitkan & Simpan Invoice Resmi
          </button>
        )}
      </div>

      {/* QUICK MODAL: Create Client */}
      {quickClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-display font-extrabold text-sm text-brand-dark uppercase tracking-wider">Tambah Klien Baru Cerdas</h3>
              <button onClick={() => setQuickClientModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>
            <form onSubmit={handleQuickClientSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nama Lengkap (Wajib)</label>
                <input required type="text" value={qcName} onChange={(e) => setQcName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-primary" placeholder="Budi Santoso" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nama Perusahaan/Bisnis (Opsional)</label>
                <input type="text" value={qcBusiness} onChange={(e) => setQcBusiness(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-primary" placeholder="Toko Berkah Abadi" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email Klien</label>
                <input type="email" value={qcEmail} onChange={(e) => setQcEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-primary" placeholder="budi@tokoberkah.com" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">No. Telepon / WhatsApp</label>
                <input type="tel" value={qcPhone} onChange={(e) => setQcPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-primary" placeholder="08129876543" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Alamat Lengkap</label>
                <textarea rows={2} value={qcAddress} onChange={(e) => setQcAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-primary resize-none" placeholder="Jl. Sudirman No. 45..." />
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">
                Simpan & Pasang Sebagai Penerima
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QUICK MODAL: Select Product from Catalog */}
      {quickProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-lg w-full p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-display font-extrabold text-sm text-brand-dark uppercase tracking-wider">Pilih dari Katalog Produk / Jasa</h3>
              <button onClick={() => setQuickProductModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2.5">
              {products.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-4 text-center">Belum ada produk di katalog.</p>
              ) : (
                products.map(prod => (
                  <div key={prod.id} className="p-3 border border-gray-100 rounded-xl hover:border-brand-primary/40 flex justify-between items-center cursor-pointer group" onClick={() => addFromCatalog(prod)}>
                    <div>
                      <h4 className="font-bold text-xs text-brand-dark group-hover:text-brand-primary">{prod.name}</h4>
                      <p className="text-[10px] text-gray-400 line-clamp-1">{prod.description}</p>
                    </div>
                    <div className="text-right flex items-center gap-3 shrink-0">
                      <div>
                        <p className="font-mono font-bold text-xs text-brand-dark">{formatCurrency(prod.price, currency)}</p>
                        <p className="text-[10px] text-gray-400">per {prod.unit}</p>
                      </div>
                      <span className="p-1.5 rounded-lg bg-brand-primary-light text-brand-primary">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">atau buat item katalog baru secara instan:</p>
              <form onSubmit={handleQuickProductSubmit} className="grid grid-cols-2 gap-3">
                <input required type="text" value={qpName} onChange={(e) => setQpName(e.target.value)} placeholder="Nama Produk / Jasa" className="col-span-2 px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-primary" />
                <input required type="number" value={qpPrice} onChange={(e) => setQpPrice(parseFloat(e.target.value) || 0)} placeholder="Harga" className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-primary font-mono" />
                <select value={qpUnit} onChange={(e) => setQpUnit(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-primary">
                  <option value="Pcs">Pcs</option>
                  <option value="Paket">Paket</option>
                  <option value="Jam">Jam</option>
                  <option value="Hari">Hari</option>
                  <option value="Bulan">Bulan</option>
                </select>
                <button type="submit" className="col-span-2 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl cursor-pointer">
                  Buat & Tambahkan ke Invoice
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
