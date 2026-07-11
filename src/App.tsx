import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, ClipboardList, Package, BarChart3, 
  CreditCard, Settings, ShieldCheck, LogOut, Menu, X, ArrowLeft,
  DollarSign, RefreshCw, AlertTriangle, PlayCircle, KeyRound, Sparkles,
  AlertCircle, Receipt, ExternalLink, ChevronDown, Plus, User, UserPlus,
  FileSpreadsheet, Ban
} from 'lucide-react';

import { UserProfile, Client, Product, Invoice, Quotation } from './types';
import { 
  SEED_PRODUCTS, SEED_CLIENTS, SEED_INVOICES, SEED_USERS_LIST, DEMO_USER 
} from './data';

import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import UserDashboard from './components/UserDashboard';
import CreateInvoice from './components/CreateInvoice';
import InvoiceList from './components/InvoiceList';
import ClientManagement from './components/ClientManagement';
import ProductsServices from './components/ProductsServices';
import ReportsAnalytics from './components/ReportsAnalytics';
import SubscriptionPage from './components/SubscriptionPage';
import ProfileSettings from './components/ProfileSettings';
import AdminPanel from './components/AdminPanel';
import InvoicePreviewPdf from './components/InvoicePreviewPdf';
import InvoiceBatchReportPdf from './components/InvoiceBatchReportPdf';
import QrisPaymentBox from './components/QrisPaymentBox';
import PaymentHistorySection from './components/PaymentHistorySection';
import ReceiptManagement from './components/ReceiptManagement';
import QuotationManagement from './components/QuotationManagement';
import CallCenterChat from './components/CallCenterChat';
import NotificationPopup from './components/NotificationPopup';
import NotificationCenter from './components/NotificationCenter';
import ToastContainer from './components/ToastContainer';
import { createNotification } from './utils/notificationService';
import { showToast, ToastMessage } from './utils/toast';


import { formatCurrency, formatDateIndonesian } from './utils';

