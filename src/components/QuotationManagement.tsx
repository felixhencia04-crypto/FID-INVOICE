import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, User, ShoppingBag, Plus, Trash2, 
  ChevronRight, ChevronLeft, Save, Eye, Send, Printer, 
  Percent, DollarSign, Check, Landmark, AlertCircle, RefreshCw,
  Search, Filter, ArrowLeftRight, CheckCircle2, XCircle, FileSpreadsheet,
  MoreVertical, Copy, Trash, Edit, CheckSquare, EyeOff, CheckSquare as CheckIcon,
  MessageSquare, Mail, Phone, MapPin, Building, Download, X, ExternalLink, Smartphone
} from 'lucide-react';
import { Quotation, Client, Product, InvoiceItem, UserProfile, Invoice } from '../types';
import { formatCurrency, terbilang, generateRandomId } from '../utils';
import { showToast } from '../utils/toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  preloadCompanyAssets, 
  waitForImagesToLoad, 
  getFormatFromBase64, 
  sanitizeBase64,
  fetchImageAsBase64 
} from '../utils/assetHelper';

interface QuotationManagementProps {
  user: UserProfile;
  clients: Client[];
  products: Product[];
  quotations: Quotation[];
  onAddQuotation: (quotation: Quotation) => void;
  onEditQuotation: (quotation: Quotation) => void;
  onDeleteQuotation: (id: string) => void;
  onConvertQuotationToInvoice: (quotation: Quotation) => void;
  onNavigate: (page: string) => void;
  onAddClient: (client: Client) => void;
  onAddProduct: (product: Product) => void;
  onFeatureBlocked?: (featureName: string) => void;
}

