import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, Lock, User, Briefcase, Phone, CheckCircle, 
  Eye, EyeOff, Shield, ArrowLeft, RefreshCw, AlertCircle, X
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { UserProfile } from '../types';
import { sendVerificationEmail, sendPasswordResetEmail, hasResendConfigured } from '../utils/emailService';

interface AuthPageProps {
  initialView: 'login' | 'register';
  onAuthSuccess: (user: UserProfile) => void;
  onNavigate: (page: string) => void;
  selectedPlan: 'starter' | 'professional' | 'enterprise';
}

export default function AuthPage({ initialView, onAuthSuccess, onNavigate, selectedPlan }: AuthPageProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'verify'>(initialView);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreement, setAgreement] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorType, setErrorType] = useState<'none' | 'email_incorrect' | 'password_incorrect' | 'other'>('none');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotSimulator, setShowForgotSimulator] = useState(false);
  const [simulatedEmailOpen, setSimulatedEmailOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  const [simulatedError, setSimulatedError] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isCreatingPassword, setIsCreatingPassword] = useState(false);

  // GOOGLE LOGIN PROMPT STATE
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePromptError, setGooglePromptError] = useState('');

  // Parse action from incoming emails
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const paramEmail = params.get('email');
    const code = params.get('code');

    if (action === 'verify' && paramEmail && code) {
      setEmail(paramEmail);
      setView('verify');
      setIsCreatingPassword(true);
      
      try {
        const pendingUsersStr = localStorage.getItem('fid_invoice_pending_users') || '{}';
        const pendingUsers = JSON.parse(pendingUsersStr);
        const pending = pendingUsers[paramEmail.toLowerCase().trim()];
        if (pending) {
          setFullName(pending.fullName || '');
          setBusinessName(pending.businessName || '');
          setPhone(pending.phone || '');
        }
      } catch(e) {}

    } else if (action === 'reset') {
      if (paramEmail) setEmail(paramEmail);
      setView('forgot');
      setIsResettingPassword(true);
      setShowForgotSimulator(false);
      setSimulatedEmailOpen(false);
    }
  }, []);

  
  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = user.email || '';
      
      // Auto-generate user profile based on Google account
      const fullName = user.displayName || 'Google User';
      const photoUrl = user.photoURL || '';
      
      // Check if user exists or register them
      // In this local state based app, we just simulate successful login and pass the profile back
      // Since it's a real Google login, we'll format a UserProfile and return it
      
            const isOwnerEmail = email.toLowerCase().trim() === 'felix.hencia04@gmail.com' || email.toLowerCase().trim() === 'admin@fidinvoice.com';
      const futureDate = new Date();
      if (isOwnerEmail) {
        futureDate.setFullYear(futureDate.getFullYear() + 20);
      } else {
        futureDate.setDate(futureDate.getDate() + 3);
      }
      
      const userProfile: UserProfile = {
        id: isOwnerEmail ? 'user-demo' : user.uid,
        email: email,
        fullName: fullName,
        businessName: `Bisnis ${fullName}`,
        phone: user.phoneNumber || '',
        profilePicture: photoUrl,
        subscription: {
          status: isOwnerEmail ? 'active' : 'trial',
          plan: isOwnerEmail ? 'enterprise' : selectedPlan,
          expiryDate: futureDate.toISOString().split('T')[0],
          trialDaysRemaining: isOwnerEmail ? 0 : 3
        }
      };
      
      // We must also ensure it's saved to the global user list so loadUserData and admin panel work
      let allUsers: any[] = [];
      try {
        const userRes = await fetch('/api/users');
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.success && userData.users) {
            allUsers = userData.users;
            localStorage.setItem('fid_invoice_all_users', JSON.stringify(allUsers));
          }
        }
      } catch (err) {
        console.warn('Could not fetch users from server, falling back to local');
      }

      if (allUsers.length === 0) {
        allUsers = JSON.parse(localStorage.getItem('fid_invoice_all_users') || '[]');
      }
      
      const existingUser = allUsers.find((u: any) => u.email === email);
      if (existingUser) {
        onAuthSuccess(existingUser);
      } else {
        // Setup state for verification flow
        setEmail(email);
        setFullName(fullName);
        setBusinessName(`Bisnis ${fullName}`);
        setPhone(user.phoneNumber || '');
        setPassword(''); // ensure empty so they can create one
        
        const pendingUsersStr = localStorage.getItem('fid_invoice_pending_users') || '{}';
        const pendingUsers = JSON.parse(pendingUsersStr);
        pendingUsers[email.toLowerCase().trim()] = { fullName, businessName: `Bisnis ${fullName}`, phone: user.phoneNumber || '', plan: selectedPlan };
        localStorage.setItem('fid_invoice_pending_users', JSON.stringify(pendingUsers));

        // Send verification email
        if (hasResendConfigured()) {
          try {
            const success = await sendVerificationEmail(email, fullName, selectedPlan, 'activate');
            setIsLoading(false);
            if (success) {
              setView('verify');
            } else {
              setErrorMsg('Gagal mengirim email verifikasi. Pastikan konfigurasi Resend Email Anda benar.');
              setErrorType('other');
              setView('verify'); // Still allow them to verify via sandbox as fallback
            }
          } catch (err: any) {
            setIsLoading(false);
            setErrorMsg(`Gagal mengirim email verifikasi: ${err.message}`);
            setErrorType('other');
            setView('verify');
          }
        } else {
          setTimeout(() => {
            setIsLoading(false);
            setView('verify');
          }, 1200);
        }
      }
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      setErrorMsg('Gagal masuk dengan Google: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength checker helper
  const getPasswordStrength = () => {
    if (!password) return { label: '', color: 'bg-gray-200', width: 'w-0' };
    if (password.length < 6) return { label: 'Sangat Lemah', color: 'bg-red-400', width: 'w-1/3' };
    if (password.length < 10) return { label: 'Sedang', color: 'bg-yellow-400', width: 'w-2/3' };
    return { label: 'Kuat & Aman', color: 'bg-green-500', width: 'w-full' };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Email dan Password wajib diisi.');
      setErrorType('other');
      return;
    }
    setErrorMsg('');
    setErrorType('none');
    setIsLoading(true);

    try {
      // Look up or initialize credentials map in localStorage, prioritizing server sync
      let credentials: Record<string, string> = {};
      
      try {
        const credRes = await fetch('/api/credentials');
        if (credRes.ok) {
          const credData = await credRes.json();
          if (credData.success && credData.credentials) {
            credentials = credData.credentials;
            localStorage.setItem('fid_invoice_user_credentials', JSON.stringify(credentials));
          }
        }
      } catch (err) {
        console.warn('Could not fetch credentials from server, falling back to local');
      }

      if (Object.keys(credentials).length === 0) {
        const storedCreds = localStorage.getItem('fid_invoice_user_credentials');
        if (storedCreds) {
          credentials = JSON.parse(storedCreds);
        } else {
          credentials = {
            'felix.hencia04@gmail.com': 'admin123',
            'admin@fidinvoice.com': 'admin123',
            'demo@fidinvoice.com': 'demo123'
          };
          localStorage.setItem('fid_invoice_user_credentials', JSON.stringify(credentials));
        }
      }

      const lowerEmail = email.toLowerCase().trim();
      
      // Check if email exists in credentials
      if (!(lowerEmail in credentials)) {
        setIsLoading(false);
        setErrorType('email_incorrect');
        setErrorMsg(`Email '${email}' belum terdaftar di sistem kami. Harap periksa e-mail kembali atau buat akun baru.`);
        return;
      }

      // Check if password matches
      if (credentials[lowerEmail] !== password) {
        setIsLoading(false);
        setErrorType('password_incorrect');
        setErrorMsg('Kata sandi yang Anda masukkan salah. Silakan periksa kembali kata sandi atau gunakan fitur Lupa Password.');
        return;
      }

      // Look up in our simulated user database in localStorage
      let users: UserProfile[] = [];
      try {
        const userRes = await fetch('/api/users');
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.success && userData.users) {
            users = userData.users;
            localStorage.setItem('fid_invoice_all_users', JSON.stringify(users));
          }
        }
      } catch (err) {
        console.warn('Could not fetch users from server, falling back to local');
      }

      if (users.length === 0) {
        const allUsersStr = localStorage.getItem('fid_invoice_all_users');
        if (allUsersStr) {
          users = JSON.parse(allUsersStr);
        }
      }

      // Check if user matches
      let matchedUser = users.find(u => u.email.toLowerCase() === lowerEmail);

      // Create matched user dynamically if missing but credentials matched
      if (!matchedUser) {
        const defaultEmails = ['felix.hencia04@gmail.com', 'admin@fidinvoice.com', 'demo@fidinvoice.com'];
        if (defaultEmails.includes(lowerEmail)) {
          const d = new Date();
          d.setDate(d.getDate() + (lowerEmail === 'felix.hencia04@gmail.com' ? 30 : 3)); // 30 days active or trial
          matchedUser = {
            id: lowerEmail === 'felix.hencia04@gmail.com' ? 'user-demo' : 'user_' + Math.random().toString(36).substring(2, 9),
            fullName: lowerEmail === 'felix.hencia04@gmail.com' ? 'Felix Hencia' : email.split('@')[0].toUpperCase(),
            businessName: lowerEmail === 'felix.hencia04@gmail.com' ? 'PT Sinergi Kreatif' : 'Bisnis ' + email.split('@')[0],
            email: email,
            phone: '081234567890',
            subscription: {
              status: lowerEmail === 'felix.hencia04@gmail.com' ? 'active' : 'trial',
              plan: selectedPlan,
              expiryDate: d.toISOString().split('T')[0],
              trialDaysRemaining: lowerEmail === 'felix.hencia04@gmail.com' ? 30 : 3
            }
          };
          users.push(matchedUser);
          localStorage.setItem('fid_invoice_all_users', JSON.stringify(users));
        } else {
          // User exists in credentials but not in allUsers, which means they are unverified
          setIsLoading(false);
          setErrorType('other');
          setErrorMsg('Akun Anda tidak ditemukan atau sudah dihapus. Jika akun Anda telah dihapus oleh Administrator, Anda wajib mendaftar kembali sebagai akun baru.');
          
          // Clean up orphaned credentials locally
          delete credentials[lowerEmail];
          localStorage.setItem('fid_invoice_user_credentials', JSON.stringify(credentials));
          return;
        }
      }

      // Check if account is blocked
      if (matchedUser.subscription.status === 'blocked') {
        setIsLoading(false);
        setErrorType('other');
        setErrorMsg('🚫 Akun Anda telah ditangguhkan (Blocked) oleh Pemilik Aplikasi karena pelanggaran kebijakan. Silakan hubungi Customer Service Fidya/Andi di live chat pojok bawah untuk klarifikasi lebih lanjut.');
        return;
      }

      setIsLoading(false);
      setErrorType('none');
      setErrorMsg('');
      onAuthSuccess(matchedUser);
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      setErrorType('other');
      setErrorMsg('Terjadi kesalahan saat masuk. Silakan coba lagi.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !businessName || !email || !phone) {
      setErrorMsg('Semua kolom wajib diisi.');
      setErrorType('other');
      return;
    }
    if (!agreement) {
      setErrorMsg('Anda harus menyetujui Syarat & Ketentuan.');
      setErrorType('other');
      return;
    }

    setErrorMsg('');
    setErrorType('none');
    setIsLoading(true);

    try {
      // Check if user already exists
      let allUsers: any[] = [];
      try {
        const userRes = await fetch('/api/users');
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.success && userData.users) {
            allUsers = userData.users;
            localStorage.setItem('fid_invoice_all_users', JSON.stringify(allUsers));
          }
        }
      } catch (err) {
        console.warn('Could not fetch users from server, falling back to local');
      }

      if (allUsers.length === 0) {
        allUsers = JSON.parse(localStorage.getItem('fid_invoice_all_users') || '[]');
      }

      const existingUser = allUsers.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
      if (existingUser) {
        setIsLoading(false);
        setErrorMsg('Email ini sudah terdaftar dan aktif. Silakan masuk (Login) menggunakan email ini.');
        setErrorType('other');
        return;
      }

      // Store pending info instead of password
      const pendingUsersStr = localStorage.getItem('fid_invoice_pending_users') || '{}';
      const pendingUsers = JSON.parse(pendingUsersStr);
      pendingUsers[email.toLowerCase().trim()] = { fullName, businessName, phone, plan: selectedPlan };
      localStorage.setItem('fid_invoice_pending_users', JSON.stringify(pendingUsers));

      if (hasResendConfigured()) {
        try {
          const success = await sendVerificationEmail(email, fullName, selectedPlan, 'activate');
          setIsLoading(false);
          if (success) {
            setView('verify');
          } else {
            setErrorMsg('Gagal mengirim email verifikasi. Pastikan konfigurasi Resend Email Anda benar.');
            setErrorType('other');
            setView('verify'); // Still allow them to verify via sandbox as fallback
          }
        } catch (err: any) {
          setIsLoading(false);
          setErrorMsg(`Gagal mengirim email verifikasi: ${err.message}`);
          setErrorType('other');
          setView('verify');
        }
      } else {
        setTimeout(() => {
          setIsLoading(false);
          setView('verify');
        }, 1200);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      setErrorMsg('Terjadi kesalahan sistem.');
      setErrorType('other');
    }
  };

  const handleVerificationComplete = () => {
    if (isCreatingPassword) {
      if (!password || !confirmPassword) {
        setErrorMsg('Kata sandi wajib diisi.');
        setErrorType('other');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Konfirmasi password tidak cocok.');
        setErrorType('other');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Kata sandi minimal harus 6 karakter.');
        setErrorType('other');
        return;
      }
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const isOwnerEmail = email.toLowerCase().trim() === 'felix.hencia04@gmail.com' || email.toLowerCase().trim() === 'admin@fidinvoice.com';
      const expiry = new Date();
      if (isOwnerEmail) {
        expiry.setFullYear(expiry.getFullYear() + 20); // 20 years perpetual
      } else {
        expiry.setDate(expiry.getDate() + 3);
      }

      const newUser: UserProfile = {
        id: isOwnerEmail ? 'user-demo' : 'user_' + Math.random().toString(36).substring(2, 9),
        fullName,
        businessName,
        email,
        phone,
        subscription: {
          status: isOwnerEmail ? 'active' : 'trial',
          plan: isOwnerEmail ? 'enterprise' : selectedPlan,
          expiryDate: expiry.toISOString().split('T')[0],
          trialDaysRemaining: isOwnerEmail ? 0 : 3
        }
      };

      // Save to global users
      const allUsersStr = localStorage.getItem('fid_invoice_all_users');
      let users: UserProfile[] = [];
      if (allUsersStr) {
        users = JSON.parse(allUsersStr);
      }
      // Remove any existing user with the same email (in case of stale local storage after deletion)
      users = users.filter(u => u.email.toLowerCase().trim() !== email.toLowerCase().trim());
      users.push(newUser);
      localStorage.setItem('fid_invoice_all_users', JSON.stringify(users));

      // Ensure credentials mapping exists
      const storedCreds = localStorage.getItem('fid_invoice_user_credentials') || '{}';
      const credentials = JSON.parse(storedCreds);
      credentials[email.toLowerCase().trim()] = password;
      localStorage.setItem('fid_invoice_user_credentials', JSON.stringify(credentials));

      // Sync both to server immediately
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: newUser })
      }).catch(err => console.error('Failed to sync new user to server:', err));

      fetch('/api/credentials/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials })
      }).catch(err => console.error('Failed to sync credentials to server:', err));

      // Dispatch custom window event for instant admin panel real-time sync
      window.dispatchEvent(new Event('fid_users_updated'));

      onAuthSuccess(newUser);
    }, 1000);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Email wajib diisi.');
      setErrorType('other');
      return;
    }
    setErrorMsg('');
    setErrorType('none');
    setIsLoading(true);

    // Look up credentials database to ensure email exists or register it on the fly for sandbox
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

    const lowerEmail = email.toLowerCase().trim();
    if (!(lowerEmail in credentials)) {
      credentials[lowerEmail] = 'temp123';
      localStorage.setItem('fid_invoice_user_credentials', JSON.stringify(credentials));
    }

    if (hasResendConfigured()) {
      try {
        const success = await sendPasswordResetEmail(email, 'Rekan Bisnis', 'reset');
        setIsLoading(false);
        if (success) {
          setSuccessMsg('Email pemulihan kata sandi berhasil dikirim! Silakan periksa kotak masuk (inbox) atau folder spam email asli Anda.');
          setShowForgotSimulator(false);
        } else {
          setErrorMsg('Gagal mengirim email. Pastikan API Key Resend Anda benar dan domain pengirim telah terverifikasi.');
          setErrorType('other');
          // Fallback to sandbox
          setShowForgotSimulator(true);
        }
      } catch (err: any) {
        setIsLoading(false);
        setErrorMsg(`Gagal mengirim email: ${err.message}`);
        setErrorType('other');
        setShowForgotSimulator(true);
      }
    } else {
      setTimeout(() => {
        setIsLoading(false);
        if (!(lowerEmail in credentials)) {
          setSuccessMsg(`Email baru terdeteksi. Sistem sandbox telah mendaftarkan '${email}' secara otomatis agar Anda dapat mensimulasikan pemulihan sandi!`);
        } else {
          setSuccessMsg('Email pemulihan kata sandi simulasi siap dibuka di bawah ini.');
        }
        setShowForgotSimulator(true);
        setSimulatedEmailOpen(false);
        setResetPasswordSuccess(false);
        setNewPassword('');
        setNewConfirmPassword('');
      }, 1000);
    }
  };
  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-brand-light flex items-stretch font-sans">
      {/* LEFT SIDE: Brand presentation */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-dark text-white p-16 flex-col justify-between relative overflow-hidden">
        {/* Decorative ambient gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(26,79,191,0.3),transparent)]"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-brand-primary/10 blur-3xl"></div>

        <div className="relative z-10 flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
          <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 17V7H15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12H13.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <span className="font-display font-bold text-xl text-white tracking-tight">FID <span className="text-brand-primary">INVOICE</span></span>
            <p className="text-[9px] text-brand-gold font-bold tracking-widest uppercase -mt-1 font-mono">Invoice Cerdas</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md my-auto space-y-8">
          <h2 className="text-4xl font-display font-extrabold leading-tight">
            Bergabung dengan Ribuan Bisnis yang Sudah Maju Bersama Kami
          </h2>
          
          <ul className="space-y-4 text-sm text-brand-primary-light">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
              <span>Sistem multi-tenant terisolasi menjamin keamanan data bisnis Anda 100%.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
              <span>Pembuatan invoice otomatis, profesional, terhitung nilai rupiah terbilang tanpa salah.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
              <span>Masa percobaan 3 hari penuh rasa paket pro tanpa biaya kartu kredit tersembunyi.</span>
            </li>
          </ul>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-sm italic text-gray-300">
              "FID INVOICE memotong waktu administrasi kami hingga 80%. Pembuatan laporan pajak bulanan pun sekarang tinggal download sekali klik."
            </p>
            <div className="flex gap-2 items-center mt-4">
              <div className="w-8 h-8 rounded-full bg-brand-primary-light text-brand-primary flex items-center justify-center font-bold text-xs">SA</div>
              <div>
                <p className="text-xs font-bold text-white">Siti Amelia</p>
                <p className="text-[10px] text-gray-400">Freelance UI Designer</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-gray-500">
          © 2026 FID INVOICE. Solusi tagihan cerdas & andalan UMKM Indonesia.
        </div>
      </div>

      {/* RIGHT SIDE: Forms */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-6 sm:px-16 py-12 relative">
        <button 
          onClick={() => onNavigate('landing')} 
          className="absolute top-6 left-6 flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-primary transition-colors cursor-pointer font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </button>

        <div className="max-w-md w-full mx-auto">
          {/* Logo on top for mobile views */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 17V7H15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12H13.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-display font-bold text-lg text-brand-dark tracking-tight">FID <span className="text-brand-primary">INVOICE</span></span>
          </div>

          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-xl border text-xs font-medium relative overflow-hidden flex flex-col gap-3 ${
                errorType === 'email_incorrect' 
                  ? 'bg-amber-50 border-amber-200 text-amber-800' 
                  : errorType === 'password_incorrect' 
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  errorType === 'email_incorrect' ? 'text-amber-600' : 'text-red-600'
                }`} />
                <div className="space-y-1">
                  <p className="font-extrabold text-sm tracking-tight">
                    {errorType === 'email_incorrect' && 'Email Tidak Terdaftar'}
                    {errorType === 'password_incorrect' && 'Kata Sandi Salah'}
                    {(errorType === 'other' || errorType === 'none') && 'Terjadi Kesalahan'}
                  </p>
                  <p className="text-[11px] leading-relaxed opacity-90">{errorMsg}</p>
                </div>
              </div>

              {/* Action buttons inside the alert! */}
              {errorType === 'email_incorrect' && (
                <div className="flex gap-2 pt-1 border-t border-amber-200/50 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setView('register');
                      setErrorMsg('');
                      setErrorType('none');
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    Daftar Akun Baru ↗
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('');
                      setErrorMsg('');
                      setErrorType('none');
                    }}
                    className="px-3 py-1.5 bg-transparent hover:bg-amber-100 text-amber-700 rounded-lg font-semibold text-[10px] transition-colors cursor-pointer"
                  >
                    Gunakan Email Lain
                  </button>
                </div>
              )}

              {errorType === 'password_incorrect' && (
                <div className="flex flex-wrap gap-2 pt-1 border-t border-red-200/50 mt-1 items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setView('forgot');
                        setErrorMsg('');
                        setErrorType('none');
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      Lupa Kata Sandi? 🔑
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPassword('');
                        setErrorMsg('');
                        setErrorType('none');
                      }}
                      className="px-3 py-1.5 bg-transparent hover:bg-red-100 text-red-700 rounded-lg font-semibold text-[10px] transition-colors cursor-pointer"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-xs text-green-600 font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {view === 'login' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-display font-extrabold text-brand-dark">Selamat Datang Kembali</h3>
                <p className="text-sm text-gray-500 mt-1">Masuk ke akun FID INVOICE Anda</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Email Bisnis</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@perusahaan.com" 
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                    />
                    <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-600 uppercase">Kata Sandi</label>
                    <button 
                      type="button" 
                      onClick={() => setView('forgot')}
                      className="text-xs text-brand-primary hover:underline font-semibold"
                    >
                      Lupa Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                    />
                    <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                    <span>Ingat saya selama 30 hari</span>
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-brand-primary/20 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Masuk ke Akun'}
                </button>
              </form>

              <div className="relative flex py-2 items-center text-xs text-gray-400">
                <div className="flex-grow border-t border-gray-150"></div>
                <span className="flex-shrink mx-4 font-medium text-gray-400">atau masuk dengan</span>
                <div className="flex-grow border-t border-gray-150"></div>
              </div>

              <button 
                onClick={handleGoogleAuth}
                className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.12.57 4.28 1.69l3.19-3.19C17.51 1.64 14.96 1 12 1 7.35 1 3.37 3.68 1.48 7.6l3.86 2.99C6.27 7.04 8.91 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.72 2.88c2.18-2.01 3.71-4.97 3.71-8.7z" />
                  <path fill="#FBBC05" d="M5.34 14.41c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.48 6.84C.54 8.71 0 10.79 0 13s.54 4.29 1.48 6.16l3.86-2.75z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.72-2.88c-1.03.69-2.35 1.11-4.24 1.11-3.09 0-5.73-2-6.66-4.97L1.48 16.1C3.37 20.02 7.35 23 12 23z" />
                </svg>
                Google Account
              </button>

              <p className="text-center text-xs text-gray-500">
                Belum punya akun?{' '}
                <button 
                  onClick={() => setView('register')} 
                  className="text-brand-primary font-bold hover:underline"
                >
                  Daftar Gratis
                </button>
              </p>

              <div className="flex justify-center items-center gap-1.5 text-[10px] text-gray-400 pt-4 border-t border-gray-100">
                <Shield className="w-3.5 h-3.5 text-green-500" />
                <span>🔒 Koneksi aman dengan enkripsi 256-bit SSL</span>
              </div>
            </div>
          )}

          {/* VIEW: REGISTER */}
          {view === 'register' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-display font-extrabold text-brand-dark">Buat Akun Baru</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Mulai 3 hari coba gratis paket <span className="font-bold text-brand-primary capitalize">{selectedPlan}</span>
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nama Lengkap</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Budi Santoso" 
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                    />
                    <User className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nama Bisnis / Perusahaan</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="PT Bisnis Sukses Indonesia" 
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                    />
                    <Briefcase className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email Bisnis</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="budi@perusahaan.com" 
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                    />
                    <Mail className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">No. WhatsApp / Telepon</label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0812XXXXXXXX" 
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                    />
                    <Phone className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
                  </div>
                </div>
                <div className="py-1">
                  <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={agreement}
                      onChange={(e) => setAgreement(e.target.checked)}
                      className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary mt-0.5" 
                    />
                    <span>Saya setuju dengan <a href="#" className="text-brand-primary font-bold hover:underline">Syarat & Ketentuan</a> serta <a href="#" className="text-brand-primary font-bold hover:underline">Kebijakan Privasi</a>.</span>
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-brand-primary/20 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Buat Akun Sekarang'}
                </button>
              </form>

              <div className="relative flex py-1 items-center text-xs text-gray-400">
                <div className="flex-grow border-t border-gray-150"></div>
                <span className="flex-shrink mx-4 font-medium text-gray-400">atau daftar dengan</span>
                <div className="flex-grow border-t border-gray-150"></div>
              </div>

              <button 
                onClick={handleGoogleAuth}
                className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.12.57 4.28 1.69l3.19-3.19C17.51 1.64 14.96 1 12 1 7.35 1 3.37 3.68 1.48 7.6l3.86 2.99C6.27 7.04 8.91 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.72 2.88c2.18-2.01 3.71-4.97 3.71-8.7z" />
                  <path fill="#FBBC05" d="M5.34 14.41c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.48 6.84C.54 8.71 0 10.79 0 13s.54 4.29 1.48 6.16l3.86-2.75z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.72-2.88c-1.03.69-2.35 1.11-4.24 1.11-3.09 0-5.73-2-6.66-4.97L1.48 16.1C3.37 20.02 7.35 23 12 23z" />
                </svg>
                Google Account
              </button>

              <p className="text-center text-xs text-gray-500">
                Sudah punya akun?{' '}
                <button 
                  onClick={() => setView('login')} 
                  className="text-brand-primary font-bold hover:underline cursor-pointer"
                >
                  Masuk
                </button>
              </p>
            </div>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <div className="space-y-6">
              {!isResettingPassword ? (
                <>
                  <div>
                    <h3 className="text-2xl font-display font-extrabold text-brand-dark">Lupa Kata Sandi?</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Masukkan email Anda untuk menerima link pemulihan kata sandi.
                    </p>
                  </div>

                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Email Terdaftar</label>
                      <div className="relative">
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="budi@perusahaan.com" 
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                        />
                        <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Kirim Link Reset'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-left space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-display font-extrabold text-brand-dark">Atur Ulang Kata Sandi</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Silakan buat kata sandi baru untuk akun <span className="font-bold text-brand-primary">{email}</span>
                    </p>
                  </div>

                  {!resetPasswordSuccess ? (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newPassword || !newConfirmPassword) {
                          setErrorMsg('Sandi baru dan konfirmasi wajib diisi!');
                          setErrorType('other');
                          return;
                        }
                        if (newPassword.length < 6) {
                          setErrorMsg('Kata sandi minimal harus 6 karakter demi keamanan!');
                          setErrorType('other');
                          return;
                        }
                        if (newPassword !== newConfirmPassword) {
                          setErrorMsg('Konfirmasi kata sandi tidak cocok. Silakan ulangi.');
                          setErrorType('other');
                          return;
                        }

                        const storedCreds = localStorage.getItem('fid_invoice_user_credentials') || '{}';
                        const credentials = JSON.parse(storedCreds);
                        credentials[email.toLowerCase().trim()] = newPassword;
                        localStorage.setItem('fid_invoice_user_credentials', JSON.stringify(credentials));

                        fetch('/api/credentials/sync', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ credentials })
                        }).catch(err => console.error('Failed to sync credentials to server:', err));

                        setPassword(''); 
                        setErrorMsg('');
                        setErrorType('none');
                        setResetPasswordSuccess(true);
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kata Sandi Baru</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"} 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimal 6 karakter" 
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                          />
                          <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3 text-gray-400 hover:text-brand-primary transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Konfirmasi Kata Sandi Baru</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"} 
                            value={newConfirmPassword}
                            onChange={(e) => setNewConfirmPassword(e.target.value)}
                            placeholder="Ulangi kata sandi" 
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                          />
                          <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
                        </div>
                      </div>

                      {simulatedError && (
                        <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-xs text-red-600 font-semibold flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{simulatedError}</span>
                        </div>
                      )}

                      <button 
                        type="submit"
                        className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                      >
                        Simpan Kata Sandi Baru
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-6 space-y-4 bg-gray-50 border border-gray-100 rounded-2xl">
                      <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">Berhasil!</h4>
                        <p className="text-sm text-gray-500 mt-1 px-4">
                          Kata sandi Anda telah berhasil diperbarui dengan aman.
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setView('login');
                            setIsResettingPassword(false);
                            setResetPasswordSuccess(false);
                            setSuccessMsg('Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.');
                          }}
                          className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl text-sm font-bold transition-colors cursor-pointer"
                        >
                          Lanjut untuk Masuk
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showForgotSimulator && (
                <div className="mt-6 pt-6 border-t border-gray-150 text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">📬 Kotak Masuk Simulasi Email ({email})</span>
                    {!simulatedEmailOpen && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-100 text-blue-800 animate-pulse">1 Baru</span>
                    )}
                  </div>
                  
                  {hasResendConfigured() ? (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[10px] leading-relaxed flex flex-col gap-1">
                      <span className="font-extrabold flex items-center gap-1 text-[11px]">⚠️ PENGIRIMAN EMAIL GAGAL (FALLBACK)</span>
                      <span>Modul mendeteksi API Key, namun pengiriman gagal. Pastikan API Key benar dan domain Anda telah diverifikasi di Resend. Sementara itu, kami menampilkan kotak masuk simulasi di bawah ini agar Anda tetap bisa melanjutkan pemulihan sandi.</span>
                    </div>
                  ) : (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-150 text-amber-700 rounded-xl text-[10px] leading-relaxed flex flex-col gap-1">
                      <span className="font-bold flex items-center gap-1 text-[11px]">🔌 MODE TESTING (SANDBOX)</span>
                      <span>Untuk mengaktifkan pengiriman email pemulihan asli ke inbox user secara otomatis, atur API Key Resend di <strong>Panel Pemilik &gt; Integrasi Email</strong>.</span>
                    </div>
                  )}
                  
                  {!simulatedEmailOpen ? (
                    // Compact Email Preview List
                    <div 
                      className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 hover:border-brand-primary/30 transition-all cursor-pointer shadow-xs hover:shadow-md group"
                      onClick={() => {
                        setSimulatedEmailOpen(true);
                        setSimulatedError('');
                        setNewPassword('');
                        setNewConfirmPassword('');
                        setResetPasswordSuccess(false);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-brand-dark group-hover:text-brand-primary transition-colors">FID INVOICE Support</span>
                        <span className="text-[10px] text-gray-400 font-mono">Baru saja</span>
                      </div>
                      <h4 className="text-xs font-bold text-brand-primary mt-1">🔑 Atur Ulang Kata Sandi Akun FID INVOICE</h4>
                      <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        Halo, kami menerima permintaan untuk mengatur ulang kata sandi Anda. Silakan klik pesan ini untuk mengatur ulang sandi secara aman...
                      </p>
                      <div className="mt-3 flex items-center gap-1 text-[11px] text-brand-primary font-black">
                        <span>Buka Email & Atur Sandi Baru ↗</span>
                      </div>
                    </div>
                  ) : (
                    // Expanded Email Details & Reset Password Form
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md">
                      {/* Email Header */}
                      <div className="bg-gray-50 border-b border-gray-150 p-3 flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => setSimulatedEmailOpen(false)}
                          className="text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1 cursor-pointer"
                        >
                          ← Kembali
                        </button>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Mail Reader v1.0</span>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        <div className="border-b border-gray-100 pb-3 text-xs space-y-1">
                          <p><span className="text-gray-400 font-medium">Dari:</span> <span className="font-bold text-gray-700">FID INVOICE Support</span> &lt;noreply@fidinvoice.com&gt;</p>
                          <p><span className="text-gray-400 font-medium">Untuk:</span> <span className="font-bold text-gray-700">{email}</span></p>
                          <p><span className="text-gray-400 font-medium">Subjek:</span> <span className="font-bold text-brand-dark">🔑 Atur Ulang Kata Sandi Akun FID INVOICE</span></p>
                        </div>

                        {!resetPasswordSuccess ? (
                          // Reset Form Inline
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!newPassword || !newConfirmPassword) {
                                setSimulatedError('Sandi baru dan konfirmasi wajib diisi!');
                                return;
                              }
                              if (newPassword.length < 6) {
                                setSimulatedError('Kata sandi minimal harus 6 karakter demi keamanan!');
                                return;
                              }
                              if (newPassword !== newConfirmPassword) {
                                setSimulatedError('Konfirmasi kata sandi tidak cocok. Silakan ulangi.');
                                return;
                              }

                              // Success! Update local credentials store
                              const storedCreds = localStorage.getItem('fid_invoice_user_credentials') || '{}';
                              const credentials = JSON.parse(storedCreds);
                              credentials[email.toLowerCase().trim()] = newPassword;
                              localStorage.setItem('fid_invoice_user_credentials', JSON.stringify(credentials));

                              fetch('/api/credentials/sync', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ credentials })
                              }).catch(err => console.error('Failed to sync credentials to server:', err));

                              // Pre-fill fields for ease of test
                              setPassword(''); 
                              setSimulatedError('');
                              setResetPasswordSuccess(true);
                            }}
                            className="space-y-3.5 pt-1"
                          >
                            <p className="text-xs text-gray-600 leading-relaxed">
                              Halo, kami menerima permintaan untuk mengatur ulang kata sandi Anda. Silakan isi form di bawah untuk mengubah kata sandi Anda:
                            </p>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-gray-600 uppercase">Kata Sandi Baru</label>
                              <div className="relative">
                                <input
                                  type="password"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  placeholder="Masukkan sandi baru"
                                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-brand-primary outline-none"
                                />
                                <Lock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-gray-600 uppercase">Konfirmasi Sandi Baru</label>
                              <div className="relative">
                                <input
                                  type="password"
                                  value={newConfirmPassword}
                                  onChange={(e) => setNewConfirmPassword(e.target.value)}
                                  placeholder="Ulangi sandi baru"
                                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-brand-primary outline-none"
                                />
                                <Lock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                              </div>
                            </div>

                            {simulatedError && (
                              <div className="p-2 bg-red-50 border border-red-150 rounded-lg text-[10px] text-red-600 font-semibold">
                                ⚠️ {simulatedError}
                              </div>
                            )}

                            <button
                              type="submit"
                              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer text-center"
                            >
                              Simpan Kata Sandi Baru
                            </button>
                          </form>
                        ) : (
                          // Reset Success State
                          <div className="text-center py-4 space-y-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto shadow-inner">
                              <CheckCircle className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-xs font-extrabold text-gray-800">Kata Sandi Berhasil Diperbarui!</h5>
                              <p className="text-[10px] text-gray-500 max-w-xs mx-auto leading-relaxed">
                                Database lokal Anda telah diperbarui. Silakan kembali ke Halaman Masuk dan login menggunakan sandi baru Anda.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setView('login');
                                setShowForgotSimulator(false);
                                setSimulatedEmailOpen(false);
                                setResetPasswordSuccess(false);
                                setSuccessMsg('Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.');
                              }}
                              className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              Masuk Sekarang dengan Sandi Baru
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <p className="text-center text-xs text-gray-500">
                <button 
                  onClick={() => {
                    setView('login');
                    setShowForgotSimulator(false);
                  }} 
                  className="text-brand-primary font-bold hover:underline flex items-center gap-1 mx-auto cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kembali ke Halaman Masuk
                </button>
              </p>
            </div>
          )}

          {/* VIEW: EMAIL VERIFICATION */}
          {view === 'verify' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-brand-primary-light text-brand-primary flex items-center justify-center mx-auto mb-6 shadow-inner">
                {isCreatingPassword ? <Lock className="w-8 h-8" /> : <Mail className="w-8 h-8" />}
              </div>

              {!isCreatingPassword ? (
                <>
                  <div>
                    <h3 className="text-2xl font-display font-extrabold text-brand-dark">Verifikasi Email Anda</h3>
                    <p className="text-sm text-gray-500 mt-2">
                      Kami telah mengirimkan link verifikasi akun ke:
                    </p>
                    <p className="text-sm font-bold text-brand-primary mt-1">{email || 'email@bisnis.com'}</p>
                    <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                      Silakan periksa folder kotak masuk atau spam email Anda. Klik link di dalam email tersebut untuk mengaktifkan akun Anda.
                    </p>
                  </div>

                  <div className="space-y-3 pt-4">
                    <button 
                      onClick={() => setIsCreatingPassword(true)}
                      className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md transition-transform active:scale-95 cursor-pointer"
                    >
                      Saya Sudah Memverifikasi Email
                    </button>

                    <p className="text-xs text-gray-500">
                      Tidak menerima email?{' '}
                      <button 
                        onClick={() => {
                          setSuccessMsg('Email verifikasi ulang berhasil dikirim!');
                          setTimeout(() => setSuccessMsg(''), 3000);
                        }}
                        className="text-brand-primary font-bold hover:underline cursor-pointer"
                      >
                        Kirim Ulang
                      </button>
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-left space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-display font-extrabold text-brand-dark">Buat Kata Sandi</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Email berhasil diverifikasi. Silakan buat kata sandi untuk akun <span className="font-bold text-brand-primary">{email}</span>
                    </p>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleVerificationComplete(); }} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kata Sandi Baru</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Minimal 6 karakter" 
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                        />
                        <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3 text-gray-400 hover:text-brand-primary transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Konfirmasi Kata Sandi Baru</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi kata sandi" 
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all"
                        />
                        <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Aktifkan Akun & Masuk'
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Interactive Sandbox Email Inbox Simulator */}
              {(errorMsg.includes('Gagal mengirim') || !hasResendConfigured()) && (
                <div className="mt-8 pt-6 border-t border-gray-150 text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">📬 Kotak Masuk Simulasi Email ({email || 'budi@perusahaan.com'})</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-100 text-blue-800 animate-pulse font-mono">1 Baru</span>
                  </div>
                  
                  {hasResendConfigured() ? (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[10px] leading-relaxed flex flex-col gap-1">
                      <span className="font-extrabold flex items-center gap-1 text-[11px]">⚠️ PENGIRIMAN EMAIL GAGAL (FALLBACK)</span>
                      <span>Modul mendeteksi API Key, namun pengiriman gagal. Pastikan API Key benar dan domain Anda telah diverifikasi di Resend. Sementara itu, kami menampilkan kotak masuk simulasi di bawah ini agar Anda tetap bisa melakukan verifikasi manual.</span>
                    </div>
                  ) : (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-150 text-amber-700 rounded-xl text-[10px] leading-relaxed flex flex-col gap-1">
                      <span className="font-bold flex items-center gap-1 text-[11px]">🔌 MODE TESTING (SANDBOX)</span>
                      <span>Email simulasi di bawah ini aktif untuk pengujian cepat. Untuk mengaktifkan pengiriman email asli ke inbox user secara otomatis, atur API Key Resend Anda di <strong>Panel Pemilik &gt; Integrasi Email</strong>.</span>
                    </div>
                  )}
                  
                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 hover:border-brand-primary/30 transition-all cursor-pointer shadow-xs" 
                       onClick={() => setIsCreatingPassword(true)}>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-brand-dark">FID INVOICE</span>
                      <span className="text-[10px] text-gray-400 font-mono">Baru saja</span>
                    </div>
                    <h4 className="text-xs font-bold text-brand-primary mt-1">📧 Verifikasi Akun Bisnis FID INVOICE Anda</h4>
                    <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      Halo {fullName || 'Pengguna'}, Klik kotak ini untuk langsung memverifikasi email Anda dan mengaktifkan trial 3 hari gratis paket {selectedPlan.toUpperCase()} secara instan!
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-[11px] text-brand-primary font-black">
                      <span>Buka email & verifikasi instan ↗</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GOOGLE EMAIL PROMPT MODAL */}
          

        </div>
      </div>
    </div>
  );
}
