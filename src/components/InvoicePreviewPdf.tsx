import { 
  X, Printer, Download, Mail, Send, CheckCircle, 
  CornerUpLeft, Smartphone, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { Invoice, UserProfile, Client } from '../types';
import { formatCurrency, formatDateIndonesian, terbilang } from '../utils';
import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import WhatsAppModal from './WhatsAppModal';
import EmailModal from './EmailModal';
import PaymentModal from './PaymentModal';
import { 
  preloadCompanyAssets, 
  waitForImagesToLoad, 
  getFormatFromBase64, 
  sanitizeBase64,
  fetchImageAsBase64 
} from '../utils/assetHelper';

interface InvoicePreviewPdfProps {
  invoice: Invoice;
  user: UserProfile;
  clients: Client[];
  onClose: () => void;
  onMarkAsPaid?: (id: string, paymentMethod?: string, notes?: string, date?: string) => void;
  initialDocumentType?: 'invoice' | 'receipt';
}

export default function InvoicePreviewPdf({
  invoice, user, clients, onClose, onMarkAsPaid, initialDocumentType
}: InvoicePreviewPdfProps) {
  const [template, setTemplate] = useState<'corporate' | 'minimalist' | 'premium'>(invoice.templateId);
  const [documentType, setDocumentType] = useState<'invoice' | 'receipt'>(initialDocumentType || 'invoice');
  
  useEffect(() => {
    if (initialDocumentType) {
      setDocumentType(initialDocumentType);
    }
  }, [initialDocumentType]);
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [sendSuccess, setSendSuccess] = useState('');
  const [errorPdf, setErrorPdf] = useState('');
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const [preloadedLogoBase64, setPreloadedLogoBase64] = useState<string>('');
  const [preloadedSignatureBase64, setPreloadedSignatureBase64] = useState<string>('');
  const [preloadedStampBase64, setPreloadedStampBase64] = useState<string>('');
  const [isPreloadingAssets, setIsPreloadingAssets] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const loadImages = async () => {
      if (!active) return;
      setIsPreloadingAssets(true);
      console.log('[InvoicePreviewPdf] Preloading company assets for high-fidelity rendering...');
      try {
        const assets = await preloadCompanyAssets(user);
        if (active) {
          setPreloadedLogoBase64(assets.businessLogo);
          setPreloadedSignatureBase64(assets.signatureImage);
          setPreloadedStampBase64(assets.stampImage);
        }
      } catch (e) {
        console.error('[InvoicePreviewPdf] Error preloading profile assets:', e);
      } finally {
        if (active) {
          setIsPreloadingAssets(false);
          console.log('[InvoicePreviewPdf] Preloading completed.');
        }
      }
    };
    loadImages();
    return () => {
      active = false;
    };
  }, [user.businessLogo, user.signatureImage, user.stampImage]);

  useEffect(() => {
    if (isPreloadingAssets) return; // Wait for assets to be 100% preloaded and encoded

    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const printId = params.get('print');
    const urlDocType = params.get('docType');

    if (urlDocType === 'receipt') {
      setDocumentType('receipt');
    } else if (urlDocType === 'invoice') {
      setDocumentType('invoice');
    }

    const autoPrintSession = sessionStorage.getItem('autoPrint') === 'true';
    const autoDownloadSession = sessionStorage.getItem('autoDownloadPdf') === 'true';

    // Clear right away to avoid multiple triggers
    if (autoPrintSession) sessionStorage.removeItem('autoPrint');
    if (autoDownloadSession) sessionStorage.removeItem('autoDownloadPdf');

    if (printId === invoice.id || autoPrintSession || autoDownloadSession) {
      if (action === 'print' || autoPrintSession) {
        handlePrint();
      } else if (action === 'download' || autoDownloadSession) {
        handleDownloadPDF();
      }
    }
  }, [invoice.id, isPreloadingAssets]);

  const currentClient = clients.find(c => c.id === invoice.clientId);
  const userCity = user.address 
    ? (user.address.split(',')[1]?.trim() || user.address.split(',')[0]?.trim() || 'Indonesia') 
    : 'Indonesia';
  const rawSpelled = invoice.spelledOut || terbilang(invoice.total, invoice.currency || 'IDR');
  const spelledText = rawSpelled 
    ? (rawSpelled.toLowerCase().endsWith('rupiah') 
        ? rawSpelled 
        : `${rawSpelled} ${invoice.currency === 'IDR' ? 'Rupiah' : ''}`.trim())
    : '';

  const handlePrint = () => {
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      // If inside an iframe sandbox, open in a new tab to escape the sandbox and print perfectly
      const printUrl = `${window.location.origin}${window.location.pathname}?print=${invoice.id}&action=print&docType=${documentType}`;
      window.open(printUrl, '_blank');
      return;
    }

    const element = document.getElementById('invoice-print-area');
    if (!element) return;

    // 1. Remove existing print iframe if any
    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.remove();
    }

    // 2. Create new hidden iframe
    iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // 3. Write print HTML into the iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>Invoice - ${invoice.invoiceNumber}</title>
          <style>
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            @page {
              size: A4;
              margin: 10mm 12mm 10mm 12mm;
            }
            body {
              background: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            /* Target print layout wrapper specifically */
            .invoice-print-body-content {
              display: flex !important;
              flex-direction: column !important;
              justify-content: flex-start !important;
              width: 100% !important;
              max-width: 100% !important;
              min-height: 0 !important;
              height: auto !important;
              overflow: visible !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: white !important;
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
          <div class="invoice-print-body-content ${element.className}" style="border: none !important; box-shadow: none !important; min-height: auto !important; padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; overflow: visible !important; display: block !important;">
            ${element.innerHTML}
          </div>
        </body>
        </html>
      `);
      
      // Copy all style sheets and styled tags to keep tailwind CSS design
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
            console.error('[InvoicePreviewPdf] Failed to print iframe:', err);
            window.print();
          }
        }
      };

      // 4. Wait for all images to load before printing using helper
      waitForImagesToLoad(iframeDoc).then(() => {
        // Additional small grace period to allow layout painting
        setTimeout(runIframePrint, 200);
      });
    }
  };

  const handleDownloadPDF = async () => {
    const params = new URLSearchParams(window.location.search);
    const fromModal = params.get('fromModal') === 'true';
    const isInIframe = window.self !== window.top;
    
    if (isInIframe && !fromModal) {
      // If inside an iframe sandbox, open in a new tab to escape the sandbox and run perfectly
      const downloadUrl = `${window.location.origin}${window.location.pathname}?print=${invoice.id}&action=download&docType=${documentType}`;
      window.open(downloadUrl, '_blank');
      return;
    }

    setIsDownloading(true);
    setErrorPdf('');

    try {
      // Pre-resolve all dynamic image assets to Base64 to ensure they are fully loaded for jsPDF
      let logoBase64 = sanitizeBase64(preloadedLogoBase64);
      if (user.businessLogo && !logoBase64) {
        try {
          const hiddenLogoImg = document.getElementById('invoice-logo-hidden') as HTMLImageElement;
          if (hiddenLogoImg && hiddenLogoImg.src) {
            logoBase64 = sanitizeBase64(hiddenLogoImg.src);
          }
          if (!logoBase64) {
            const previewLogoImg = document.getElementById('invoice-logo-preview') as HTMLImageElement;
            if (previewLogoImg && previewLogoImg.src) {
              logoBase64 = sanitizeBase64(previewLogoImg.src);
            }
          }
          if (!logoBase64) {
            const kuitansiLogoImg = document.getElementById('kuitansi-logo-preview') as HTMLImageElement;
            if (kuitansiLogoImg && kuitansiLogoImg.src) {
              logoBase64 = sanitizeBase64(kuitansiLogoImg.src);
            }
          }
          if (!logoBase64) {
            logoBase64 = sanitizeBase64(await fetchImageAsBase64(user.businessLogo));
          }
        } catch (logoLoadErr) {
          console.error('Error pre-loading business logo Base64:', logoLoadErr);
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

      let signatureBase64 = sanitizeBase64(preloadedSignatureBase64);
      if (user.signatureImage && !signatureBase64) {
        try {
          const hiddenSigImg = document.getElementById('invoice-signature-hidden') as HTMLImageElement;
          if (hiddenSigImg && hiddenSigImg.src) {
            signatureBase64 = sanitizeBase64(hiddenSigImg.src);
          }
          if (!signatureBase64) {
            signatureBase64 = sanitizeBase64(await fetchImageAsBase64(user.signatureImage));
          }
        } catch (sigLoadErr) {
          console.error('Error pre-loading signature Base64:', sigLoadErr);
        }
      }

      let stampBase64 = sanitizeBase64(preloadedStampBase64);
      if (user.stampImage && !stampBase64) {
        try {
          const hiddenStampImg = document.getElementById('invoice-stamp-hidden') as HTMLImageElement;
          if (hiddenStampImg && hiddenStampImg.src) {
            stampBase64 = sanitizeBase64(hiddenStampImg.src);
          }
          if (!stampBase64) {
            stampBase64 = sanitizeBase64(await fetchImageAsBase64(user.stampImage));
          }
        } catch (stampLoadErr) {
          console.error('Error pre-loading stamp Base64:', stampLoadErr);
        }
      }

      // Helper function to detect image format for jsPDF
      const getFormatFromBase64 = (base64Str: string): string => {
        if (!base64Str) return 'PNG';
        if (base64Str.includes('image/jpeg') || base64Str.includes('image/jpg')) {
          return 'JPEG';
        }
        if (base64Str.includes('image/webp')) {
          return 'WEBP';
        }
        return 'PNG';
      };

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

      // --- GENERATE RECEIPT / KUITANSI PDF ---
      if (documentType === 'receipt') {
        // Draw elegant double borders
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(1.2);
        doc.rect(15, 15, 180, 267, 'S'); // Outer border
        
        doc.setLineWidth(0.4);
        doc.rect(17, 17, 176, 263, 'S'); // Inner accent border
        
        // Header
        if (logoBase64) {
          try {
            const maxW = 32;
            const maxH = 14;
            const ratio = Math.min(maxW / originalLogoWidth, maxH / originalLogoHeight);
            const logoW = originalLogoWidth * ratio;
            const logoH = originalLogoHeight * ratio;

            const format = getFormatFromBase64(logoBase64);
            // Draw company logo on the left of the header
            doc.addImage(logoBase64, format, 25, 21, logoW, logoH);
          } catch (logoErr) {
            console.error('Error drawing logo in receipt PDF:', logoErr);
          }
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(31, 41, 55);
          doc.text(user.businessName, 25, 37);
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(17);
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.text('KUITANSI PEMBAYARAN', 185, 30, { align: 'right' });
          
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8.5);
          doc.setTextColor(120, 130, 140);
          doc.text('OFFICIAL PAYMENT RECEIPT', 185, 35, { align: 'right' });
        } else {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(21);
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.text('KUITANSI PEMBAYARAN', 105, 31, { align: 'center' });
          
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9.5);
          doc.setTextColor(120, 130, 140);
          doc.text('OFFICIAL PAYMENT RECEIPT', 105, 36, { align: 'center' });
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(31, 41, 55);
          doc.text(user.businessName, 105, 41, { align: 'center' });
        }

        // Divider
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.8);
        doc.line(22, 46, 188, 46);

        // Metadata: No Kuitansi & Tanggal
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(31, 41, 55);
        doc.text(`No. Kuitansi :  KW-${invoice.invoiceNumber}`, 25, 56);
        doc.text(`Tanggal         :  ${formatDateIndonesian(invoice.date)}`, 128, 56);

        // Content rows
        let rowY = 74;
        const colLabelX = 25;
        const colValueX = 72;
        
        doc.setDrawColor(220, 225, 230);
        doc.setLineWidth(0.2);

        const drawReceiptRow = (labelInd: string, labelEng: string, value: string, linesCount: number = 1) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(100, 110, 120);
          doc.text(labelInd, colLabelX, rowY);
          
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(150, 160, 170);
          doc.text(labelEng, colLabelX, rowY + 3.5);
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10.5);
          doc.setTextColor(31, 41, 55);
          
          const wrappedValue = doc.splitTextToSize(value, 112);
          doc.text(wrappedValue, colValueX, rowY + 1.5);
          
          const underlineY = rowY + (linesCount * 5.5) + 2.5;
          doc.line(colValueX, underlineY, 185, underlineY);
          
          rowY = underlineY + 11;
        };

        // 1. Telah Diterima Dari
        drawReceiptRow(
          'Telah Diterima Dari',
          'Received From',
          currentClient?.name || invoice.clientName || '-'
        );

        // 2. Uang Sejumlah
        drawReceiptRow(
          'Uang Sejumlah',
          'Amount In Words',
          spelledText,
          2
        );

        // 3. Untuk Pembayaran
        const itemsDescriptions = invoice.items.map(i => i.description).join(', ');
        const forPaymentText = `Pelunasan Invoice No. ${invoice.invoiceNumber} - ${itemsDescriptions}`;
        drawReceiptRow(
          'Untuk Pembayaran',
          'For Payment Of',
          forPaymentText,
          2
        );

        // 4. Metode Pembayaran
        const displayPaymentMethod = invoice.paymentMethodInfo || (invoice.notes?.toLowerCase().includes('cash') ? 'Tunai / Cash' : 'Bank Transfer');
        drawReceiptRow(
          'Metode Pembayaran',
          'Payment Method',
          displayPaymentMethod,
          1
        );

        // Nominal Box bottom left
        const nominalY = rowY + 6;
        doc.setFillColor(terbilangBg[0], terbilangBg[1], terbilangBg[2]);
        doc.roundedRect(25, nominalY, 78, 18, 1.5, 1.5, 'F');
        
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.6);
        doc.roundedRect(25, nominalY, 78, 18, 1.5, 1.5, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`Rp ${formatCurrency(invoice.total, invoice.currency)}`, 64, nominalY + 11, { align: 'center' });

        // Signature block bottom right
        const signatureX = 142;
        const signatureY = rowY + 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(75, 85, 99);
        doc.text(`${userCity}, ${formatDateIndonesian(invoice.date)}`, signatureX, signatureY, { align: 'center' });
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('Penerima / Bendahara', signatureX, signatureY + 5, { align: 'center' });

        // DRAW DIGITAL SIGNATURE FIRST (Draw first so stamp overlaps on top)
        if (signatureBase64) {
          try {
            const format = getFormatFromBase64(signatureBase64);
            doc.addImage(signatureBase64, format, signatureX - 14, signatureY + 8, 28, 15);
          } catch (sigErr) {
            console.error('Error drawing signature on kuitansi PDF:', sigErr);
          }
        }

        // DRAW DIGITAL STAMP SECOND (Overlaps the signature perfectly)
        if (stampBase64) {
          try {
            const format = getFormatFromBase64(stampBase64);
            // Overlapping slightly to the left of the signature center
            doc.addImage(stampBase64, format, signatureX - 22, signatureY + 6, 18, 18);
          } catch (stampErr) {
            console.error('Error drawing stamp on kuitansi PDF:', stampErr);
          }
        }

        // Signatory Name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(31, 41, 55);
        doc.text(user.fullName || '', signatureX, signatureY + 37, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(user.businessName || '', signatureX, signatureY + 41, { align: 'center' });

        // Footer brand
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(156, 163, 175);
        doc.text('Kuitansi ini diterbitkan secara resmi melalui sistem FID INVOICE dan sah tanpa tanda tangan basah.', 105, 272, { align: 'center' });

        // Save PDF
        doc.save(`KUITANSI_PEMBAYARAN_${invoice.invoiceNumber}.pdf`);
        setIsDownloading(false);
        return;
      }

      // --- LOGO OR COMPANY INITIALS BADGE ---
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

      // --- RIGHT SIDE HEADER: INVOICE INFORMATION ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('INVOICE PENAGIHAN', 190, startY + 4, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);
      doc.text(invoice.invoiceNumber, 190, startY + 10, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);
      doc.text(`Tanggal Invoice: ${formatDateIndonesian(invoice.date)}`, 190, startY + 15, { align: 'right' });
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(185, 28, 28); // Red-700 warning
      doc.text(`Jatuh Tempo: ${formatDateIndonesian(invoice.dueDate)}`, 190, startY + 20, { align: 'right' });

      // Determine bottom of header section
      const headerBottomY = Math.max(currentLeftY + 2, startY + 24);

      // --- DECORATIVE ACCENT LINE ---
      doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
      doc.setLineWidth(template === 'corporate' ? 0.8 : 0.4);
      doc.line(20, headerBottomY, 190, headerBottomY);

      // --- CLIENT & BILLING DETAILS SIDE-BY-SIDE ---
      const billingY = headerBottomY + 8;
      
      // Ditagihkan Oleh (Billed By)
      doc.setFillColor(cardBgColor);
      doc.setDrawColor(cardBorderColor);
      doc.setLineWidth(0.2);
      doc.roundedRect(20, billingY, 82, 32, 2, 2, 'FD');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175); // Gray 400
      doc.text('DITAGIHKAN OLEH:', 24, billingY + 5);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(31, 41, 55);
      doc.text(user.fullName || '', 24, billingY + 10);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);
      doc.text(user.email || '', 24, billingY + 15);
      doc.text(user.phone || '', 24, billingY + 20);
      
      // Ditujukan Kepada (Billed To)
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
      doc.text(currentClient?.name || invoice.clientName || '', 112, billingY + 10);
      
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
      
      const tableBody = invoice.items.map((it, idx) => {
        let descriptionFull = it.description;
        if (it.discountPercent > 0) {
          descriptionFull += `\n(Diskon Item: ${it.discountPercent}%)`;
        }
        return [
          (idx + 1).toString(),
          descriptionFull,
          `${it.qty} ${it.unit}`,
          formatCurrency(it.price, invoice.currency),
          formatCurrency(it.subtotal, invoice.currency)
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
      
      // We need about 65mm for the entire bottom section (Totals, Terms, Signature). 
      // If we don't have enough room on the current page, start a new page to keep them beautifully together.
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
      drawTotalRow('Subtotal Item:', formatCurrency(invoice.subtotal, invoice.currency), totalsY);
      totalsY += 4.5;

      // Global Discount
      if (invoice.globalDiscountPercent > 0) {
        drawTotalRow(`Diskon Global (${invoice.globalDiscountPercent}%):`, `-${formatCurrency(invoice.discountAmount, invoice.currency)}`, totalsY);
        totalsY += 4.5;
      }

      // PPN Tax 1
      if (invoice.hasTax) {
        drawTotalRow('PPN (11%):', `+${formatCurrency(invoice.taxAmount, invoice.currency)}`, totalsY);
        totalsY += 4.5;
      }

      // PPh23 Tax 2
      if (invoice.hasTax2) {
        drawTotalRow('PPh 23 (2% Potongan):', `-${formatCurrency(invoice.tax2Amount, invoice.currency)}`, totalsY);
        totalsY += 4.5;
      }

      // Grand Total separating border line
      doc.setDrawColor(229, 231, 235); // gray-200
      doc.setLineWidth(0.4);
      doc.line(112, totalsY - 1, 190, totalsY - 1);
      
      // Grand Total
      totalsY += 2;
      drawTotalRow('Grand Total:', formatCurrency(invoice.total, invoice.currency), totalsY, true);

      // Paid Amount & Amount Due details
      const isPaid = invoice.status === 'Lunas';
      const paidVal = isPaid ? invoice.total : 0;
      const dueVal = isPaid ? 0 : invoice.total;

      totalsY += 4.5;
      drawTotalRow('Jumlah Dibayar (Paid):', formatCurrency(paidVal, invoice.currency), totalsY);

      totalsY += 4.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      if (isPaid) {
        doc.setTextColor(22, 163, 74); // green
      } else {
        doc.setTextColor(185, 28, 28); // red
      }
      doc.text('Sisa Tagihan (Amount Due):', 112, totalsY);
      doc.text(formatCurrency(dueVal, invoice.currency), 190, totalsY, { align: 'right' });

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
      const wrappedNotes = doc.splitTextToSize(invoice.notes || '-', 80);
      doc.text(wrappedNotes, 20, currentY + 4);

      // Instruksi Pembayaran
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text('INSTRUKSI PEMBAYARAN:', 108, currentY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      const wrappedTerms = doc.splitTextToSize(invoice.terms || '-', 82);
      doc.text(wrappedTerms, 108, currentY + 4);

      const notesBottomHeight = Math.max(wrappedNotes.length, wrappedTerms.length) * 3.5;
      currentY += Math.max(10, notesBottomHeight + 6);

      // --- SIGNATURE AREA (Bottom Right) ---
      // Safely start new page ONLY if notes/terms overflow near the bottom edge
      if (currentY > 255) {
        doc.addPage();
        currentY = 25;
      }

      const sigY = currentY + 2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text('Hormat Kami,', 150, sigY);

      // DRAW DIGITAL SIGNATURE FIRST (Draw first so stamp overlaps on top)
      if (signatureBase64) {
        try {
          const format = getFormatFromBase64(signatureBase64);
          doc.addImage(signatureBase64, format, 146, sigY + 2, 28, 15);
        } catch (sigErr) {
          console.error('Error drawing signature on invoice PDF:', sigErr);
        }
      }

      // DRAW DIGITAL STAMP SECOND (Overlaps the signature perfectly)
      if (stampBase64) {
        try {
          const format = getFormatFromBase64(stampBase64);
          // Placed at x=140 to overlap the left portion of the signature at x=146
          doc.addImage(stampBase64, format, 140, sigY + 1, 18, 16);
        } catch (stampErr) {
          console.error('Error drawing stamp on invoice PDF:', stampErr);
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

      // --- PAGE NUMBERING AND WATERMARK PAID ---
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Paid/Overdue Watermark
        if (invoice.status === 'Lunas') {
          doc.saveGraphicsState();
          doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(65);
          doc.setTextColor(34, 197, 94); // Green
          doc.text('LUNAS', 105, 150, { align: 'center', angle: 45 });
          doc.restoreGraphicsState();
        } else if (invoice.status === 'Jatuh Tempo') {
          doc.saveGraphicsState();
          doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(55);
          doc.setTextColor(239, 68, 68); // Red
          doc.text('OVERDUE', 105, 150, { align: 'center', angle: 45 });
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
          doc.text(`Invoice: ${invoice.invoiceNumber} | ${user.businessName}`, 20, 12);
        }

        // Footer at the absolute bottom
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(156, 163, 175); // Gray 400
        doc.text('Terima kasih atas kerja sama bisnis Anda.', 20, 287);
        doc.text(`Halaman ${i} dari ${totalPages}`, 190, 287, { align: 'right' });
      }

      // --- TRIGGER FILE SAVE / DOWNLOAD ---
      const sanitizedClientName = (currentClient?.name || invoice.clientName || 'Klien')
        .replace(/[^a-zA-Z0-9]/g, '_');
      const finalFileName = `Invoice-${invoice.invoiceNumber}-${sanitizedClientName}.pdf`;
      
      doc.save(finalFileName);
      setIsDownloading(false);
    } catch (err: any) {
      console.error('Failed to generate professional PDF via jsPDF:', err);
      setErrorPdf(err.message || 'Gagal merender file PDF. Silakan coba kembali atau gunakan tombol Cetak Langsung.');
      setIsDownloading(false);
    }
  };

  const handleSendEmail = () => {
    setEmailModalOpen(true);
  };

  const handleSendWhatsApp = () => {
    setWhatsAppModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans text-left pb-16 no-print">
      {/* Hidden image element to guarantee the browser loads the logo and keeps it in the DOM for PDF generation */}
      {user.businessLogo && (
        <img 
          id="invoice-logo-hidden" 
          src={preloadedLogoBase64 || user.businessLogo} 
          alt="Hidden Logo" 
          style={{ display: 'none' }} 
        />
      )}
      {/* Hidden signature image element to guarantee the browser loads it and keeps it in the DOM for PDF generation */}
      {user.signatureImage && (
        <img 
          id="invoice-signature-hidden" 
          src={preloadedSignatureBase64 || user.signatureImage} 
          alt="Hidden Signature" 
          style={{ display: 'none' }} 
        />
      )}
      {/* Hidden stamp image element to guarantee the browser loads it and keeps it in the DOM for PDF generation */}
      {user.stampImage && (
        <img 
          id="invoice-stamp-hidden" 
          src={preloadedStampBase64 || user.stampImage} 
          alt="Hidden Stamp" 
          style={{ display: 'none' }} 
        />
      )}
      
      {/* Top action header (Skips print automatically with .no-print class) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <button 
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-primary font-bold cursor-pointer"
          >
            <CornerUpLeft className="w-4 h-4" />
            Kembali ke Daftar
          </button>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-brand-dark mt-2">
            Pratinjau Invoice Resmi ({invoice.invoiceNumber})
          </h1>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-wrap gap-2 text-xs font-bold shrink-0">
          <button 
            onClick={handleDownloadPDF}
            disabled={isDownloading || isPreloadingAssets}
            className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
          >
            {isPreloadingAssets ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isPreloadingAssets ? 'Memuat Aset...' : isDownloading ? 'Mengunduh PDF...' : 'Simpan Sebagai PDF'}
          </button>

          <button 
            onClick={handlePrint}
            disabled={isPreloadingAssets || isDownloading}
            className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
          >
            {isPreloadingAssets ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            {isPreloadingAssets ? 'Memuat Aset...' : 'Cetak Langsung'}
          </button>

          <button 
            onClick={handleSendWhatsApp}
            className="px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl border border-green-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            Kirim WhatsApp
          </button>

          <button 
            onClick={handleSendEmail}
            className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            Kirim Email Klien
          </button>

          {invoice.status !== 'Lunas' && onMarkAsPaid && (
            <button 
              onClick={() => setPaymentModalOpen(true)}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Tandai Lunas
            </button>
          )}
        </div>
      </div>

      {sendSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-xs text-green-600 font-bold flex items-center gap-1.5">
          <CheckCircle className="w-4.5 h-4.5 text-green-500" />
          {sendSuccess}
        </div>
      )}

      {errorPdf && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-bold flex flex-col gap-1.5 no-print">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4.5 h-4.5 text-red-500" />
            <span>Terjadi Kesalahan Pembuatan PDF</span>
          </div>
          <p className="font-medium text-red-500/90 ml-6">{errorPdf}</p>
        </div>
      )}

      {/* Informative Tip Banner for iframe and print compatibility */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-3 no-print">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-amber-950">Tips Hasil Cetak & Simpan PDF Maksimal 💡</p>
          <p className="text-amber-950 leading-relaxed font-medium">
            Jika tombol <span className="font-bold">Simpan Sebagai PDF</span> atau <span className="font-bold">Cetak Langsung</span> tidak memunculkan dialog pengunduhan (karena batasan keamanan sistem iframe preview), silakan klik tombol <span className="font-bold text-brand-primary">Buka di Tab Baru ↗</span> di pojok kanan atas layar Anda untuk membukanya secara penuh, lalu jalankan kembali fiturnya. Di tab baru, fitur cetak dan simpan PDF browser dijamin berjalan 100% lancar dan maksimal!
          </p>
        </div>
      </div>

      {/* Grid of designs & real preview sheet */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Design picker bar left */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 no-print">
          
          {/* Tipe Dokumen Selector */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-50">Tipe Dokumen</h3>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-150">
              <button
                type="button"
                onClick={() => setDocumentType('invoice')}
                className={`px-2 py-2 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer text-center ${documentType === 'invoice' ? 'bg-white text-brand-dark shadow-xs border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                📝 Invoice
              </button>
              <button
                type="button"
                onClick={() => setDocumentType('receipt')}
                className={`px-2 py-2 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer text-center ${documentType === 'receipt' ? 'bg-white text-brand-dark shadow-xs border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                🧾 Kuitansi
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-50">Tema Tampilan</h3>
            
            <div className="space-y-2.5">
              <button 
                onClick={() => setTemplate('corporate')} 
                className={`w-full text-left p-3 rounded-xl border-2 text-xs font-bold flex justify-between items-center transition-all ${template === 'corporate' ? 'border-brand-primary bg-brand-primary-light/10 text-brand-primary' : 'border-gray-150 hover:border-gray-200 text-gray-700'}`}
              >
                <span>Corporate Blue</span>
                <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
              </button>

              <button 
                onClick={() => setTemplate('minimalist')} 
                className={`w-full text-left p-3 rounded-xl border-2 text-xs font-bold flex justify-between items-center transition-all ${template === 'minimalist' ? 'border-brand-primary bg-brand-primary-light/10 text-brand-primary' : 'border-gray-150 hover:border-gray-200 text-gray-700'}`}
              >
                <span>Minimalist White</span>
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              </button>

              <button 
                onClick={() => setTemplate('premium')} 
                className={`w-full text-left p-3 rounded-xl border-2 text-xs font-bold flex justify-between items-center transition-all ${template === 'premium' ? 'border-brand-primary bg-brand-primary-light/10 text-brand-primary' : 'border-gray-150 hover:border-gray-200 text-gray-700'}`}
              >
                <span>Premium Gold</span>
                <span className="w-2 h-2 rounded-full bg-brand-gold"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Real preview sheet paper right (Styled to A4 dimensions) */}
        <div id="invoice-print-area" className="lg:col-span-9 bg-white p-8 sm:p-10 rounded-2xl border border-gray-200 shadow-xl max-w-2xl mx-auto overflow-hidden relative min-h-[840px] flex flex-col justify-between text-xs print:p-0 print:shadow-none print:border-none">
          
          {/* Watermark paid */}
          {invoice.status === 'Lunas' && (
            <div className="absolute top-1/3 left-1/4 transform -rotate-45 text-green-500/10 text-8xl font-black font-display tracking-widest uppercase pointer-events-none select-none">
              PAID
            </div>
          )}

          {invoice.status === 'Jatuh Tempo' && (
            <div className="absolute top-1/3 left-1/4 transform -rotate-45 text-red-500/10 text-8xl font-black font-display tracking-widest uppercase pointer-events-none select-none">
              OVERDUE
            </div>
          )}

          {/* Template rendering logic */}
          {documentType === 'receipt' ? (
            <div className="space-y-6 py-4 flex-1 flex flex-col justify-between">
              
              {/* Outer double border styling like classical kuitansi */}
              <div className={`p-6 border-4 border-double rounded-xl ${template === 'corporate' ? 'border-brand-primary/40' : template === 'premium' ? 'border-brand-gold/40' : 'border-gray-300'}`}>
                
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-gray-150 text-left">
                  <div className="flex items-center gap-3">
                    {user.businessLogo ? (
                      <img id="kuitansi-logo-preview" src={preloadedLogoBase64 || user.businessLogo} alt="Logo" className="h-10 object-contain" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-brand-primary flex items-center justify-center font-bold text-white text-xs">LOGO</div>
                    )}
                    <div>
                      <h2 className={`text-base sm:text-lg font-display font-black tracking-widest ${template === 'corporate' ? 'text-brand-primary' : template === 'premium' ? 'text-brand-dark' : 'text-gray-800'}`}>
                        KUITANSI PEMBAYARAN
                      </h2>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none">OFFICIAL PAYMENT RECEIPT</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-[10px] font-bold text-gray-800">{user.businessName}</h3>
                    <p className="text-[8px] text-gray-400 font-mono">NPWP: {user.taxNumber || '-'}</p>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="flex justify-between items-center text-xs font-bold pt-4 text-gray-700">
                  <p>No. Kuitansi: <span className="font-mono font-black text-brand-dark">KW-{invoice.invoiceNumber}</span></p>
                  <p>Tanggal: <span className="text-brand-dark">{formatDateIndonesian(invoice.date)}</span></p>
                </div>

                {/* Receipt Grid Body */}
                <div className="space-y-6 mt-8">
                  
                  {/* Telah Diterima Dari */}
                  <div className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-4 space-y-0.5 text-left">
                      <p className="text-xs font-black text-gray-500">Telah Diterima Dari</p>
                      <p className="text-[9px] font-semibold italic text-gray-400">Received From</p>
                    </div>
                    <div className="col-span-8 border-b border-dashed border-gray-300 pb-1.5 text-left font-display font-black text-sm text-brand-dark">
                      {currentClient?.name || invoice.clientName || '-'} {currentClient?.businessName && `(${currentClient.businessName})`}
                    </div>
                  </div>

                  {/* Uang Sejumlah */}
                  <div className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-4 space-y-0.5 text-left">
                      <p className="text-xs font-black text-gray-500">Uang Sejumlah</p>
                      <p className="text-[9px] font-semibold italic text-gray-400">Amount in Words</p>
                    </div>
                    <div className="col-span-8 border-b border-dashed border-gray-300 pb-1.5 text-left">
                      <div className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-extrabold italic text-gray-700 font-serif leading-relaxed">
                        {spelledText}
                      </div>
                    </div>
                  </div>

                  {/* Untuk Pembayaran */}
                  <div className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-4 space-y-0.5 text-left">
                      <p className="text-xs font-black text-gray-500">Untuk Pembayaran</p>
                      <p className="text-[9px] font-semibold italic text-gray-400">For Payment of</p>
                    </div>
                    <div className="col-span-8 border-b border-dashed border-gray-300 pb-1.5 text-left text-xs font-bold text-gray-800 leading-relaxed">
                      Pelunasan Tagihan Invoice No. {invoice.invoiceNumber} - {invoice.items.map(it => it.description).join(', ')}
                    </div>
                  </div>

                  {/* Metode Pembayaran */}
                  <div className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-4 space-y-0.5 text-left">
                      <p className="text-xs font-black text-gray-500">Metode Pembayaran</p>
                      <p className="text-[9px] font-semibold italic text-gray-400">Payment Method</p>
                    </div>
                    <div className="col-span-8 border-b border-dashed border-gray-300 pb-1.5 text-left text-xs font-bold text-gray-800 leading-relaxed flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600 font-extrabold uppercase tracking-wider">
                        {invoice.paymentMethodInfo || (invoice.notes?.toLowerCase().includes('cash') ? 'Tunai / Cash' : 'Bank Transfer')}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Bottom Segment */}
                <div className="grid grid-cols-12 gap-4 mt-12 items-end">
                  
                  {/* Nominal Box */}
                  <div className="col-span-6">
                    <div className={`p-4 rounded-xl border-2 font-display text-center relative overflow-hidden flex flex-col justify-center items-center ${
                      template === 'corporate' 
                        ? 'bg-blue-50/75 border-brand-primary text-brand-primary shadow-xs' 
                        : template === 'premium' 
                        ? 'bg-amber-50/75 border-brand-gold text-brand-dark shadow-xs' 
                        : 'bg-gray-50 border-gray-400 text-gray-800 shadow-xs'
                    }`}>
                      <p className="text-[8px] font-black uppercase tracking-wider opacity-60 mb-1">JUMLAH NOMINAL / AMOUNT</p>
                      <p className="text-lg sm:text-xl font-mono font-black tracking-tight">
                        Rp {formatCurrency(invoice.total, invoice.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Signature Section */}
                  <div className="col-span-6 text-center space-y-1 relative">
                    <p className="text-[10px] text-gray-500 font-medium">
                      {userCity}, {formatDateIndonesian(invoice.date)}
                    </p>
                    <p className="text-xs font-black text-gray-700">Penerima / Bendahara</p>
                    
                    <div className="h-20 flex items-center justify-center relative my-1">
                      {/* Electronic Signature (Drawn behind the stamp) */}
                      {user.signatureImage ? (
                        <img src={preloadedSignatureBase64 || user.signatureImage} alt="Tanda Tangan" className="h-16 object-contain z-10 relative" />
                      ) : null}

                      {/* Electronic Stamp (Drawn over/overlapping the signature) */}
                      {user.stampImage ? (
                        <img src={preloadedStampBase64 || user.stampImage} alt="Cap Stempel" className="h-16 w-16 object-contain absolute z-20 opacity-80 mix-blend-multiply translate-x-[-12px] translate-y-[2px] pointer-events-none select-none" />
                      ) : null}
                    </div>

                    <p className="text-xs font-black text-brand-dark underline decoration-gray-300 decoration-wavy underline-offset-4">
                      {user.fullName}
                    </p>
                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                      {user.businessName}
                    </p>
                  </div>

                </div>

              </div>

              {/* Note / Terms */}
              <div className="grid grid-cols-1 gap-1 text-[9px] text-left pt-4 border-t border-gray-100">
                <p className="font-bold text-gray-400 uppercase text-[8px]">Catatan Pengesahan:</p>
                <p className="text-gray-500 leading-relaxed italic">
                  Kuitansi ini merupakan bukti pembayaran yang sah dan diterbitkan secara elektronik melalui sistem administrasi FID INVOICE.
                </p>
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Template Header 1: Corporate Blue */}
              {template === 'corporate' && (
                <div className="flex justify-between items-start border-b-2 border-brand-primary pb-4">
                  <div>
                    {user.businessLogo ? (
                      <img id="invoice-logo-preview" src={preloadedLogoBase64 || user.businessLogo} alt="Logo" className="h-10 object-contain mb-2" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-brand-primary flex items-center justify-center font-bold text-white text-xs mb-2">LOGO</div>
                    )}
                    <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight leading-none">{user.businessName}</h2>
                    <p className="text-[10px] text-gray-500 mt-1.5 max-w-xs leading-relaxed">{user.address}</p>
                    {user.taxNumber && <p className="text-[10px] text-gray-400 font-mono mt-0.5">NPWP: {user.taxNumber}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black tracking-widest text-brand-primary uppercase">INVOICE PENAGIHAN</span>
                    <h3 className="text-sm font-bold font-mono text-gray-800 mt-1">{invoice.invoiceNumber}</h3>
                  </div>
                </div>
              )}

              {/* Template Header 2: Minimalist White */}
              {template === 'minimalist' && (
                <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                  <div>
                    {user.businessLogo ? (
                      <img id="invoice-logo-preview" src={preloadedLogoBase64 || user.businessLogo} alt="Logo" className="h-10 object-contain mb-2" />
                    ) : null}
                    <h2 className="text-base font-bold text-gray-900 uppercase tracking-tight leading-none">{user.businessName}</h2>
                    <p className="text-[9px] text-gray-400 mt-1.5 max-w-xs leading-relaxed">{user.address}</p>
                    {user.taxNumber && <p className="text-[9px] text-gray-400 font-mono mt-0.5">NPWP: {user.taxNumber}</p>}
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-[8px] text-gray-400 uppercase tracking-widest">INVOICE NO.</p>
                    <p className="text-xs font-mono font-bold text-gray-800">{invoice.invoiceNumber}</p>
                  </div>
                </div>
              )}

              {/* Template Header 3: Premium Gold */}
              {template === 'premium' && (
                <div className="space-y-3 pb-4 border-b border-gray-100">
                  <div className="h-2 bg-brand-gold -mx-16 -mt-16 print:-mx-0 print:-mt-0"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      {user.businessLogo ? (
                        <img id="invoice-logo-preview" src={preloadedLogoBase64 || user.businessLogo} alt="Logo" className="h-10 object-contain mb-2" />
                      ) : null}
                      <h2 className="text-lg font-extrabold text-slate-950 font-display tracking-tight uppercase leading-none">{user.businessName}</h2>
                      <p className="text-[10px] text-gray-500 mt-1.5 max-w-xs leading-relaxed">{user.address}</p>
                      {user.taxNumber && <p className="text-[10px] text-gray-400 font-mono mt-0.5">NPWP: {user.taxNumber}</p>}
                    </div>
                    <div className="text-right bg-slate-900 text-white p-3 rounded-xl shrink-0">
                      <p className="text-[8px] font-mono font-bold text-brand-gold tracking-widest uppercase">Tagihan Invoice</p>
                      <p className="text-xs font-mono font-bold mt-0.5">{invoice.invoiceNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sender & Receiver metadata */}
              <div className="grid grid-cols-2 gap-4 text-[10px] text-left print-avoid-break">
                <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
                  <p className="text-[8px] font-mono font-semibold tracking-wider text-gray-400 uppercase">Ditagihkan Oleh (Sender):</p>
                  <p className="font-bold text-gray-800 text-xs">{user.fullName}</p>
                  <p className="text-gray-500">{user.email}</p>
                  <p className="text-gray-500">{user.phone}</p>
                </div>

                <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
                  <p className="text-[8px] font-mono font-semibold tracking-wider text-gray-400 uppercase">Ditujukan Kepada (Client):</p>
                  {currentClient ? (
                    <>
                      <p className="font-bold text-gray-800 text-xs">{currentClient.name}</p>
                      {currentClient.businessName && <p className="text-gray-500 font-medium">{currentClient.businessName}</p>}
                      <p className="text-gray-500">{currentClient.email}</p>
                      <p className="text-gray-400 line-clamp-2">{currentClient.address}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-gray-800 text-xs">{invoice.clientName}</p>
                      <p className="text-red-500 italic font-medium">Klien telah dihapus dari database.</p>
                    </>
                  )}
                </div>
              </div>

              {/* Dates row */}
              <div className="flex justify-between text-[10px] text-gray-600 border-y border-gray-100 py-2.5 px-2 text-left print-avoid-break bg-slate-50/50">
                <span><strong>Tanggal Invoice:</strong> {formatDateIndonesian(invoice.date)}</span>
                <span><strong>Mata Uang:</strong> {invoice.currency}</span>
                <span className="text-red-600 font-bold"><strong>Tanggal Jatuh Tempo:</strong> {formatDateIndonesian(invoice.dueDate)}</span>
              </div>

              {/* Invoice Line Items (Upgraded to structured HTML table) */}
              <div className="text-left overflow-visible">
                <table className="w-full text-left border-collapse overflow-visible">
                  <thead>
                    <tr className={`text-[9px] uppercase tracking-wider font-bold text-white ${
                      template === 'corporate' 
                        ? 'bg-brand-primary text-white' 
                        : template === 'premium' 
                        ? 'bg-slate-900 text-brand-gold' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <th className="py-2.5 px-3 rounded-l-lg text-left">Deskripsi Layanan / Produk</th>
                      <th className="py-2.5 px-2 text-center w-16">Qty</th>
                      <th className="py-2.5 px-2 text-right w-28">Harga Satuan</th>
                      <th className="py-2.5 px-3 text-right w-28 rounded-r-lg">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[10px]">
                    {invoice.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                        <td className="py-1.5 px-3">
                          <p className="font-bold text-gray-800 leading-normal">{it.description}</p>
                          {it.discountPercent > 0 && <p className="text-[9px] text-red-500 mt-0.5 font-medium">Diskon Item: {it.discountPercent}%</p>}
                        </td>
                        <td className="py-1.5 px-2 text-center text-gray-600 whitespace-nowrap">
                          {it.qty} {it.unit}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-gray-600 whitespace-nowrap">
                          {formatCurrency(it.price, invoice.currency)}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-gray-800 whitespace-nowrap">
                          {formatCurrency(it.subtotal, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals sections calculation & Spelling Terbilang (Avoid breaks inside this section) */}
              <div className="print-avoid-break space-y-4">
                <div className="flex flex-col items-end text-[10px] space-y-1.5 text-right">
                  <div className="flex justify-between w-64 border-b border-gray-50 pb-1">
                    <span className="text-gray-500">Subtotal Item:</span>
                    <span className="font-mono text-gray-800 font-medium">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  {invoice.globalDiscountPercent > 0 && (
                    <div className="flex justify-between w-64 text-red-600 border-b border-gray-50 pb-1">
                      <span>Diskon Global ({invoice.globalDiscountPercent}%):</span>
                      <span className="font-mono font-bold">-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
                    </div>
                  )}
                  {invoice.hasTax && (
                    <div className="flex justify-between w-64 border-b border-gray-50 pb-1">
                      <span>PPN (11%):</span>
                      <span className="font-mono text-gray-800 font-medium">+{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                    </div>
                  )}
                  {invoice.hasTax2 && (
                    <div className="flex justify-between w-64 text-red-600 border-b border-gray-50 pb-1">
                      <span>PPh 23 (2% Potongan):</span>
                      <span className="font-mono font-medium">-{formatCurrency(invoice.tax2Amount, invoice.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between w-64 font-bold text-sm text-brand-dark pt-2 border-t border-gray-200">
                    <span>Grand Total:</span>
                    <span className="font-mono text-brand-primary text-sm sm:text-base font-extrabold">{formatCurrency(invoice.total, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between w-64 text-gray-500 text-[9px] pt-1.5 border-t border-gray-100 border-dashed">
                    <span>Jumlah Dibayar (Amount Paid):</span>
                    <span className="font-mono text-green-600 font-bold">{formatCurrency(invoice.status === 'Lunas' ? invoice.total : 0, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between w-64 font-bold text-xs pt-1 border-t border-gray-100">
                    <span className="text-gray-700">Sisa Tagihan (Amount Due):</span>
                    <span className={`font-mono ${invoice.status === 'Lunas' ? 'text-green-600 font-bold' : 'text-red-600 font-extrabold'}`}>
                      {formatCurrency(invoice.status === 'Lunas' ? 0 : invoice.total, invoice.currency)}
                    </span>
                  </div>
                </div>

                {/* Spelling Terbilang with super premium layout */}
                <div className="p-3 bg-slate-50 border border-dashed border-gray-200 rounded-xl text-[10px] text-left leading-relaxed">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[8px] block mb-1">Terbilang (Amount in Words):</span>
                  <p className="italic text-brand-primary font-serif font-extrabold text-xs">
                    "{spelledText}"
                  </p>
                </div>
              </div>

              {/* Terms, notes and Signature section */}
              <div className="grid grid-cols-12 gap-6 pt-5 border-t border-gray-150 text-left print-avoid-break">
                {/* Notes and Terms (Left side) */}
                <div className="col-span-7 space-y-4">
                  <div className="space-y-1 text-[9px]">
                    <p className="font-mono font-bold text-gray-400 uppercase tracking-wider text-[8px]">Catatan Khusus (Special Notes):</p>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">{invoice.notes || '-'}</p>
                  </div>
                  <div className="space-y-1 text-[9px]">
                    <p className="font-mono font-bold text-gray-400 uppercase tracking-wider text-[8px]">Instruksi Pembayaran (Payment Terms):</p>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">{invoice.terms || '-'}</p>
                  </div>
                </div>

                {/* Signature and Stamp (Right side) */}
                <div className="col-span-5 text-center space-y-1.5 relative">
                  <p className="text-[9px] text-gray-500 font-semibold font-mono">
                    {userCity}, {formatDateIndonesian(invoice.date)}
                  </p>
                  <p className="text-[10px] font-black text-slate-800">Hormat Kami (Authorized Signatory),</p>
                  
                  <div className="h-20 flex items-center justify-center relative my-1">
                    {/* Electronic Signature */}
                    {user.signatureImage ? (
                      <img src={preloadedSignatureBase64 || user.signatureImage} alt="Tanda Tangan" className="h-16 object-contain z-10 relative" />
                    ) : null}

                    {/* Electronic Stamp */}
                    {user.stampImage ? (
                      <img src={preloadedStampBase64 || user.stampImage} alt="Cap Stempel" className="h-16 w-16 object-contain absolute z-20 opacity-85 mix-blend-multiply translate-x-[-10px] translate-y-[2px] pointer-events-none select-none" />
                    ) : null}
                  </div>

                  <p className="text-xs font-black text-brand-dark underline decoration-gray-300 decoration-wavy underline-offset-4 truncate max-w-full">
                    {user.fullName}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate max-w-full">
                    {user.businessName}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* Footer Paper */}
          <div className="border-t border-gray-50 pt-6 flex justify-between items-center text-[9px] text-gray-400 text-left">
            <p>Terima kasih atas kerja sama bisnis Anda.</p>
            <span className="font-display font-black tracking-tight text-[10px] text-brand-dark">FID <span className="text-brand-primary">INVOICE</span></span>
          </div>

        </div>

      </div>

      {/* Embedded CSS printing overrides to guarantee pristine printing quality in standard A4 */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm 12mm 10mm 12mm;
          }
          body {
            background: white !important;
            color: black !important;
            font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, nav, sidebar, header, button, .no-print * {
            display: none !important;
          }
          #invoice-print-area {
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {whatsAppModalOpen && (
        <WhatsAppModal
          isOpen={whatsAppModalOpen}
          onClose={() => setWhatsAppModalOpen(false)}
          invoice={invoice}
          client={currentClient}
          user={user}
        />
      )}

      {emailModalOpen && (
        <EmailModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          invoice={invoice}
          client={currentClient}
          user={user}
        />
      )}

      {onMarkAsPaid && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          invoice={invoice}
          onConfirm={(invoiceId, paymentMethod, notes, date) => {
            onMarkAsPaid(invoiceId, paymentMethod, notes, date);
          }}
        />
      )}

    </div>
  );
}