export default function QuotationManagement({
  user,
  clients,
  products,
  quotations,
  onAddQuotation,
  onEditQuotation,
  onDeleteQuotation,
  onConvertQuotationToInvoice,
  onNavigate,
  onFeatureBlocked,
  onAddClient,
  onAddProduct
}: QuotationManagementProps) {
  const isExpired = user.subscription.status === 'expired' || new Date(user.subscription.expiryDate) < new Date();
  
  // Navigation inside Quotation Management
  // 'list' | 'create' | 'edit' | 'preview'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'preview'>('list');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  
  // PDF and Print states
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorPdf, setErrorPdf] = useState('');
  const [preloadedLogoBase64, setPreloadedLogoBase64] = useState<string>('');
  const [preloadedSignatureBase64, setPreloadedSignatureBase64] = useState<string>('');
  const [preloadedStampBase64, setPreloadedStampBase64] = useState<string>('');
  const [isPreloadingAssets, setIsPreloadingAssets] = useState<boolean>(true);

  // Share Modal states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareType, setShareType] = useState<'whatsapp' | 'email'>('whatsapp');
  const [shareTemplate, setShareTemplate] = useState<'standard' | 'followup'>('standard');
  const [shareRecipient, setShareRecipient] = useState('');
  const [shareSubject, setShareSubject] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  // Preload company logo, signature, stamp for high-fidelity PDF rendering
  useEffect(() => {
    let active = true;
    const loadImages = async () => {
      if (!active) return;
      setIsPreloadingAssets(true);
      console.log('[QuotationManagement] Preloading company assets...');
      try {
        const assets = await preloadCompanyAssets(user);
        if (active) {
          setPreloadedLogoBase64(assets.businessLogo);
          setPreloadedSignatureBase64(assets.signatureImage);
          setPreloadedStampBase64(assets.stampImage);
        }
      } catch (e) {
        console.error('[QuotationManagement] Error preloading profile assets:', e);
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
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');

  // Form states
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [quotationNumber, setQuotationNumber] = useState('');
  const [quotationDate, setQuotationDate] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [currency, setCurrency] = useState<Quotation['currency']>('IDR');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [hasTax, setHasTax] = useState(false); // PPN 11%
  const [hasTax2, setHasTax2] = useState(false); // PPh 2%
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [templateId, setTemplateId] = useState<Quotation['templateId']>('corporate');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick modals
  const [quickClientModal, setQuickClientModal] = useState(false);
  const [quickProductModal, setQuickProductModal] = useState(false);
  const [qcName, setQcName] = useState('');
  const [qcBusiness, setQcBusiness] = useState('');
  const [qcEmail, setQcEmail] = useState('');
  const [qcPhone, setQcPhone] = useState('');
  const [qcAddress, setQcAddress] = useState('');

  const [qpName, setQpName] = useState('');
  const [qpPrice, setQpPrice] = useState(0);
  const [qpUnit, setQpUnit] = useState('Pcs');
  const [qpDesc, setQpDesc] = useState('');

  // Dropdown actions ID track
  const [actionDropdownId, setActionDropdownId] = useState<string | null>(null);

  // Load form fields if editing
  useEffect(() => {
    if (viewMode === 'edit' && selectedQuotation) {
      setQuotationNumber(selectedQuotation.quotationNumber);
      setQuotationDate(selectedQuotation.date);
      setValidUntil(selectedQuotation.validUntil);
      setSelectedClientId(selectedQuotation.clientId);
      setCurrency(selectedQuotation.currency);
      setItems(selectedQuotation.items);
      setGlobalDiscount(selectedQuotation.globalDiscountPercent);
      setHasTax(selectedQuotation.hasTax);
      setHasTax2(selectedQuotation.hasTax2);
      setNotes(selectedQuotation.notes || '');
      setTerms(selectedQuotation.terms || '');
      setTemplateId(selectedQuotation.templateId);
      setFormStep(1);
    } else if (viewMode === 'create') {
      // Auto-generate quotation number
      const count = quotations.length + 1;
      const currentYear = new Date().getFullYear();
      const paddedNum = String(count).padStart(4, '0');
      setQuotationNumber(`QT-${currentYear}-${paddedNum}`);
      
      const today = new Date().toISOString().split('T')[0];
      setQuotationDate(today);
      // Valid for 30 days by default
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      setValidUntil(futureDate.toISOString().split('T')[0]);
      
      setSelectedClientId(clients[0]?.id || '');
      setCurrency('IDR');
      setItems([
        {
          id: generateRandomId(),
          description: 'Layanan Konsultasi Bisnis Digital',
          qty: 1,
          unit: 'Bulan',
          price: 5000000,
          discountPercent: 0,
          subtotal: 5000000
        }
      ]);
      setGlobalDiscount(0);
      setHasTax(false);
      setHasTax2(false);
      setNotes('Penawaran ini mencakup analisis sistem penuh dan implementasi awal.');
      setTerms('1. Penawaran harga ini berlaku selama 30 hari sejak tanggal diterbitkan.\n2. Pembayaran uang muka sebesar 50% dilakukan saat penandatanganan persetujuan.\n3. Sisa pelunasan 50% dilakukan setelah pekerjaan selesai dideploy.');
      setTemplateId('corporate');
      setFormStep(1);
    }
  }, [viewMode, selectedQuotation]);

  // Calculations
  const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = Math.round((itemsSubtotal * globalDiscount) / 100);
  const afterDiscount = itemsSubtotal - discountAmount;
  const taxAmount = hasTax ? Math.round((afterDiscount * 11) / 100) : 0;
  const tax2Amount = hasTax2 ? Math.round((afterDiscount * 2) / 100) : 0;
  const total = afterDiscount + taxAmount - tax2Amount;
  const spelling = terbilang(total, currency);

  const handleAddItem = () => {
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

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Recalculate subtotal
        if (field === 'qty' || field === 'price' || field === 'discountPercent') {
          const qty = field === 'qty' ? Number(value) : item.qty;
          const price = field === 'price' ? Number(value) : item.price;
          const disc = field === 'discountPercent' ? Number(value) : item.discountPercent;
          const rawSub = qty * price;
          updatedItem.subtotal = rawSub - (rawSub * disc) / 100;
        }
        return updatedItem;
      }
      return item;
    });
    setItems(updated);
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) {
      showToast('Penawaran harus memiliki minimal 1 baris item.', 'warning');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const handleSelectProduct = (itemId: string, product: Product) => {
    const updated = items.map(item => {
      if (item.id === itemId) {
        const rawSub = 1 * product.price;
        return {
          ...item,
          description: product.name,
          price: product.price,
          unit: product.unit || 'Pcs',
          qty: 1,
          discountPercent: 0,
          subtotal: rawSub
        };
      }
      return item;
    });
    setItems(updated);
  };

  const handleSaveForm = () => {
    if (!selectedClientId) {
      showToast('Pilih klien bisnis terlebih dahulu.', 'warning');
      return;
    }
    if (items.some(item => !item.description.trim())) {
      showToast('Pastikan semua deskripsi item sudah diisi.', 'warning');
      return;
    }
    if (items.some(item => item.price <= 0 || item.qty <= 0)) {
      showToast('Jumlah qty dan harga satuan item harus lebih besar dari 0.', 'warning');
      return;
    }

    setIsSubmitting(true);

    const clientObj = clients.find(c => c.id === selectedClientId);

    setTimeout(() => {
      const quotationData: Quotation = {
        id: viewMode === 'edit' && selectedQuotation ? selectedQuotation.id : generateRandomId(),
        quotationNumber,
        userId: user.id,
        clientId: selectedClientId,
        clientName: clientObj?.name || 'Klien Baru',
        date: quotationDate,
        validUntil,
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
        status: viewMode === 'edit' && selectedQuotation ? selectedQuotation.status : 'Draft',
        notes,
        terms,
        templateId,
        currency,
        createdAt: viewMode === 'edit' && selectedQuotation ? selectedQuotation.createdAt : new Date().toISOString()
      };

      if (viewMode === 'edit') {
        onEditQuotation(quotationData);
      } else {
        onAddQuotation(quotationData);
      }

      setIsSubmitting(false);
      setViewMode('list');
      setSelectedQuotation(null);
    }, 800);
  };

  const handleAddQuickClient = () => {
    if (!qcName.trim()) return;
    const newClient: Client = {
      id: 'cli_' + Math.random().toString(36).substring(2, 9),
      name: qcName,
      businessName: qcBusiness,
      email: qcEmail || 'client@business.com',
      phone: qcPhone || '-',
      address: qcAddress || '-',
      createdAt: new Date().toISOString()
    };
    onAddClient(newClient);
    setSelectedClientId(newClient.id);
    setQuickClientModal(false);
    setQcName('');
    setQcBusiness('');
    setQcEmail('');
    setQcPhone('');
    setQcAddress('');
  };

  const handleAddQuickProduct = (itemId: string) => {
    if (!qpName.trim()) return;
    const newProduct: Product = {
      id: 'prod_' + Math.random().toString(36).substring(2, 9),
      name: qpName,
      price: qpPrice,
      unit: qpUnit,
      description: qpDesc
    };
    onAddProduct(newProduct);
    
    // Auto-select this newly created product in the specified item row
    const rawSub = 1 * qpPrice;
    const updated = items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          description: newProduct.name,
          price: newProduct.price,
          unit: newProduct.unit,
          qty: 1,
          discountPercent: 0,
          subtotal: rawSub
        };
      }
      return item;
    });
    setItems(updated);

    setQuickProductModal(false);
    setQpName('');
    setQpPrice(0);
    setQpUnit('Pcs');
    setQpDesc('');
  };

  // Convert Quotation Status change helper
  const handleUpdateQuotationStatus = (id: string, nextStatus: Quotation['status']) => {
    const q = quotations.find(item => item.id === id);
    if (q) {
      const updated: Quotation = { ...q, status: nextStatus };
      onEditQuotation(updated);
      if (selectedQuotation && selectedQuotation.id === id) {
        setSelectedQuotation(updated);
      }
    }
  };

  // Hidden high-fidelity iframe-based print implementation
  const handlePrint = () => {
    const element = document.getElementById('quotation-print-area');
    if (!element) return;

    // Remove existing print iframe if any
    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.remove();
    }

    // Create new hidden iframe
    iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // Write print HTML into the iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>Penawaran Harga - ${selectedQuotation?.quotationNumber || 'Document'}</title>
          <style>
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            @page {
              size: A4;
              margin: 15mm 15mm 15mm 15mm;
            }
            body {
              background: white !important;
              color: #1e293b !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
              margin: 0 !important;
              padding: 0 !important;
              font-size: 11px !important;
              line-height: 1.4 !important;
            }
            
            /* High-fidelity structural overrides to bypass mobile-first responsive stacking */
            #quotation-print-area {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              background: white !important;
            }
            
            /* Force side-by-side display for corporate, premium or minimalist top headers */
            #quotation-print-area > .flex.flex-col {
              display: flex !important;
              flex-direction: row !important;
              justify-content: space-between !important;
              align-items: flex-start !important;
              width: 100% !important;
              margin-bottom: 24px !important;
              gap: 20px !important;
            }
            
            #quotation-print-area > .flex.flex-col > div {
              flex: 1 !important;
            }
            
            #quotation-print-area > .flex.flex-col > .text-right {
              text-align: right !important;
              flex: 1 !important;
            }

            /* Force Client/Target Information into clean double columns */
            #quotation-print-area .grid.grid-cols-1.md\\:grid-cols-2 {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 24px !important;
              width: 100% !important;
              margin-bottom: 24px !important;
            }
            
            #quotation-print-area .grid.grid-cols-1.md\\:grid-cols-2 > div {
              width: 100% !important;
            }

            /* Grid items layout */
            .grid-cols-1 {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 16px !important;
            }

            /* Sizing and alignment of items table */
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin-top: 16px !important;
              margin-bottom: 24px !important;
            }
            th {
              padding: 10px 14px !important;
              font-size: 10px !important;
              font-weight: bold !important;
              border: 1px solid #cbd5e1 !important;
              text-align: left !important;
            }
            td {
              padding: 10px 14px !important;
              font-size: 11px !important;
              border: 1px solid #cbd5e1 !important;
              text-align: left !important;
            }
            th.text-center, td.text-center {
              text-align: center !important;
            }
            th.text-right, td.text-right {
              text-align: right !important;
            }

            /* Force Notes and Totals into side-by-side columns */
            #quotation-print-area .grid.grid-cols-1.md\\:grid-cols-2.gap-6 {
              display: grid !important;
              grid-template-columns: 1.1fr 0.9fr !important;
              gap: 30px !important;
              width: 100% !important;
              margin-top: 24px !important;
              border-top: none !important;
              padding-top: 0 !important;
            }
            
            #quotation-print-area .grid.grid-cols-1.md\\:grid-cols-2.gap-6 > div {
              width: 100% !important;
            }

            /* Totals table line values alignment */
            .space-y-2 .flex {
              display: flex !important;
              flex-direction: row !important;
              justify-content: space-between !important;
              width: 100% !important;
              margin-bottom: 6px !important;
            }
            
            .text-right {
              text-align: right !important;
            }

            /* Force signature panel block to be perfectly structured on one row */
            #quotation-print-area .pt-8.border-t.border-gray-100.flex.justify-between {
              display: flex !important;
              flex-direction: row !important;
              justify-content: space-between !important;
              align-items: flex-end !important;
              width: 100% !important;
              margin-top: 40px !important;
              border-top: 1px solid #e2e8f0 !important;
              padding-top: 24px !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            #quotation-print-area .pt-8.border-t.border-gray-100.flex.justify-between > div {
              width: 45% !important;
            }

            .print-avoid-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            img {
              display: block !important;
              opacity: 1 !important;
              visibility: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body style="background: white !important; padding: 0; margin: 0;">
          <div class="quotation-print-body-content ${element.className}" style="border: none !important; box-shadow: none !important; min-height: auto !important; padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; overflow: visible !important; display: block !important;">
            ${element.innerHTML}
          </div>
        </body>
        </html>
      `);

      // Copy style sheets to keep Tailwind CSS design active
      const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
      styles.forEach(style => {
        iframeDoc.head.appendChild(style.cloneNode(true));
      });

      iframeDoc.close();

      const runIframePrint = () => {
        if (iframe.contentWindow) {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } catch (err) {
            console.error('[QuotationManagement] Failed to print iframe:', err);
            window.print();
          }
        }
      };

      // Wait for all images to fully load and render
      waitForImagesToLoad(iframeDoc).then(() => {
        setTimeout(runIframePrint, 250);
      });
    }
  };

  const generateShareMessage = (
    type: 'whatsapp' | 'email',
    template: 'standard' | 'followup',
    quotation: Quotation,
    recipient: string
  ) => {
    const clientName = quotation.clientName;
    const qNum = quotation.quotationNumber;
    const totalVal = formatCurrency(quotation.total, quotation.currency);
    const qDate = quotation.date;
    const qValid = quotation.validUntil;
    const bizName = user.businessName || 'Perusahaan Kami';
    const senderName = user.fullName || 'Penyedia Jasa';
    
    const itemsList = quotation.items
      .map(item => type === 'whatsapp' 
        ? `• *${item.description}* (${item.qty} ${item.unit}) - ${formatCurrency(item.price, quotation.currency)}`
        : `- ${item.description} (${item.qty} ${item.unit}) - ${formatCurrency(item.price, quotation.currency)}`
      )
      .join('\n');

    if (type === 'whatsapp') {
      if (template === 'standard') {
        const text = `*PENAWARAN HARGA RESMI*\n\n` +
          `Yth. *${clientName}*\n` +
          `Dari: *${bizName}*\n\n` +
          `Dengan hormat,\n` +
          `Bersama pesan ini kami mengirimkan dokumen Penawaran Harga Resmi dengan rincian berikut:\n\n` +
          `📄 *Nomor:* ${qNum}\n` +
          `📅 *Tanggal:* ${qDate}\n` +
          `⏳ *Berlaku s/d:* ${qValid}\n\n` +
          `*Rincian Pekerjaan:*\n${itemsList}\n\n` +
          `💰 *TOTAL PENAWARAN: ${totalVal}*\n\n` +
          (quotation.notes ? `_Catatan: ${quotation.notes}_\n\n` : '') +
          `Terima kasih atas perhatian dan peluang kerja sama ini. Silakan hubungi kami untuk mendiskusikan penawaran ini lebih lanjut.\n\n` +
          `Salam hangat,\n` +
          `*${bizName}*`;
        setShareMessage(text);
      } else {
        const text = `Halo *${clientName}*,\n\n` +
          `Bagaimana kabar Anda? Kami harap semua berjalan lancar.\n\n` +
          `Menindaklanjuti rencana kerja sama kita, berikut kami lampirkan draf Penawaran Harga Resmi *#${qNum}* senilai *${totalVal}*.\n\n` +
          `Apakah rincian dan nilai penawaran di atas sudah sesuai dengan kebutuhan proyek Anda?\n\n` +
          `Jika Anda memerlukan revisi atau ingin berdiskusi mengenai anggaran, silakan kabari kami. Apabila sudah sesuai, mohon balas pesan ini dengan konfirmasi *"SETUJU"* agar kami dapat memproses ke tahap berikutnya.\n\n` +
          `Terima kasih banyak, kami siap memberikan layanan terbaik!\n\n` +
          `Hormat kami,\n` +
          `*${bizName}*`;
        setShareMessage(text);
      }
    } else {
      // Email type
      if (template === 'standard') {
        setShareSubject(`Penawaran Harga Resmi - #${qNum} [${bizName}]`);
        const text = `Yth. Bapak/Ibu ${clientName},\n\n` +
          `Semoga Bapak/Ibu dalam keadaan sehat dan sukses selalu.\n\n` +
          `Merujuk pada pembicaraan sebelumnya, bersama email ini kami mengirimkan dokumen Penawaran Harga Resmi Nomor ${qNum} dari ${bizName}.\n\n` +
          `Berikut adalah ringkasan penawaran tersebut:\n` +
          `- Nomor Dokumen: ${qNum}\n` +
          `- Tanggal Diterbitkan: ${qDate}\n` +
          `- Berlaku Hingga: ${qValid}\n` +
          `- Total Penawaran: ${totalVal}\n\n` +
          `Rincian Pekerjaan / Produk:\n` +
          `${itemsList}\n\n` +
          (quotation.notes ? `Catatan Tambahan:\n"${quotation.notes}"\n\n` : '') +
          (quotation.terms ? `Syarat & Ketentuan Umum:\n${quotation.terms}\n\n` : '') +
          `Kami berharap penawaran harga ini dapat memenuhi ekspektasi Bapak/Ibu. Silakan hubungi kami atau langsung balas email ini apabila ada pertanyaan atau penyesuaian yang diperlukan.\n\n` +
          `Terima kasih banyak atas waktu dan kesempatan kerja sama yang diberikan.\n\n` +
          `Hormat kami,\n` +
          `${senderName}\n` +
          `${bizName}`;
        setShareMessage(text);
      } else {
        setShareSubject(`Menindaklanjuti Penawaran Harga #${qNum} - ${clientName}`);
        const text = `Halo Bapak/Ibu ${clientName},\n\n` +
          `Bagaimana kabar Anda? Semoga dalam keadaan sehat selalu.\n\n` +
          `Kami ingin menindaklanjuti dokumen penawaran harga #${qNum} senilai ${totalVal} yang telah kami kirimkan sebelumnya untuk rencana proyek/pembelian Anda.\n\n` +
          `Apakah Anda sudah sempat meninjau rincian penawaran tersebut? Kami sangat terbuka untuk berdiskusi lebih lanjut mengenai detail pengerjaan, penyesuaian anggaran, maupun timeline kerja agar dapat memberikan solusi terbaik yang sesuai dengan kebutuhan Anda.\n\n` +
          `Jika sudah disetujui atau apabila ada revisi yang dibutuhkan, mohon untuk mengabari kami agar kami dapat segera memproses draf pengerjaan atau menerbitkan invoice.\n\n` +
          `Terima kasih banyak atas waktu, perhatian, dan kepercayaan Anda.\n\n` +
          `Hormat kami,\n` +
          `${senderName}\n` +
          `${bizName}`;
        setShareMessage(text);
      }
    }
  };

  const handleOpenShare = (type: 'whatsapp' | 'email', quotation = selectedQuotation) => {
    if (!quotation) return;
    const clientObj = clients.find(c => c.id === quotation.clientId);
    const recipient = type === 'whatsapp' ? (clientObj?.phone || '') : (clientObj?.email || '');
    
    setShareType(type);
    setShareRecipient(recipient);
    setShareTemplate('standard');
    setIsShareModalOpen(true);
    setShareCopied(false);
    
    // Generate initial message
    generateShareMessage(type, 'standard', quotation, recipient);
  };

  // High-fidelity, template-aware PDF exporter using jsPDF and jspdf-autotable
  const handleDownloadPDF = async () => {
    if (!selectedQuotation) return;
    setIsDownloading(true);
    setErrorPdf('');

    try {
      let logoBase64 = sanitizeBase64(preloadedLogoBase64);
      if (user.businessLogo && !logoBase64) {
        try {
          logoBase64 = sanitizeBase64(await fetchImageAsBase64(user.businessLogo));
        } catch (err) {
          console.error('Error pre-loading business logo Base64:', err);
        }
      }

      let signatureBase64 = sanitizeBase64(preloadedSignatureBase64);
      if (user.signatureImage && !signatureBase64) {
        try {
          signatureBase64 = sanitizeBase64(await fetchImageAsBase64(user.signatureImage));
        } catch (err) {
          console.error('Error pre-loading signature Base64:', err);
        }
      }

      let stampBase64 = sanitizeBase64(preloadedStampBase64);
      if (user.stampImage && !stampBase64) {
        try {
          stampBase64 = sanitizeBase64(await fetchImageAsBase64(user.stampImage));
        } catch (err) {
          console.error('Error pre-loading stamp Base64:', err);
        }
      }

      let originalLogoWidth = 300;
      let originalLogoHeight = 150;
      if (logoBase64) {
        const dim = await new Promise<{width: number, height: number}>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.onerror = () => resolve({ width: 300, height: 150 });
          img.src = logoBase64;
        });
        originalLogoWidth = dim.width || 300;
        originalLogoHeight = dim.height || 150;
      }

      // Create PDF instance (A4 size: 210mm x 297mm)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors styling depending on selected template
      let primaryColor: [number, number, number] = [30, 58, 138]; // Default corporate blue
      let lineColor: [number, number, number] = [30, 58, 138];
      let tableHeaderFill: [number, number, number] = [30, 58, 138];
      let tableHeaderTextColor: [number, number, number] = [255, 255, 255];
      let terbilangBg: [number, number, number] = [239, 246, 255]; // #eff6ff light blue
      let terbilangText: [number, number, number] = [30, 58, 138];
      let cardBgColor = '#f0f4f8'; // Soft light blue tint for corporate
      let cardBorderColor = '#cbd5e1'; // Slate 300 border for corporate
      
      const template = selectedQuotation.templateId;
      if (template === 'minimalist') {
        primaryColor = [31, 41, 55]; // Charcoal
        lineColor = [156, 163, 175];  // Gray 400
        tableHeaderFill = [243, 244, 246]; // Gray 100
        tableHeaderTextColor = [31, 41, 55]; // Charcoal
        terbilangBg = [249, 250, 251]; // Gray 50
        terbilangText = [31, 41, 55];
        cardBgColor = '#f9fafb'; // Soft light gray 50 for minimalist
        cardBorderColor = '#e5e7eb'; // Soft gray 200 border for minimalist
      } else if (template === 'premium') {
        primaryColor = [15, 23, 42]; // Dark slate
        lineColor = [212, 175, 55]; // Gold
        tableHeaderFill = [15, 23, 42]; // Dark slate
        tableHeaderTextColor = [212, 175, 55]; // Gold text
        terbilangBg = [253, 250, 242]; // Gold tint
        terbilangText = [15, 23, 42];
        cardBgColor = '#fdfaf2'; // Soft warm cream for premium
        cardBorderColor = '#e9dfc6'; // Soft gold border for premium
      }

      let startY = 20;
      let logoWidth = 30;
      let logoHeight = 15;
      
      let logoLoaded = false;
      let detailX = 40;
      if (logoBase64) {
        try {
          const maxW = 40;
          const maxH = 18;
          const ratio = Math.min(maxW / originalLogoWidth, maxH / originalLogoHeight);
          logoWidth = originalLogoWidth * ratio;
          logoHeight = originalLogoHeight * ratio;

          const format = getFormatFromBase64(logoBase64);
          doc.addImage(logoBase64, format, 20, startY, logoWidth, logoHeight);
          logoLoaded = true;
          detailX = 20 + logoWidth + 8;
        } catch (logoErr) {
          console.error('Error loading logo into PDF, falling back to company initials badge:', logoErr);
        }
      }

      if (!logoLoaded) {
        // Draw initials badge
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.roundedRect(20, startY, 15, 15, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        const initials = user.businessName ? user.businessName.substring(0, 2).toUpperCase() : 'CO';
        doc.text(initials, 27.5, startY + 9, { align: 'center' });
        detailX = 42;
      }

      // --- SENDER / COMPANY DETAILS (Left Aligned, offset from logo) ---
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55); // charcoal
      doc.text(user.businessName || '', detailX, startY + 4);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99); // gray 600
      doc.text(user.fullName || '', detailX, startY + 8);
      
      // Multi-line Address wrapped
      const senderAddress = user.address || '';
      const wrappedSenderAddress = doc.splitTextToSize(senderAddress, 70);
      doc.text(wrappedSenderAddress, detailX, startY + 12);
      
      const senderAddrLinesCount = wrappedSenderAddress.length;
      let currentLeftY = startY + 12 + (senderAddrLinesCount * 4);
      
      if (user.taxNumber) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128); // gray 500
        doc.text(`NPWP: ${user.taxNumber}`, detailX, currentLeftY);
        currentLeftY += 4;
      }

      // --- RIGHT SIDE HEADER: QUOTATION INFORMATION ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('PENAWARAN HARGA', 190, startY + 4, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);
      doc.text(selectedQuotation.quotationNumber, 190, startY + 10, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);
      doc.text(`Tanggal Penawaran: ${selectedQuotation.date}`, 190, startY + 15, { align: 'right' });
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`Berlaku Hingga: ${selectedQuotation.validUntil}`, 190, startY + 20, { align: 'right' });

      // Determine bottom of header section
      const headerBottomY = Math.max(currentLeftY + 2, startY + 24);

      // --- DECORATIVE ACCENT LINE ---
      doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
      doc.setLineWidth(template === 'corporate' ? 0.8 : 0.4);
      doc.line(20, headerBottomY, 190, headerBottomY);

      // --- CLIENT & BILLING DETAILS SIDE-BY-SIDE ---
      const billingY = headerBottomY + 8;
      const currentClient = clients.find(c => c.id === selectedQuotation.clientId);
      
      // Ditawarkan Oleh (Offered By)
      doc.setFillColor(cardBgColor);
      doc.setDrawColor(cardBorderColor);
      doc.setLineWidth(0.2);
      doc.roundedRect(20, billingY, 82, 32, 2, 2, 'FD');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175); // Gray 400
      doc.text('DITAWARKAN OLEH:', 24, billingY + 5);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(31, 41, 55);
      doc.text(user.fullName || '', 24, billingY + 10);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);
      doc.text(user.email || '', 24, billingY + 15);
      doc.text(user.phone || '', 24, billingY + 20);
      
      // Ditujukan Kepada (Offered To)
      doc.setFillColor(cardBgColor);
      doc.setDrawColor(cardBorderColor);
      doc.setLineWidth(0.2);
      doc.roundedRect(108, billingY, 82, 32, 2, 2, 'FD');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text('DITUJUKAN KEPADA:', 112, billingY + 5);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(31, 41, 55);
      doc.text(selectedQuotation.clientName || '', 112, billingY + 10);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);
      
      if (currentClient?.businessName) {
        doc.text(currentClient.businessName, 112, billingY + 14);
      }
      doc.text(currentClient?.email || '-', 112, billingY + 18);
      
      // Wrap client address
      const clientAddr = currentClient?.address || '-';
      const wrappedClientAddr = doc.splitTextToSize(clientAddr, 74);
      const maxClientAddrLines = wrappedClientAddr.slice(0, 2);
      doc.text(maxClientAddrLines, 112, billingY + 22);

      // --- INVOICE LINE ITEMS TABLE ---
      const tableStartY = billingY + 38;
      
      const tableBody = selectedQuotation.items.map((it, idx) => {
        let descriptionFull = it.description;
        if (it.discountPercent > 0) {
          descriptionFull += `\n(Diskon Item: ${it.discountPercent}%)`;
        }
        return [
          (idx + 1).toString(),
          descriptionFull,
          `${it.qty} ${it.unit}`,
          formatCurrency(it.price, selectedQuotation.currency),
          formatCurrency(it.subtotal, selectedQuotation.currency)
        ];
      });

      autoTable(doc, {
        startY: tableStartY,
        head: [['No', 'Deskripsi Layanan / Produk', 'Qty', 'Harga Satuan', 'Subtotal']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: tableHeaderFill,
          textColor: tableHeaderTextColor,
          font: 'helvetica',
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'left',
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' }, // No
          1: { cellWidth: 80, halign: 'left' },   // Deskripsi
          2: { cellWidth: 18, halign: 'center' }, // Qty
          3: { cellWidth: 31, halign: 'right' },  // Harga Satuan
          4: { cellWidth: 31, halign: 'right' }   // Subtotal
        },
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: 3,
          lineColor: [229, 231, 235], // gray-200
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: template === 'corporate' ? [249, 250, 251] : [255, 255, 255]
        },
        margin: { left: 20, right: 20 }
      });

      // Get Y coordinate after table
      let currentY = (doc as any).lastAutoTable.finalY + 5;
      
      if (currentY > 215) {
        doc.addPage();
        currentY = 25;
      }

      // --- SPELLING TERBILANG (Left Side) ---
      const spellingHeight = 14;
      doc.setFillColor(terbilangBg[0], terbilangBg[1], terbilangBg[2]);
      doc.roundedRect(20, currentY, 82, spellingHeight, 1.5, 1.5, 'F');
      
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(terbilangText[0], terbilangText[1], terbilangText[2]);
      
      const rawSpelled = selectedQuotation.spelledOut || terbilang(selectedQuotation.total, selectedQuotation.currency || 'IDR');
      const spelledText = rawSpelled 
        ? (rawSpelled.toLowerCase().endsWith('rupiah') 
            ? rawSpelled 
            : `${rawSpelled} ${selectedQuotation.currency === 'IDR' ? 'Rupiah' : ''}`.trim())
        : '';
      const wrappedSpelling = doc.splitTextToSize(`Terbilang: ${spelledText}`, 76);
      doc.text(wrappedSpelling, 24, currentY + 5);

      // --- TOTALS CALCULATIONS (Right Side) ---
      let totalsY = currentY + 3;
      
      const drawTotalRow = (label: string, valueStr: string, yCoord: number, isGrandTotal = false) => {
        doc.setFont('helvetica', isGrandTotal ? 'bold' : 'normal');
        doc.setFontSize(isGrandTotal ? 11 : 9);
        doc.setTextColor(isGrandTotal ? primaryColor[0] : 75, isGrandTotal ? primaryColor[1] : 85, isGrandTotal ? primaryColor[2] : 99);
        
        doc.text(label, 112, yCoord);
        doc.text(valueStr, 190, yCoord, { align: 'right' });
      };

      // Subtotal
      drawTotalRow('Subtotal Item:', formatCurrency(selectedQuotation.subtotal, selectedQuotation.currency), totalsY);
      totalsY += 4.5;

      // Global Discount
      if (selectedQuotation.globalDiscountPercent > 0) {
        drawTotalRow(`Diskon Global (${selectedQuotation.globalDiscountPercent}%):`, `-${formatCurrency(selectedQuotation.discountAmount, selectedQuotation.currency)}`, totalsY);
        totalsY += 4.5;
      }

      // PPN Tax 1
      if (selectedQuotation.hasTax) {
        drawTotalRow('PPN (11%):', `+${formatCurrency(selectedQuotation.taxAmount, selectedQuotation.currency)}`, totalsY);
        totalsY += 4.5;
      }

      // PPh23 Tax 2
      if (selectedQuotation.hasTax2) {
        drawTotalRow('PPh 23 (2% Potongan):', `-${formatCurrency(selectedQuotation.tax2Amount, selectedQuotation.currency)}`, totalsY);
        totalsY += 4.5;
      }

      // Grand Total separating border line
      doc.setDrawColor(229, 231, 235); // gray-200
      doc.setLineWidth(0.4);
      doc.line(112, totalsY - 1, 190, totalsY - 1);
      
      // Grand Total
      totalsY += 2;
      drawTotalRow('Total Penawaran:', formatCurrency(selectedQuotation.total, selectedQuotation.currency), totalsY, true);

      // Move Y coordinate past totals/spelling
      currentY = Math.max(currentY + spellingHeight, totalsY) + 6;

      // --- TERMS & NOTES (Side-by-Side) ---
      // Catatan Khusus
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175); // Gray-400
      doc.text('CATATAN KHUSUS:', 20, currentY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128); // Gray-500
      const wrappedNotes = doc.splitTextToSize(selectedQuotation.notes || '-', 80);
      doc.text(wrappedNotes, 20, currentY + 4);

      // Syarat & Ketentuan Umum
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text('SYARAT & KETENTUAN UMUM:', 108, currentY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      const wrappedTerms = doc.splitTextToSize(selectedQuotation.terms || '-', 82);
      doc.text(wrappedTerms, 108, currentY + 4);

      const notesBottomHeight = Math.max(wrappedNotes.length, wrappedTerms.length) * 3.5;
      currentY += Math.max(10, notesBottomHeight + 6);

      // --- SIGNATURE AREA ---
      if (currentY > 255) {
        doc.addPage();
        currentY = 25;
      }

      const sigY = currentY + 2;
      
      // Left side: Client approval signature spacer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text('Tanda Tangan Persetujuan Klien,', 20, sigY);
      
      doc.setDrawColor(220, 225, 230);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(160, 170, 180);
      doc.text('( Tanda Tangan & Cap )', 20, sigY + 11);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(31, 41, 55);
      doc.text(selectedQuotation.clientName || '', 20, sigY + 22);

      // Right side: Provider's signature
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text('Hormat Kami, Penyedia Jasa', 150, sigY);

      // DRAW DIGITAL SIGNATURE FIRST (Draw first so stamp overlaps on top)
      if (signatureBase64) {
        try {
          const format = getFormatFromBase64(signatureBase64);
          doc.addImage(signatureBase64, format, 146, sigY + 2, 28, 15);
        } catch (sigErr) {
          console.error('Error drawing signature on quotation PDF:', sigErr);
        }
      }

      // DRAW DIGITAL STAMP SECOND (Overlaps the signature perfectly)
      if (stampBase64) {
        try {
          const format = getFormatFromBase64(stampBase64);
          doc.addImage(stampBase64, format, 140, sigY + 1, 18, 16);
        } catch (stampErr) {
          console.error('Error drawing stamp on quotation PDF:', stampErr);
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(31, 41, 55);
      doc.text(user.fullName || '', 150, sigY + 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(user.businessName || '', 150, sigY + 26);

      // --- PAGE NUMBERING AND WATERMARK DRAFT / DISAMPUR ---
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Status Watermark if Approved or Draft
        if (selectedQuotation.status === 'Disetujui') {
          doc.saveGraphicsState();
          doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(65);
          doc.setTextColor(34, 197, 94); // Green
          doc.text('DISETUJUI', 105, 150, { align: 'center', angle: 45 });
          doc.restoreGraphicsState();
        } else if (selectedQuotation.status === 'Draft') {
          doc.saveGraphicsState();
          doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(65);
          doc.setTextColor(100, 110, 120); // Gray
          doc.text('DRAF', 105, 150, { align: 'center', angle: 45 });
          doc.restoreGraphicsState();
        }

        // Header Border top for pages > 1
        if (i > 1) {
          doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
          doc.setLineWidth(0.4);
          doc.line(20, 15, 190, 15);
          
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(156, 163, 175);
          doc.text(`Penawaran: ${selectedQuotation.quotationNumber} | ${user.businessName}`, 20, 12);
        }

        // Footer at the absolute bottom
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(156, 163, 175); // Gray 400
        doc.text('Dokumen Penawaran Harga Elektronik Resmi.', 20, 287);
        doc.text(`Halaman ${i} dari ${totalPages}`, 190, 287, { align: 'right' });
      }

      // --- TRIGGER FILE SAVE / DOWNLOAD ---
      const sanitizedClientName = (selectedQuotation.clientName || 'Klien')
        .replace(/[^a-zA-Z0-9]/g, '_');
      const finalFileName = `Penawaran-${selectedQuotation.quotationNumber}-${sanitizedClientName}.pdf`;
      
      doc.save(finalFileName);
      setIsDownloading(false);
    } catch (err: any) {
      console.error('Failed to generate professional PDF via jsPDF:', err);
      setErrorPdf(err.message || 'Gagal merender file PDF. Silakan coba kembali atau gunakan tombol Cetak Langsung.');
      setIsDownloading(false);
    }
  };

  // Filter logic
  const filteredQuotations = quotations.filter(q => {
    const matchSearch = q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        q.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'Semua' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Calculate statistics
  const totalQuotationsCount = quotations.length;
  const totalQuotationsValue = quotations.reduce((sum, q) => sum + q.total, 0);

  const approvedCount = quotations.filter(q => q.status === 'Disetujui').length;
  const approvedValue = quotations.filter(q => q.status === 'Disetujui').reduce((sum, q) => sum + q.total, 0);

  const pendingCount = quotations.filter(q => q.status === 'Draft' || q.status === 'Dikirim').length;
  const pendingValue = quotations.filter(q => q.status === 'Draft' || q.status === 'Dikirim').reduce((sum, q) => sum + q.total, 0);

  const rejectedCount = quotations.filter(q => q.status === 'Ditolak').length;
  const rejectedValue = quotations.filter(q => q.status === 'Ditolak').reduce((sum, q) => sum + q.total, 0);

  // Template Styles definition
  const getTemplateStyles = (tempId: Quotation['templateId']) => {
    switch (tempId) {
      case 'premium':
        return {
          headerBg: 'bg-gradient-to-r from-amber-950 to-slate-900 text-amber-100',
          accentText: 'text-amber-600',
          borderCol: 'border-amber-200',
          tableHeader: 'bg-amber-950/5 text-amber-900 font-bold',
          badgeStyle: 'bg-amber-50 text-amber-700 border border-amber-200',
          accentLine: 'border-b-2 border-amber-600'
        };
      case 'minimalist':
        return {
          headerBg: 'bg-white text-black border-b border-black',
          accentText: 'text-black',
          borderCol: 'border-gray-200',
          tableHeader: 'bg-gray-100 text-gray-900 font-bold border-b border-black',
          badgeStyle: 'bg-gray-100 text-gray-800 border border-gray-300',
          accentLine: 'border-b-2 border-black'
        };
      case 'corporate':
      default:
        return {
          headerBg: 'bg-brand-primary text-white',
          accentText: 'text-brand-primary',
          borderCol: 'border-brand-primary-light/30',
          tableHeader: 'bg-brand-primary-light/30 text-brand-primary font-bold',
          badgeStyle: 'bg-brand-primary-light/50 text-brand-primary border border-brand-primary/20',
          accentLine: 'border-b-2 border-brand-primary'
        };
    }
  };

  const getStatusBadgeClass = (status: Quotation['status']) => {
    switch (status) {
      case 'Disetujui':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'Ditolak':
        return 'bg-rose-50 text-rose-700 border border-rose-100';
      case 'Dibuat Invoice':
        return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'Dikirim':
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'Draft':
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-display font-black tracking-tight text-brand-dark flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            Penawaran Harga (Quotation)
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Sistem manajemen prospek, penawaran harga bisnis, dan konversi otomatis menjadi invoice resmi.
          </p>
        </div>

        {viewMode === 'list' && (
          <button
            onClick={() => {
              if (isExpired && onFeatureBlocked) {
                onFeatureBlocked('Pembuatan Penawaran Harga Baru (Quotation)');
              } else {
                setViewMode('create');
              }
            }}
            className="flex items-center gap-2 bg-brand-primary text-white text-xs font-bold px-4 py-3 rounded-xl hover:bg-brand-primary/90 hover:scale-[1.02] shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buat Penawaran Baru
          </button>
        )}
      </div>

      {/* 1. LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Dashboard Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">Total Penawaran</span>
                <p className="text-xl font-display font-black text-slate-800 mt-1">{totalQuotationsCount}</p>
              </div>
              <span className="text-[10px] font-bold text-gray-500 mt-2 block">{formatCurrency(totalQuotationsValue, 'IDR')}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider block">Disetujui Klien</span>
                <p className="text-xl font-display font-black text-emerald-700 mt-1">{approvedCount}</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 mt-2 block">{formatCurrency(approvedValue, 'IDR')}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider block">Menunggu Respon</span>
                <p className="text-xl font-display font-black text-amber-700 mt-1">{pendingCount}</p>
              </div>
              <span className="text-[10px] font-bold text-amber-600 mt-2 block">{formatCurrency(pendingValue, 'IDR')}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-wider block">Ditolak</span>
                <p className="text-xl font-display font-black text-rose-700 mt-1">{rejectedCount}</p>
              </div>
              <span className="text-[10px] font-bold text-rose-600 mt-2 block">{formatCurrency(rejectedValue, 'IDR')}</span>
            </div>
          </div>

          {/* Search, Filter & Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row justify-between gap-4">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari No. Penawaran atau Klien..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs py-2.5 pl-10 pr-4 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-100 focus:border-brand-primary rounded-xl outline-none transition-all"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-bold text-gray-400 flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5" /> Filter Status:
                </span>
                {['Semua', 'Draft', 'Dikirim', 'Disetujui', 'Ditolak', 'Dibuat Invoice'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === st 
                        ? 'bg-brand-primary text-white shadow-sm' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Quotations List Table */}
            {filteredQuotations.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <FileText className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                <p className="text-xs font-bold">Tidak ada data penawaran yang ditemukan.</p>
                <p className="text-[11px] text-gray-300 mt-1">Coba sesuaikan kata kunci pencarian atau buat penawaran baru.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-50 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-4 px-6">No. Penawaran</th>
                      <th className="py-4 px-6">Klien Bisnis</th>
                      <th className="py-4 px-6">Tanggal</th>
                      <th className="py-4 px-6">Berlaku Hingga</th>
                      <th className="py-4 px-6 text-right">Nilai Penawaran</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {filteredQuotations.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-gray-900">{q.quotationNumber}</td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-800 block">{q.clientName}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {clients.find(c => c.id === q.clientId)?.businessName || 'Profil Umum'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-500">{q.date}</td>
                        <td className="py-4 px-6 text-gray-500">{q.validUntil}</td>
                        <td className="py-4 px-6 text-right font-bold text-slate-800">
                          {formatCurrency(q.total, q.currency)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadgeClass(q.status)}`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center relative">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedQuotation(q);
                                setViewMode('preview');
                              }}
                              className="p-1.5 bg-gray-50 hover:bg-brand-primary-light text-gray-500 hover:text-brand-primary rounded-lg transition-colors cursor-pointer"
                              title="Pratinjau / Cetak"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedQuotation(q);
                                setViewMode('edit');
                              }}
                              className="p-1.5 bg-gray-50 hover:bg-amber-50 text-gray-500 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit Penawaran"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Convert quick shortcut */}
                            {q.status !== 'Dibuat Invoice' && (
                              <button
                                onClick={() => {
                                  if (isExpired && onFeatureBlocked) {
                                    onFeatureBlocked('Konversi Penawaran ke Invoice Baru');
                                  } else {
                                    onConvertQuotationToInvoice(q);
                                  }
                                }}
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                                title="Konversi ke Invoice"
                              >
                                <ArrowLeftRight className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (confirm('Apakah Anda yakin ingin menghapus penawaran harga ini?')) {
                                  onDeleteQuotation(q.id);
                                }
                              }}
                              className="p-1.5 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. CREATE / EDIT FORM VIEW */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Step Indicators */}
          <div className="bg-slate-50/50 p-5 border-b border-gray-50 flex justify-between items-center">
            <button
              onClick={() => {
                setViewMode('list');
                setSelectedQuotation(null);
              }}
              className="text-xs text-gray-400 hover:text-brand-primary flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar
            </button>

            <div className="flex items-center gap-6 text-xs">
              <span className={`font-bold flex items-center gap-1.5 ${formStep >= 1 ? 'text-brand-primary' : 'text-gray-300'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border font-mono text-[10px] ${formStep >= 1 ? 'border-brand-primary bg-brand-primary-light/50' : 'border-gray-200'}`}>1</span>
                Info Dasar
              </span>
              <span className="text-gray-200">/</span>
              <span className={`font-bold flex items-center gap-1.5 ${formStep >= 2 ? 'text-brand-primary' : 'text-gray-300'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border font-mono text-[10px] ${formStep >= 2 ? 'border-brand-primary bg-brand-primary-light/50' : 'border-gray-200'}`}>2</span>
                Item Penawaran
              </span>
              <span className="text-gray-200">/</span>
              <span className={`font-bold flex items-center gap-1.5 ${formStep >= 3 ? 'text-brand-primary' : 'text-gray-300'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border font-mono text-[10px] ${formStep >= 3 ? 'border-brand-primary bg-brand-primary-light/50' : 'border-gray-200'}`}>3</span>
                Pratinjau & Simpan
              </span>
            </div>
          </div>

          <div className="p-6">
            {/* STEP 1: INFO DASAR */}
            {formStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Client Selection */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-brand-primary" /> Klien Bisnis Penerima
                      </label>
                      <button
                        type="button"
                        onClick={() => setQuickClientModal(true)}
                        className="text-[10px] font-bold text-brand-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Tambah Klien Cepat
                      </button>
                    </div>

                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full text-xs p-3 bg-gray-50 border border-gray-100 hover:border-brand-primary-light focus:border-brand-primary outline-none rounded-xl transition-all"
                    >
                      <option value="">-- Pilih Klien Bisnis --</option>
                      {clients.map(cli => (
                        <option key={cli.id} value={cli.id}>
                          {cli.name} {cli.businessName ? `(${cli.businessName})` : ''}
                        </option>
                      ))}
                    </select>

                    {selectedClientId && (
                      <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 text-xs space-y-2 text-slate-600">
                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-gray-400" />
                          {clients.find(c => c.id === selectedClientId)?.businessName || 'Profil Perorangan'}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {clients.find(c => c.id === selectedClientId)?.email}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {clients.find(c => c.id === selectedClientId)?.phone}
                        </p>
                        <p className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                          <span className="line-clamp-2">{clients.find(c => c.id === selectedClientId)?.address}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Base Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Nomor Penawaran
                      </label>
                      <input
                        type="text"
                        value={quotationNumber}
                        onChange={(e) => setQuotationNumber(e.target.value)}
                        className="w-full text-xs p-3 bg-gray-50 border border-gray-100 hover:border-brand-primary-light focus:border-brand-primary outline-none rounded-xl font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                          <Calendar className="w-4 h-4 text-brand-primary" /> Tanggal Penawaran
                        </label>
                        <input
                          type="date"
                          value={quotationDate}
                          onChange={(e) => setQuotationDate(e.target.value)}
                          className="w-full text-xs p-3 bg-gray-50 border border-gray-100 hover:border-brand-primary-light focus:border-brand-primary outline-none rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                          <Calendar className="w-4 h-4 text-brand-primary" /> Berlaku Hingga
                        </label>
                        <input
                          type="date"
                          value={validUntil}
                          onChange={(e) => setValidUntil(e.target.value)}
                          className="w-full text-xs p-3 bg-gray-50 border border-gray-100 hover:border-brand-primary-light focus:border-brand-primary outline-none rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Mata Uang</label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value as Quotation['currency'])}
                          className="w-full text-xs p-3 bg-gray-50 border border-gray-100 hover:border-brand-primary-light focus:border-brand-primary outline-none rounded-xl"
                        >
                          <option value="IDR">Rupiah (IDR)</option>
                          <option value="USD">Dolar AS (USD)</option>
                          <option value="SGD">Dolar SGD (SGD)</option>
                          <option value="EUR">Euro (EUR)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Diskon Global (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={globalDiscount}
                            onChange={(e) => setGlobalDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-full text-xs p-3 pr-10 bg-gray-50 border border-gray-100 hover:border-brand-primary-light focus:border-brand-primary outline-none rounded-xl"
                          />
                          <Percent className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-end">
                  <button
                    onClick={() => setFormStep(2)}
                    className="flex items-center gap-1 bg-brand-primary text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-brand-primary/90 transition-colors cursor-pointer"
                  >
                    Lanjutkan Ke Item <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: LINE ITEMS EDITOR */}
            {formStep === 2 && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-brand-primary" /> Daftar Jasa & Produk yang Ditawarkan
                    </h3>
                    <button
                      onClick={handleAddItem}
                      className="flex items-center gap-1 text-brand-primary text-xs font-bold px-3 py-1.5 rounded-lg bg-brand-primary-light/50 hover:bg-brand-primary-light transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Baris Baru
                    </button>
                  </div>

                  {/* Lines container */}
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                    {items.map((item, index) => (
                      <div key={item.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-3 relative group">
                        <span className="absolute left-3 top-3 font-mono text-[10px] font-bold text-gray-300">#{index + 1}</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3">
                          {/* Item Selector / Description */}
                          <div className="md:col-span-5 space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold text-gray-400 block">Deskripsi Layanan / Barang</label>
                              
                              {/* Quick selection dropdown helper from existing products */}
                              {products.length > 0 && (
                                <select
                                  onChange={(e) => {
                                    const prodId = e.target.value;
                                    const prod = products.find(p => p.id === prodId);
                                    if (prod) handleSelectProduct(item.id, prod);
                                  }}
                                  className="text-[9px] text-brand-primary bg-white px-1 py-0.5 border border-brand-primary/10 rounded"
                                  defaultValue=""
                                >
                                  <option value="" disabled>-- Pilih dari Katalog --</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price, 'IDR')}</option>
                                  ))}
                                </select>
                              )}
                            </div>

                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                              placeholder="Ketik deskripsi pekerjaan..."
                              className="w-full text-xs p-2.5 bg-white border border-gray-100 focus:border-brand-primary outline-none rounded-lg"
                            />
                          </div>

                          {/* Qty */}
                          <div className="md:col-span-1.5">
                            <label className="text-[10px] font-bold text-gray-400 block mb-1.5">Kuantitas</label>
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleUpdateItem(item.id, 'qty', Math.max(1, Number(e.target.value)))}
                              className="w-full text-xs p-2.5 bg-white border border-gray-100 focus:border-brand-primary outline-none rounded-lg font-mono text-center"
                            />
                          </div>

                          {/* Unit */}
                          <div className="md:col-span-1.5">
                            <label className="text-[10px] font-bold text-gray-400 block mb-1.5">Satuan</label>
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                              placeholder="Pcs/Jam"
                              className="w-full text-xs p-2.5 bg-white border border-gray-100 focus:border-brand-primary outline-none rounded-lg text-center"
                            />
                          </div>

                          {/* Unit Price */}
                          <div className="md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 block mb-1.5">Harga Satuan ({currency})</label>
                            <input
                              type="number"
                              min="0"
                              value={item.price}
                              onChange={(e) => handleUpdateItem(item.id, 'price', Math.max(0, Number(e.target.value)))}
                              className="w-full text-xs p-2.5 bg-white border border-gray-100 focus:border-brand-primary outline-none rounded-lg font-mono"
                            />
                          </div>

                          {/* Item Discount */}
                          <div className="md:col-span-1">
                            <label className="text-[10px] font-bold text-gray-400 block mb-1.5">Disc %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discountPercent}
                              onChange={(e) => handleUpdateItem(item.id, 'discountPercent', Math.min(100, Math.max(0, Number(e.target.value))))}
                              className="w-full text-xs p-2.5 bg-white border border-gray-100 focus:border-brand-primary outline-none rounded-lg font-mono text-center"
                            />
                          </div>

                          {/* Action Trash */}
                          <div className="md:col-span-1 flex items-end justify-center pb-1">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Calculated line subtotal indicator */}
                        <div className="flex justify-end text-[10px] font-bold text-gray-400 font-mono pr-12 pt-1 border-t border-dashed border-gray-100">
                          Subtotal Item: <span className="text-brand-primary ml-1">{formatCurrency(item.subtotal, currency)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Taxes checkboxes */}
                <div className="p-4 bg-slate-50/50 border border-gray-50 rounded-2xl grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasTax}
                      onChange={(e) => setHasTax(e.target.checked)}
                      className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary h-4 w-4"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Terapkan PPN 11%</span>
                      <span className="text-[10px] text-gray-400">Pajak Pertambahan Nilai resmi UMKM</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasTax2}
                      onChange={(e) => setHasTax2(e.target.checked)}
                      className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary h-4 w-4"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Terapkan PPh 2%</span>
                      <span className="text-[10px] text-gray-400">Pajak Penghasilan Pasal 23 (Potongan)</span>
                    </div>
                  </label>
                </div>

                {/* Totals Breakdown */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block">Terbilang (Spelled Out)</span>
                    <p className="text-xs text-brand-gold italic font-bold">"{spelling}"</p>
                  </div>

                  <div className="w-full md:w-80 text-xs font-mono space-y-2 text-right border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Kotor:</span>
                      <span className="font-bold">{formatCurrency(itemsSubtotal, currency)}</span>
                    </div>
                    {globalDiscount > 0 && (
                      <div className="flex justify-between text-rose-300">
                        <span>Diskon ({globalDiscount}%):</span>
                        <span className="font-bold">-{formatCurrency(discountAmount, currency)}</span>
                      </div>
                    )}
                    {hasTax && (
                      <div className="flex justify-between text-amber-300">
                        <span>PPN (11%):</span>
                        <span className="font-bold">+{formatCurrency(taxAmount, currency)}</span>
                      </div>
                    )}
                    {hasTax2 && (
                      <div className="flex justify-between text-blue-300">
                        <span>PPh 23 (2%):</span>
                        <span className="font-bold">-{formatCurrency(tax2Amount, currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-brand-gold font-bold text-sm border-t border-white/10 pt-2 mt-2">
                      <span>NILAI PENAWARAN:</span>
                      <span>{formatCurrency(total, currency)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-between">
                  <button
                    onClick={() => setFormStep(1)}
                    className="flex items-center gap-1 text-gray-500 hover:text-brand-primary text-xs font-bold px-5 py-3 rounded-xl border border-gray-200 hover:border-brand-primary-light transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Kembali
                  </button>

                  <button
                    onClick={() => setFormStep(3)}
                    className="flex items-center gap-1 bg-brand-primary text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-brand-primary/90 transition-colors cursor-pointer"
                  >
                    Pratinjau & Selesai <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PREVIEW & CUSTOMIZE TEMPLATE */}
            {formStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Left Controls: Notes, Terms, and Template Selector */}
                  <div className="md:col-span-1 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Gaya Desain (Template)</label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'corporate', label: 'Biru Korporat', desc: 'Profesional & Standar' },
                          { id: 'minimalist', label: 'Elegansi Hitam', desc: 'Modern & Bersih' },
                          { id: 'premium', label: 'Emas Mewah', desc: 'Eksklusif & Artistik' }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setTemplateId(t.id as Quotation['templateId'])}
                            className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                              templateId === t.id 
                                ? 'bg-brand-primary-light/40 border-brand-primary text-brand-primary' 
                                : 'bg-white border-gray-100 hover:border-gray-300'
                            }`}
                          >
                            <span className="text-xs font-bold block">{t.label}</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">{t.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Catatan Khusus Penawaran</label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Catatan tambahan untuk prospek..."
                        className="w-full text-xs p-3 bg-gray-50 border border-gray-100 hover:border-brand-primary-light focus:border-brand-primary outline-none rounded-xl transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Syarat & Ketentuan</label>
                      <textarea
                        rows={4}
                        value={terms}
                        onChange={(e) => setTerms(e.target.value)}
                        placeholder="Ketentuan jatuh tempo penawaran..."
                        className="w-full text-xs p-3 bg-gray-50 border border-gray-100 hover:border-brand-primary-light focus:border-brand-primary outline-none rounded-xl transition-all"
                      />
                    </div>
                  </div>

                  {/* Right Sheet Mockup Preview */}
                  <div className="md:col-span-3">
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Pratinjau Dokumen Nyata (Skala Sesuai)</label>
                    
                    {/* The actual quotation design sheet */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                      {/* Doc Header Accent Line based on template selection */}
                      <div className={`h-2 rounded-t-3xl ${
                        templateId === 'premium' ? 'bg-gradient-to-r from-amber-500 to-slate-800' :
                        templateId === 'minimalist' ? 'bg-black' : 'bg-brand-primary'
                      }`} />

                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        {/* Company sender info */}
                        <div>
                          {user.businessLogo ? (
                            <img src={preloadedLogoBase64 || user.businessLogo} alt="Logo" className="h-10 max-w-[140px] object-contain mb-3" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm mb-3">
                              {user.businessName?.charAt(0) || 'U'}
                            </div>
                          )}
                          <h4 className="text-sm font-bold text-slate-800">{user.businessName || 'Nama Bisnis Saya'}</h4>
                          <p className="text-[10px] text-gray-400 mt-1 max-w-xs">{user.address || 'Alamat Perusahaan Pendiri'}</p>
                          <p className="text-[10px] text-gray-400">Telp: {user.phone} | Email: {user.email}</p>
                        </div>

                        {/* Document Type Label */}
                        <div className="text-right">
                          <h2 className={`text-xl font-display font-black uppercase tracking-tight ${getTemplateStyles(templateId).accentText}`}>
                            PENAWARAN HARGA
                          </h2>
                          <p className="text-xs font-mono font-bold text-slate-700 mt-1">No: {quotationNumber}</p>
                          <div className="text-[10px] text-gray-400 mt-2 space-y-0.5">
                            <p>Tanggal: <span className="text-slate-800 font-medium">{quotationDate}</span></p>
                            <p>Berlaku Hingga: <span className="text-slate-800 font-medium">{validUntil}</span></p>
                          </div>
                        </div>
                      </div>

                      {/* Recipient Client Info Row */}
                      <div className={`p-4 rounded-2xl bg-gray-50 border ${getTemplateStyles(templateId).borderCol} text-xs`}>
                        <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Ditujukan Kepada:</p>
                        <p className="font-bold text-slate-800 text-sm">
                          {clients.find(c => c.id === selectedClientId)?.name || 'Klien Baru'}
                        </p>
                        <p className="text-gray-500 mt-0.5">
                          {clients.find(c => c.id === selectedClientId)?.businessName || 'Profil Umum'}
                        </p>
                        <p className="text-gray-400 text-[10px] mt-1">
                          Alamat: {clients.find(c => c.id === selectedClientId)?.address || '-'}
                        </p>
                      </div>

                      {/* Line items table render */}
                      <div className="border border-gray-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className={`${getTemplateStyles(templateId).tableHeader} text-[10px] font-mono`}>
                              <th className="py-3 px-4">Deskripsi Layanan / Pekerjaan</th>
                              <th className="py-3 px-4 text-center">Qty</th>
                              <th className="py-3 px-4 text-center">Satuan</th>
                              <th className="py-3 px-4 text-right">Harga Satuan</th>
                              <th className="py-3 px-4 text-center">Disc</th>
                              <th className="py-3 px-4 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {items.map(it => (
                              <tr key={it.id} className="text-[11px]">
                                <td className="py-3 px-4 font-medium text-slate-800">{it.description || 'Item Tanpa Deskripsi'}</td>
                                <td className="py-3 px-4 text-center font-mono">{it.qty}</td>
                                <td className="py-3 px-4 text-center text-gray-400">{it.unit}</td>
                                <td className="py-3 px-4 text-right font-mono">{formatCurrency(it.price, currency)}</td>
                                <td className="py-3 px-4 text-center font-mono text-gray-400">{it.discountPercent}%</td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">{formatCurrency(it.subtotal, currency)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Calculations breakdown block */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          {notes && (
                            <div className="p-3 bg-slate-50 border border-gray-100 rounded-xl mb-3">
                              <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">Catatan Tambahan:</span>
                              <p className="text-[10px] text-slate-600 italic">"{notes}"</p>
                            </div>
                          )}
                          {terms && (
                            <div>
                              <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">Syarat & Ketentuan:</span>
                              <p className="text-[10px] text-gray-400 whitespace-pre-line leading-relaxed">{terms}</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 font-mono text-[11px] text-right">
                          <div className="flex justify-between pl-6 text-gray-500">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(itemsSubtotal, currency)}</span>
                          </div>
                          {globalDiscount > 0 && (
                            <div className="flex justify-between pl-6 text-rose-600">
                              <span>Diskon Global ({globalDiscount}%):</span>
                              <span>-{formatCurrency(discountAmount, currency)}</span>
                            </div>
                          )}
                          {hasTax && (
                            <div className="flex justify-between pl-6 text-amber-600">
                              <span>PPN (11%):</span>
                              <span>+{formatCurrency(taxAmount, currency)}</span>
                            </div>
                          )}
                          {hasTax2 && (
                            <div className="flex justify-between pl-6 text-blue-600">
                              <span>PPh Potongan (2%):</span>
                              <span>-{formatCurrency(tax2Amount, currency)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pl-6 font-bold text-slate-800 border-t border-gray-100 pt-2 text-xs">
                            <span>TOTAL PENAWARAN:</span>
                            <span className={getTemplateStyles(templateId).accentText}>{formatCurrency(total, currency)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Signatures block */}
                      <div className="pt-6 border-t border-gray-50 flex justify-between items-end">
                        <div className="text-[10px] text-gray-400">
                          <p>Diterima dan Disetujui Oleh:</p>
                          <div className="h-16 flex items-center justify-center">
                            <span className="text-gray-300 italic">( Tanda Tangan Klien )</span>
                          </div>
                          <p className="border-t border-dashed border-gray-200 pt-1 text-slate-700 font-bold mt-2">
                            {clients.find(c => c.id === selectedClientId)?.name || 'Perwakilan Klien'}
                          </p>
                        </div>

                        <div className="text-[10px] text-gray-400 text-right">
                          <p>Hormat Kami, {user.businessName}</p>
                          <div className="h-16 flex items-center justify-end">
                            {user.signatureImage ? (
                              <img src={preloadedSignatureBase64 || user.signatureImage} alt="Tanda Tangan" className="h-14 object-contain" />
                            ) : (
                              <span className="text-gray-300 italic mr-6">( Tanda Tangan Digital )</span>
                            )}
                          </div>
                          <p className="border-t border-dashed border-gray-200 pt-1 text-slate-700 font-bold mt-2 inline-block">
                            {user.fullName || 'Nama Penyedia'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-between">
                  <button
                    onClick={() => setFormStep(2)}
                    className="flex items-center gap-1 text-gray-500 hover:text-brand-primary text-xs font-bold px-5 py-3 rounded-xl border border-gray-200 hover:border-brand-primary-light transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Kembali ke Item
                  </button>

                  <button
                    onClick={handleSaveForm}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 bg-brand-primary text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-brand-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Simpan Penawaran Resmi
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. LIVE FULL DETAILED PREVIEW AND ACTIONS MODE */}
      {viewMode === 'preview' && selectedQuotation && (
        <div className="space-y-6">
          {/* Action Button Strip */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center justify-between">
            <button
              onClick={() => {
                setViewMode('list');
                setSelectedQuotation(null);
              }}
              className="text-xs text-gray-500 hover:text-brand-primary flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar
            </button>

            <div className="flex flex-wrap gap-2">
              {/* WhatsApp Share Button */}
              <button
                onClick={() => handleOpenShare('whatsapp')}
                className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl hover:bg-emerald-600 transition-colors cursor-pointer"
                title="Kirim dokumen penawaran lewat WhatsApp dengan template kustom"
              >
                <MessageSquare className="w-4 h-4" /> Kirim WhatsApp
              </button>

              {/* Email Share Button */}
              <button
                onClick={() => handleOpenShare('email')}
                className="flex items-center gap-1.5 bg-sky-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl hover:bg-sky-700 transition-colors cursor-pointer"
                title="Kirim penawaran harga lewat email resmi"
              >
                <Mail className="w-4 h-4" /> Kirim Email
              </button>

              {/* Status Selector dropdown */}
              <select
                value={selectedQuotation.status}
                onChange={(e) => handleUpdateQuotationStatus(selectedQuotation.id, e.target.value as Quotation['status'])}
                className={`text-xs font-bold px-3 py-2 rounded-xl outline-none border cursor-pointer ${getStatusBadgeClass(selectedQuotation.status)}`}
              >
                <option value="Draft">Draft</option>
                <option value="Dikirim">Dikirim</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Ditolak">Ditolak</option>
                <option value="Dibuat Invoice">Dibuat Invoice</option>
              </select>

              {/* Convert trigger */}
              {selectedQuotation.status !== 'Dibuat Invoice' && (
                <button
                  onClick={() => {
                    if (isExpired && onFeatureBlocked) {
                      onFeatureBlocked('Konversi Penawaran ke Invoice Baru');
                    } else {
                      onConvertQuotationToInvoice(selectedQuotation);
                    }
                  }}
                  className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-700 hover:scale-[1.01] shadow-sm transition-all cursor-pointer"
                  title="Konversi otomatis penawaran harga ini menjadi invoice resmi yang dapat ditarik pembayaran"
                >
                  <ArrowLeftRight className="w-4 h-4 animate-pulse" /> Buat Invoice Resmi
                </button>
              )}

              {/* Separate Print and PDF Save buttons */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
                title="Cetak lembar penawaran harga dengan tata letak profesional"
              >
                <Printer className="w-4 h-4" /> Cetak Penawaran
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary/95 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                title="Unduh dokumen penawaran harga PDF berkualitas tinggi"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Menyiapkan PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Simpan PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {errorPdf && (
            <div className="bg-red-50 text-red-600 p-3.5 rounded-xl border border-red-100 text-xs flex items-center gap-2 max-w-4xl mx-auto">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorPdf}</span>
            </div>
          )}

          {/* Detailed Printable Sheet preview */}
          <div id="quotation-print-area" className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-12 shadow-sm space-y-6 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0">
            {/* Header Accent block */}
            <div className={`h-2.5 rounded-t-3xl ${
              selectedQuotation.templateId === 'premium' ? 'bg-gradient-to-r from-amber-500 to-slate-800' :
              selectedQuotation.templateId === 'minimalist' ? 'bg-black' : 'bg-brand-primary'
            }`} />

            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              {/* Sender Details */}
              <div>
                {user.businessLogo ? (
                  <img src={preloadedLogoBase64 || user.businessLogo} alt="Logo" className="h-12 max-w-[150px] object-contain mb-3" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-base mb-3">
                    {user.businessName?.charAt(0) || 'U'}
                  </div>
                )}
                <h4 className="text-base font-bold text-slate-800">{user.businessName || 'Nama Bisnis Saya'}</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-sm whitespace-pre-line leading-relaxed">{user.address || 'Alamat Perusahaan Pendiri'}</p>
                <p className="text-xs text-gray-400 mt-1">Telp: {user.phone} | Email: {user.email}</p>
                {user.taxNumber && <p className="text-xs text-gray-400">NPWP: {user.taxNumber}</p>}
              </div>

              {/* Invoice identifier */}
              <div className="text-right">
                <h1 className={`text-2xl font-display font-black uppercase tracking-tight ${getTemplateStyles(selectedQuotation.templateId).accentText}`}>
                  PENAWARAN HARGA
                </h1>
                <p className="text-sm font-mono font-bold text-slate-700 mt-1">NO: {selectedQuotation.quotationNumber}</p>
                <div className="text-xs text-gray-400 mt-3 space-y-1">
                  <p>Tanggal Penawaran: <span className="text-slate-800 font-bold">{selectedQuotation.date}</span></p>
                  <p>Berlaku Hingga: <span className="text-slate-800 font-bold">{selectedQuotation.validUntil}</span></p>
                  <p>Status: <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeClass(selectedQuotation.status)}`}>{selectedQuotation.status}</span></p>
                </div>
              </div>
            </div>

            {/* Target Client Details block */}
            <div className={`p-4 rounded-2xl bg-gray-50 border ${getTemplateStyles(selectedQuotation.templateId).borderCol} text-xs grid grid-cols-1 md:grid-cols-2 gap-4`}>
              <div>
                <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Ditujukan Kepada:</p>
                <p className="font-bold text-slate-800 text-sm">
                  {selectedQuotation.clientName}
                </p>
                <p className="text-gray-500 mt-0.5">
                  {clients.find(c => c.id === selectedQuotation.clientId)?.businessName || 'Profil Umum'}
                </p>
              </div>
              <div className="space-y-0.5 text-gray-500">
                <p>Email: {clients.find(c => c.id === selectedQuotation.clientId)?.email || '-'}</p>
                <p>Telepon: {clients.find(c => c.id === selectedQuotation.clientId)?.phone || '-'}</p>
                <p className="line-clamp-2">Alamat: {clients.find(c => c.id === selectedQuotation.clientId)?.address || '-'}</p>
              </div>
            </div>

            {/* Line items table render */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`${getTemplateStyles(selectedQuotation.templateId).tableHeader} text-[10px] font-mono uppercase tracking-wider`}>
                    <th className="py-3 px-5">Deskripsi Pekerjaan / Produk</th>
                    <th className="py-3 px-5 text-center">Kuantitas</th>
                    <th className="py-3 px-5 text-center">Satuan</th>
                    <th className="py-3 px-5 text-right">Harga Satuan</th>
                    <th className="py-3 px-5 text-center">Item Disc</th>
                    <th className="py-3 px-5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedQuotation.items.map(it => (
                    <tr key={it.id} className="text-xs">
                      <td className="py-3.5 px-5 font-medium text-slate-800">{it.description}</td>
                      <td className="py-3.5 px-5 text-center font-mono font-bold">{it.qty}</td>
                      <td className="py-3.5 px-5 text-center text-gray-400 font-medium">{it.unit}</td>
                      <td className="py-3.5 px-5 text-right font-mono">{formatCurrency(it.price, selectedQuotation.currency)}</td>
                      <td className="py-3.5 px-5 text-center font-mono text-gray-400">{it.discountPercent}%</td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-800">{formatCurrency(it.subtotal, selectedQuotation.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Spelled-out word, notes, and totals layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                {selectedQuotation.notes && (
                  <div className="p-4 bg-slate-50 border border-gray-100 rounded-2xl">
                    <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">Catatan Tambahan:</span>
                    <p className="text-xs text-slate-600 italic">"{selectedQuotation.notes}"</p>
                  </div>
                )}
                {selectedQuotation.terms && (
                  <div>
                    <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">Syarat & Ketentuan Umum:</span>
                    <p className="text-[11px] text-gray-400 whitespace-pre-line leading-relaxed">{selectedQuotation.terms}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 font-mono text-xs text-right border-t md:border-t-0 md:pl-6 pt-4 md:pt-0">
                <div className="flex justify-between pl-12 text-gray-500">
                  <span>Subtotal Kotor:</span>
                  <span>{formatCurrency(selectedQuotation.subtotal, selectedQuotation.currency)}</span>
                </div>
                {selectedQuotation.globalDiscountPercent > 0 && (
                  <div className="flex justify-between pl-12 text-rose-500 font-bold">
                    <span>Diskon Global ({selectedQuotation.globalDiscountPercent}%):</span>
                    <span>-{formatCurrency(selectedQuotation.discountAmount, selectedQuotation.currency)}</span>
                  </div>
                )}
                {selectedQuotation.hasTax && (
                  <div className="flex justify-between pl-12 text-amber-600 font-bold">
                    <span>PPN (11%):</span>
                    <span>+{formatCurrency(selectedQuotation.taxAmount, selectedQuotation.currency)}</span>
                  </div>
                )}
                {selectedQuotation.hasTax2 && (
                  <div className="flex justify-between pl-12 text-blue-600 font-bold">
                    <span>PPh Potongan (2%):</span>
                    <span>-{formatCurrency(selectedQuotation.tax2Amount, selectedQuotation.currency)}</span>
                  </div>
                )}
                <div className={`flex justify-between pl-12 font-bold text-slate-800 border-t border-gray-100 pt-3 text-sm ${getTemplateStyles(selectedQuotation.templateId).accentLine}`}>
                  <span>TOTAL PENAWARAN:</span>
                  <span>{formatCurrency(selectedQuotation.total, selectedQuotation.currency)}</span>
                </div>

                <div className="text-right pt-4">
                  <span className="text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-1">Terbilang (IDR)</span>
                  <p className="text-[11px] font-bold text-brand-primary italic">"{selectedQuotation.spelledOut}"</p>
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-8 border-t border-gray-100 flex justify-between items-end">
              <div className="text-xs text-gray-400">
                <p>Tanda Tangan Penerima Penawaran (Klien):</p>
                <div className="h-20 flex items-center justify-center">
                  <span className="text-gray-300 italic border border-dashed border-gray-200 px-4 py-2 rounded-xl text-[10px]">Persetujuan Klien</span>
                </div>
                <p className="border-t border-dashed border-gray-200 pt-1 text-slate-700 font-bold mt-2">
                  {selectedQuotation.clientName}
                </p>
              </div>

              <div className="text-xs text-gray-400 text-right">
                <p>Hormat Kami, Penyedia Jasa</p>
                <div className="h-20 flex items-center justify-end relative">
                  {user.signatureImage ? (
                    <img src={preloadedSignatureBase64 || user.signatureImage} alt="Tanda Tangan" className="h-16 object-contain" />
                  ) : (
                    <span className="text-gray-300 italic mr-10">( Tanda Tangan Digital )</span>
                  )}
                  {user.stampImage && (
                    <img src={preloadedStampBase64 || user.stampImage} alt="Cap Stempel" className="h-16 w-16 object-contain absolute right-2 opacity-80" />
                  )}
                </div>
                <p className="border-t border-dashed border-gray-200 pt-1 text-slate-700 font-bold mt-2 inline-block">
                  {user.fullName || 'Nama Penyedia'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK CLIENT MODAL */}
      {quickClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-5 h-5 text-brand-primary" /> Tambah Klien Bisnis Cepat
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">Nama Klien *</label>
                <input
                  type="text"
                  value={qcName}
                  onChange={(e) => setQcName(e.target.value)}
                  placeholder="e.g., Felix Hencia"
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-100 outline-none rounded-lg focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">Nama Instansi / Bisnis</label>
                <input
                  type="text"
                  value={qcBusiness}
                  onChange={(e) => setQcBusiness(e.target.value)}
                  placeholder="e.g., PT Hencia Digital Nusantara"
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-100 outline-none rounded-lg focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={qcEmail}
                    onChange={(e) => setQcEmail(e.target.value)}
                    placeholder="email@bisnis.com"
                    className="w-full text-xs p-2.5 bg-gray-50 border border-gray-100 outline-none rounded-lg focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">Telepon</label>
                  <input
                    type="text"
                    value={qcPhone}
                    onChange={(e) => setQcPhone(e.target.value)}
                    placeholder="0812xxxxxx"
                    className="w-full text-xs p-2.5 bg-gray-50 border border-gray-100 outline-none rounded-lg focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">Alamat Klien</label>
                <textarea
                  rows={2}
                  value={qcAddress}
                  onChange={(e) => setQcAddress(e.target.value)}
                  placeholder="Alamat lengkap..."
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-100 outline-none rounded-lg focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setQuickClientModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleAddQuickClient}
                disabled={!qcName.trim()}
                className="px-4 py-2 bg-brand-primary text-white rounded-lg text-xs font-bold hover:bg-brand-primary/90 cursor-pointer disabled:opacity-50"
              >
                Simpan & Pasang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADVANCED QUOTATION SHARE MODAL (WHATSAPP & EMAIL) */}
      {isShareModalOpen && selectedQuotation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Left sidebar: Channel & Templates */}
            <div className="bg-slate-50 p-6 md:w-72 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-between shrink-0">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Bagikan Penawaran</h3>
                  <p className="text-[11px] text-gray-400 mt-1">Kirim rincian penawaran harga dengan tata letak profesional.</p>
                </div>

                {/* Channel Selector Tab */}
                <div className="flex bg-gray-200/60 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      setShareType('whatsapp');
                      const clientObj = clients.find(c => c.id === selectedQuotation.clientId);
                      const recipient = clientObj?.phone || '';
                      setShareRecipient(recipient);
                      generateShareMessage('whatsapp', shareTemplate, selectedQuotation, recipient);
                      setShareCopied(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      shareType === 'whatsapp' 
                        ? 'bg-emerald-500 text-white shadow-sm' 
                        : 'text-gray-500 hover:text-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      setShareType('email');
                      const clientObj = clients.find(c => c.id === selectedQuotation.clientId);
                      const recipient = clientObj?.email || '';
                      setShareRecipient(recipient);
                      generateShareMessage('email', shareTemplate, selectedQuotation, recipient);
                      setShareCopied(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      shareType === 'email' 
                        ? 'bg-blue-500 text-white shadow-sm' 
                        : 'text-gray-500 hover:text-slate-800'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                </div>

                {/* Message Templates Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Pilih Template</label>
                  
                  <button
                    onClick={() => {
                      setShareTemplate('standard');
                      generateShareMessage(shareType, 'standard', selectedQuotation, shareRecipient);
                      setShareCopied(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      shareTemplate === 'standard'
                        ? 'bg-white border-brand-primary text-brand-primary shadow-sm'
                        : 'bg-transparent border-gray-100 hover:bg-white text-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Template Standar
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Rincian formal penawaran lengkap</p>
                  </button>

                  <button
                    onClick={() => {
                      setShareTemplate('followup');
                      generateShareMessage(shareType, 'followup', selectedQuotation, shareRecipient);
                      setShareCopied(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      shareTemplate === 'followup'
                        ? 'bg-white border-brand-primary text-brand-primary shadow-sm'
                        : 'bg-transparent border-gray-100 hover:bg-white text-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Follow-up / Negosiasi
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Persetujuan & review responsif</p>
                  </button>
                </div>
              </div>

              {/* Informational card at bottom of left rail */}
              <div className="hidden md:block bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/10 mt-4">
                <p className="text-[10px] text-brand-primary leading-relaxed font-semibold">
                  💡 <strong>Tips Pro:</strong> Anda dapat menyesuaikan isi pesan di panel kanan sebelum membuka aplikasi atau menyalin pesan ke clipboard.
                </p>
              </div>
            </div>

            {/* Right Panel: Content preview and manual fields */}
            <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
                    Rincian Kiriman {shareType === 'whatsapp' ? 'WhatsApp' : 'Email'}
                  </span>
                  <button
                    onClick={() => setIsShareModalOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Recipient Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">
                      {shareType === 'whatsapp' ? 'Nomor WhatsApp Klien' : 'Alamat Email Klien'}
                    </label>
                    <div className="relative">
                      {shareType === 'whatsapp' ? (
                        <Smartphone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      ) : (
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      )}
                      <input
                        type="text"
                        value={shareRecipient}
                        onChange={(e) => {
                          setShareRecipient(e.target.value);
                          generateShareMessage(shareType, shareTemplate, selectedQuotation, e.target.value);
                        }}
                        placeholder={shareType === 'whatsapp' ? '0812xxxxxx' : 'client@email.com'}
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 outline-none rounded-xl focus:border-brand-primary"
                      />
                    </div>
                  </div>

                  {shareType === 'email' && (
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">Subjek Email</label>
                      <input
                        type="text"
                        value={shareSubject}
                        onChange={(e) => setShareSubject(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-gray-100 outline-none rounded-xl focus:border-brand-primary"
                      />
                    </div>
                  )}
                </div>

                {/* Editable message content preview */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-gray-400 block">Edit Isi Pesan</label>
                    <span className="text-[10px] font-mono text-gray-300 font-bold">Pratinjau Pesan</span>
                  </div>
                  <textarea
                    rows={10}
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                    className="w-full text-xs p-3.5 bg-slate-900 text-slate-100 outline-none rounded-2xl font-mono leading-relaxed resize-none focus:ring-1 focus:ring-brand-primary border-none shadow-inner animate-fade-in"
                  />
                </div>
              </div>

              {/* Action Area */}
              <div className="mt-6 pt-4 border-t border-gray-50 flex flex-col sm:flex-row gap-2 justify-between items-center">
                {/* Clipboard copy trigger */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareMessage);
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2000);
                  }}
                  className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    shareCopied 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                      : 'bg-white border-gray-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {shareCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500 animate-bounce" /> Berhasil Disalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Salin Pesan
                    </>
                  )}
                </button>

                {/* Main sending trigger triggers */}
                <div className="flex gap-2 w-full sm:w-auto">
                  {shareType === 'whatsapp' ? (
                    <>
                      <button
                        onClick={() => {
                          let cleanPhone = shareRecipient.replace(/[^0-9]/g, '');
                          if (cleanPhone.startsWith('0')) {
                            cleanPhone = '62' + cleanPhone.substring(1);
                          } else if (cleanPhone.startsWith('8')) {
                            cleanPhone = '62' + cleanPhone;
                          }
                          // Open WhatsApp Web
                          window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(shareMessage)}`, '_blank');
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
                        title="Buka menggunakan WhatsApp Web di komputer"
                      >
                        <ExternalLink className="w-4 h-4" /> WA Web
                      </button>

                      <button
                        onClick={() => {
                          let cleanPhone = shareRecipient.replace(/[^0-9]/g, '');
                          if (cleanPhone.startsWith('0')) {
                            cleanPhone = '62' + cleanPhone.substring(1);
                          } else if (cleanPhone.startsWith('8')) {
                            cleanPhone = '62' + cleanPhone;
                          }
                          // Open WhatsApp mobile application
                          window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(shareMessage)}`, '_blank');
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-600 hover:scale-[1.01] transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
                        title="Buka menggunakan aplikasi WhatsApp HP atau desktop"
                      >
                        <MessageSquare className="w-4 h-4" /> Buka WA Jasa
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(shareRecipient)}&su=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareMessage)}`;
                          window.open(gmailUrl, '_blank');
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-red-600 transition-colors cursor-pointer"
                        title="Buka draft baru di Google Gmail Web"
                      >
                        <ExternalLink className="w-4 h-4" /> Buka Gmail
                      </button>

                      <button
                        onClick={() => {
                          const mailtoUrl = `mailto:${encodeURIComponent(shareRecipient)}?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareMessage)}`;
                          window.open(mailtoUrl, '_blank');
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-blue-600 hover:scale-[1.01] transition-all cursor-pointer shadow-sm shadow-blue-500/10"
                        title="Buka aplikasi Mail lokal (Outlook, Mac Mail, dll.)"
                      >
                        <Mail className="w-4 h-4" /> Buka Aplikasi Mail
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