export default function App() {
  // Navigation states
  const [currentPage, setCurrentPage] = useState<string>('landing'); // landing, auth, dashboard, etc.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auth session
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Shared application databases (Synced per logged-in user in localStorage)
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  // Selected invoice for viewing PDF preview
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [previewDocType, setPreviewDocType] = useState<'invoice' | 'receipt'>('invoice');

  // Selected batch of invoices for viewing PDF report
  const [viewingBatchInvoices, setViewingBatchInvoices] = useState<Invoice[] | null>(null);
  
  // Invoice currently being edited
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Timeouts for handling sandbox storage isolation hangs
  const [printLoadingTimeout, setPrintLoadingTimeout] = useState(false);
  const [batchLoadingTimeout, setBatchLoadingTimeout] = useState(false);

  // Expiry screen payment state
  const [qrisStep, setQrisStep] = useState<boolean>(false);
  const [selectedRenewPlan, setSelectedRenewPlan] = useState<'professional' | 'enterprise'>('professional');
  const [renewBillingPeriod, setRenewBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Multi-profile and profile switcher state
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [addProfileModalOpen, setAddProfileModalOpen] = useState(false);
  
  // Blocked feature message state
  const [blockedFeatureMessage, setBlockedFeatureMessage] = useState<string | null>(null);

  // Global Toast Notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleShowToast = (e: any) => {
      const newToast = e.detail as ToastMessage;
      setToasts(prev => [...prev, newToast]);

      if (newToast.duration !== 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, newToast.duration || 4000);
      }
    };

    window.addEventListener('fid_show_toast', handleShowToast);
    return () => {
      window.removeEventListener('fid_show_toast', handleShowToast);
    };
  }, []);
  
  // Periodic background check to fetch all users from server and keep localStorage updated
  useEffect(() => {
    const fetchAndSyncUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.users)) {
            const serverUsers = data.users;
            
            // Merge with local users (keeping whichever is newer, or simply taking server's as truth)
            const localUsersStr = localStorage.getItem('fid_invoice_all_users');
            const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
            
            // Build merged list
            const mergedMap = new Map<string, any>();
            
            if (serverUsers.length === 0) {
              // If server is empty, keep local users and seed server
              localUsers.forEach((u: any) => mergedMap.set(u.id, u));
            } else {
              // Server is single source of truth!
              // Only keep users that exist on the server.
              serverUsers.forEach((u: any) => mergedMap.set(u.id, u));
            }
            
            const mergedUsers = Array.from(mergedMap.values());
            
            // If server was empty, seed server with our local users
            if (serverUsers.length === 0 && localUsers.length > 0) {
              await fetch('/api/users/sync-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: localUsers, overwrite: true })
              }).catch(e => console.error(e));
            }
            
            const nextUsersStr = JSON.stringify(mergedUsers);
            if (nextUsersStr !== localUsersStr) {
              localStorage.setItem('fid_invoice_all_users', nextUsersStr);
              window.dispatchEvent(new Event('fid_users_updated'));
            }

            // Real-time active session sync from server users
            if (currentUser) {
              const freshServerUser = mergedUsers.find((u: any) => u.id === currentUser.id);
              if (freshServerUser) {
                const subSrv = freshServerUser.subscription;
                const subCli = currentUser.subscription;
                if (
                  subSrv.status !== subCli.status ||
                  subSrv.plan !== subCli.plan ||
                  subSrv.expiryDate !== subCli.expiryDate
                ) {
                  console.log('[Active Session Auto-Sync] Active user subscription changed on server. Synchronizing client session state...', freshServerUser);
                  setCurrentUser(freshServerUser);
                  localStorage.setItem('fid_invoice_active_session', JSON.stringify(freshServerUser));
                  showToast(`Status lisensi Anda telah disinkronkan! Paket ${freshServerUser.subscription.plan.toUpperCase()} sekarang aktif. 🎉`, 'success');
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch server users in background:', err);
      }
    };

    // Run every 6 seconds
    fetchAndSyncUsers();
    const interval = setInterval(fetchAndSyncUsers, 6000);
    return () => clearInterval(interval);
  }, []);

  // Periodic background check to fetch credentials from server and keep localStorage updated
  useEffect(() => {
    const fetchAndSyncCredentials = async () => {
      try {
        const res = await fetch('/api/credentials');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.credentials) {
            const serverCreds = data.credentials;
            const localCredsStr = localStorage.getItem('fid_invoice_user_credentials') || '{}';
            const localCreds = JSON.parse(localCredsStr);
            
            const mergedCreds = { ...localCreds, ...serverCreds };
            
            // Sync merged back to server if different
            if (JSON.stringify(mergedCreds) !== JSON.stringify(serverCreds)) {
              await fetch('/api/credentials/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credentials: mergedCreds })
              }).catch(e => console.error(e));
            }
            
            const nextCredsStr = JSON.stringify(mergedCreds);
            if (nextCredsStr !== localCredsStr) {
              localStorage.setItem('fid_invoice_user_credentials', nextCredsStr);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch server credentials in background:', err);
      }
    };

    // Run every 10 seconds
    fetchAndSyncCredentials();
    const interval = setInterval(fetchAndSyncCredentials, 10000);
    return () => clearInterval(interval);
  }, []);

  // New profile form states
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileBusiness, setNewProfileBusiness] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [newProfilePhone, setNewProfilePhone] = useState('');
  const [newProfileAddress, setNewProfileAddress] = useState('');

  // Load / initialize users & initial state
  useEffect(() => {
    // 1. Check if database of users is already initialized in localStorage, if not seed it
    const allUsersStr = localStorage.getItem('fid_invoice_all_users');
    if (!allUsersStr) {
      localStorage.setItem('fid_invoice_all_users', JSON.stringify(SEED_USERS_LIST));
    }

    // 2. Auto-restore active login session from localStorage
    let activeUser = null;
    const savedSession = localStorage.getItem('fid_invoice_active_session');
    if (savedSession) {
      activeUser = JSON.parse(savedSession);
    }

    // Bypassing / auto-login fallback if URL is a print URL and there's no active session
    const params = new URLSearchParams(window.location.search);
    const printId = params.get('print');
    const isBatchReport = params.get('batchReport') === 'true';
    const actionParam = params.get('action');
    const emailParam = params.get('email');

    if (actionParam === 'verify' || actionParam === 'reset') {
      if (emailParam) {
        setCurrentPage('auth');
      }
      return;
    }

    if (!activeUser && (printId || isBatchReport)) {
      // Find a user who has this invoice or use default DEMO_USER
      const allUsers = JSON.parse(localStorage.getItem('fid_invoice_all_users') || '[]');
      const idsStr = params.get('ids');
      const batchIds = idsStr ? idsStr.split(',') : [];
      let foundUser = null;

      for (const u of allUsers) {
        const key = `fid_invoice_user_${u.id}_data`;
        const dataStr = localStorage.getItem(key);
        if (dataStr) {
          const parsed = JSON.parse(dataStr);
          const userInvs = parsed.invoices || [];
          if (printId && userInvs.some((inv: Invoice) => inv.id === printId)) {
            foundUser = u;
            break;
          }
          if (isBatchReport && batchIds.length > 0 && userInvs.some((inv: Invoice) => batchIds.includes(inv.id))) {
            foundUser = u;
            break;
          }
        }
      }

      if (foundUser) {
        activeUser = foundUser;
      } else {
        // Fallback to DEMO_USER so we don't display a blank page
        activeUser = allUsers.find((u: any) => u.id === 'user-demo') || DEMO_USER;
      }
    }

    if (activeUser) {
      // Pull fresh data for this user from global user database
      const freshUsers = JSON.parse(localStorage.getItem('fid_invoice_all_users') || '[]');
      const matched = freshUsers.find((u: any) => u.id === activeUser.id);
      
      if (matched) {
        setCurrentUser(matched);
        loadUserData(matched.id);
        setCurrentPage('dashboard');
      } else {
        // Active session user was deleted! Force secure logout.
        localStorage.removeItem('fid_invoice_active_session');
        setCurrentUser(null);
        setCurrentPage('landing');
      }
    }
  }, []);

  // Handle auto-print and auto-download from URL parameters (escaping sandboxed iframe preview)
  useEffect(() => {
    if (invoices.length === 0) return;
    
    const params = new URLSearchParams(window.location.search);
    const printId = params.get('print');
    const isBatchReport = params.get('batchReport') === 'true';
    const action = params.get('action'); // 'print' or 'download'
    const idsStr = params.get('ids');
    const docTypeParam = params.get('docType');

    if (docTypeParam === 'receipt') {
      setPreviewDocType('receipt');
    } else {
      setPreviewDocType('invoice');
    }

    if (printId) {
      const matched = invoices.find(inv => inv.id === printId);
      if (matched) {
        setViewingInvoice(matched);
        if (action === 'print') {
          sessionStorage.setItem('autoPrint', 'true');
        } else if (action === 'download') {
          sessionStorage.setItem('autoDownloadPdf', 'true');
        }
      }
    } else if (isBatchReport) {
      let batchInvoices: Invoice[] = [];
      if (idsStr) {
        const ids = idsStr.split(',');
        batchInvoices = invoices.filter(inv => ids.includes(inv.id));
      } else {
        batchInvoices = invoices;
      }
      
      if (batchInvoices.length > 0) {
        setViewingBatchInvoices(batchInvoices);
        if (action === 'print') {
          sessionStorage.setItem('autoPrint', 'true');
        } else if (action === 'download') {
          sessionStorage.setItem('autoDownloadPdf', 'true');
        }
      } else {
        // Fallback to all invoices so the page doesn't hang in loading state
        setViewingBatchInvoices(invoices);
      }
    }
  }, [invoices]);

  // Track loading timeouts for print and batch report (handling sandbox localStorage partition)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const printId = params.get('print');
    const isBatchReport = params.get('batchReport') === 'true';

    let printTimer: any;
    let batchTimer: any;

    if (printId && !viewingInvoice) {
      printTimer = setTimeout(() => {
        setPrintLoadingTimeout(true);
      }, 3500);
    } else {
      setPrintLoadingTimeout(false);
    }

    if (isBatchReport && !viewingBatchInvoices) {
      batchTimer = setTimeout(() => {
        setBatchLoadingTimeout(true);
      }, 3500);
    } else {
      setBatchLoadingTimeout(false);
    }

    return () => {
      clearTimeout(printTimer);
      clearTimeout(batchTimer);
    };
  }, [invoices, viewingInvoice, viewingBatchInvoices]);

  // Real-time synchronization of currentUser state with the global localStorage user database
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      const allUsersStr = localStorage.getItem('fid_invoice_all_users');
      if (allUsersStr) {
        try {
          const allUsers = JSON.parse(allUsersStr);
          const matched = allUsers.find((u: any) => u.id === currentUser.id);
          if (matched) {
            // Only update state if something changed (e.g., status, plan, expiryDate) to prevent infinite loops
            if (
              matched.subscription.status !== currentUser.subscription.status ||
              matched.subscription.plan !== currentUser.subscription.plan ||
              matched.subscription.expiryDate !== currentUser.subscription.expiryDate ||
              matched.fullName !== currentUser.fullName
            ) {
              setCurrentUser(matched);
            }
          }
        } catch (e) {
          // ignore
        }
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Reusable function to check pending payments and instantly apply subscription status updates
  const checkPendingPayments = async (targetUser = currentUser) => {
    if (!targetUser || !targetUser.id) return;
    try {
      const response = await fetch(`/api/doku/check-pending/${targetUser.id}`);
      if (!response.ok) return;

      const contentType = response.headers.get("content-type"); if (!contentType || !contentType.includes("application/json")) return; const data = await response.json();
      const confirmedPayments = data.confirmed || [];

      if (confirmedPayments.length > 0) {
        console.log('[Payment Verifier] Found confirmed payments on server:', confirmedPayments);
        
        let hasUpdated = false;
        let updatedUser = { ...targetUser };

        for (const tx of confirmedPayments) {
          // Calculate new expiry date based on plan name
          const isYearly = tx.isYearly;
          const extendDays = isYearly ? 365 : 30;
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + extendDays);

          // Extract clean plan name
          let cleanPlan: 'starter' | 'professional' | 'enterprise' = 'professional';
          if (tx.planName.toLowerCase().includes('enterprise')) {
            cleanPlan = 'enterprise';
          } else if (tx.planName.toLowerCase().includes('starter')) {
            cleanPlan = 'starter';
          }

          updatedUser = {
            ...updatedUser,
            subscription: {
              ...updatedUser.subscription,
              status: 'active',
              plan: cleanPlan,
              expiryDate: futureDate.toISOString().split('T')[0],
              trialDaysRemaining: 0,
              billingCycle: isYearly ? 'yearly' : 'monthly'
            }
          };

          hasUpdated = true;

          // Mark applied on server
          await fetch('/api/doku/mark-applied', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: tx.orderId })
          }).catch(err => console.error('Failed to mark transaction as applied:', err));

          // Create client-side notification
          createNotification(
            'success',
            'Perpanjangan Otomatis Sukses 🎉',
            `Sistem mendeteksi pembayaran Anda via ${tx.paymentType || 'QRIS/VA'} telah lunas! Akun Anda untuk paket ${cleanPlan.toUpperCase()} (${isYearly ? 'Tahunan' : 'Bulanan'}) telah diaktifkan kembali secara otomatis.`,
            targetUser.id
          );
        }

        if (hasUpdated) {
          // Save updated user to state and localStorage
          setCurrentUser(updatedUser);
          localStorage.setItem('fid_invoice_active_session', JSON.stringify(updatedUser));

          // Also update in all users array in localStorage
          const allUsers = JSON.parse(localStorage.getItem('fid_invoice_all_users') || '[]');
          const updatedUsers = allUsers.map((u: any) => u.id === updatedUser.id ? updatedUser : u);
          localStorage.setItem('fid_invoice_all_users', JSON.stringify(updatedUsers));

          showToast(`Pembayaran terverifikasi! Paket ${updatedUser.subscription.plan.toUpperCase()} Anda telah diaktifkan kembali secara otomatis. 🎉`, 'success');
        }
      }
    } catch (err) {
      console.error('Failed to check pending payments:', err);
    }
  };

  // Periodic background check for confirmed payments on the server
  useEffect(() => {
    if (!currentUser) return;

    let isSubscribed = true;
    const intervalTime = 6000; // Poll every 6 seconds

    const poll = () => {
      if (isSubscribed) {
        checkPendingPayments(currentUser);
      }
    };

    // Run check immediately, then periodically
    poll();
    const timer = setInterval(poll, intervalTime);

    return () => {
      isSubscribed = false;
      clearInterval(timer);
    };
  }, [currentUser]);

  // Helper to load or seed databases for a specific user
  const loadUserData = (userId: string) => {
    const key = `fid_invoice_user_${userId}_data`;
    const savedData = localStorage.getItem(key);
    
    if (savedData) {
      const parsed = JSON.parse(savedData);
      
      // Healer/Deduplication check for historical duplicates
      const rawInvoices = parsed.invoices || [];
      const uniqueInvoices = rawInvoices.filter((inv: Invoice, idx: number, self: Invoice[]) =>
        self.findIndex(i => i.id === inv.id) === idx
      );
      
      const rawClients = parsed.clients || [];
      const uniqueClients = rawClients.filter((c: Client, idx: number, self: Client[]) =>
        self.findIndex(i => i.id === c.id) === idx
      );
      
      const rawProducts = parsed.products || [];
      const uniqueProducts = rawProducts.filter((p: Product, idx: number, self: Product[]) =>
        self.findIndex(i => i.id === p.id) === idx
      );

      const rawQuotations = parsed.quotations || [];
      const uniqueQuotations = rawQuotations.filter((q: Quotation, idx: number, self: Quotation[]) =>
        self.findIndex(i => i.id === q.id) === idx
      );
      
      setClients(uniqueClients);
      setProducts(uniqueProducts);
      setInvoices(uniqueInvoices);
      
      const defaultQuotations = [
        {
          id: 'q-demo-1',
          quotationNumber: 'QT-2026-0001',
          userId: userId,
          clientId: SEED_CLIENTS[0]?.id || 'cli-1',
          clientName: SEED_CLIENTS[0]?.name || 'Felix Hencia',
          date: new Date().toISOString().split('T')[0],
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          items: [
            {
              id: 'qitem-1',
              description: 'Jasa Pembuatan Website Custom',
              qty: 1,
              unit: 'Paket',
              price: 8500000,
              discountPercent: 0,
              subtotal: 8500000
            }
          ],
          globalDiscountPercent: 5,
          hasTax: true,
          hasTax2: false,
          subtotal: 8500000,
          discountAmount: 425000,
          taxAmount: 888250,
          tax2Amount: 0,
          total: 8963250,
          spelledOut: 'Delapan Juta Sembilan Ratus Enam Puluh Tiga Ribu Dua Ratus Lima Puluh Rupiah',
          status: 'Draft' as const,
          notes: 'Penawaran ini mencakup analisis sistem penuh dan implementasi awal.',
          terms: '1. Penawaran harga ini berlaku selama 30 hari sejak tanggal diterbitkan.\n2. Pembayaran uang muka sebesar 50% dilakukan saat penandatanganan persetujuan.\n3. Sisa pelunasan 50% dilakukan setelah pekerjaan selesai dideploy.',
          templateId: 'corporate',
          currency: 'IDR',
          createdAt: new Date().toISOString()
        }
      ];

      const loadedQuotations = uniqueQuotations.length > 0 ? uniqueQuotations : defaultQuotations;
      setQuotations(loadedQuotations);

      // Save back deduplicated state to heal any corrupted localStorage
      const dataToSave = {
        clients: uniqueClients,
        products: uniqueProducts,
        invoices: uniqueInvoices,
        quotations: loadedQuotations
      };
      localStorage.setItem(key, JSON.stringify(dataToSave));
    } else {
      // Seed default demo databases ONLY for the demo account
      if (userId === 'user-demo') {
        const defaultQuotations: Quotation[] = [
          {
            id: 'q-demo-1',
            quotationNumber: 'QT-2026-0001',
            userId: userId,
            clientId: SEED_CLIENTS[0]?.id || 'cli-1',
            clientName: SEED_CLIENTS[0]?.name || 'Felix Hencia',
            date: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            items: [
              {
                id: 'qitem-1',
                description: 'Jasa Pembuatan Website Custom',
                qty: 1,
                unit: 'Paket',
                price: 8500000,
                discountPercent: 0,
                subtotal: 8500000
              }
            ],
            globalDiscountPercent: 5,
            hasTax: true,
            hasTax2: false,
            subtotal: 8500000,
            discountAmount: 425000,
            taxAmount: 888250,
            tax2Amount: 0,
            total: 8963250,
            spelledOut: 'Delapan Juta Sembilan Ratus Enam Puluh Tiga Ribu Dua Ratus Lima Puluh Rupiah',
            status: 'Draft',
            notes: 'Penawaran ini mencakup analisis sistem penuh dan implementasi awal.',
            terms: '1. Penawaran harga ini berlaku selama 30 hari sejak tanggal diterbitkan.\n2. Pembayaran uang muka sebesar 50% dilakukan saat penandatanganan persetujuan.\n3. Sisa pelunasan 50% dilakukan setelah pekerjaan selesai dideploy.',
            templateId: 'corporate',
            currency: 'IDR',
            createdAt: new Date().toISOString()
          }
        ];
        const defaultData = {
          clients: SEED_CLIENTS,
          products: SEED_PRODUCTS,
          invoices: SEED_INVOICES,
          quotations: defaultQuotations
        };
        localStorage.setItem(key, JSON.stringify(defaultData));
        setClients(SEED_CLIENTS);
        setProducts(SEED_PRODUCTS);
        setInvoices(SEED_INVOICES);
        setQuotations(defaultQuotations);
      } else {
        // Real users get clean slate
        const emptyData = {
          clients: [],
          products: [],
          invoices: [],
          quotations: []
        };
        localStorage.setItem(key, JSON.stringify(emptyData));
        setClients([]);
        setProducts([]);
        setInvoices([]);
        setQuotations([]);
      }
    }
  };

  const saveUserDataToStorage = (userId: string, updatedClients: Client[], updatedProducts: Product[], updatedInvoices: Invoice[], updatedQuotations?: Quotation[]) => {
    const key = `fid_invoice_user_${userId}_data`;
    
    // Safety deduplication on save
    const uniqueInvoices = updatedInvoices.filter((inv, idx, self) => self.findIndex(i => i.id === inv.id) === idx);
    const uniqueClients = updatedClients.filter((c, idx, self) => self.findIndex(i => i.id === c.id) === idx);
    const uniqueProducts = updatedProducts.filter((p, idx, self) => self.findIndex(i => i.id === p.id) === idx);
    const uniqueQuotations = (updatedQuotations || quotations).filter((q, idx, self) => self.findIndex(i => i.id === q.id) === idx);

    const dataToSave = {
      clients: uniqueClients,
      products: uniqueProducts,
      invoices: uniqueInvoices,
      quotations: uniqueQuotations
    };
    localStorage.setItem(key, JSON.stringify(dataToSave));
  };

  // Auth callbacks
  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('fid_invoice_active_session', JSON.stringify(user));
    loadUserData(user.id);

    // Create personalized welcome notification for logged-in user
    createNotification(
      'info',
      `Sesi Masuk Berhasil - Halo, ${user.fullName}!`,
      `Selamat datang kembali di dashboard administrasi penagihan pintar FID INVOICE untuk ${user.businessName || 'Profil UMKM Anda'}. Seluruh pencatatan invoice dan kuitansi pembayaran Anda telah sinkron secara aman. Mari mulai mengelola invoicing pintar hari ini! 🚀`,
      user.id
    );

    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('fid_invoice_active_session');
    setCurrentUser(null);
    setCurrentPage('landing');
  };

  const handleSwitchProfile = (userId: string) => {
    const allUsers = JSON.parse(localStorage.getItem('fid_invoice_all_users') || '[]');
    const targetUser = allUsers.find((u: any) => u.id === userId);
    if (targetUser) {
      setCurrentUser(targetUser);
      localStorage.setItem('fid_invoice_active_session', JSON.stringify(targetUser));
      loadUserData(targetUser.id);
      setProfileDropdownOpen(false);
      setCurrentPage('dashboard');
    }
  };

  const handleAddNewProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName || !newProfileBusiness || !newProfileEmail) return;

    const allUsers = JSON.parse(localStorage.getItem('fid_invoice_all_users') || '[]');
    
    // Check if email already exists
    if (allUsers.some((u: any) => u.email.toLowerCase() === newProfileEmail.toLowerCase())) {
      showToast('Email ini sudah terdaftar sebagai profil lain.', 'error');
      return;
    }

    const newId = 'usr_' + Date.now();
    const newProfile: UserProfile = {
      id: newId,
      fullName: newProfileName,
      businessName: newProfileBusiness,
      email: newProfileEmail,
      phone: newProfilePhone || '-',
      address: newProfileAddress || '-',
      subscription: {
        status: 'active',
        plan: 'professional',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days active
        trialDaysRemaining: 30
      }
    };

    const updatedUsersList = [...allUsers, newProfile];
    localStorage.setItem('fid_invoice_all_users', JSON.stringify(updatedUsersList));
    
    // Sync to backend server
    fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: newProfile })
    }).catch(err => console.error('Failed to sync new profile:', err));

    // Dispatch event for real-time sync
    window.dispatchEvent(new Event('fid_users_updated'));
    
    // Switch to the newly created profile!
    setCurrentUser(newProfile);
    localStorage.setItem('fid_invoice_active_session', JSON.stringify(newProfile));
    loadUserData(newId);
    
    // Reset form & state
    setNewProfileName('');
    setNewProfileBusiness('');
    setNewProfileEmail('');
    setNewProfilePhone('');
    setNewProfileAddress('');
    setAddProfileModalOpen(false);
    setProfileDropdownOpen(false);
    setCurrentPage('dashboard');
  };

  // Global triggers to update user profile & sync with all users database
  const syncAndSaveUser = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('fid_invoice_active_session', JSON.stringify(updatedUser));

    // Update inside list of all registered users
    const allUsers = JSON.parse(localStorage.getItem('fid_invoice_all_users') || '[]');
    const nextUsers = allUsers.map((u: any) => u.id === updatedUser.id ? updatedUser : u);
    localStorage.setItem('fid_invoice_all_users', JSON.stringify(nextUsers));
    
    // Sync to backend server
    fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: updatedUser })
    }).catch(err => console.error('Failed to sync updated user to server:', err));

    // Dispatch event for real-time sync across admin panel
    window.dispatchEvent(new Event('fid_users_updated'));
  };

  // Auto-expiry simulation toggle callback
  const handleSimulateExpiry = (expire: boolean) => {
    if (!currentUser) return;
    
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - 5);

    const updated: UserProfile = {
      ...currentUser,
      subscription: {
        ...currentUser.subscription,
        status: expire ? 'expired' : 'active',
        expiryDate: expire ? pastDate.toISOString().split('T')[0] : futureDate.toISOString().split('T')[0]
      }
    };
    syncAndSaveUser(updated);
  };

  // Client DB handlers
  const handleAddClient = (newClient: Client) => {
    if (!currentUser) return;
    if (isSubscriptionExpired()) {
      setBlockedFeatureMessage('Penambahan Klien Baru');
      return;
    }
    
    if (currentUser.subscription.plan === 'starter' && clients.length >= 1) {
      setBlockedFeatureMessage('Batas Klien (Starter: Max 1)');
      return;
    }
    if (currentUser.subscription.plan === 'professional' && clients.length >= 50) {
      setBlockedFeatureMessage('Batas Klien (Pro: Max 50)');
      return;
    }

    const nextClients = [newClient, ...clients];
    setClients(nextClients);
    saveUserDataToStorage(currentUser.id, nextClients, products, invoices);
  };

  const handleEditClient = (updatedClient: Client) => {
    if (!currentUser) return;
    const nextClients = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
    setClients(nextClients);
    saveUserDataToStorage(currentUser.id, nextClients, products, invoices);
  };

  const handleDeleteClient = (clientId: string) => {
    if (!currentUser) return;
    const nextClients = clients.filter(c => c.id !== clientId);
    setClients(nextClients);
    saveUserDataToStorage(currentUser.id, nextClients, products, invoices);
  };

  // Product DB handlers
  const handleAddProduct = (newProduct: Product) => {
    if (!currentUser) return;
    if (isSubscriptionExpired()) {
      setBlockedFeatureMessage('Penambahan Produk atau Jasa Baru');
      return;
    }
    const nextProducts = [newProduct, ...products];
    setProducts(nextProducts);
    saveUserDataToStorage(currentUser.id, clients, nextProducts, invoices);
  };

  const handleEditProduct = (updatedProduct: Product) => {
    if (!currentUser) return;
    const nextProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(nextProducts);
    saveUserDataToStorage(currentUser.id, clients, nextProducts, invoices);
  };

  const handleDeleteProduct = (productId: string) => {
    if (!currentUser) return;
    const nextProducts = products.filter(p => p.id !== productId);
    setProducts(nextProducts);
    saveUserDataToStorage(currentUser.id, clients, nextProducts, invoices);
  };

  // Invoice DB handlers
  const handleSaveInvoice = (newInv: Invoice) => {
    if (!currentUser) return;
    
    const existsInList = invoices.some(i => i.id === newInv.id);
    const isEditExisting = (editingInvoice && invoices.some(i => i.id === editingInvoice.id)) || existsInList;
    const isReceiptUpdate = existsInList; // payment recorded on existing invoice
    
    if (isSubscriptionExpired() && !isEditExisting && !isReceiptUpdate) {
      if (newInv.invoiceNumber.startsWith('KW-')) {
        setBlockedFeatureMessage('Pembuatan Kuitansi Baru');
      } else {
        setBlockedFeatureMessage('Pembuatan Invoice Baru');
      }
      return;
    }
    
    // Enforce Starter invoice limits
    if (!isEditExisting && !isReceiptUpdate && currentUser.subscription.plan === 'starter' && invoices.length >= 5) {
      setBlockedFeatureMessage('Batas Pembuatan Invoice (Starter: Max 5)');
      return;
    }
    
    let nextInvoices = [];
    if (isEditExisting || isReceiptUpdate) {
      // It's an edit update of an existing invoice
      nextInvoices = invoices.map(i => i.id === newInv.id ? newInv : i);
    } else {
      // It's a brand new invoice (or converted from quotation)
      nextInvoices = [newInv, ...invoices];
    }
    setEditingInvoice(null);

    setInvoices(nextInvoices);
    saveUserDataToStorage(currentUser.id, clients, products, nextInvoices);
    setCurrentPage('invoice-list');
  };

  const handleAddQuotation = (newQuo: Quotation) => {
    if (!currentUser) return;
    const nextQuotations = [newQuo, ...quotations];
    setQuotations(nextQuotations);
    saveUserDataToStorage(currentUser.id, clients, products, invoices, nextQuotations);
  };

  const handleEditQuotation = (updatedQuo: Quotation) => {
    if (!currentUser) return;
    const nextQuotations = quotations.map(q => q.id === updatedQuo.id ? updatedQuo : q);
    setQuotations(nextQuotations);
    saveUserDataToStorage(currentUser.id, clients, products, invoices, nextQuotations);
  };

  const handleDeleteQuotation = (id: string) => {
    if (!currentUser) return;
    const nextQuotations = quotations.filter(q => q.id !== id);
    setQuotations(nextQuotations);
    saveUserDataToStorage(currentUser.id, clients, products, invoices, nextQuotations);
  };

  const handleConvertQuotationToInvoice = (quotation: Quotation) => {
    if (!currentUser) return;
    
    // Generate next invoice number based on local sequence
    const countStr = localStorage.getItem(`fid_invoice_count_${currentUser.id}`) || '1';
    const count = parseInt(countStr);
    const currentYear = new Date().getFullYear();
    const paddedNum = String(count).padStart(4, '0');
    const invoiceNumber = `FID-${currentYear}-${paddedNum}`;

    // Create a new draft invoice
    const newInvoice: Invoice = {
      id: 'inv_conv_' + Math.random().toString(36).substring(2, 9),
      invoiceNumber,
      userId: currentUser.id,
      clientId: quotation.clientId,
      clientName: quotation.clientName,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Net 15
      type: 'Commercial Invoice',
      items: quotation.items,
      globalDiscountPercent: quotation.globalDiscountPercent,
      hasTax: quotation.hasTax,
      hasTax2: quotation.hasTax2,
      subtotal: quotation.subtotal,
      discountAmount: quotation.discountAmount,
      taxAmount: quotation.taxAmount,
      tax2Amount: quotation.tax2Amount,
      total: quotation.total,
      spelledOut: quotation.spelledOut,
      status: 'Draft',
      notes: quotation.notes || '',
      terms: quotation.terms || '',
      templateId: quotation.templateId,
      currency: quotation.currency,
      createdAt: new Date().toISOString()
    };

    // Update quotation status
    const nextQuotations = quotations.map(q => {
      if (q.id === quotation.id) {
        return { ...q, status: 'Dibuat Invoice' as const, convertedInvoiceId: newInvoice.id };
      }
      return q;
    });

    setQuotations(nextQuotations);
    setEditingInvoice(newInvoice);
    saveUserDataToStorage(currentUser.id, clients, products, invoices, nextQuotations);
    setCurrentPage('create-invoice');
    showToast('Penawaran berhasil diubah menjadi Draf Invoice baru. Silakan tinjau dan klik simpan!', 'success');
  };

  const handleDuplicateInvoice = (invoice: Invoice) => {
    if (!currentUser) return;
    const duplicate: Invoice = {
      ...invoice,
      id: 'inv_dup_' + Math.random().toString(36).substring(2, 9),
      invoiceNumber: invoice.invoiceNumber + '-DUP',
      createdAt: new Date().toISOString()
    };
    const nextInvoices = [duplicate, ...invoices];
    setInvoices(nextInvoices);
    saveUserDataToStorage(currentUser.id, clients, products, nextInvoices);
  };

  const handleMarkAsPaid = (invoiceId: string, paymentMethod?: string, notes?: string, paymentDate?: string) => {
    if (!currentUser) return;
    const nextInvoices = invoices.map(inv => {
      if (inv.id === invoiceId) {
        let updatedNotes = inv.notes || '';
        if (notes) {
          updatedNotes = `${updatedNotes}\n---\nPembayaran diterima via ${paymentMethod || 'Bank Transfer'} pada ${paymentDate || new Date().toLocaleDateString('id-ID')}. Catatan: ${notes}`.trim();
        }
        return { 
          ...inv, 
          status: 'Lunas' as const,
          paymentMethodInfo: paymentMethod || inv.paymentMethodInfo || 'Bank Transfer',
          notes: updatedNotes
        };
      }
      return inv;
    });
    setInvoices(nextInvoices);
    saveUserDataToStorage(currentUser.id, clients, products, nextInvoices);

    // Also update viewing invoice state if active
    if (viewingInvoice && viewingInvoice.id === invoiceId) {
      const activeInv = nextInvoices.find(i => i.id === invoiceId);
      if (activeInv) {
        setViewingInvoice(activeInv);
      } else {
        setViewingInvoice({ 
          ...viewingInvoice, 
          status: 'Lunas' as const,
          paymentMethodInfo: paymentMethod || viewingInvoice.paymentMethodInfo || 'Bank Transfer'
        });
      }
    }
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (!currentUser) return;
    const nextInvoices = invoices.filter(inv => inv.id !== invoiceId);
    setInvoices(nextInvoices);
    saveUserDataToStorage(currentUser.id, clients, products, nextInvoices);
  };

  // Renewal & payment flow on expired lock-out screen
  const handleSimulatePaymentSuccess = () => {
    if (!currentUser) return;
    
    const isYearly = renewBillingPeriod === 'yearly';
    const futureDate = new Date();
    const extendDays = isYearly ? 365 : 30;
    futureDate.setDate(futureDate.getDate() + extendDays);

    const updated: UserProfile = {
      ...currentUser,
      subscription: {
        ...currentUser.subscription,
        status: 'active',
        plan: selectedRenewPlan,
        expiryDate: futureDate.toISOString().split('T')[0],
        trialDaysRemaining: 0,
        billingCycle: isYearly ? 'yearly' : 'monthly'
      }
    };

    // Payment record is already recorded inside QrisPaymentBox on successful verification.
    // So we only update the user subscription status here.
    syncAndSaveUser(updated);
    setQrisStep(false);
    setCurrentPage('dashboard');
    createNotification(
      'success',
      'Pembayaran Perpanjangan Sukses 🎉',
      `Selamat datang kembali! Pembayaran otomatis untuk perpanjangan masa aktif paket ${selectedRenewPlan.toUpperCase()} (${isYearly ? 'Tahunan' : 'Bulanan'}) Anda berhasil diverifikasi. Masa aktif diperpanjang ${extendDays} hari ke depan.`,
      currentUser.id
    );
    showToast(`Pembayaran Sukses! Lisensi paket ${selectedRenewPlan.toUpperCase()} (${isYearly ? 'Tahunan' : 'Bulanan'}) Anda telah diaktifkan kembali.`, 'success');
  };

  // Check if current logged-in user is expired
  const isSubscriptionExpired = () => {
    if (!currentUser) return false;
    
    const isStatusExpired = currentUser.subscription.status === 'expired';
    const isPastExpiryDate = new Date(currentUser.subscription.expiryDate) < new Date();
    
    return isStatusExpired || isPastExpiryDate;
  };

  const handleSimulateQuota = (type: 'clients' | 'invoices', max: number) => {
    if (!currentUser) return;
    
    if (type === 'clients') {
      const generatedClients = [];
      for (let i = 0; i < max; i++) {
        generatedClients.push({
          id: 'sim_client_' + i + '_' + Date.now(),
          name: 'Simulasi Klien ' + (i + 1),
          email: 'sim' + i + '@example.com',
          phone: '0800000000',
          address: 'Alamat Simulasi ' + i,
          createdAt: new Date().toISOString()
        });
      }
      setClients(generatedClients);
      saveUserDataToStorage(currentUser.id, generatedClients, products, invoices);
      showToast(`Berhasil mengisi ${max} klien untuk simulasi kuota`, 'info');
    } else if (type === 'invoices') {
      const generatedInvoices = [];
      for (let i = 0; i < max; i++) {
        generatedInvoices.push({
          id: 'sim_inv_' + i + '_' + Date.now(),
          invoiceNumber: 'INV-SIM-' + (i + 1),
          userId: currentUser.id,
          clientId: 'sim_client_0',
          clientName: 'Klien Simulasi',
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          type: 'Commercial Invoice',
          items: [],
          globalDiscountPercent: 0,
          hasTax: false,
          hasTax2: false,
          subtotal: 100000,
          discountAmount: 0,
          taxAmount: 0,
          tax2Amount: 0,
          total: 100000,
          spelledOut: 'Seratus Ribu Rupiah',
          status: 'Draft',
          templateId: 'corporate',
          currency: 'IDR',
          createdAt: new Date().toISOString()
        });
      }
      setInvoices(generatedInvoices);
      saveUserDataToStorage(currentUser.id, clients, products, generatedInvoices);
      showToast(`Berhasil mengisi ${max} invoice untuk simulasi kuota`, 'info');
    }
  };  // Centrally handle navigation with subscription guards
  const handleNavigate = (page: string) => {
    if (page === 'create-invoice') {
      if (!editingInvoice && isSubscriptionExpired()) {
        setBlockedFeatureMessage('Pembuatan Invoice Baru');
        return;
      }
    }
    setCurrentPage(page);
  };

  // Main layout content coordinator
  const renderMainContent = () => {
    const params = new URLSearchParams(window.location.search);
    const printId = params.get('print');
    const isBatchReport = params.get('batchReport') === 'true';

    if (printId && !viewingInvoice) {
      if (printLoadingTimeout) {
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md mx-auto mt-10">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-extrabold text-gray-800">Invoice Tidak Ditemukan</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Dokumen ini kemungkinan dibuat di sesi browser yang terisolasi (sandbox iframe editor). Jangan khawatir, Anda dapat mencetak dokumen ini dengan sangat mudah:
            </p>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-left text-xs text-amber-900 space-y-2">
              <p className="font-extrabold text-amber-950">Cara Instan Mengatasi 💡</p>
              <p>1. Silakan <span className="font-bold">tutup tab ini</span> terlebih dahulu.</p>
              <p>2. Pada layar aplikasi utama, klik tombol <span className="font-bold text-brand-primary">Buka di Tab Baru ↗</span> di pojok kanan atas layar Anda.</p>
              <p>3. Di tab baru tersebut, jalankan kembali fitur simpan PDF atau cetak langsung. Dijamin berjalan 100% lancar!</p>
            </div>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('print');
                url.searchParams.delete('action');
                window.location.href = url.pathname;
              }}
              className="mt-2 w-full px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors"
            >
              Kembali ke Dashboard Utama
            </button>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white rounded-2xl border border-gray-100 shadow-xl max-w-lg mx-auto mt-10 animate-fade-in">
          <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
          <p className="text-sm font-bold text-gray-700">Mempersiapkan Dokumen Invoice...</p>
          <p className="text-xs text-gray-400 animate-pulse">Harap tunggu sebentar selagi sistem merender layout PDF Anda.</p>
        </div>
      );
    }

    if (isBatchReport && !viewingBatchInvoices) {
      if (batchLoadingTimeout) {
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md mx-auto mt-10">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-extrabold text-gray-800">Laporan Laporan Tidak Ditemukan</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Laporan ini kemungkinan dibuat di sesi browser yang terisolasi (sandbox iframe editor). Jangan khawatir, Anda dapat membuat laporan ini dengan sangat mudah:
            </p>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-left text-xs text-amber-900 space-y-2">
              <p className="font-extrabold text-amber-950">Cara Instan Mengatasi 💡</p>
              <p>1. Silakan <span className="font-bold">tutup tab ini</span> terlebih dahulu.</p>
              <p>2. Pada layar aplikasi utama, klik tombol <span className="font-bold text-brand-primary">Buka di Tab Baru ↗</span> di pojok kanan atas layar Anda.</p>
              <p>3. Di tab baru tersebut, jalankan kembali fitur cetak/unduh laporan. Dijamin berjalan 100% lancar!</p>
            </div>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('batchReport');
                url.searchParams.delete('ids');
                url.searchParams.delete('action');
                window.location.href = url.pathname;
              }}
              className="mt-2 w-full px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors"
            >
              Kembali ke Dashboard Utama
            </button>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white rounded-2xl border border-gray-100 shadow-xl max-w-lg mx-auto mt-10 animate-fade-in">
          <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
          <p className="text-sm font-bold text-gray-700">Mempersiapkan Laporan Ringkasan...</p>
          <p className="text-xs text-gray-400 animate-pulse">Harap tunggu sebentar selagi sistem merangkum batch laporan Anda.</p>
        </div>
      );
    }

    if (viewingInvoice) {
      return (
        <InvoicePreviewPdf 
          invoice={viewingInvoice}
          user={currentUser!}
          clients={clients}
          onClose={() => setViewingInvoice(null)}
          onMarkAsPaid={handleMarkAsPaid}
          initialDocumentType={previewDocType}
        />
      );
    }

    if (viewingBatchInvoices) {
      return (
        <InvoiceBatchReportPdf 
          invoices={viewingBatchInvoices}
          user={currentUser!}
          clients={clients}
          onClose={() => setViewingBatchInvoices(null)}
        />
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <UserDashboard 
            user={currentUser!}
            invoices={invoices}
            clients={clients}
            onNavigate={(page) => {
              if (page === 'create-invoice') setEditingInvoice(null);
              handleNavigate(page);
            }}
            onSelectInvoice={(inv) => setViewingInvoice(inv)}
          />
        );
      
      case 'create-invoice':
        return (
          <CreateInvoice 
            user={currentUser!}
            clients={clients}
            products={products}
            initialInvoiceToEdit={editingInvoice || undefined}
            onSaveInvoice={handleSaveInvoice}
            onAddClient={handleAddClient}
            onAddProduct={handleAddProduct}
            onNavigate={handleNavigate}
            onFeatureBlocked={(featureName) => setBlockedFeatureMessage(featureName)}
          />
        );
      
      case 'invoice-list':
        return (
          <InvoiceList 
            user={currentUser!}
            invoices={invoices}
            clients={clients}
            onNavigate={(page) => {
              if (page === 'create-invoice') setEditingInvoice(null);
              handleNavigate(page);
            }}
            onSelectInvoice={(inv) => setViewingInvoice(inv)}
            onSelectBatchInvoices={(batch) => setViewingBatchInvoices(batch)}
            onEditInvoice={(inv) => {
              setEditingInvoice(inv);
              setCurrentPage('create-invoice');
            }}
            onDuplicateInvoice={handleDuplicateInvoice}
            onMarkAsPaid={handleMarkAsPaid}
            onDeleteInvoice={handleDeleteInvoice}
          />
        );

      case 'receipts':
        return (
          <ReceiptManagement 
            user={currentUser!}
            invoices={invoices}
            clients={clients}
            onNavigate={handleNavigate}
            onSelectInvoice={(inv, docType) => {
              setPreviewDocType(docType || 'receipt');
              setViewingInvoice(inv);
            }}
            onSaveInvoice={handleSaveInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onFeatureBlocked={(featureName) => setBlockedFeatureMessage(featureName)}
          />
        );

      case 'clients':
        return (
          <ClientManagement 
            user={currentUser!}
            clients={clients}
            invoices={invoices}
            onAddClient={handleAddClient}
            onEditClient={handleEditClient}
            onDeleteClient={handleDeleteClient}
            onFeatureBlocked={(featureName) => setBlockedFeatureMessage(featureName)}
          />
        );

      case 'products':
        return (
          <ProductsServices 
            user={currentUser!}
            products={products}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onFeatureBlocked={(featureName) => setBlockedFeatureMessage(featureName)}
          />
        );

      case 'reports':
        return (
          <ReportsAnalytics 
            invoices={invoices}
            clients={clients}
            user={currentUser!}
          />
        );

      case 'quotations':
        return (
          <QuotationManagement 
            user={currentUser!}
            clients={clients}
            products={products}
            quotations={quotations}
            onAddQuotation={handleAddQuotation}
            onEditQuotation={handleEditQuotation}
            onDeleteQuotation={handleDeleteQuotation}
            onConvertQuotationToInvoice={handleConvertQuotationToInvoice}
            onNavigate={handleNavigate}
            onFeatureBlocked={(featureName) => setBlockedFeatureMessage(featureName)}
          />
        );

      case 'subscription':
        return (
          <SubscriptionPage 
            user={currentUser!}
            currentClientCount={clients.length}
            currentInvoiceCount={invoices.length}
            onSimulateQuota={handleSimulateQuota}
            onUpgradePlan={(plan, isYearly) => {
              const futureDate = new Date();
              const extendDays = isYearly ? 365 : 30;
              futureDate.setDate(futureDate.getDate() + extendDays);

              const updated = {
                ...currentUser!,
                subscription: { 
                  ...currentUser!.subscription, 
                  plan,
                  status: 'active' as const,
                  expiryDate: futureDate.toISOString().split('T')[0],
                  trialDaysRemaining: 0,
                  billingCycle: isYearly ? 'yearly' as const : 'monthly' as const
                }
              };

              // Payment record is already recorded inside QrisPaymentBox on successful verification.

              syncAndSaveUser(updated);
              createNotification(
                'success',
                'Upgrade Paket Berhasil! 🚀',
                `Selamat! Anda telah sukses meng-upgrade akun Anda ke paket ${plan.toUpperCase()} (${isYearly ? 'Tahunan' : 'Bulanan'}). Masa aktif akun Anda telah diperpanjang selama ${extendDays} hari ke depan dan seluruh fitur premium sudah dapat Anda akses secara penuh.`,
                currentUser!.id
              );
              showToast(`Berhasil upgrade ke paket ${plan.toUpperCase()} (${isYearly ? 'Tahunan' : 'Bulanan'})! Masa aktif diperpanjang ${extendDays} hari.`, 'success');
            }}
            onRenewSubscription={() => {
              setCurrentPage('renew-lockout');
            }}
            onSimulateExpiry={handleSimulateExpiry}
            onRefreshUserStatus={() => {
              checkPendingPayments(currentUser!);
            }}
          />
        );

      case 'settings':
        return (
          <ProfileSettings 
            user={currentUser!}
            onUpdateProfile={(updatedProfile) => {
              syncAndSaveUser(updatedProfile);
            }}
          />
        );

      case 'admin-panel':
        return (
          <AdminPanel 
            currentUser={currentUser}
            onUsersUpdated={() => {
              // Reload session
              const freshUsers = JSON.parse(localStorage.getItem('fid_invoice_all_users') || '[]');
              const matched = freshUsers.find((u: any) => u.id === currentUser?.id);
              if (matched) {
                setCurrentUser(matched);
                loadUserData(matched.id);
              }
            }}
            onCloseAdmin={() => setCurrentPage('dashboard')}
          />
        );

      default:
        return <p className="text-xs text-gray-400">Halaman tidak ditemukan.</p>;
    }
  };

  // Nav rails config
  const navItems = [
    { id: 'dashboard', label: 'Ringkasan', icon: Building2 },
    { id: 'quotations', label: 'Penawaran Harga', icon: FileSpreadsheet },
    { id: 'create-invoice', label: 'Buat Invoice', icon: FileText },
    { id: 'invoice-list', label: 'Kelola Invoice', icon: ClipboardList },
    { id: 'receipts', label: 'Kuitansi Resmi', icon: Receipt },
    { id: 'clients', label: 'Klien Bisnis', icon: Users },
    { id: 'products', label: 'Produk & Jasa', icon: Package },
    { id: 'reports', label: 'Laporan Keuangan', icon: BarChart3 },
    { id: 'subscription', label: 'Paket Saya', icon: CreditCard },
    { id: 'settings', label: 'Setelan Profil', icon: Settings },
  ];

  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const isPrintMode = params.has('print') || params.has('batchReport');

  // STANDALONE PRINT VIEW MODE (bypasses landing, auth blocks, subscription locks and sidebar decoration)
  if (isPrintMode) {
    return (
      <div className="min-h-screen bg-white font-sans text-brand-dark selection:bg-brand-primary-light selection:text-brand-primary">
        <main className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
          {renderMainContent()}
        </main>
      </div>
    );
  }

  // LANDING PAGE ROUTING
  if (currentPage === 'landing') {
    return (
      <>
        <LandingPage 
          onNavigate={(page) => setCurrentPage(page)}
          onSelectPlan={(plan) => {
            setCurrentPage('register');
          }}
        />
        <CallCenterChat currentUser={currentUser} onNavigate={setCurrentPage} />
      </>
    );
  }

  // AUTH PAGE ROUTING (handles 'auth', 'login', and 'register')
  if (currentPage === 'auth' || currentPage === 'login' || currentPage === 'register') {
    return (
      <>
        <AuthPage 
          initialView={currentPage === 'register' ? 'register' : 'login'}
          selectedPlan="professional"
          onNavigate={(page) => setCurrentPage(page)}
          onAuthSuccess={handleAuthSuccess}
        />
        <CallCenterChat currentUser={currentUser} onNavigate={setCurrentPage} />
      </>
    );
  }

  // TOP LEVEL ROUTING BYPASS FOR SECRET ADMIN PANEL (Allows unauthenticated/expired owner testing)
  if (currentPage === 'admin-panel') {
    return (
      <AdminPanel 
        currentUser={currentUser}
        onUsersUpdated={() => {
          const freshUsers = JSON.parse(localStorage.getItem('fid_invoice_all_users') || '[]');
          const matched = freshUsers.find((u: any) => u.id === currentUser?.id);
          if (matched) {
            setCurrentUser(matched);
            loadUserData(matched.id);
          }
        }}
        onCloseAdmin={() => {
          if (currentUser) {
            setCurrentPage('dashboard');
          } else {
            setCurrentPage('landing');
          }
        }}
      />
    );
  }

  // FORCE TO LANDING IF NOT LOGGED IN
  if (!currentUser) {
    return (
      <>
        <LandingPage 
          onNavigate={(page) => setCurrentPage(page)}
          onSelectPlan={(plan) => {
            setCurrentPage('register');
          }}
        />
        <CallCenterChat currentUser={currentUser} onNavigate={setCurrentPage} />
      </>
    );
  }

  // HIGH FIDELITY BLOCKED ACCOUNT GATEWAY SCREEN (BLOCKS ALL NORMAL VIEWS)
  if (currentUser?.subscription.status === 'blocked') {
    return (
      <>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-start p-6 sm:p-10 font-sans text-left selection:bg-brand-gold/30 overflow-y-auto">
        
        {/* Header bar */}
        <div className="flex justify-between items-center border-b border-slate-900 pb-5 shrink-0">
          <span className="font-display font-black tracking-tight text-lg text-white">
            FID <span className="text-brand-primary">INVOICE</span>
          </span>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>

        {/* Core Lockout message */}
        <div className="max-w-xl mx-auto space-y-8 py-10 w-full flex-1 flex flex-col justify-center text-center sm:text-left">
          
          <div className="space-y-4">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto sm:mx-0">
              <Ban className="w-8 h-8 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white leading-tight">Akun Ditangguhkan (Blocked)</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Akun dengan nama owner <strong className="text-white">{currentUser?.fullName}</strong> ({currentUser?.email}) telah <strong>DINONAKTIFKAN</strong> secara permanen atau sementara oleh Pemilik Aplikasi (Administrator).
              </p>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850 space-y-4 text-left">
            <h4 className="text-xs font-black uppercase text-brand-gold tracking-widest font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-brand-gold" />
              Mengapa akun saya ditangguhkan?
            </h4>
            <ul className="list-disc list-inside text-xs text-slate-400 space-y-2 leading-relaxed">
              <li>Adanya indikasi manipulasi invoice atau penagihan fiktif.</li>
              <li>Penyalahgunaan data klien atau email spam pengingat.</li>
              <li>Belum mengonfirmasi bukti transfer paket subscription yang sah.</li>
              <li>Pelanggaran umum terhadap syarat dan ketentuan penggunaan FID INVOICE.</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-950/20 border border-blue-900/30 rounded-xl text-xs text-blue-300 leading-relaxed text-left">
            💬 <strong>Butuh bantuan?</strong> Silakan hubungi admin atau supervisor kami untuk mengirim pesan pengajuan banding atau bukti konfirmasi transfer secara langsung ke pemilik aplikasi.
          </div>

        </div>

      </div>
      <CallCenterChat currentUser={currentUser} onNavigate={setCurrentPage} />
      </>
    );
  }

  // HIGH FIDELITY EXPIRED LOCK-OUT GATEWAY SCREEN (BLOCKS ALL NORMAL VIEWS)
  if (currentPage === 'renew-lockout') {
    return (
      <>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-start p-6 sm:p-10 font-sans text-left selection:bg-brand-gold/30 overflow-y-auto">
        
        {/* Header bar */}
        <div className="flex justify-between items-center border-b border-slate-900 pb-5 shrink-0">
          <span className="font-display font-black tracking-tight text-lg text-white">
            FID <span className="text-brand-primary">INVOICE</span>
          </span>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>

        {/* Core Lockout message */}
        <div className="max-w-xl mx-auto space-y-8 py-10 w-full flex-1 flex flex-col justify-center">
          
          <div className="space-y-4 text-center sm:text-left">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto sm:mx-0">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white leading-tight">Layanan Ditangguhkan (Expired)</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Masa berlaku lisensi penagihan SaaS untuk owner <strong className="text-white">{currentUser?.fullName || 'Felix Hencia'}</strong> telah berakhir pada <strong className="text-red-400">{currentUser ? formatDateIndonesian(currentUser.subscription.expiryDate) : 'hari ini'}</strong>.
              </p>
            </div>
          </div>

          {!qrisStep ? (
            // Select renewal pricing
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-850 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="text-xs font-black uppercase text-brand-gold tracking-widest font-mono">PILIH PAKET PERPANJANGAN</h4>
                
                {/* Billing cycle toggle in Lockout Screen */}
                <div className="bg-slate-800 p-1 rounded-xl flex items-center shrink-0 self-start sm:self-center">
                  <button
                    onClick={() => setRenewBillingPeriod('monthly')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${renewBillingPeriod === 'monthly' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-slate-300'}`}
                  >
                    Bulanan
                  </button>
                  <button
                    onClick={() => setRenewBillingPeriod('yearly')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer ${renewBillingPeriod === 'yearly' ? 'bg-brand-primary text-white shadow-xs' : 'text-slate-400 hover:text-slate-300'}`}
                  >
                    Tahunan
                    <span className="bg-red-500 text-white text-[8px] font-extrabold px-1 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                      Hemat 20%
                    </span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => setSelectedRenewPlan('professional')}
                  className={`p-4 rounded-xl border-2 text-left space-y-2 transition-all cursor-pointer ${selectedRenewPlan === 'professional' ? 'border-brand-primary bg-brand-primary-light/5 text-white' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}
                >
                  <p className="text-xs font-bold">PRO PLAN ({renewBillingPeriod === 'yearly' ? '365 Hari' : '30 Hari'})</p>
                  <p className="font-mono text-base font-black text-white">
                    {renewBillingPeriod === 'yearly' ? 'Rp 950.000' : 'Rp 99.000'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {renewBillingPeriod === 'yearly' ? 'Masa aktif 1 tahun (hemat Rp 238.000). ' : ''}Kuota 50 klien, Unlimited Invoice, Auto Reminder.
                  </p>
                </button>

                <button 
                  onClick={() => setSelectedRenewPlan('enterprise')}
                  className={`p-4 rounded-xl border-2 text-left space-y-2 transition-all cursor-pointer ${selectedRenewPlan === 'enterprise' ? 'border-brand-primary bg-brand-primary-light/5 text-white' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}
                >
                  <p className="text-xs font-bold">ENTERPRISE ({renewBillingPeriod === 'yearly' ? '365 Hari' : '30 Hari'})</p>
                  <p className="font-mono text-base font-black text-white">
                    {renewBillingPeriod === 'yearly' ? 'Rp 1.900.000' : 'Rp 199.000'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {renewBillingPeriod === 'yearly' ? 'Masa aktif 1 tahun (hemat Rp 488.000). ' : ''}Klien Tanpa Batas, Custom branding, Prioritas CS.
                  </p>
                </button>
              </div>

              <button 
                onClick={() => setQrisStep(true)}
                className="w-full py-3 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Lanjutkan Pembayaran (BCA, Mandiri, BSN)
              </button>
            </div>
          ) : (
            // Bank Transfer Step with high-fidelity QrisPaymentBox
            <div className="space-y-4">
              <QrisPaymentBox 
                amount={selectedRenewPlan === 'professional' ? (renewBillingPeriod === 'yearly' ? 950000 : 99000) : (renewBillingPeriod === 'yearly' ? 1900000 : 199000)}
                planName={renewBillingPeriod === 'yearly' ? `${selectedRenewPlan} (Yearly)` : selectedRenewPlan}
                onPaymentSuccess={handleSimulatePaymentSuccess}
                onClose={() => setQrisStep(false)}
                isDarkMode={true}
                userName={currentUser?.fullName || 'Tamu'}
                userEmail={currentUser?.email}
                userId={currentUser?.id}
              />
              <button 
                onClick={() => setQrisStep(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                ← Pilih Paket Lain
              </button>
            </div>
          )}

          {/* SaaS subscription history and check status panel for lockout recovery */}
          <PaymentHistorySection 
            userId={currentUser.id}
            onRefreshUserStatus={() => {
              showToast('Mendapatkan status verifikasi terupdate dari server...', 'info');
              // Reload page to automatically pick up the reactivated subscription status from localStorage/server
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            }}
            isDarkMode={true}
          />

        </div>

        {/* Footer */}
        <p className="text-[10px] text-slate-600 text-center uppercase tracking-widest font-mono">SaaS SECURE GATEWAY VERSI 2026.04</p>
      </div>
      <CallCenterChat currentUser={currentUser} onNavigate={setCurrentPage} />
      </>
    );
  }

  // GENERAL LOGGED IN APP LAYOUT (DASHBOARD & ALL PAGES)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-brand-dark selection:bg-brand-primary-light selection:text-brand-primary relative">
      
      {/* Desktop & Mobile Collapsible Sidebar */}
      <aside 
        className={`fixed md:sticky top-0 left-0 h-screen bg-white border-r border-gray-100 flex flex-col justify-between shrink-0 z-40 transition-all duration-300 no-print shadow-xl md:shadow-none
          ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:-translate-x-full md:w-0 w-0 overflow-hidden'}
        `}
      >
        
        {/* Brand & Menu */}
        <div className="space-y-8 py-8 px-6 text-left">
          
          {/* Logo brand & close button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand-primary text-white flex items-center justify-center shadow-md shadow-brand-primary/15 shrink-0">
                <svg className="w-5.5 h-5.5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 17V7H15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12H13.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <span className="font-display font-black tracking-tight text-sm text-brand-dark">
                  FID <span className="text-brand-primary">INVOICE</span>
                </span>
                <p className="text-[8px] text-gray-400 font-mono tracking-widest uppercase mt-0.5">Penagihan Digital UMKM</p>
              </div>
            </div>

            {/* Collapse Sidebar Button (Hamburger toggle close) */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-brand-primary rounded-xl transition-all cursor-pointer"
              title="Sembunyikan Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu items list */}
          <nav className="space-y-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setViewingInvoice(null);
                    if (item.id === 'create-invoice') {
                      setEditingInvoice(null);
                    }
                    handleNavigate(item.id);
                    // auto close on mobile to prevent blocking view
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive ? 'bg-brand-primary-light/50 text-brand-primary scale-[1.01]' : 'text-gray-500 hover:text-brand-primary hover:bg-gray-50'}`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-brand-primary' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom profile actions & Admin shortcut */}
        <div className="p-6 border-t border-gray-50 space-y-4 text-left">
          
          {/* Admin / Owner Quick Access Badge */}
          {currentUser && (currentUser.email.toLowerCase() === 'felix.hencia04@gmail.com' || currentUser.email.toLowerCase() === 'admin@fidinvoice.com') && (
            <button
              onClick={() => setCurrentPage('admin-panel')}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-brand-gold hover:text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
              id="admin-sidebar-shortcut"
            >
              <ShieldCheck className="w-4 h-4 text-brand-gold" />
              <span>DASHBOARD PEMILIK</span>
            </button>
          )}

          {/* Active Profile block */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-primary-light text-brand-primary flex items-center justify-center font-black text-xs font-display">
              {currentUser?.fullName.substring(0,2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-brand-dark truncate">{currentUser?.fullName}</p>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{currentUser?.subscription.plan}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </aside>

      {/* Backdrop for mobile menu drawer overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 md:hidden no-print transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main workspace container with responsive top-bar */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Iframe Preview Help Banner */}
        {typeof window !== 'undefined' && window.self !== window.top && (
          <div className="bg-amber-50 border-b border-amber-200 py-3.5 px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-left no-print shrink-0">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">⚠️</div>
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                <strong>Mode Pratinjau Aktif:</strong> Browser membatasi fungsi print, unggah logo, tanda tangan, stempel, dan sinkronisasi profil Anda di dalam frame pratinjau ini. Agar logo, tanda tangan, cap stempel, dan nama PT Anda <strong>tersimpan & muncul sempurna</strong>, silakan klik tombol di samping:
              </p>
            </div>
            <button
              onClick={() => window.open(window.location.origin + window.location.pathname, '_blank')}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all border-none"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka Aplikasi di Tab Baru ↗
            </button>
          </div>
        )}

        {/* Expiry Warning Banner */}
        {isSubscriptionExpired() && (
          <div className="bg-rose-50 border-b border-rose-200 py-3 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left no-print shrink-0 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">⚠️</div>
              <p className="text-xs text-rose-950 leading-relaxed font-semibold">
                <strong>Lisensi Berlangganan Habis:</strong> Akses pembuatan rekam keuangan baru (Invoice, Penawaran, Nota Kredit) telah dinonaktifkan. Anda masih dapat mengelola data klien/produk, mengekspor laporan, serta mengoreksi (edit) nota kredit lama.
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('renew-lockout')}
              className="shrink-0 flex items-center gap-1.5 px-4.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer transition-all border-none"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Perpanjang Sekarang ⚡
            </button>
          </div>
        )}
        
        {/* Unified sticky/fixed-like responsive top header bar with Hamburger menu */}
        <header className="bg-white border-b border-gray-100 py-4 px-6 flex justify-between items-center shrink-0 no-print shadow-xs z-20">
          <div className="flex items-center gap-4">
            {/* Hamburger button (Menu) */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 text-gray-500 hover:text-brand-primary hover:bg-gray-50 rounded-xl cursor-pointer transition-colors flex items-center justify-center border border-gray-100"
              title={sidebarOpen ? "Sembunyikan Menu" : "Tampilkan Menu"}
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-primary text-white flex items-center justify-center shadow-sm shrink-0">
                <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 17V7H15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12H13.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-display font-black tracking-tight text-xs text-brand-dark">
                FID <span className="text-brand-primary">INVOICE</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Display current page label for convenience */}
            <span className="hidden xs:inline-block text-[10px] font-extrabold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg uppercase tracking-wider font-mono">
              {navItems.find(item => item.id === currentPage)?.label || 'Aplikasi'}
            </span>
            
            {/* Clickable real-time notification bell icon with badge dropdown menu */}
            <NotificationCenter currentUser={currentUser} />
            
            {/* Clickable Profile Trigger Button with Chevron and Name */}
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1 px-2 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all cursor-pointer text-left select-none"
              title="Menu Profil & Perusahaan"
            >
              <div className="w-7 h-7 rounded-full bg-brand-primary-light text-brand-primary flex items-center justify-center font-black text-[10px] font-display border border-brand-primary/10 shrink-0 overflow-hidden">
                {currentUser?.profilePicture ? (
                  <img src={currentUser.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.fullName.substring(0,2).toUpperCase()
                )}
              </div>
              <div className="hidden md:block min-w-0 max-w-[120px]">
                <p className="text-[10px] font-bold text-brand-dark truncate leading-none">{currentUser?.fullName}</p>
                <span className="text-[8px] font-bold text-gray-400 truncate tracking-wide leading-none">{currentUser?.businessName || 'Profil UMKM'}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Backdrop to close on clicking outside */}
            {profileDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-45 cursor-default" 
                  onClick={() => setProfileDropdownOpen(false)}
                ></div>
                
                {/* Premium Profile Switcher Dropdown */}
                <div className="absolute right-0 top-11 w-72 bg-white rounded-2xl border border-gray-150 shadow-2xl z-50 text-left p-4 space-y-3.5 font-sans animate-fade-in">
                  
                  {/* Dropdown Header: Active profile */}
                  <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-black text-sm font-display shadow-md shadow-brand-primary/10 shrink-0 overflow-hidden">
                      {currentUser?.profilePicture ? (
                        <img src={currentUser.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        currentUser?.fullName.substring(0,2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-brand-dark truncate">{currentUser?.fullName}</p>
                      <p className="text-[10px] font-bold text-gray-500 truncate">{currentUser?.businessName}</p>
                      <p className="text-[9px] text-gray-400 truncate">{currentUser?.email}</p>
                      
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-brand-primary-light/50 text-brand-primary text-[8px] font-black uppercase tracking-wider">
                          {currentUser?.subscription.plan === 'professional' ? 'UMKM PRO' : currentUser?.subscription.plan === 'enterprise' ? 'CORP ENTERPRISE' : 'BASIC FREE'}
                        </span>
                        <span className="text-[8px] font-bold text-green-600 uppercase">AKTIF</span>
                      </div>
                    </div>
                  </div>

                  {/* Settings and Logout items */}
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setViewingInvoice(null);
                        setCurrentPage('settings');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 py-2 px-2.5 hover:bg-gray-50 rounded-xl text-[10px] font-bold text-gray-600 hover:text-brand-primary transition-colors cursor-pointer text-left"
                    >
                      <Settings className="w-3.5 h-3.5 text-gray-400" />
                      <span>Atur Profil & Perusahaan</span>
                    </button>

                    {currentUser && (currentUser.email.toLowerCase() === 'felix.hencia04@gmail.com' || currentUser.email.toLowerCase() === 'admin@fidinvoice.com') && (
                      <button
                        onClick={() => {
                          setViewingInvoice(null);
                          setCurrentPage('admin-panel');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 py-2 px-2.5 bg-slate-950 text-brand-gold hover:text-white rounded-xl text-[10px] font-black transition-colors cursor-pointer text-left"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
                        <span>MASUK PANEL PEMILIK</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 py-2 px-2.5 hover:bg-red-50 hover:text-red-600 rounded-xl text-[10px] font-bold text-gray-500 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                      <span>Keluar Aplikasi (Logout)</span>
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>
        </header>

        {/* Main Workspace Frame */}
        <main className="flex-1 p-6 sm:p-8 md:p-10 max-w-5xl mx-auto w-full overflow-y-auto print:p-0 print:max-w-full">
          {renderMainContent()}
        </main>
      </div>

      {/* Gated Feature Modal for Expired Accounts */}
      {blockedFeatureMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] no-print animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 text-left relative overflow-hidden animate-scale-up">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500"></div>
            
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Masa Berlaku Lisensi Habis</h3>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider font-mono">Fitur Pembuatan Dinonaktifkan</span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-600 leading-relaxed mb-6">
              <p>
                Masa berlaku lisensi penagihan SaaS untuk perusahaan Anda telah berakhir. Untuk menjaga kualitas layanan penagihan dan kepatuhan administrasi keuangan, tindakan <strong>{blockedFeatureMessage}</strong> dinonaktifkan sementara.
              </p>
              <p className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-gray-500 text-[11px]">
                💡 <strong>Catatan:</strong> Anda tetap memiliki akses penuh untuk masuk ke aplikasi, melihat riwayat invoice lama, mengunduh data klien/produk, mengekspor laporan keuangan, dan mengoreksi (edit) Nota Kredit yang sudah ada.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setBlockedFeatureMessage(null);
                  setCurrentPage('renew-lockout');
                }}
                className="flex-1 px-5 py-3.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs text-center rounded-2xl cursor-pointer shadow-md shadow-red-600/10 transition-all border-none"
              >
                Perpanjang Sekarang ⚡
              </button>
              <button
                onClick={() => setBlockedFeatureMessage(null)}
                className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 font-extrabold text-xs text-center rounded-2xl cursor-pointer transition-all border-none"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      <CallCenterChat currentUser={currentUser} onNavigate={setCurrentPage} />
      <NotificationPopup currentUser={currentUser} />
      <ToastContainer toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
}
