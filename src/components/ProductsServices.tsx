import React, { useState } from 'react';
import { 
  Package, Plus, Search, Edit, Trash2, Tag, 
  Layers, CircleDollarSign, PlusCircle, Check, FileDown, Briefcase
} from 'lucide-react';
import { Product, UserProfile } from '../types';
import { formatCurrency, formatDateIndonesian } from '../utils';
import ConfirmModal from './ConfirmModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { showToast } from '../utils/toast';

interface ProductsServicesProps {
  user: UserProfile;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onFeatureBlocked?: (featureName: string) => void;
}

export default function ProductsServices({
  user, products, onAddProduct, onEditProduct, onDeleteProduct, onFeatureBlocked
}: ProductsServicesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Confirmation Dialog State
  const [confirmDeleteState, setConfirmDeleteState] = useState<{
    isOpen: boolean;
    productId?: string;
    productName?: string;
  }>({
    isOpen: false
  });

  const triggerDeleteProduct = (id: string, name: string) => {
    setConfirmDeleteState({
      isOpen: true,
      productId: id,
      productName: name
    });
  };

  const executeDeleteProduct = () => {
    if (confirmDeleteState.productId) {
      onDeleteProduct(confirmDeleteState.productId);
      showToast('Item/Jasa berhasil dihapus', 'success');
      setConfirmDeleteState(prev => ({ ...prev, isOpen: false }));
    }
  };

  const formatSeqNumber = (num: number) => String(num).padStart(2, '0');

  const getCategoryStyles = (cat?: string) => {
    switch (cat) {
      case 'Jasa IT':
        return 'bg-indigo-50/70 text-indigo-700 border border-indigo-100/80';
      case 'Desain':
        return 'bg-purple-50/70 text-purple-700 border border-purple-100/80';
      case 'Pemasaran':
        return 'bg-amber-50/70 text-amber-700 border border-amber-100/80';
      case 'Konsultasi':
        return 'bg-emerald-50/70 text-emerald-700 border border-emerald-100/80';
      default:
        return 'bg-slate-50/70 text-slate-600 border border-slate-200';
    }
  };

  const handleExportProductsPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // 1. Sleek corporate deep slate header block
        doc.setFillColor(30, 41, 59); // Slate 800
        doc.rect(0, 0, 210, 40, 'F');

        // Document Titles
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('KATALOG RESMI PRODUK & JASA', 14, 15);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(203, 213, 225); // Slate 300
        doc.text(`Dicetak pada: ${formatDateIndonesian(new Date().toISOString().split('T')[0])}`, 14, 22);
        doc.text(`Instansi/Bisnis: ${user.businessName || user.fullName || 'Usaha Mandiri'}`, 14, 27);
        if (user.address) {
          doc.text(`Alamat: ${user.address}`, 14, 32);
        }

        // 2. Summary stats block
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.rect(14, 48, 182, 18, 'FD');

        const totalItems = filteredProducts.length;
        const categories = Array.from(new Set(filteredProducts.map(p => p.category || 'Umum')));
        const totalCategories = categories.length;
        const averagePrice = filteredProducts.reduce((acc, curr) => acc + curr.price, 0) / (totalItems || 1);

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.text('RINGKASAN KATALOG:', 20, 53);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text('Jumlah Item:', 20, 60);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${totalItems} Item`, 40, 60);

        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('Jumlah Kategori:', 75, 60);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${totalCategories} Kategori`, 100, 60);

        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text('Rata-rata Harga:', 135, 60);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(79, 70, 229); // Indigo 600
        doc.text(formatCurrency(averagePrice), 160, 60);

        // 3. Table Headers and Data mapping
        const tableHeaders = [
          ['No.', 'Nama Produk / Layanan', 'Kategori', 'Satuan', 'Tarif / Harga Satuan', 'Deskripsi Rincian']
        ];

        const tableData = filteredProducts.map((p, index) => {
          return [
            formatSeqNumber(index + 1),
            p.name,
            p.category || 'Umum',
            `per ${p.unit}`,
            formatCurrency(p.price),
            p.description || '-'
          ];
        });

        // 4. Render autotable with outstanding formatting
        autoTable(doc, {
          startY: 72,
          head: tableHeaders,
          body: tableData,
          theme: 'striped',
          headStyles: {
            fillColor: [30, 41, 59], // Slate 800
            textColor: [255, 255, 255],
            fontSize: 8.5,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 42, fontStyle: 'bold' },
            2: { cellWidth: 25 },
            3: { cellWidth: 18, halign: 'center' },
            4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
            5: { cellWidth: 53 }
          },
          styles: {
            fontSize: 8,
            cellPadding: 3.5,
            valign: 'middle'
          },
          didParseCell: (data) => {
            if (data.column.index === 0) {
              data.cell.styles.halign = 'center';
            } else if (data.column.index === 3) {
              data.cell.styles.halign = 'center';
            } else if (data.column.index === 4) {
              data.cell.styles.halign = 'right';
            } else {
              data.cell.styles.halign = 'left';
            }
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252] // Slate 50
          },
          margin: { left: 14, right: 14, bottom: 20 },
          didDrawPage: (data) => {
            // Footer page numbers
            const str = `Halaman ${data.pageNumber}`;
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184); // Slate 400
            doc.setFont('Helvetica', 'normal');
            doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
            
            // Professional copyright line
            const copyright = `${user.businessName || 'Usaha Mandiri'} © ${new Date().getFullYear()}`;
            doc.text(copyright, doc.internal.pageSize.width - data.settings.margin.right - doc.getTextWidth(copyright), doc.internal.pageSize.height - 10);
          }
        });

        doc.save(`Katalog_Produk_Jasa_${user.businessName?.replace(/\s+/g, '_') || 'Bisnis'}.pdf`);
      } catch (err) {
        console.error('Failed to export PDF:', err);
        showToast('Gagal mengekspor katalog ke PDF.', 'error');
      } finally {
        setIsExporting(false);
      }
    }, 600);
  };

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [unit, setUnit] = useState('Pcs');
  const [category, setCategory] = useState('Jasa IT');
  const [description, setDescription] = useState('');

  const handleOpenAddForm = () => {
    const isExpired = user.subscription.status === 'expired' || new Date(user.subscription.expiryDate) < new Date();
    if (isExpired && onFeatureBlocked) {
      onFeatureBlocked('Penambahan Produk atau Jasa Baru');
      return;
    }
    setEditingProduct(null);
    setName('');
    setPrice(0);
    setUnit('Pcs');
    setCategory('Jasa IT');
    setDescription('');
    setFormOpen(true);
  };

  const handleOpenEditForm = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setPrice(prod.price);
    setUnit(prod.unit);
    setCategory(prod.category || 'Lainnya');
    setDescription(prod.description);
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      showToast('Nama produk/layanan wajib diisi.', 'warning');
      return;
    }

    const isExpired = user.subscription.status === 'expired' || new Date(user.subscription.expiryDate) < new Date();
    if (!editingProduct && isExpired) {
      if (onFeatureBlocked) onFeatureBlocked('Penambahan Produk atau Jasa Baru');
      return;
    }

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name,
        price,
        unit,
        category,
        description
      };
      onEditProduct(updated);
    } else {
      const newProduct: Product = {
        id: 'prod_' + Math.random().toString(36).substring(2, 9),
        name,
        price,
        unit,
        category,
        description
      };
      onAddProduct(newProduct);
    }
    setFormOpen(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 font-sans text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-brand-dark">Katalog Produk & Jasa</h1>
          <p className="text-xs text-gray-400 mt-1">Kelola daftar produk, jasa, dan standar tarif penagihan bisnis Anda</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
          <button 
            disabled={isExporting}
            onClick={handleExportProductsPDF}
            className="px-4.5 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                Mengekspor...
              </>
            ) : (
              <>
                <FileDown className="w-4.5 h-4.5 text-gray-500" />
                Simpan PDF Katalog
              </>
            )}
          </button>
          
          <button 
            onClick={handleOpenAddForm}
            className="px-4.5 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-brand-primary/10 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="w-4.5 h-4.5" />
            Tambah Produk / Jasa
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative">
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari item katalog berdasarkan nama, deskripsi, atau kategori..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-brand-primary outline-none transition-all"
        />
        <Search className="absolute left-7 top-6.5 w-4.5 h-4.5 text-gray-400" />
      </div>

      {/* Grid List */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-gray-100 shadow-sm text-center text-gray-500">
          <p className="text-sm">Tidak ada produk/layanan dalam katalog.</p>
          <button onClick={handleOpenAddForm} className="mt-3 px-4 py-2 bg-brand-primary-light text-brand-primary font-bold text-xs rounded-xl">Buat Item Katalog Pertama</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(p => (
            <div key={p.id} className="bg-white p-6 rounded-2xl border border-gray-100/90 shadow-sm hover:shadow-lg hover:border-indigo-100/80 transition-all duration-300 flex flex-col justify-between text-left group relative overflow-hidden">
              {/* Top border decor accent */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-transparent group-hover:bg-indigo-500 transition-all duration-300" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${getCategoryStyles(p.category)}`}>
                    <Layers className="w-3 h-3" />
                    {p.category || 'Umum'}
                  </span>
                  
                  <div className="flex gap-1 bg-gray-50/50 p-1 rounded-lg border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => handleOpenEditForm(p)} className="p-1 text-gray-400 hover:text-brand-primary transition-colors" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => triggerDeleteProduct(p.id, p.name)} className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-extrabold text-base text-brand-dark group-hover:text-brand-primary transition-colors line-clamp-1">{p.name}</h3>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2 h-8">{p.description || 'Tidak ada deskripsi tambahan.'}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center gap-2 min-w-0">
                <div className="flex items-center gap-1.5 text-indigo-600 min-w-0 flex-1">
                  <CircleDollarSign className="w-4.5 h-4.5 shrink-0" />
                  <span className="font-mono font-black text-[14px] text-brand-dark group-hover:text-indigo-600 transition-colors truncate tracking-tight" title={formatCurrency(p.price)}>{formatCurrency(p.price)}</span>
                </div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider bg-gray-50 border border-gray-100/50 px-2 py-1 rounded-md shrink-0">per {p.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: FORM ADD / EDIT PRODUCT */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-display font-extrabold text-sm text-brand-dark uppercase tracking-wider">{editingProduct ? 'Ubah Item Katalog' : 'Tambah Item Baru'}</h3>
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nama Layanan / Produk (Wajib)</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-primary" placeholder="e.g. Jasa Pemeliharaan Server Cloud" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Harga Satuan (IDR)</label>
                  <input required type="number" min="0" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-primary font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Satuan</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-primary">
                    <option value="Pcs">Pcs</option>
                    <option value="Paket">Paket</option>
                    <option value="Jam">Jam</option>
                    <option value="Hari">Hari</option>
                    <option value="Bulan">Bulan</option>
                    <option value="Proyek">Proyek</option>
                    <option value="Sesi">Sesi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Kategori Produk/Jasa</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-primary">
                  <option value="Jasa IT">Jasa IT & Pengembangan Perangkat Lunak</option>
                  <option value="Desain">Desain UI/UX & Desain Grafis</option>
                  <option value="Pemasaran">Pemasaran Digital & Copywriting</option>
                  <option value="Konsultasi">Konsultasi Bisnis & Mentoring</option>
                  <option value="Lainnya">Lainnya / Umum</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Deskripsi Tambahan</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-primary resize-none" placeholder="Masukkan detail rincian produk/layanan..." />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setFormOpen(false)} className="flex-1 py-2.5 bg-gray-50 text-gray-600 text-xs font-bold rounded-xl border border-gray-200">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">Simpan Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDeleteState.isOpen}
        onClose={() => setConfirmDeleteState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeDeleteProduct}
        title="Hapus Produk"
        message={`Apakah Anda yakin ingin menghapus produk/layanan "${confirmDeleteState.productName}" dari katalog?`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
      />

    </div>
  );
}
