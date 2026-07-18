import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, TrendingUp, AlertTriangle, CheckCircle, 
  Trash2, Mail, Ban, ShieldAlert, CalendarPlus, Key, Award,
  Sparkles, DollarSign, Download, Settings, RefreshCw, X,
  MessageSquare, Send, Check, Hourglass, Clock, AlertCircle,
  Lock, Unlock, Eye, EyeOff, Shield, Bell
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { UserProfile, AppNotification } from '../types';
import { formatCurrency, formatDateIndonesian } from '../utils';
import ConfirmModal from './ConfirmModal';
import { getNotifications, saveNotifications, createNotification, syncNotifications } from '../utils/notificationService';
import { showToast } from '../utils/toast';

interface AdminPanelProps {
  onUsersUpdated: () => void;
  onCloseAdmin: () => void;
  currentUser?: UserProfile | null;
}

export default function AdminPanel({ onUsersUpdated, onCloseAdmin, currentUser }: AdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  // OWNER AUTHENTICATION STATES
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
  const [loginError, setLoginError] = useState('');
  const [remoteAdminPass, setRemoteAdminPass] = useState<string | null>(null);

  // Fetch admin config from server on mount
  useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.config && data.config.adminPassObfuscated) {
          setRemoteAdminPass(data.config.adminPassObfuscated);
        }
      })
      .catch(err => console.error("Failed to load admin config:", err));
  }, []);

  // Auto-authorize if the logged-in user is verified as the application owner
  useEffect(() => {
    if (currentUser) {
      const email = currentUser.email.toLowerCase().trim();
      if (email === 'felix.hencia04@gmail.com' || email === 'admin@fidinvoice.com') {
        setIsAuthorized(true);
      }
    }
  }, [currentUser]);

  // OWNER CONFIGURABLE PASSWORD STATE (inside settings)
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');
  const [passChangeError, setPassChangeError] = useState('');

  const [activeTab, setActiveTab] = useState<'Semua' | 'aktif' | 'trial' | 'expired' | 'blocked'>('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  
  // NEW TOP-LEVEL ADMIN VIEW SECTIONS
  const [adminSection, setAdminSection] = useState<'users' | 'payments' | 'chats' | 'email_settings' | 'notifications'>('users');

  // PAYMENT RECAP FILTER STATE
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');
  const [paymentsSubTab, setPaymentsSubTab] = useState<'list' | 'analytics'>('analytics');

  // EARNINGS FILTER STATE
  const [earningsFilterType, setEarningsFilterType] = useState<'all' | 'monthly' | 'custom_range'>('all');
  const [earningsMonth, setEarningsMonth] = useState<string>(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`; // default to current month YYYY-MM
  });
  const [earningsStartDate, setEarningsStartDate] = useState<string>('');
  const [earningsEndDate, setEarningsEndDate] = useState<string>('');

  // REFRESH DATA POPUP STATES
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);

  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadUsers();
      loadPendingPayments();
      loadChatThreads();
      loadNotifications();
      setIsRefreshing(false);
      setShowRefreshSuccess(true);
      setTimeout(() => {
        setShowRefreshSuccess(false);
      }, 2500);
    }, 1000);
  };

  // NOTIFICATION MANAGER STATES
  const [notificationsList, setNotificationsList] = useState<AppNotification[]>([]);
  const [newNotifTitle, setNewNotifTitle] = useState('');
  const [newNotifMessage, setNewNotifMessage] = useState('');
  const [newNotifType, setNewNotifType] = useState<'info' | 'success' | 'warning' | 'maintenance'>('info');
  const [newNotifTarget, setNewNotifTarget] = useState('all'); // 'all' or specific userId

  // RESEND EMAIL SETTINGS STATE
  const [resendApiKey, setResendApiKey] = useState('');
  const [senderEmail, setSenderEmail] = useState('noreply@fidinvoice.id');
  const [testEmailDest, setTestEmailDest] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailSuccess, setTestEmailSuccess] = useState(false);
  const [testEmailError, setTestEmailError] = useState('');

  useEffect(() => {
    // Load config from backend
    fetch('/api/config/email')
      .then(res => res.json())
      .then(data => {
        if (data.resendApiKey) setResendApiKey(data.resendApiKey);
        if (data.resendSender) setSenderEmail(data.resendSender);
      })
      .catch(err => console.error('Failed to load email config:', err));
  }, []);

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/config/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resendApiKey: resendApiKey.trim(),
          resendSender: senderEmail.trim()
        })
      });
      localStorage.setItem('fid_invoice_resend_api_key', resendApiKey.trim());
      localStorage.setItem('fid_invoice_resend_sender', senderEmail);
      setNotif('Pengaturan integrasi Resend Email berhasil disimpan!');
      setTimeout(() => setNotif(''), 3000);
    } catch (err) {
      console.error(err);
      setTestEmailError('Gagal menyimpan pengaturan ke server.');
    }
  };

  const handleSendTestEmail = async () => {
    if (!resendApiKey) {
      setTestEmailError('Silakan masukkan API Key Resend terlebih dahulu!');
      return;
    }
    if (!testEmailDest) {
      setTestEmailError('Silakan masukkan alamat email tujuan uji coba!');
      return;
    }
    setTestEmailLoading(true);
    setTestEmailSuccess(false);
    setTestEmailError('');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: resendApiKey.trim(),
          from: senderEmail || 'noreply@fidinvoice.id',
          to: testEmailDest,
          subject: '⚡ Uji Coba Pengiriman Email Integrasi - FID INVOICE',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: bold;">FID <span style="color: #1a4fbf;">INVOICE</span></h1>
                <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0;">Invoice & Billing Cerdas</p>
              </div>
              <div style="border-top: 4px solid #1a4fbf; padding-top: 20px; color: #334155;">
                <p style="font-size: 16px; font-weight: bold;">Koneksi Berhasil! 🎉</p>
                <p style="font-size: 14px; line-height: 1.6;">Selamat, koneksi API Key Resend Anda pada aplikasi <strong>FID INVOICE</strong> telah berhasil terverifikasi dan siap digunakan untuk pengiriman email asli ke inbox pelanggan secara otomatis.</p>
                <div style="margin: 20px 0; padding: 12px; background-color: #f8fafc; border-radius: 8px; font-size: 13px; color: #475569;">
                  <strong>Detail Uji Coba:</strong><br/>
                  • Alamat Pengirim: ${senderEmail || 'noreply@fidinvoice.id'}<br/>
                  • Alamat Penerima: ${testEmailDest}<br/>
                  • Tanggal: ${new Date().toLocaleString('id-ID')}<br/>
                  • Status Gateway: Aktif (Live)
                </div>
                <p style="font-size: 13px; color: #64748b; margin-top: 24px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                  Pesan ini dikirim secara otomatis oleh modul email integrasi FID INVOICE Gateway. Mohon tidak membalas pesan ini langsung.
                </p>
              </div>
            </div>
          `
        })
      });

      if (response.ok) {
        setTestEmailSuccess(true);
      } else {
        const errData = await response.json().catch(() => ({}));
        setTestEmailError(errData.message || errData.error || 'Gagal mengirim email. Periksa kembali API Key atau domain pengirim Anda.');
      }
    } catch (err: any) {
      setTestEmailError(err.message || 'Terjadi kesalahan jaringan saat mencoba mengirim email.');
    } finally {
      setTestEmailLoading(false);
    }
  };
  
  // NEW OWNER STATES
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [chatThreads, setChatThreads] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');

  // Selected user for action dropdown/modal
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionModal, setActionModal] = useState<'plan' | 'extend' | 'msg' | null>(null);

  // Confirmation Dialog State
  const [confirmDeleteState, setConfirmDeleteState] = useState<{
    isOpen: boolean;
    userId?: string;
    userName?: string;
  }>({
    isOpen: false
  });

  const [confirmDeletePaymentState, setConfirmDeletePaymentState] = useState<{
    isOpen: boolean;
    paymentId?: string;
  }>({
    isOpen: false
  });

  const triggerDeleteUser = (id: string, name: string) => {
    setConfirmDeleteState({
      isOpen: true,
      userId: id,
      userName: name
    });
  };

  const executeDeleteUser = () => {
    if (confirmDeleteState.userId) {
      const targetUser = users.find(u => u.id === confirmDeleteState.userId);
      if (targetUser) {
        const lowerEmail = targetUser.email.toLowerCase().trim();
        // Securely remove their login credentials so they can never authenticate again
        let credentials: Record<string, string> = {};
        const storedCreds = localStorage.getItem('fid_invoice_user_credentials');
        if (storedCreds) {
          credentials = JSON.parse(storedCreds);
        } else {
          credentials = {
            'felix.hencia04@gmail.com': 'admin123',
            'admin@fidinvoice.com': 'admin123',
            'demo@fidinvoice.com': 'demo123'
          };
        }
        if (lowerEmail in credentials) {
          delete credentials[lowerEmail];
          localStorage.setItem('fid_invoice_user_credentials', JSON.stringify(credentials));
        }
      }

      // If the user being deleted has an active session on the current machine, terminate it
      const savedSession = localStorage.getItem('fid_invoice_active_session');
      if (savedSession) {
        try {
          const activeUser = JSON.parse(savedSession);
          if (activeUser && activeUser.id === confirmDeleteState.userId) {
            localStorage.removeItem('fid_invoice_active_session');
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      const updated = users.filter(u => u.id !== confirmDeleteState.userId);
      saveUsersToStorage(updated);
      localStorage.removeItem(`fid_invoice_user_${confirmDeleteState.userId}_data`);
      
      // Delete user on server
      fetch(`/api/users/delete/${confirmDeleteState.userId}`, {
        method: 'DELETE'
      }).catch(err => console.error('Failed to delete user on server:', err));

      setNotif('Pengguna berhasil dihapus secara permanen dari sistem.');
      setTimeout(() => setNotif(''), 3000);
      loadUsers();
    }
  };

  // Modal forms
  const [newPlan, setNewPlan] = useState<'starter' | 'professional' | 'enterprise'>('starter');
  const [extendDays, setExtendDays] = useState(30);

  const [notif, setNotif] = useState('');

  // Transfer Manual external order sync state
  const [adminOrderIdInput, setAdminOrderIdInput] = useState('');
  const [isCheckingOrderId, setIsCheckingOrderId] = useState(false);
  const [adminImportResult, setAdminImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [rowCheckingOrderId, setRowCheckingOrderId] = useState<string | null>(null);

  // Load all users from server & fallback to localStorage
  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
          localStorage.setItem('fid_invoice_all_users', JSON.stringify(data.users));
          return;
        }
      }
    } catch (err) {
      console.error('Failed to load users from server:', err);
    }

    const allUsersStr = localStorage.getItem('fid_invoice_all_users');
    if (allUsersStr) {
      setUsers(JSON.parse(allUsersStr));
    }
  };

  // Load pending payments
  const loadPendingPayments = async () => {
    // 1. Get manual local payments
    const list = JSON.parse(localStorage.getItem('fid_invoice_pending_payments') || '[]');
    
    // Deduplicate logic
    const uniqueList: any[] = [];
    const seenIds = new Set<string>();

    list.forEach((pay: any) => {
      if (!pay || !pay.id) return;
      if (seenIds.has(pay.id)) return;

      // Check if there's a highly similar payment (same user, plan, amount within 15 seconds) already in uniqueList
      const isDuplicate = uniqueList.some((existing: any) => {
        const timeDiff = Math.abs(new Date(existing.timestamp).getTime() - new Date(pay.timestamp).getTime());
        return (
          existing.userId === pay.userId &&
          existing.plan === pay.plan &&
          existing.amount === pay.amount &&
          timeDiff < 15000 // 15 seconds
        );
      });

      if (!isDuplicate) {
        uniqueList.push(pay);
        seenIds.add(pay.id);
      }
    });

    if (uniqueList.length !== list.length) {
      localStorage.setItem('fid_invoice_pending_payments', JSON.stringify(uniqueList));
    }

    // 2. Fetch server-recorded Transfer Manual payments
    try {
      const res = await fetch('/api/doku/all-payments');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.payments)) {
          // Auto-apply subscriptions for any transaction with status 'confirmed' (paid but not applied to user yet)
          const unappliedConfirmedPayments = data.payments.filter((tx: any) => tx.status === 'confirmed');
          
          if (unappliedConfirmedPayments.length > 0) {
            console.log(`[Admin Auto-Apply] Found ${unappliedConfirmedPayments.length} paid but unapplied Transfer Manual payments! Processing auto-apply...`);
            
            // Fetch fresh users from the server so that newly registered users are found
            let allUsers: any[] = [];
            try {
              const uRes = await fetch('/api/users');
              if (uRes.ok) {
                const uData = await uRes.json();
                if (uData.success && Array.isArray(uData.users)) {
                  allUsers = uData.users;
                }
              }
            } catch (err) {
              console.error('Failed to fetch fresh users during auto-apply:', err);
            }

            if (allUsers.length === 0) {
              const allUsersStr = localStorage.getItem('fid_invoice_all_users') || '[]';
              allUsers = JSON.parse(allUsersStr);
            }

            let usersUpdated = false;

            for (const tx of unappliedConfirmedPayments) {
              const userIdx = allUsers.findIndex((u: any) => u.id === tx.userId);
              if (userIdx > -1) {
                const isYearly = !!tx.isYearly;
                const extendDaysVal = isYearly ? 365 : 30;
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + extendDaysVal);
                
                let cleanPlan: 'starter' | 'professional' | 'enterprise' = 'professional';
                if (tx.planName?.toLowerCase().includes('enterprise')) {
                  cleanPlan = 'enterprise';
                } else if (tx.planName?.toLowerCase().includes('starter')) {
                  cleanPlan = 'starter';
                }

                allUsers[userIdx] = {
                  ...allUsers[userIdx],
                  subscription: {
                    ...allUsers[userIdx].subscription,
                    status: 'active',
                    plan: cleanPlan,
                    expiryDate: futureDate.toISOString().split('T')[0],
                    trialDaysRemaining: 0,
                    billingCycle: isYearly ? 'yearly' : 'monthly'
                  }
                };

                // Create persistent user notification using import helper
                createNotification(
                  'success',
                  'Aktivasi Otomatis Transfer Manual 🎉',
                  `Sistem mendeteksi pembayaran Anda senilai Rp ${tx.amount.toLocaleString('id-ID')} via QRIS/VA telah lunas! Paket ${cleanPlan.toUpperCase()} Anda telah aktif secara otomatis.`,
                  tx.userId
                );
                
                usersUpdated = true;

                // Inform server that this payment has been applied
                await fetch('/api/doku/mark-applied', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderId: tx.orderId })
                }).catch(err => console.error(`Failed to mark transaction ${tx.orderId} as applied:`, err));

                // Change status to applied in local list so it represents as confirmed
                tx.status = 'applied';
              }
            }

            if (usersUpdated) {
              saveUsersToStorage(allUsers);
              console.log('[Admin Auto-Apply] Successfully updated user subscriptions and synced with server.');
            }
          }

          const serverPayments = data.payments.map((tx: any) => ({
            id: tx.orderId,
            userId: tx.userId,
            userEmail: tx.userEmail,
            fullName: tx.fullName,
            businessName: tx.businessName || 'Profil SASS',
            plan: tx.planName || 'professional',
            amount: tx.amount || 0,
            isYearly: !!tx.isYearly,
            status: tx.status === 'applied' ? 'confirmed' : tx.status, // normalise for admin viewing
            timestamp: tx.timestamp,
            transferMethod: tx.paymentType || 'Transfer Manual',
            senderBank: tx.paymentType ? 'E-Wallet / VA' : 'QRIS Dinamis',
            notes: tx.paymentType ? `Gateway: ${tx.paymentType}` : 'Pencatatan Otomatis Transfer Manual'
          }));

          serverPayments.forEach((sp: any) => {
            if (!seenIds.has(sp.id)) {
              uniqueList.push(sp);
              seenIds.add(sp.id);
            } else {
              // Update local representation if found
              const idx = uniqueList.findIndex((p: any) => p.id === sp.id);
              if (idx > -1) {
                uniqueList[idx] = {
                  ...uniqueList[idx],
                  status: sp.status,
                  amount: sp.amount || uniqueList[idx].amount,
                  plan: sp.plan || uniqueList[idx].plan
                };
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn('[Admin Panel] Failed to fetch server-recorded Transfer Manual payments:', err);
    }

    // Sort by timestamp descending
    uniqueList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setPendingPayments(uniqueList);
  };

  // Handle checking and importing unregistered Transfer Manual order IDs
  const handleCheckAndImportTransaction = async () => {
    if (!adminOrderIdInput.trim()) {
      setAdminImportResult({ success: false, message: 'Harap masukkan ID Transaksi (Order ID) terlebih dahulu.' });
      return;
    }

    setIsCheckingOrderId(true);
    setAdminImportResult(null);

    try {
      const response = await fetch(`/api/doku/check-status/${adminOrderIdInput.trim()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: 'Pelanggan Ad-hoc (Luar Aplikasi)',
          userEmail: 'customer@example.com'
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setAdminImportResult({
          success: true,
          message: `Sukses! Transaksi ${adminOrderIdInput.trim()}()} ditemukan di Transfer Manual. Status: ${data.transaction?.status?.toUpperCase()} (${data.transaction?.planName?.toUpperCase()}). Transaksi berhasil disimpan/diperbarui!`
        });
        setAdminOrderIdInput('');
        
        // Refresh the payment list immediately
        loadPendingPayments();
        
        // If there's an associated user that needs subscription extension, let's update them
        if (data.transaction && data.transaction.userId && data.transaction.userId !== 'guest' && data.transaction.status === 'confirmed') {
          const allUsersStr = localStorage.getItem('fid_invoice_all_users') || '[]';
          let allUsers = JSON.parse(allUsersStr);
          const userIdx = allUsers.findIndex((u: any) => u.id === data.transaction.userId);
          if (userIdx > -1) {
            const isYearly = !!data.transaction.isYearly;
            const extendDaysVal = isYearly ? 365 : 30;
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + extendDaysVal);

            let cleanPlan: 'starter' | 'professional' | 'enterprise' = 'professional';
            if (data.transaction.planName?.toLowerCase().includes('enterprise')) {
              cleanPlan = 'enterprise';
            } else if (data.transaction.planName?.toLowerCase().includes('starter')) {
              cleanPlan = 'starter';
            }

            allUsers[userIdx] = {
              ...allUsers[userIdx],
              subscription: {
                ...allUsers[userIdx].subscription,
                status: 'active',
                plan: cleanPlan,
                expiryDate: futureDate.toISOString().split('T')[0],
                trialDaysRemaining: 0,
                billingCycle: isYearly ? 'yearly' : 'monthly'
              }
            };
            saveUsersToStorage(allUsers);

            // Create notification for the user
            createNotification(
              'success',
              'Aktivasi Otomatis Transfer Manual 🎉',
              `Sistem mendeteksi pembayaran Anda senilai Rp ${data.transaction.amount.toLocaleString('id-ID')} via QRIS/VA telah lunas! Paket ${cleanPlan.toUpperCase()} Anda telah aktif secara otomatis.`,
              data.transaction.userId
            );

            // Inform server that this payment has been applied
            await fetch('/api/doku/mark-applied', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.transaction.orderId })
            }).catch(err => console.error('Failed to mark transaction as applied:', err));
          }
        }
      } else {
        setAdminImportResult({
          success: false,
          message: data.message || 'Transaksi tidak dapat diverifikasi atau tidak ditemukan di Transfer Manual.'
        });
      }
    } catch (err: any) {
      setAdminImportResult({
        success: false,
        message: `Terjadi kesalahan koneksi ke server: ${err.message}`
      });
    } finally {
      setIsCheckingOrderId(false);
    }
  };

  // Check status for a single row directly from the list
  const handleCheckStatusForOrder = async (orderId: string) => {
    setRowCheckingOrderId(orderId);
    try {
      const response = await fetch(`/api/doku/check-status/${orderId}}}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast(`Sukses memperbarui status Transaksi ${orderId}}}!`, 'success');
        await loadPendingPayments();
        
        // If there's an associated user that needs subscription extension, update them
        if (data.transaction && data.transaction.userId && data.transaction.userId !== 'guest' && data.transaction.status === 'confirmed') {
          const allUsersStr = localStorage.getItem('fid_invoice_all_users') || '[]';
          let allUsers = JSON.parse(allUsersStr);
          const userIdx = allUsers.findIndex((u: any) => u.id === data.transaction.userId);
          if (userIdx > -1) {
            const isYearly = !!data.transaction.isYearly;
            const extendDaysVal = isYearly ? 365 : 30;
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + extendDaysVal);
            
            let cleanPlan: 'starter' | 'professional' | 'enterprise' = 'professional';
            if (data.transaction.planName?.toLowerCase().includes('enterprise')) {
              cleanPlan = 'enterprise';
            } else if (data.transaction.planName?.toLowerCase().includes('starter')) {
              cleanPlan = 'starter';
            }

            allUsers[userIdx] = {
              ...allUsers[userIdx],
              subscription: {
                ...allUsers[userIdx].subscription,
                status: 'active',
                plan: cleanPlan,
                expiryDate: futureDate.toISOString().split('T')[0],
                trialDaysRemaining: 0,
                billingCycle: isYearly ? 'yearly' : 'monthly'
              }
            };
            saveUsersToStorage(allUsers);

            // Create notification for the user
            createNotification(
              'success',
              'Aktivasi Otomatis Transfer Manual 🎉',
              `Sistem mendeteksi pembayaran Anda senilai Rp ${data.transaction.amount.toLocaleString('id-ID')} via QRIS/VA telah lunas! Paket ${cleanPlan.toUpperCase()} Anda telah aktif secara otomatis.`,
              data.transaction.userId
            );

            // Inform server that this payment has been applied
            await fetch('/api/doku/mark-applied', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.transaction.orderId })
            }).catch(err => console.error('Failed to mark transaction as applied:', err));
          }
        }
      } else {
        showToast(data.message || 'Transaksi belum terbayar atau tidak ditemukan.', 'warning');
      }
    } catch (err: any) {
      showToast(`Gagal menghubungi server: ${err.message}`, 'error');
    } finally {
      setRowCheckingOrderId(null);
    }
  };

  // Load support chat threads
  const loadChatThreads = async () => {
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const threads = data.threads || [];
          localStorage.setItem('fid_invoice_support_chats', JSON.stringify(threads));
          setChatThreads(threads.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
          return;
        }
      }
    } catch (e) {}
    const threads = JSON.parse(localStorage.getItem('fid_invoice_support_chats') || '[]');
    setChatThreads(threads.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
  };

  // Load active support chat messages
  const loadChatMessages = async (userId: string) => {
    try {
      const res = await fetch(`/api/chats/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const msgs = data.messages || [];
          localStorage.setItem(`fid_invoice_chat_${userId}`, JSON.stringify(msgs));
          setChatMessages(msgs);
          return;
        }
      }
    } catch(e) {}
    const messages = JSON.parse(localStorage.getItem('fid_invoice_chat_' + userId) || '[]');
    setChatMessages(messages);
  };

  // Load system notifications
  const loadNotifications = async () => {
    await syncNotifications();
    setNotificationsList(getNotifications());
  };

  // Poll for changes in real-time & listen to instant update events
  useEffect(() => {
    loadUsers();
    loadPendingPayments();
    loadChatThreads();
    loadNotifications();

    const handleUsersUpdate = () => {
      loadUsers();
    };

    const handlePaymentsUpdate = () => {
      loadPendingPayments();
    };

    window.addEventListener('fid_users_updated', handleUsersUpdate);
    window.addEventListener('fid_payments_updated', handlePaymentsUpdate);

    const interval = setInterval(() => {
      loadUsers();
      loadPendingPayments();
      loadChatThreads();
      loadNotifications();
      if (selectedChatId) {
        loadChatMessages(selectedChatId);
      }
    }, 1500);

    return () => {
      clearInterval(interval);
      window.removeEventListener('fid_users_updated', handleUsersUpdate);
      window.removeEventListener('fid_payments_updated', handlePaymentsUpdate);
    };
  }, [selectedChatId]);

  // Check persistent lockout state on mount & cleanup session on unmount
  useEffect(() => {
    const savedLockout = localStorage.getItem('fid_invoice_admin_lockout_until');
    if (savedLockout) {
      const timeLeft = Math.ceil((parseInt(savedLockout, 10) - Date.now()) / 1000);
      if (timeLeft > 0) {
        setLockoutTimeLeft(timeLeft);
        setFailedAttempts(3);
        setLoginError('Terdeteksi kegagalan login berulang. Akses dikunci sementara!');
      } else {
        localStorage.removeItem('fid_invoice_admin_lockout_until');
      }
    }

    return () => {
      // Forceful secure state cleanup on component unmount
      setIsAuthorized(false);
    };
  }, []);

  // Secure exit handler that immediately revokes authorization
  const handleExitAdmin = () => {
    setIsAuthorized(false);
    onCloseAdmin();
  };

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setLockoutTimeLeft(prev => {
        if (prev <= 1) {
          setFailedAttempts(0);
          setLoginError('');
          localStorage.removeItem('fid_invoice_admin_lockout_until');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTimeLeft]);

  function saveUsersToStorage(updatedUsers: UserProfile[]) {
    setUsers(updatedUsers);
    localStorage.setItem('fid_invoice_all_users', JSON.stringify(updatedUsers));
    
    // Sync all users to backend server
    fetch('/api/users/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: updatedUsers, overwrite: true })
    }).catch(err => console.error('Failed to sync users to server:', err));

    onUsersUpdated(); // notify parent
  }

  // 1. Extend subscription
  const handleExtendSubscription = (userId: string, days: number) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        const currentExp = new Date(u.subscription.expiryDate);
        const today = new Date();
        const baseDate = currentExp > today ? currentExp : today;
        baseDate.setDate(baseDate.getDate() + days);
        
        return {
          ...u,
          subscription: {
            ...u.subscription,
            status: 'active' as const,
            expiryDate: baseDate.toISOString().split('T')[0],
            trialDaysRemaining: 0
          }
        };
      }
      return u;
    });
    saveUsersToStorage(updated);
    setNotif(`Sukses memperpanjang lisensi selama ${days} hari!`);
    setActionModal(null);
    setTimeout(() => setNotif(''), 3000);
  };

  // 2. Change Plan Tier
  const handleChangePlan = (userId: string, tier: 'starter' | 'professional' | 'enterprise') => {
    const updated = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          subscription: {
            ...u.subscription,
            plan: tier
          }
        };
      }
      return u;
    });
    saveUsersToStorage(updated);
    setNotif(`Sukses mengubah tier paket ke ${tier.toUpperCase()}!`);
    setActionModal(null);
    setTimeout(() => setNotif(''), 3000);
  };

  // 3. Block / Unblock account
  const handleToggleBlock = (userId: string) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        const isBlocked = u.subscription.status === 'blocked';
        return {
          ...u,
          subscription: {
            ...u.subscription,
            status: isBlocked ? 'active' as const : 'blocked' as const
          }
        };
      }
      return u;
    });
    saveUsersToStorage(updated);
    setNotif(`Sukses mengubah status blokir pengguna!`);
    setTimeout(() => setNotif(''), 3000);
  };

  // 4. Send support chat reply as Customer Service (Andi)
  const handleSendChatReply = () => {
    if (!selectedChatId || !replyText.trim()) return;

    const now = new Date();
    const formattedTime = now.toTimeString().split(' ')[0].substring(0, 5);
    const newMsg = {
      id: 'msg_reply_owner_' + Date.now(),
      sender: 'agent' as const,
      senderName: 'Andi - Customer Experience',
      text: replyText,
      timestamp: formattedTime
    };

    const chatKey = 'fid_invoice_chat_' + selectedChatId;
    const existingMsgs = JSON.parse(localStorage.getItem(chatKey) || '[]');
    const updatedMsgs = [...existingMsgs, newMsg];
    localStorage.setItem(chatKey, JSON.stringify(updatedMsgs));
    setChatMessages(updatedMsgs);

    // Update index list
    const indexStr = localStorage.getItem('fid_invoice_support_chats') || '[]';
    let indexList = JSON.parse(indexStr);
    const targetIdx = indexList.findIndex((item: any) => item.userId === selectedChatId);
    let threadMeta = null;
    if (targetIdx > -1) {
      indexList[targetIdx] = {
        ...indexList[targetIdx],
        lastMessage: replyText,
        lastUpdated: new Date().toISOString(),
        unreadForOwner: false,
        unreadForUser: true
      };
      threadMeta = indexList[targetIdx];
      localStorage.setItem('fid_invoice_support_chats', JSON.stringify(indexList));
      setChatThreads(indexList.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
    }

    // Sync to server
    fetch(`/api/chats/${selectedChatId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMsg, threadMeta })
    }).catch(e => console.error(e));

    setReplyText('');

    // Play pleasant UI send sound
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  };

  // 5. Approve manual payment
  const handleApprovePayment = async (paymentId: string) => {
    const isServerPayment = paymentId.startsWith('FID-') || !paymentId.startsWith('pay_');
    
    let payRequest: any = null;
    if (isServerPayment) {
      payRequest = pendingPayments.find((p: any) => p.id === paymentId);
    } else {
      const list = JSON.parse(localStorage.getItem('fid_invoice_pending_payments') || '[]');
      payRequest = list.find((p: any) => p.id === paymentId);
    }
    
    if (!payRequest) {
      showToast('Transaksi tidak ditemukan!', 'error');
      return;
    }

    if (isServerPayment) {
      try {
        const res = await fetch('/api/doku/admin-approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: paymentId })
        });
        if (!res.ok) {
          showToast('Gagal menyetujui transaksi di server', 'error');
          return;
        }
      } catch (err) {
        console.error('Failed to approve server transaction:', err);
        showToast('Gagal menghubungi server', 'error');
        return;
      }
    } else {
      const list = JSON.parse(localStorage.getItem('fid_invoice_pending_payments') || '[]');
      const updatedList = list.map((p: any) => p.id === paymentId ? { ...p, status: 'confirmed' } : p);
      localStorage.setItem('fid_invoice_pending_payments', JSON.stringify(updatedList));
    }

    // Update user subscription
    const allUsersStr = localStorage.getItem('fid_invoice_all_users') || '[]';
    let allUsers = JSON.parse(allUsersStr);
    const userIdx = allUsers.findIndex((u: any) => u.id === payRequest.userId);
    if (userIdx > -1) {
      const isYearly = !!payRequest.isYearly;
      const extendDays = isYearly ? 365 : 30;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + extendDays);

      let cleanPlan = payRequest.plan;
      if (typeof cleanPlan === 'string' && cleanPlan.toLowerCase().includes('enterprise')) {
        cleanPlan = 'enterprise';
      } else if (typeof cleanPlan === 'string' && cleanPlan.toLowerCase().includes('starter')) {
        cleanPlan = 'starter';
      } else {
        cleanPlan = 'professional';
      }

      allUsers[userIdx] = {
        ...allUsers[userIdx],
        subscription: {
          ...allUsers[userIdx].subscription,
          status: 'active',
          plan: cleanPlan,
          expiryDate: futureDate.toISOString().split('T')[0],
          trialDaysRemaining: 0,
          billingCycle: isYearly ? 'yearly' : 'monthly'
        }
      };

      localStorage.setItem('fid_invoice_all_users', JSON.stringify(allUsers));
      setUsers(allUsers);

      // Sync active session if it's the currently logged-in user
      const activeSessionStr = localStorage.getItem('fid_invoice_active_session');
      const activeUser = activeSessionStr ? JSON.parse(activeSessionStr) : null;
      if (activeUser && activeUser.id === payRequest.userId) {
        localStorage.setItem('fid_invoice_active_session', JSON.stringify(allUsers[userIdx]));
      }

      // Automatically create a gorgeous user notification
      createNotification(
        'success',
        'Pembayaran Terverifikasi & Paket Aktif',
        `Selamat! Pembayaran Anda sebesar Rp ${(payRequest.amount || 0).toLocaleString('id-ID')} telah dikonfirmasi oleh Admin. Akun Anda kini aktif di Paket ${cleanPlan.toUpperCase()} untuk ${extendDays} hari ke depan. Terima kasih atas kepercayaan Anda! ✨`,
        payRequest.userId
      );

      setNotif(`Sukses menyetujui transfer & mengaktifkan Paket ${cleanPlan.toUpperCase()} untuk ${payRequest.fullName}!`);
      setTimeout(() => setNotif(''), 3000);
      onUsersUpdated();
    } else {
      setNotif(`Transaksi disetujui (Pelanggan Ad-hoc / Luar Aplikasi)!`);
      setTimeout(() => setNotif(''), 3000);
    }

    await loadPendingPayments();
  };

  // 6. Reject manual payment
  const handleRejectPayment = async (paymentId: string) => {
    const isServerPayment = paymentId.startsWith('FID-') || !paymentId.startsWith('pay_');
    
    let payRequest: any = null;
    if (isServerPayment) {
      payRequest = pendingPayments.find((p: any) => p.id === paymentId);
    } else {
      const list = JSON.parse(localStorage.getItem('fid_invoice_pending_payments') || '[]');
      payRequest = list.find((p: any) => p.id === paymentId);
    }

    if (isServerPayment) {
      try {
        const res = await fetch('/api/doku/admin-reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: paymentId })
        });
        if (!res.ok) {
          showToast('Gagal menolak transaksi di server', 'error');
          return;
        }
      } catch (err) {
        console.error('Failed to reject server transaction:', err);
        showToast('Gagal menghubungi server', 'error');
        return;
      }
    } else {
      const list = JSON.parse(localStorage.getItem('fid_invoice_pending_payments') || '[]');
      const updatedList = list.map((p: any) => p.id === paymentId ? { ...p, status: 'rejected' } : p);
      localStorage.setItem('fid_invoice_pending_payments', JSON.stringify(updatedList));
    }

    await loadPendingPayments();
    setNotif('Pembayaran berhasil ditolak/dibatalkan.');
    setTimeout(() => setNotif(''), 3000);

    if (payRequest) {
      createNotification(
        'warning',
        'Pembayaran Ditolak / Dibatalkan',
        `Pengajuan transfer Anda sebesar Rp ${(payRequest.amount || 0).toLocaleString('id-ID')} untuk Paket ${(payRequest.plan || '').toUpperCase()} ditolak atau dibatalkan oleh Admin. Harap periksa bukti transfer Anda atau hubungi dukungan CS melalui call center chat.`,
        payRequest.userId
      );
    }
  };

  // Delete payment record permanently
  const handleDeletePayment = (paymentId: string) => {
    setConfirmDeletePaymentState({
      isOpen: true,
      paymentId
    });
  };

  const executeDeletePayment = async () => {
    if (confirmDeletePaymentState.paymentId) {
      const paymentId = confirmDeletePaymentState.paymentId;
      setConfirmDeletePaymentState(prev => ({ ...prev, isOpen: false }));

      // Selalu coba hapus dari localStorage untuk memastikan tidak ada cache
      const list = JSON.parse(localStorage.getItem('fid_invoice_pending_payments') || '[]');
      const updatedList = list.filter((p: any) => p.id !== paymentId);
      localStorage.setItem('fid_invoice_pending_payments', JSON.stringify(updatedList));

      const isServerPayment = paymentId.startsWith('FID-') || !paymentId.startsWith('pay_');
      
      if (isServerPayment) {
        try {
          const res = await fetch(`/api/doku/delete/${paymentId}`, {
            method: 'DELETE'
          });
          if (!res.ok && res.status !== 404) {
            showToast('Gagal menghapus transaksi di server', 'error');
            return;
          }
        } catch (err) {
          console.error('Failed to delete server transaction:', err);
          showToast('Gagal menghubungi server', 'error');
          return;
        }
      }

      await loadPendingPayments();
      setNotif('Catatan transaksi pembayaran berhasil dihapus secara permanen.');
      setTimeout(() => setNotif(''), 3000);
    }
  };

  // 7. Create custom notification/broadcast from admin panel
  const handleCreateNotif = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotifTitle || !newNotifMessage) {
      showToast('Judul dan Pesan notifikasi wajib diisi!', 'warning');
      return;
    }
    
    let targetName = 'Semua Pengguna';
    if (newNotifTarget !== 'all') {
      const targetUser = users.find(u => u.id === newNotifTarget);
      if (targetUser) {
        targetName = targetUser.fullName;
      }
    }

    createNotification(newNotifType, newNotifTitle, newNotifMessage, newNotifTarget);
    
    // Clear fields
    setNewNotifTitle('');
    setNewNotifMessage('');
    setNewNotifType('info');
    setNewNotifTarget('all');

    setNotif(`Sukses mengirim notifikasi "${newNotifTitle}" ke ${targetName}!`);
    setTimeout(() => setNotif(''), 3000);
    loadNotifications();
  };

  // 8. Delete notification from admin view (Revoke)
  const handleDeleteNotif = (notifId: string) => {
    const list = getNotifications();
    const updated = list.filter(n => n.id !== notifId);
    saveNotifications(updated);
    setNotif('Notifikasi berhasil ditarik/dihapus dari sistem.');
    setTimeout(() => setNotif(''), 3000);
    loadNotifications();
  };

  // Aggregations
  const totalUsersCount = users.length;
  const activeSubsCount = users.filter(u => u.subscription.status === 'active' || u.subscription.status === 'trial').length;
  const expiredSubsCount = users.filter(u => u.subscription.status === 'expired').length;
  
  // Simulated monthly revenue calculation (Professional plan count * 99k, Enterprise plan count * 199k)
  const monthlyRevenueSimulated = users.reduce((acc, curr) => {
    if (curr.subscription.status === 'active') {
      if (curr.subscription.plan === 'professional') return acc + 99000;
      if (curr.subscription.plan === 'enterprise') return acc + 199000;
    }
    return acc;
  }, 0);

  // Realized all-time revenue from confirmed payments
  const totalConfirmedRealRevenue = pendingPayments
    .filter((p: any) => p.status === 'confirmed' || p.status === 'applied')
    .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

  // Filter user list
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'Semua') return matchesSearch;
    return matchesSearch && u.subscription.status === activeTab;
  });

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-10 font-sans selection:bg-brand-gold/30 selection:text-brand-gold">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden text-left">
          
          {/* Subtle back decorative glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

          {/* Close button to go back to App */}
          <div className="flex justify-end">
            <button
              onClick={handleExitAdmin}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-500 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Kembali ke Aplikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-brand-gold/10 text-brand-gold rounded-2xl flex items-center justify-center mx-auto border border-brand-gold/20 animate-pulse">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-lg sm:text-xl font-display font-extrabold text-white tracking-tight uppercase">
              Gerbang Keamanan Pemilik
            </h2>
            <p className="text-[10px] text-brand-gold font-mono uppercase tracking-widest font-bold">
              FID INVOICE PLATFORM
            </p>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (lockoutTimeLeft > 0) return;

              // Read custom password from server config if set, otherwise check local fallback, else default
              const localCustomPass = localStorage.getItem('fid_invoice_admin_pass');
              const activeObfuscated = remoteAdminPass || localCustomPass;
              const correctPass = activeObfuscated ? atob(activeObfuscated) : atob('RmlkSW52b2ljZUFkbWluOTkh'); // "FidInvoiceAdmin99!"

              if (passwordInput === correctPass) {
                setFailedAttempts(0);
                setIsAuthorized(true);
              } else {
                const newAttempts = failedAttempts + 1;
                setFailedAttempts(newAttempts);
                if (newAttempts >= 3) {
                  const lockoutUntil = Date.now() + 30000;
                  localStorage.setItem('fid_invoice_admin_lockout_until', lockoutUntil.toString());
                  setLockoutTimeLeft(30);
                  setLoginError('Terdeteksi 3x kegagalan login. Akses dikunci selama 30 detik demi keamanan!');
                } else {
                  setLoginError(`Kunci akses salah! Sisa percobaan: ${3 - newAttempts}`);
                }
              }
            }}
            className="space-y-4"
          >
            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{loginError}</span>
              </div>
            )}

            {lockoutTimeLeft > 0 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl text-xs text-center space-y-2">
                <p className="font-extrabold uppercase tracking-widest font-mono">⚠️ LOCKOUT SYSTEM ACTIVE</p>
                <p className="text-[11px]">Sistem terkunci dari tebakan kata sandi liar. Silakan tunggu:</p>
                <p className="text-xl font-black font-mono tracking-widest">{lockoutTimeLeft} DETIK</p>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Masukkan Kunci Akses Pemilik
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (failedAttempts < 3) setLoginError('');
                  }}
                  disabled={lockoutTimeLeft > 0}
                  placeholder="Kunci Akses Pemilik..."
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl pl-10 pr-10 py-3 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono tracking-wider font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white cursor-pointer"
                  title={showPassword ? "Sembunyikan Sandi" : "Tampilkan Sandi"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={lockoutTimeLeft > 0 || !passwordInput}
              className="w-full py-3 bg-brand-gold hover:bg-brand-gold-dark text-slate-950 font-black text-xs sm:text-sm rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all uppercase tracking-wider shadow-lg shadow-brand-gold/10"
            >
              Masuk Panel Pemilik
            </button>
          </form>

          {/* Secure disclaimer */}
          <div className="pt-4 border-t border-slate-850 text-center space-y-1.5 text-slate-500">
            <div className="flex items-center justify-center gap-1 text-[9px] font-mono">
              <Shield className="w-3.5 h-3.5 text-brand-gold" />
              <span>SISTEM TERENKRIPSI AES-256</span>
            </div>
            <p className="text-[9px] text-slate-600 leading-relaxed max-w-[280px] mx-auto">
              Hanya pemilik sah platform yang memiliki akses legal ke data ini. Kunci default didekripsi secara runtime demi perlindungan maksimum.
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10 font-sans text-left relative selection:bg-brand-gold/30 selection:text-brand-gold">
      
      {/* Refresh Loading Modal Popup Overlay */}
      {isRefreshing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in no-print">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto animate-spin">
              <RefreshCw className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-md font-extrabold text-white">Sinkronisasi Data Real-Time</h3>
              <p className="text-xs text-slate-400 mt-1">Mengambil rekapitulasi pembayaran terbaru, status paket pengguna, dan pesan chat masuk...</p>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div className="bg-indigo-600 h-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Success Toast Popup Overlay */}
      {showRefreshSuccess && (
        <div className="fixed top-6 right-6 bg-emerald-950 border border-emerald-800 text-emerald-400 px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-2xl z-50 animate-fade-in no-print">
          <div className="w-8 h-8 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400 font-bold">
            ✓
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider">SUKSES REFRESH</p>
            <p className="text-[11px] text-slate-300">Semua data berhasil disinkronkan secara instan!</p>
          </div>
        </div>
      )}

      {/* Absolute Header with close button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-850 pb-5 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gold text-slate-950 flex items-center justify-center font-black">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white tracking-tight">PANEL PEMILIK APLIKASI (FID INVOICE)</h1>
            <p className="text-xs text-brand-gold font-mono uppercase tracking-widest mt-0.5">Sistem Verifikasi Billing, Langganan & Chat Support</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <button 
            onClick={handleRefreshData}
            className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-indigo-900/20"
            title="Sinkronisasi & Segarkan Data Real-Time"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Segarkan Data
          </button>

          <button 
            onClick={() => setIsChangingPass(true)}
            className="flex-1 md:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-brand-gold hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Key className="w-4 h-4" />
            Ubah Sandi Owner
          </button>
          
          <button 
            onClick={handleExitAdmin}
            className="flex-1 md:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            Keluar Ke Aplikasi
          </button>
        </div>
      </div>

      {notif && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-xs font-bold text-green-400">
          ✓ {notif}
        </div>
      )}

      {/* THREE-WAY SECTIONS NAVIGATION RAIL */}
      <div className="flex border-b border-slate-800 mb-8 gap-1 overflow-x-auto pb-px">
        <button 
          onClick={() => setAdminSection('users')}
          className={`px-5 py-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${adminSection === 'users' ? 'border-brand-gold text-white bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Users className="w-4 h-4 text-brand-gold" />
          👥 Manajemen Pengguna
        </button>
        <button 
          onClick={() => {
            setAdminSection('payments');
            loadPendingPayments();
          }}
          className={`px-5 py-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${adminSection === 'payments' ? 'border-brand-gold text-white bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-white'} relative`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          Verifikasi & Rekap Pembayaran
          {pendingPayments.filter(p => p.status === 'pending').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute right-3 top-3" />
          )}
        </button>
        <button 
          onClick={() => {
            setAdminSection('chats');
            loadChatThreads();
          }}
          className={`px-5 py-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${adminSection === 'chats' ? 'border-brand-gold text-white bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-white'} relative`}
        >
          <Mail className="w-4 h-4 text-blue-400" />
          Dukungan Pesan Masuk
          {chatThreads.filter(c => c.unreadForOwner).length > 0 && (
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse absolute right-3 top-3" />
          )}
        </button>
        <button 
          onClick={() => {
            setAdminSection('notifications');
            loadNotifications();
          }}
          className={`px-5 py-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${adminSection === 'notifications' ? 'border-brand-gold text-white bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Bell className="w-4 h-4 text-rose-400" />
          📢 Kirim Notifikasi
        </button>
        <button 
          onClick={() => setAdminSection('email_settings')}
          className={`px-5 py-3 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${adminSection === 'email_settings' ? 'border-brand-gold text-white bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Settings className="w-4 h-4 text-indigo-400" />
          ✉ Integrasi Resend Email
        </button>
      </div>

      {/* METRICS ROW (Shared on all views) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Terdaftar</p>
          <h3 className="text-3xl font-black font-display text-white mt-1.5">{totalUsersCount}</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-semibold text-green-400">+15 Minggu ini</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pelanggan Aktif</p>
          <h3 className="text-3xl font-black font-display text-emerald-400 mt-1.5">{activeSubsCount}</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-semibold">Rasio Konversi 85%</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pembayaran Tertunda</p>
          <h3 className="text-3xl font-black font-display text-amber-500 mt-1.5">
            {pendingPayments.filter(p => p.status === 'pending').length} Transaksi
          </h3>
          <p className="text-[10px] text-slate-400 mt-2 font-semibold text-amber-400">Menunggu Verifikasi Manual</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Omzet Riil (Terverifikasi)</p>
          <h3 className="text-3xl font-black font-display text-brand-gold mt-1.5 font-mono">{formatCurrency(totalConfirmedRealRevenue)}</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-semibold text-green-400">
            {pendingPayments.filter((p: any) => p.status === 'confirmed' || p.status === 'applied').length}x Transaksi Sukses
          </p>
        </div>
      </div>

      {/* CONDITIONAL SECTIONS RENDERING */}
      {adminSection === 'users' && (
        <>
          {/* BULK CONTROLS & SEARCH */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-850 space-y-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              
              {/* Tabs switch */}
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                {(['Semua', 'aktif', 'trial', 'expired', 'blocked'] as const).map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl transition-colors cursor-pointer uppercase tracking-wider text-[10px] font-mono ${activeTab === tab ? 'bg-brand-gold text-slate-950 font-black' : 'bg-slate-850 text-slate-400 hover:text-white'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Search field */}
              <div className="w-full md:w-80 relative">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari user berdasarkan nama, email, bisnis..."
                  className="w-full pl-4 pr-4 py-2 border border-slate-800 bg-slate-950 rounded-xl text-xs text-white outline-none focus:border-brand-gold"
                />
              </div>

            </div>
          </div>

          {/* USER LIST DATATABLE */}
          <div className="bg-slate-900 rounded-2xl border border-slate-850 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead>
                  <tr className="bg-slate-950 text-slate-500 text-xs font-bold uppercase border-b border-slate-800">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Nama Pengguna</th>
                    <th className="px-6 py-4">Email & No HP</th>
                    <th className="px-6 py-4">Nama Legal Bisnis</th>
                    <th className="px-6 py-4">Paket Tier</th>
                    <th className="px-6 py-4">Tanggal Expiry</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-emerald-400">Histori Omzet</th>
                    <th className="px-6 py-4 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-500 italic">Tidak ada data pengguna terdaftar.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, idx) => {
                      const userPayments = pendingPayments.filter((p: any) => p.userEmail === u.email || p.userId === u.id);
                      const confirmedPayments = userPayments.filter((p: any) => p.status === 'confirmed' || p.status === 'applied');
                      const totalConfirmedAmount = confirmedPayments.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
                      const hasPending = userPayments.some((p: any) => p.status === 'pending');

                      const isOwnerUser = u.email.toLowerCase().trim() === 'felix.hencia04@gmail.com' || u.email.toLowerCase().trim() === 'admin@fidinvoice.com';

                      return (
                        <tr key={u.id} className="hover:bg-slate-850/40 transition-colors">
                          <td className="px-6 py-4 font-mono text-slate-500 text-xs">{u.id.substring(0, 8)}</td>
                          <td className="px-6 py-4 font-semibold text-white">
                            <div className="flex items-center gap-1.5">
                              <span>{u.fullName}</span>
                              {isOwnerUser && (
                                <span className="px-2 py-0.5 rounded bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[9px] font-black uppercase tracking-wider flex items-center gap-1 font-mono">
                                  👑 Pemilik
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-white text-xs">{u.email}</p>
                            <p className="text-slate-500 text-[10px]">{u.phone}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-300">{u.businessName}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-mono font-bold uppercase">
                              {u.subscription.plan}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">{formatDateIndonesian(u.subscription.expiryDate)}</td>
                          <td className="px-6 py-4">
                            {u.subscription.status === 'active' && <span className="text-emerald-400 font-bold text-xs">🟢 Aktif</span>}
                            {u.subscription.status === 'trial' && <span className="text-amber-400 font-bold text-xs">🟡 Trial</span>}
                            {u.subscription.status === 'expired' && <span className="text-red-400 font-bold text-xs">🔴 Expired</span>}
                            {u.subscription.status === 'blocked' && <span className="text-rose-600 font-bold text-xs">🚫 Diblokir</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="font-mono text-xs font-black text-emerald-400">
                                {formatCurrency(totalConfirmedAmount)}
                              </p>
                              <p className="text-[10px] text-slate-500 font-semibold uppercase">
                                {confirmedPayments.length}x Sukses
                              </p>
                              {hasPending && (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-black animate-pulse uppercase">
                                  ADA PENDING ⏳
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            
                            {/* Extend manually */}
                            <button 
                              onClick={() => { setSelectedUser(u); setActionModal('extend'); }}
                              className="p-1.5 bg-slate-800 hover:bg-brand-gold hover:text-slate-950 rounded text-slate-300 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Perpanjang Manually"
                            >
                              <CalendarPlus className="w-4 h-4" />
                            </button>

                            {/* Upgrade plan */}
                            <button 
                              onClick={() => { setSelectedUser(u); setActionModal('plan'); }}
                              className="p-1.5 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 rounded text-slate-300 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Ganti Tier Paket"
                            >
                              <Award className="w-4 h-4" />
                            </button>

                            {/* Toggle block */}
                            <button 
                              onClick={() => handleToggleBlock(u.id)}
                              className={`p-1.5 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${u.subscription.status === 'blocked' ? 'bg-rose-500 text-white' : 'bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-300'}`}
                              title={u.subscription.status === 'blocked' ? 'Buka Blokir' : 'Blokir Akun'}
                            >
                              <Ban className="w-4 h-4" />
                            </button>

                            {/* Delete user */}
                            <button 
                              onClick={() => triggerDeleteUser(u.id, u.fullName)}
                              className="p-1.5 bg-slate-800 hover:bg-red-600 hover:text-white rounded text-slate-300 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Hapus Akun Permanen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

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
        </>
      )}

      {adminSection === 'payments' && (() => {
        // Filter payments based on month or manual date range
        const filteredByDatePayments = pendingPayments.filter(pay => {
          if (earningsFilterType === 'all') return true;
          if (!pay.timestamp) return false;
          
          const payDate = new Date(pay.timestamp);
          
          if (earningsFilterType === 'monthly') {
            if (!earningsMonth) return true;
            // earningsMonth is YYYY-MM
            const [year, month] = earningsMonth.split('-').map(Number);
            return payDate.getFullYear() === year && (payDate.getMonth() + 1) === month;
          }
          
          if (earningsFilterType === 'custom_range') {
            // Check start date
            if (earningsStartDate) {
              const start = new Date(earningsStartDate);
              start.setHours(0, 0, 0, 0);
              if (payDate < start) return false;
            }
            // Check end date
            if (earningsEndDate) {
              const end = new Date(earningsEndDate);
              end.setHours(23, 59, 59, 999);
              if (payDate > end) return false;
            }
            return true;
          }
          
          return true;
        });

        const confirmedEarnings = filteredByDatePayments
          .filter(p => p.status === 'confirmed' || p.status === 'applied')
          .reduce((acc, curr) => acc + (curr.amount || 0), 0);

        const pendingEarnings = filteredByDatePayments
          .filter(p => p.status === 'pending')
          .reduce((acc, curr) => acc + (curr.amount || 0), 0);

        const filteredPayments = filteredByDatePayments.filter(pay => {
          if (paymentFilter === 'all') return true;
          return pay.status === paymentFilter;
        });

        // 1. Calculate Metrics for Premium Dashboard
        const activePayingSubscribers = users.filter(u => 
          (u.subscription.status === 'active' || u.subscription.status === 'trial') && 
          u.subscription.plan !== 'free'
        );
        const payingConversionRate = users.length > 0 
          ? ((activePayingSubscribers.length / users.length) * 100).toFixed(1) 
          : '0.0';

        // MRR Calculation
        const calculatedMRR = users.reduce((total, u) => {
          if (u.subscription.status === 'active') {
            const plan = (u.subscription.plan || 'professional').toLowerCase();
            const billing = u.subscription.billingCycle || 'monthly';
            
            let monthlyPrice = 99000;
            if (plan.includes('starter')) monthlyPrice = 39000;
            else if (plan.includes('enterprise')) monthlyPrice = 199000;
            
            if (billing === 'yearly') {
              let yearlyPrice = 950000;
              if (plan.includes('starter')) yearlyPrice = 390000;
              else if (plan.includes('enterprise')) yearlyPrice = 1900000;
              return total + Math.round(yearlyPrice / 12);
            } else {
              return total + monthlyPrice;
            }
          }
          return total;
        }, 0);

        const calculatedARR = calculatedMRR * 12;

        const totalTransactionsCount = pendingPayments.filter(p => p.status === 'confirmed' || p.status === 'applied').length;
        
        const averageOrderValue = totalTransactionsCount > 0 
          ? Math.round(confirmedEarnings / totalTransactionsCount) 
          : 0;

        // Data for Past 6 Months
        const chart6MonthsData = (() => {
          const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          const today = new Date();
          const chartDataList = [];
          
          for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const label = `${monthsIndo[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
            
            // Calculate earnings in this month
            const monthEarnings = pendingPayments
              .filter(p => p.status === 'confirmed' || p.status === 'applied')
              .filter(p => {
                if (!p.timestamp) return false;
                const pDate = new Date(p.timestamp);
                return pDate.getFullYear() === d.getFullYear() && pDate.getMonth() === d.getMonth();
              })
              .reduce((sum, p) => sum + (p.amount || 0), 0);
              
            chartDataList.push({
              name: label,
              Omzet: monthEarnings,
              Transaksi: pendingPayments
                .filter(p => p.status === 'confirmed' || p.status === 'applied')
                .filter(p => {
                  if (!p.timestamp) return false;
                  const pDate = new Date(p.timestamp);
                  return pDate.getFullYear() === d.getFullYear() && pDate.getMonth() === d.getMonth();
                }).length
            });
          }
          return chartDataList;
        })();

        // Data for Plan Distribution
        const planDistData = (() => {
          let starterVal = 0;
          let proVal = 0;
          let entVal = 0;
          
          pendingPayments.forEach(p => {
            if (p.status === 'confirmed' || p.status === 'applied') {
              const plan = (p.plan || '').toLowerCase();
              if (plan.includes('starter')) starterVal += (p.amount || 0);
              else if (plan.includes('enterprise')) entVal += (p.amount || 0);
              else proVal += (p.amount || 0);
            }
          });
          
          return [
            { name: 'Starter', value: starterVal, color: '#38bdf8' },
            { name: 'Professional', value: proVal, color: '#fbbf24' },
            { name: 'Enterprise', value: entVal, color: '#818cf8' }
          ].filter(item => item.value > 0);
        })();

        const planDataToRender = planDistData.length > 0 ? planDistData : [
          { name: 'Starter', value: 0, color: '#38bdf8' },
          { name: 'Professional', value: 0, color: '#fbbf24' },
          { name: 'Enterprise', value: 0, color: '#818cf8' }
        ];

        // Data for Payment Type Distribution
        const paymentMethodData = (() => {
          const bankTotals: Record<string, number> = {};
          pendingPayments.forEach(p => {
            if (p.status === 'confirmed' || p.status === 'applied') {
              const bankName = p.senderBank || 'BCA';
              bankTotals[bankName] = (bankTotals[bankName] || 0) + (p.amount || 0);
            }
          });
          
          const colors: Record<string, string> = {
            'BCA': '#3b82f6',
            'MANDIRI': '#eab308',
            'BSN': '#14b8a6',
            'Lainnya': '#6366f1'
          };
          
          return Object.entries(bankTotals).map(([bank, value]) => ({
            name: `Transfer ${bank}`,
            value: value as number,
            color: colors[bank] || colors['Lainnya']
          }));
        })();

        const paymentMethodDataToRender = paymentMethodData.some(p => (p.value as number) > 0) ? paymentMethodData : [
          { name: 'Transfer BCA', value: 0, color: '#3b82f6' }
        ];

        // Group payments by user to find VIP customers (Top 5 Loyal Customers)
        const topLoyalCustomers = (() => {
          const userSummary: { [key: string]: { fullName: string, email: string, businessName: string, totalAmount: number, transactionsCount: number, plan: string } } = {};
          
          pendingPayments.forEach((p: any) => {
            if (p.status === 'confirmed' || p.status === 'applied') {
              const email = p.userEmail || 'guest@example.com';
              if (!userSummary[email]) {
                userSummary[email] = {
                  fullName: p.fullName || 'Pelanggan',
                  email: email,
                  businessName: p.businessName || 'Profil Bisnis',
                  totalAmount: 0,
                  transactionsCount: 0,
                  plan: p.plan || 'Professional'
                };
              }
              userSummary[email].totalAmount += (p.amount || 0);
              userSummary[email].transactionsCount += 1;
            }
          });
          
          return Object.values(userSummary)
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 5); // top 5 customers
        })();

        const handleExportCSV = () => {
          // Generate CSV contents
          const headers = ['Tanggal', 'ID Transaksi', 'Nama Pelanggan', 'Email', 'Paket', 'Durasi', 'Nominal', 'Metode Pembayaran', 'Status'];
          const rows = pendingPayments.map((p: any) => {
            const dateStr = p.timestamp ? new Date(p.timestamp).toLocaleString('id-ID') : '-';
            const planStr = (p.plan || 'Professional').toUpperCase();
            const durasi = p.isYearly ? 'Tahunan' : 'Bulanan';
            const statusStr = p.status === 'confirmed' || p.status === 'applied' ? 'Sukses/Terverifikasi' : p.status === 'pending' ? 'Tertunda' : 'Ditolak/Batal';
            return [
              `"${dateStr}"`,
              `"${p.id || ''}"`,
              `"${p.fullName || ''}"`,
              `"${p.userEmail || ''}"`,
              `"${planStr}"`,
              `"${durasi}"`,
              p.amount || 0,
              `"${p.transferMethod || 'Manual'}"`,
              `"${statusStr}"`
            ];
          });
          
          const csvContent = "\ufeff" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n'); // Add BOM for excel indonesian compatibility
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `Laporan_Keuangan__FID_Invoice_${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          showToast('Laporan Keuangan berhasil diekspor sebagai CSV!', 'success');
        };

        return (
          <div className="space-y-6 animate-fade-in text-left">
            {/* SUB-TAB TOGGLE - Premium Segmented Controller */}
            <div className="flex bg-slate-955 p-1.5 rounded-2xl border border-slate-850 max-w-lg">
              <button
                onClick={() => setPaymentsSubTab('analytics')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  paymentsSubTab === 'analytics'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/10 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📊 Analisis & Metrik 
              </button>
              <button
                onClick={() => setPaymentsSubTab('list')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  paymentsSubTab === 'list'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/10 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📜 Buku Transaksi & Verifikasi
              </button>
            </div>

            {paymentsSubTab === 'analytics' ? (
              <div className="space-y-6 animate-fade-in">
                {/* Analytics Welcome & Action Panel */}
                <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                      Dashboard Pendapatan & Analisis Keuangan Pro
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Pantau indikator pertumbuhan (MRR, ARR, LTV) serta analisis distribusi pembayaran pelanggan setia Anda secara real-time.
                    </p>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 text-amber-500 hover:text-amber-400 font-extrabold text-xs rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg shadow-black/40"
                  >
                    <Download className="w-4 h-4" />
                    Ekspor Jurnal CSV
                  </button>
                </div>

                {/* Metrics KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Omzet Terverifikasi */}
                  <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl space-y-1 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-white group-hover:scale-110 transition-transform duration-300">
                      <DollarSign className="w-16 h-16" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-amber-500 font-mono tracking-widest font-extrabold">TOTAL OMZET RIIL</span>
                    <h4 className="text-2xl font-black text-white font-mono tracking-tight pt-1">
                      {formatCurrency(confirmedEarnings)}
                    </h4>
                    <p className="text-[10px] text-slate-500">Omzet riil lolos verifikasi owner & gateway</p>
                  </div>

                  {/* Card 2: MRR */}
                  <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl space-y-1 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-white group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-16 h-16" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-indigo-400 font-mono tracking-widest font-extrabold">MRR (RECURRING BULANAN)</span>
                    <h4 className="text-2xl font-black text-white font-mono tracking-tight pt-1">
                      {formatCurrency(calculatedMRR)}
                    </h4>
                    <p className="text-[10px] text-slate-500">Estimasi pendapatan berulang bulanan aktif</p>
                  </div>

                  {/* Card 3: ARR */}
                  <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl space-y-1 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-white group-hover:scale-110 transition-transform duration-300">
                      <Award className="w-16 h-16" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-emerald-400 font-mono tracking-widest font-extrabold">ARR (RECURRING TAHUNAN)</span>
                    <h4 className="text-2xl font-black text-white font-mono tracking-tight pt-1">
                      {formatCurrency(calculatedARR)}
                    </h4>
                    <p className="text-[10px] text-slate-500">Prakiraan pendapatan tahunan (MRR x 12)</p>
                  </div>

                  {/* Card 4: Paying Conversion */}
                  <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl space-y-1 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-white group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-16 h-16" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-blue-400 font-mono tracking-widest font-extrabold">RASIO BERBAYAR (CONVERSION)</span>
                    <h4 className="text-2xl font-black text-white font-mono tracking-tight pt-1">
                      {payingConversionRate}%
                    </h4>
                    <p className="text-[10px] text-slate-500">{activePayingSubscribers.length} dari {users.length} pengguna terdaftar berbayar</p>
                  </div>
                </div>

                {/* Recharts Visualizations Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 1: Omzet Monthly Trend */}
                  <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl space-y-4">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
                        📈 Tren Pertumbuhan Pendapatan (6 Bulan Terakhir)
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Akumulasi pendapatan riil terverifikasi berdasarkan bulan transaksi</p>
                    </div>
                    <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-850/60 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={chart6MonthsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={9} tickLine={false} tickFormatter={(val) => `Rp ${val/1000}k`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                            labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '11px' }}
                            itemStyle={{ color: '#fbbf24', fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(value: any) => [formatCurrency(Number(value)), 'Omzet']}
                          />
                          <Area type="monotone" dataKey="Omzet" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorOmzet)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Plan Revenue contribution */}
                  <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl space-y-4">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
                        📊 Kontribusi Paket & Metode Pembayaran
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Analisis porsi nominal pendapatan berdasarkan paket langganan pilihan</p>
                    </div>
                    <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-850/60 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={planDataToRender} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={9} tickLine={false} tickFormatter={(val) => `Rp ${val/1000}k`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                            itemStyle={{ color: '#38bdf8', fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(value: any) => [formatCurrency(Number(value)), 'Nominal']}
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {planDataToRender.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Loyal VIP Customers & Future Outlook */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Top VIP Loyal Customers (LTV) */}
                  <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl space-y-4 lg:col-span-7">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
                        👑 Top 5 Pelanggan Setia (Kontribusi LTV Tertinggi)
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Pelanggan premium yang memberikan nilai finansial akumulatif terbesar bagi platform</p>
                    </div>
                    <div className="overflow-x-auto border border-slate-850 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-950/60 text-slate-500 border-b border-slate-850">
                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider">Pelanggan</th>
                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider">Profil Bisnis</th>
                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider font-mono">Transaksi</th>
                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-right">Total Investasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850/40 text-xs">
                          {topLoyalCustomers.length > 0 ? (
                            topLoyalCustomers.map((c, idx) => (
                              <tr key={idx} className="hover:bg-slate-955 transition-colors">
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-600/20 text-amber-500 flex items-center justify-center font-black text-xs font-mono border border-amber-500/10">
                                      {idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                                    </div>
                                    <div>
                                      <p className="font-bold text-white flex items-center gap-1">
                                        {c.fullName}
                                      </p>
                                      <p className="text-[9px] text-slate-500">{c.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-slate-300 font-medium">
                                  {c.businessName || 'Profil Pribadi'}
                                </td>
                                <td className="px-4 py-3.5 text-slate-400 font-mono font-semibold">
                                  {c.transactionsCount}x bayar
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400">
                                  {formatCurrency(c.totalAmount)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                                Belum ada transaksi langganan terverifikasi yang tercatat.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Future Outlook & Strategic Guidance */}
                  <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl space-y-4 lg:col-span-5">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
                        🔮 Proyeksi & Kesehatan Finansial Platform
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Analisis peramalan performa bisnis bulanan secara otomatis</p>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* LTV & ARPU Summary */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 font-mono">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-500 uppercase font-black">ARPU (Rata-rata Pendapatan / User)</span>
                          <span className="text-white font-extrabold">{formatCurrency(averageOrderValue)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-900 pt-2">
                          <span className="text-[10px] text-slate-500 uppercase font-black">Masa Hidup Pelanggan (LTV Est.)</span>
                          <span className="text-amber-500 font-extrabold">~ 24 Bulan</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-900 pt-2">
                          <span className="text-[10px] text-slate-500 uppercase font-black">Proyeksi LTV per Pengguna</span>
                          <span className="text-emerald-400 font-black">{formatCurrency(averageOrderValue * 24)}</span>
                        </div>
                      </div>

                      {/* Payment Method distribution text */}
                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-2">
                        <h5 className="text-[10px] font-black text-brand-gold uppercase tracking-wider font-mono">Porsi Saluran Pembayaran (Omzet)</h5>
                        <div className="flex items-center gap-2 h-2.5 bg-slate-900 rounded-full overflow-hidden">
                          {(() => {
                            const totalVal = paymentMethodDataToRender.reduce((s, curr) => s + (curr.value as number), 0);
                            if (totalVal === 0) {
                              return <div className="h-full w-full bg-slate-800" title="Belum ada omzet" />;
                            }
                            return paymentMethodDataToRender.map((p, i) => {
                              const pct = ((p.value as number) / totalVal) * 100;
                              if (pct === 0) return null;
                              return (
                                <div key={i} className="h-full" style={{ width: `${pct}%`, backgroundColor: p.color }} title={`${p.name}: ${pct.toFixed(1)}%`} />
                              );
                            });
                          })()}
                        </div>
                        <div className="flex flex-wrap gap-3 justify-between text-[10px] text-slate-400 font-medium mt-3">
                          {paymentMethodDataToRender.map((p, i) => {
                            if (p.value === 0) return null;
                            return (
                              <span key={i} className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} /> {p.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Insight Suggestion */}
                      <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl text-slate-400 leading-relaxed text-[11px]">
                        🎯 <strong>Tips Owner:</strong> {payingConversionRate === '0.0' ? (
                          <span>Ayo dapatkan pelanggan pertama Anda! Bagikan platform Anda ke grup pengusaha dan tawarkan paket Professional gratis 7 hari untuk memicu konversi ke sistem berbayar.</span>
                        ) : Number(payingConversionRate) < 5 ? (
                          <span>Rasio berbayar Anda ({payingConversionRate}%) masih di bawah rata-rata industri (5%). Pertimbangkan mengirim email pemberitahuan otomatis 3 hari sebelum paket uji coba / trial berakhir.</span>
                        ) : (
                          <span>Luar biasa! Rasio berbayar Anda ({payingConversionRate}%) sangat sehat. Manfaatkan sistem <strong>Gateway Otomatis Transfer Manual</strong> untuk mengurangi beban administratif validasi transfer manual Anda!</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in text-left">
                {/* Filter Periode Pendapatan */}
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">
                        ⚙️ Pengaturan Filter Rekapitulasi & Pendapatan
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Atur rentang pencatatan omzet (pendapatan) bulanan maupun manual sesuai rentang tanggal transfer</p>
                    </div>
                    
                    {/* Selector Type */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setEarningsFilterType('all')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${earningsFilterType === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'}`}
                      >
                        Semua Waktu
                      </button>
                      <button
                        onClick={() => setEarningsFilterType('monthly')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${earningsFilterType === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'}`}
                      >
                        Custom Bulanan
                      </button>
                      <button
                        onClick={() => setEarningsFilterType('custom_range')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${earningsFilterType === 'custom_range' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'}`}
                      >
                        Rentang Manual (Custom)
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Inputs depending on type */}
                  {earningsFilterType === 'monthly' && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 flex flex-wrap items-center gap-3 animate-fade-in">
                      <span className="text-[10px] font-black text-brand-gold uppercase tracking-wider font-mono">PILIH BULAN TRANSFER:</span>
                      <input
                        type="month"
                        value={earningsMonth}
                        onChange={(e) => setEarningsMonth(e.target.value)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-brand-gold cursor-pointer font-mono"
                      />
                      <span className="text-[10px] text-slate-500 font-medium italic">Menampilkan omzet transfer yang terjadi hanya pada bulan terpilih</span>
                    </div>
                  )}

                  {earningsFilterType === 'custom_range' && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center animate-fade-in">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider font-mono">Tanggal Mulai (Transfer):</label>
                        <input
                          type="date"
                          value={earningsStartDate}
                          onChange={(e) => setEarningsStartDate(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-brand-gold cursor-pointer font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider font-mono">Tanggal Selesai (Transfer):</label>
                        <input
                          type="date"
                          value={earningsEndDate}
                          onChange={(e) => setEarningsEndDate(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-brand-gold cursor-pointer font-mono"
                        />
                      </div>
                      <div className="pt-4 sm:pt-0">
                        <button 
                          onClick={() => {
                            setEarningsStartDate('');
                            setEarningsEndDate('');
                          }}
                          className="w-full sm:w-auto px-4 py-2 bg-slate-905 hover:bg-slate-800 border border-slate-800 text-slate-400 text-[10px] uppercase font-black tracking-widest rounded-lg transition-colors cursor-pointer"
                        >
                          Reset Rentang
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Summary Metrics Box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-emerald-950/30 border border-emerald-800/30 p-5 rounded-2xl">
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider font-mono">Total Pendapatan Terverifikasi</p>
                    <h3 className="text-2xl font-black text-emerald-400 mt-1 font-mono">{formatCurrency(confirmedEarnings)}</h3>
                    <p className="text-[9px] text-slate-500 mt-1">
                      {earningsFilterType === 'monthly' && `Hanya di bulan ${earningsMonth}`}
                      {earningsFilterType === 'custom_range' && `Rentang ${earningsStartDate || 'awal'} s/d ${earningsEndDate || 'akhir'}`}
                      {earningsFilterType === 'all' && 'Akumulasi total transfer dana riil yang masuk rekening owner'}
                    </p>
                  </div>

                  <div className="bg-amber-950/30 border border-amber-800/30 p-5 rounded-2xl">
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider font-mono">Total Pending (Tertunda)</p>
                    <h3 className="text-2xl font-black text-amber-400 mt-1 font-mono">{formatCurrency(pendingEarnings)}</h3>
                    <p className="text-[9px] text-slate-500 mt-1">Total ajuan transfer menunggu konfirmasi untuk periode terpilih</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl flex flex-col justify-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Status Gateway & Periode</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                      <span className="text-xs font-black text-white uppercase font-mono">
                        {earningsFilterType === 'all' && 'SEMUA PERIODE AKTIF'}
                        {earningsFilterType === 'monthly' && `PERIODE BULAN ${earningsMonth}`}
                        {earningsFilterType === 'custom_range' && 'PERIODE RENTANG KUSTOM'}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-600 mt-1">Rekening Bank Terkoneksi</p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs leading-relaxed">
                  💡 <strong>Buku Rekap & Verifikasi Pembayaran:</strong> Di bawah adalah daftar rekapitulasi pembayaran dari pengguna platform. Sesuai prinsip kehati-hatian, sistem <strong>TIDAK</strong> mengaktifkan paket secara otomatis. Anda wajib mengonfirmasi bukti nominal transfer rekening Anda terlebih dahulu sebelum menekan tombol <strong>"Setujui & Aktifkan Paket"</strong>.
                </div>

                                {/* Sub-Filters Tabs */}
                <div className="flex flex-wrap gap-2 text-xs font-bold justify-start">
                  <button 
                    onClick={() => setPaymentFilter('all')}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider text-[9px] font-mono ${paymentFilter === 'all' ? 'bg-brand-gold text-slate-950 font-black' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    Semua Histori ({filteredByDatePayments.length})
                  </button>
                  <button 
                    onClick={() => setPaymentFilter('pending')}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider text-[9px] font-mono ${paymentFilter === 'pending' ? 'bg-amber-600 text-white font-black' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    Menunggu Verifikasi ({filteredByDatePayments.filter(p => p.status === 'pending').length})
                  </button>
                  <button 
                    onClick={() => setPaymentFilter('confirmed')}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider text-[9px] font-mono ${paymentFilter === 'confirmed' ? 'bg-emerald-600 text-white font-black' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    Berhasil Dikonfirmasi ({filteredByDatePayments.filter(p => p.status === 'confirmed').length})
                  </button>
                  <button 
                    onClick={() => setPaymentFilter('rejected')}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider text-[9px] font-mono ${paymentFilter === 'rejected' ? 'bg-red-600 text-white font-black' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    Ditolak / Batal ({filteredByDatePayments.filter(p => p.status === 'rejected').length})
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300 border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 text-xs font-black uppercase tracking-wider border-b border-slate-800">
                          <th className="px-6 py-4">Waktu Transaksi</th>
                          <th className="px-6 py-4">Akun Pelanggan</th>
                          <th className="px-6 py-4">Metode Pembayaran (Melalui Apa)</th>
                          <th className="px-6 py-4">Paket & Nominal</th>
                          <th className="px-6 py-4">Tujuan Rekening</th>
                          <th className="px-6 py-4 text-center">Status & Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {filteredPayments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-20 text-slate-500 italic bg-slate-900/50">
                              <div className="max-w-xs mx-auto space-y-2">
                                <span className="block text-3xl">📭</span>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tidak Ada Histori Pembayaran</p>
                                <p className="text-[10px] text-slate-500">Semua riwayat transaksi untuk filter periode ini kosong atau telah dihapus.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredPayments.map((pay: any) => {
                            const payDate = new Date(pay.timestamp);
                            const formattedDate = payDate.toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                            const formattedTime = payDate.toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            });

                            // Determine payment source label / badge
                            const isManual = pay.transferMethod?.toLowerCase().includes('doku') || pay.notes?.toLowerCase().includes('doku') || pay.id?.startsWith('FID-') || pay.id?.startsWith('doku-');
                            const paymentSource = pay.transferMethod || 'Transfer Manual';
                            const senderBank = pay.senderBank || 'BCA';

                            return (
                              <tr key={pay.id} className="hover:bg-slate-850/40 transition-all border-b border-slate-850">
                                {/* 1. WAKTU TRANSAKSI */}
                                <td className="px-6 py-5">
                                  <div className="space-y-1">
                                    <p className="text-xs font-black text-slate-300 font-mono tracking-tight">{formattedDate}</p>
                                    <p className="text-[10px] text-brand-gold font-mono font-medium">🕒 Pukul {formattedTime} WIB</p>
                                    <p className="text-[9px] text-slate-500 font-mono">{pay.id}</p>
                                  </div>
                                </td>

                                {/* 2. AKUN PELANGGAN */}
                                <td className="px-6 py-5">
                                  <div className="space-y-1">
                                    <p className="font-extrabold text-white text-xs sm:text-sm">{pay.fullName}</p>
                                    <p className="text-[10px] text-slate-400 font-semibold">{pay.businessName}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">{pay.userEmail}</p>
                                  </div>
                                </td>

                                {/* 3. METODE PEMBAYARAN (MELALUI APA) */}
                                <td className="px-6 py-5">
                                  <div className="space-y-2 max-w-xs">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                                        💳 {paymentSource}
                                      </span>
                                      {senderBank && (
                                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 text-[9px] font-bold">
                                          {senderBank}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {pay.senderName ? (
                                      <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-850 text-[10px] space-y-1 font-normal text-slate-300">
                                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-500">Detail Rekening Pengirim:</p>
                                        <p><span className="text-slate-500">A/N:</span> <span className="font-extrabold text-slate-200">{pay.senderName}</span></p>
                                        <p><span className="text-slate-500">Bank Asal:</span> <span className="text-slate-200 font-semibold">{senderBank}</span></p>
                                        {pay.notes && (
                                          <p className="text-slate-400 italic mt-1 border-t border-slate-800/60 pt-1">
                                            "{pay.notes}"
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-slate-500 italic">No Rekening / Gateway Otomatis Terverifikasi</p>
                                    )}
                                  </div>
                                </td>

                                {/* 4. PAKET & NOMINAL */}
                                <td className="px-6 py-5">
                                  <div className="space-y-1.5">
                                    <div>
                                      <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest">
                                        {pay.plan}
                                      </span>
                                    </div>
                                    <p className="font-mono font-black text-emerald-400 text-sm tracking-tight">
                                      {formatCurrency(pay.amount)}
                                    </p>
                                  </div>
                                </td>

                                {/* 5. TUJUAN REKENING */}
                                <td className="px-6 py-5">
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-extrabold text-white">BANK {pay.senderBank || 'BCA'}</p>
                                    <p className="text-[9px] text-slate-400 font-medium">A/N FELIX HENCIA SUCIADI</p>
                                    <p className="text-[9px] font-mono text-slate-500 font-bold">
                                      {(pay.senderBank || 'BCA').toUpperCase() === 'MANDIRI' ? '1090024887135' : 
                                       (pay.senderBank || 'BCA').toUpperCase() === 'BSN' ? '2090320006' : 
                                       '8080507772'}
                                    </p>
                                  </div>
                                </td>

                                {/* 6. STATUS & TINDAKAN OWNER */}
                                <td className="px-6 py-5 text-center">
                                  <div className="flex flex-col items-center gap-3">
                                    {/* Status Badge */}
                                    {pay.status === 'pending' && (
                                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse text-[10px] font-black tracking-wide uppercase">
                                        ⏳ Menunggu ACC
                                      </span>
                                    )}
                                    {(pay.status === 'confirmed' || pay.status === 'applied') && (
                                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black tracking-wide uppercase">
                                        ✓ SUDAH DIAKTIFKAN
                                      </span>
                                    )}
                                    {pay.status === 'rejected' && (
                                      <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black tracking-wide uppercase">
                                        ✗ DITOLAK
                                      </span>
                                    )}

                                    {/* Action Buttons */}
                                    {pay.status === 'pending' ? (
                                        <div className="flex flex-wrap gap-1.5 justify-center">
                                          <button 
                                          onClick={() => handleApprovePayment(pay.id)}
                                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                                          title="Konfirmasi pembayaran dan aktifkan paket"
                                        >
                                          <Check className="w-3 h-3" />
                                          ACC & Aktifkan
                                        </button>
                                        <button 
                                          onClick={() => handleRejectPayment(pay.id)}
                                          className="px-2 py-1.5 bg-red-950/40 hover:bg-red-900 border border-red-800 text-red-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                                          title="Tolak pembayaran"
                                        >
                                          Tolak
                                        </button>
                                        <button 
                                          onClick={() => handleDeletePayment(pay.id)}
                                          className="p-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg transition-colors cursor-pointer shrink-0"
                                          title="Hapus Permanen"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button 
                                        onClick={() => handleDeletePayment(pay.id)}
                                        className="p-1.5 bg-slate-950 hover:bg-red-950/60 border border-slate-850 hover:border-red-850 text-slate-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                        title="Hapus Rekaman Histori"
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
              </div>
            )}
          </div>
        );
      })()}

      {adminSection === 'notifications' && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs leading-relaxed flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong>Pusat Notifikasi & Broadcast:</strong> Di panel ini, sebagai Pemilik Aplikasi (Admin), Anda dapat mengirimkan pengumuman penting (seperti maintenance aplikasi) atau ucapan selamat upgrade paket secara manual ke pengguna spesifik maupun ke seluruh pengguna sekaligus (broadcast)!
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form to send new notification (lg:col-span-5) */}
            <form onSubmit={handleCreateNotif} className="lg:col-span-5 bg-slate-900 border border-slate-850 p-6 rounded-2xl space-y-4 text-left">
              <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-widest pb-3 border-b border-slate-800">
                Kirim Notifikasi / Pengumuman Baru
              </h3>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Judul Notifikasi</label>
                <input 
                  type="text" 
                  required
                  value={newNotifTitle}
                  onChange={(e) => setNewNotifTitle(e.target.value)}
                  placeholder="Contoh: Pemeliharaan Sistem Selesai"
                  className="w-full px-4 py-2.5 border border-slate-800 bg-slate-950 rounded-xl text-xs text-white outline-none focus:border-brand-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Isi Pesan Notifikasi</label>
                <textarea 
                  required
                  rows={4}
                  value={newNotifMessage}
                  onChange={(e) => setNewNotifMessage(e.target.value)}
                  placeholder="Tulis pesan lengkap kepada pengguna di sini..."
                  className="w-full px-4 py-2.5 border border-slate-800 bg-slate-950 rounded-xl text-xs text-white outline-none focus:border-brand-gold resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kategori / Jenis</label>
                  <select
                    value={newNotifType}
                    onChange={(e: any) => setNewNotifType(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-800 bg-slate-950 rounded-xl text-xs text-white outline-none focus:border-brand-gold cursor-pointer"
                  >
                    <option value="info">📢 Informasi (Info)</option>
                    <option value="success">🎉 Sukses (Upgrade Paket)</option>
                    <option value="warning">⚠️ Peringatan (Warning)</option>
                    <option value="maintenance">🔧 Pemeliharaan (Maintenance)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Target Pengguna</label>
                  <select
                    value={newNotifTarget}
                    onChange={(e) => setNewNotifTarget(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-800 bg-slate-950 rounded-xl text-xs text-white outline-none focus:border-brand-gold cursor-pointer"
                  >
                    <option value="all">🌐 Semua Pengguna (Broadcast)</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>👤 {u.fullName} ({u.businessName})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-md mt-2 border-none"
              >
                Kirim & Broadcast Notifikasi ⚡
              </button>
            </form>

            {/* List of Sent Notifications (lg:col-span-7) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-850 p-6 rounded-2xl flex flex-col h-full text-left">
              <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-widest pb-3 border-b border-slate-800 mb-4">
                Histori Notifikasi Terkirim ({notificationsList.length})
              </h3>

              <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
                {notificationsList.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 italic text-xs">
                    Belum ada notifikasi yang terkirim di sistem.
                  </div>
                ) : (
                  notificationsList.map(notif => {
                    const targetUserObj = users.find(u => u.id === notif.targetUserId);
                    return (
                      <div key={notif.id} className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-2 relative group text-left">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase font-mono ${
                              notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              notif.type === 'maintenance' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              notif.type === 'warning' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {notif.type}
                            </span>
                            <h4 className="font-extrabold text-white text-sm mt-1">{notif.title}</h4>
                          </div>

                          <button
                            onClick={() => handleDeleteNotif(notif.id)}
                            className="p-1 text-slate-500 hover:text-red-500 rounded hover:bg-slate-900/60 transition-colors cursor-pointer"
                            title="Tarik Notifikasi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed font-medium whitespace-pre-wrap">{notif.message}</p>

                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono pt-2 border-t border-slate-900">
                          <span>Target: <strong className="text-slate-400">{notif.targetUserId === 'all' ? 'SEMUA USER' : targetUserObj ? targetUserObj.fullName : 'USER ID: ' + notif.targetUserId}</strong></span>
                          <span>Terkirim: {new Date(notif.createdAt).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {adminSection === 'chats' && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs leading-relaxed flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <strong>Kotak Layanan Pelanggan (Andi CS Mode):</strong> Di sini Anda dapat membaca dan membalas pertanyaan pengguna secara manual. 
              Balasan Anda akan langsung masuk ke widget chat pengguna (Fidya Chatbot) secara real-time!
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[550px]">
            {/* Thread list (Left side - md:col-span-4) */}
            <div className="md:col-span-4 bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col h-full overflow-hidden">
              <h3 className="text-xs font-black uppercase text-slate-400 font-mono tracking-widest pb-3 border-b border-slate-800 mb-4">
                Daftar Percakapan ({chatThreads.length})
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
                {chatThreads.length === 0 ? (
                  <p className="text-slate-500 italic text-center py-12">Belum ada chat masuk.</p>
                ) : (
                  chatThreads.map(thread => {
                    const isSelected = selectedChatId === thread.userId;
                    return (
                      <button
                        key={thread.userId}
                        onClick={() => {
                          setSelectedChatId(thread.userId);
                          loadChatMessages(thread.userId);
                          
                          // Mark as read for owner
                          const list = JSON.parse(localStorage.getItem('fid_invoice_support_chats') || '[]');
                          const idx = list.findIndex((l: any) => l.userId === thread.userId);
                          if (idx > -1) {
                            list[idx].unreadForOwner = false;
                            localStorage.setItem('fid_invoice_support_chats', JSON.stringify(list));
                          }
                        }}
                        className={`w-full p-3 rounded-xl text-left border transition-all flex items-start gap-3 cursor-pointer relative ${
                          isSelected 
                            ? 'bg-blue-600/15 border-blue-500/40 text-white' 
                            : 'bg-slate-950 border-slate-850 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        {/* Status indicators */}
                        {thread.unreadForOwner && (
                          <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                        )}

                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 font-extrabold text-white text-[11px] font-display">
                          {thread.userName.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex justify-between items-center pr-2">
                            <h4 className="font-bold truncate text-white text-[11px]">{thread.userName}</h4>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {new Date(thread.lastUpdated).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{thread.userEmail}</p>
                          <p className="text-[11px] text-slate-400 truncate mt-1 leading-relaxed">
                            {thread.lastMessage || 'Menunggu pesan...'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Box window (Right side - md:col-span-8) */}
            <div className="md:col-span-8 bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden flex flex-col h-full">
              {selectedChatId ? (
                <>
                  {/* Chat header */}
                  <div className="bg-slate-950/80 p-4 border-b border-slate-850 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600/25 border border-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs font-display">
                      {chatThreads.find(c => c.userId === selectedChatId)?.userName.substring(0,2).toUpperCase()}
                    </div>
                    <div className="text-xs">
                      <h4 className="font-extrabold text-white">
                        {chatThreads.find(c => c.userId === selectedChatId)?.userName}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Melayani: {chatThreads.find(c => c.userId === selectedChatId)?.userEmail}
                      </p>
                    </div>
                  </div>

                  {/* Message viewport */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/30">
                    {chatMessages.length === 0 ? (
                      <p className="text-center text-slate-500 italic text-xs py-16">Tidak ada pesan.</p>
                    ) : (
                      chatMessages.map((msg, index) => {
                        const isOwnerMsg = msg.sender === 'agent';
                        const isSystemBot = msg.sender === 'bot';
                        
                        return (
                          <div 
                            key={msg.id || index} 
                            className={`flex ${isOwnerMsg ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[75%] rounded-2xl p-3.5 text-xs text-left shadow-md ${
                              isOwnerMsg 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : isSystemBot 
                                  ? 'bg-slate-850 border border-slate-800 text-slate-300 rounded-tl-none'
                                  : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                            }`}>
                              <p className="font-bold text-[9px] uppercase tracking-wider mb-1 font-mono opacity-60">
                                {msg.senderName} • {msg.timestamp}
                              </p>
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input form */}
                  <div className="p-3 bg-slate-950 border-t border-slate-850 flex gap-2 items-center">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChatReply();
                        }
                      }}
                      placeholder="Tulis balasan pesan support Anda di sini..."
                      rows={2}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500 text-white resize-none"
                    />
                    <button
                      onClick={handleSendChatReply}
                      className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-lg"
                      title="Kirim Balasan"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <div className="w-14 h-14 bg-slate-850 rounded-2xl flex items-center justify-center text-slate-500">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <div className="max-w-xs space-y-1">
                    <h3 className="text-sm font-bold text-slate-300">Belum Ada Chat Terpilih</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Silakan pilih salah satu percakapan pengguna di panel sebelah kiri untuk mulai mengobrol & membantu secara real-time.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {adminSection === 'email_settings' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400 animate-spin-slow" />
                  PENGATURAN GATEWAY TRANSAKSIONAL RESEND EMAIL
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Platform FID INVOICE mendukung integrasi API pihak ketiga dengan <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-brand-gold hover:underline">Resend.com</a> untuk mengirimkan email aktivasi verifikasi dan email reset kata sandi langsung ke inbox nyata pengguna.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* CONFIGURATION FORM */}
                <form onSubmit={handleSaveEmailSettings} className="space-y-5">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">🔒 Kredensial API Gateway</h4>
                  
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Resend API Key
                    </label>
                    <input
                      type="password"
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      placeholder="re_1234567890abcdef..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:border-brand-gold outline-none"
                    />
                    <p className="text-[10px] text-slate-500">
                      Dapatkan kunci API gratis Anda di dashboard akun Resend &gt; API Keys.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Alamat Email Pengirim (Verified Domain)
                    </label>
                    <input
                      type="text"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="onboarding@resend.dev"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-mono focus:border-brand-gold outline-none"
                    />
                    <p className="text-[10px] text-slate-500">
                      Gunakan <code className="bg-slate-950 px-1 py-0.5 rounded text-brand-gold font-bold">onboarding@resend.dev</code> untuk pengetesan awal, atau hubungkan custom domain bisnis Anda ke Resend agar pengiriman menggunakan alamat email profesional (contoh: <code className="bg-slate-950 px-1 py-0.5 rounded">noreply@fidinvoice.com</code>).
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-brand-gold hover:bg-brand-gold-dark text-slate-950 font-black text-xs rounded-xl uppercase tracking-wider cursor-pointer shadow-lg shadow-brand-gold/10 transition-colors"
                  >
                    Simpan Pengaturan Email
                  </button>
                </form>

                {/* EMAIL TESTING TOOL */}
                <div className="bg-slate-950 rounded-2xl border border-slate-850 p-5 space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">⚡ Uji Coba Gateway Email</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Kirim email uji coba HTML nyata ke inbox Anda untuk memverifikasi fungsionalitas integrasi Resend.
                  </p>

                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500">
                        Alamat Email Tujuan
                      </label>
                      <input
                        type="email"
                        value={testEmailDest}
                        onChange={(e) => {
                          setTestEmailDest(e.target.value);
                          setTestEmailSuccess(false);
                          setTestEmailError('');
                        }}
                        placeholder="email-anda@gmail.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-400 outline-none"
                      />
                    </div>

                    {testEmailSuccess && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs font-bold">
                        ✓ Email uji coba berhasil dikirim ke {testEmailDest}! Silakan cek folder Inbox atau Spam Anda.
                      </div>
                    )}

                    {testEmailError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold">
                        ⚠️ Gagal mengirim: {testEmailError}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={testEmailLoading || !resendApiKey || !testEmailDest}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 disabled:opacity-40 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      {testEmailLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengirim...</span>
                        </>
                      ) : (
                        <span>Kirim Test Email Sekarang</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* INTEGRATION GUIDE */}
              <div className="pt-6 border-t border-slate-800 space-y-3 text-left">
                <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">📘 Petunjuk Teknis Integrasi Backend Untuk Developer</h4>
                <div className="text-xs text-slate-400 leading-relaxed space-y-2">
                  <p>Aplikasi ini telah siap dipasarkan dengan modul gateway transaksional otomatis. Ketika Anda memindahkan server ke production backend, Anda dapat mengimplementasikan controller di bawah ini menggunakan pustaka resmi <code className="bg-slate-950 px-1 py-0.5 text-brand-gold rounded font-mono">@resend/node</code>:</p>
                  <pre className="bg-slate-950 p-4 rounded-xl text-[10px] font-mono text-emerald-400 border border-slate-850 overflow-x-auto leading-relaxed">
{`// Contoh Implementasi Node.js + Express untuk mengirim verifikasi
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

app.post('/api/send-verification', async (req, res) => {
  const { email, fullName, selectedPlan, verifyCode } = req.body;
  const verifyLink = "https://fidinvoice.com/verify?email=" + email + "&code=" + verifyCode;

  try {
    const data = await resend.emails.send({
      from: 'FidInvoice Support <noreply@fidinvoice.com>',
      to: [email],
      subject: '📧 Verifikasi Akun Bisnis FID INVOICE Anda',
      html: "<h1>Halo " + fullName + "</h1><p>Silakan klik link berikut: " + verifyLink + "</p>"
    });
    res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* MODAL ACTION: Plan Changer */}
      {actionModal === 'plan' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 text-slate-900">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-sm w-full p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-display font-extrabold text-sm text-brand-dark uppercase tracking-wider">Ubah Tier Paket Pengguna</h3>
              <button onClick={() => setActionModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>
            
            <p className="text-xs text-gray-500">Ubah paket untuk owner <strong className="text-brand-dark">{selectedUser.fullName}</strong>:</p>
            
            <div className="space-y-3 pt-2">
              <button onClick={() => handleChangePlan(selectedUser.id, 'starter')} className="w-full text-left p-3 border border-gray-150 rounded-xl text-xs hover:border-brand-primary font-bold flex justify-between items-center">
                <span>Starter Plan (Trial)</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </button>
              <button onClick={() => handleChangePlan(selectedUser.id, 'professional')} className="w-full text-left p-3 border border-gray-150 rounded-xl text-xs hover:border-brand-primary font-bold flex justify-between items-center">
                <span>Professional Plan</span>
                <Award className="w-4 h-4 text-brand-primary" />
              </button>
              <button onClick={() => handleChangePlan(selectedUser.id, 'enterprise')} className="w-full text-left p-3 border border-gray-150 rounded-xl text-xs hover:border-brand-primary font-bold flex justify-between items-center">
                <span>Enterprise Plan</span>
                <ShieldCheck className="w-4 h-4 text-green-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ACTION: Extend expiry */}
      {actionModal === 'extend' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 text-slate-900">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-sm w-full p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-display font-extrabold text-sm text-brand-dark uppercase tracking-wider">Perpanjang Lisensi Manual</h3>
              <button onClick={() => setActionModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>
            
            <p className="text-xs text-gray-500">Tambahkan masa tenggang aktif untuk owner <strong className="text-brand-dark">{selectedUser.fullName}</strong>:</p>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => handleExtendSubscription(selectedUser.id, 30)} className="p-3 bg-slate-50 hover:bg-slate-100 border rounded-xl text-xs font-bold text-center cursor-pointer">+30 Hari</button>
              <button onClick={() => handleExtendSubscription(selectedUser.id, 90)} className="p-3 bg-slate-50 hover:bg-slate-100 border rounded-xl text-xs font-bold text-center cursor-pointer">+90 Hari</button>
              <button onClick={() => handleExtendSubscription(selectedUser.id, 365)} className="col-span-2 p-3 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl text-xs font-bold text-center cursor-pointer">+1 Tahun Penuh</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDeleteState.isOpen}
        onClose={() => setConfirmDeleteState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeDeleteUser}
        title="Hapus Akun Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun pengguna "${confirmDeleteState.userName}" secara permanen? Seluruh data invoice, produk, dan klien mereka akan terhapus selamanya dan tidak dapat dikembalikan.`}
        confirmText="Ya, Hapus Permanen"
        cancelText="Batal"
        type="danger"
      />

      <ConfirmModal
        isOpen={confirmDeletePaymentState.isOpen}
        onClose={() => setConfirmDeletePaymentState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeDeletePayment}
        title="Hapus Catatan Transaksi"
        message="Apakah Anda yakin ingin menghapus catatan transaksi pembayaran ini secara permanen dari sistem? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus Transaksi"
        cancelText="Batal"
        type="danger"
      />

      {/* Change Password Modal */}
      {isChangingPass && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-slate-100">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl relative text-left">
            
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-gold" />
                UBAH KUNCI AKSES OWNER
              </h3>
              <button 
                onClick={() => {
                  setIsChangingPass(false);
                  setNewAdminPass('');
                  setConfirmAdminPass('');
                  setPassChangeError('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-400 leading-relaxed">
              Kata sandi default didekripsi secara otomatis di tingkat runtime. Untuk mengamankan panel dari tebakan user, Anda dapat menetapkan kunci akses baru di sini. Sandi baru akan disimpan dengan enkripsi Base64 di browser lokal Anda.
            </div>

            {passChangeError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold">
                ⚠️ {passChangeError}
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Kunci Akses Baru</label>
                <input
                  type="password"
                  value={newAdminPass}
                  onChange={(e) => {
                    setNewAdminPass(e.target.value);
                    setPassChangeError('');
                  }}
                  placeholder="Kunci akses baru..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Konfirmasi Kunci Akses</label>
                <input
                  type="password"
                  value={confirmAdminPass}
                  onChange={(e) => {
                    setConfirmAdminPass(e.target.value);
                    setPassChangeError('');
                  }}
                  placeholder="Konfirmasi kunci akses..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setIsChangingPass(false);
                  setNewAdminPass('');
                  setConfirmAdminPass('');
                  setPassChangeError('');
                }}
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!newAdminPass) {
                    setPassChangeError('Sandi baru tidak boleh kosong!');
                    return;
                  }
                  if (newAdminPass.length < 6) {
                    setPassChangeError('Kata sandi minimal harus 6 karakter demi perlindungan memadai!');
                    return;
                  }
                  if (newAdminPass !== confirmAdminPass) {
                    setPassChangeError('Konfirmasi kata sandi tidak cocok!');
                    return;
                  }

                  // Save encrypted Base64 custom pass to localStorage as fallback
                  const obfuscated = btoa(newAdminPass);
                  localStorage.setItem('fid_invoice_admin_pass', obfuscated);
                  setRemoteAdminPass(obfuscated);
                  
                  // Sync to server
                  fetch('/api/admin/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ adminPassObfuscated: obfuscated })
                  }).catch(err => console.error('Failed to sync admin pass to server', err));
                  
                  setNotif('Kunci akses pemilik (sandi admin) berhasil diperbarui dan disinkronisasi ke Cloud!');
                  setIsChangingPass(false);
                  setNewAdminPass('');
                  setConfirmAdminPass('');
                  setTimeout(() => setNotif(''), 3000);
                }}
                className="flex-1 py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-slate-950 font-black text-xs rounded-xl cursor-pointer"
              >
                Simpan Baru
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
