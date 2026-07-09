const fs = require('fs');
let code = fs.readFileSync('src/components/AuthPage.tsx', 'utf8');

const replacement = `  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !businessName || !email || !phone || !password || !confirmPassword) {
      setErrorMsg('Semua kolom wajib diisi.');
      setErrorType('other');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok.');
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

    // Save password to credentials store immediately
    const storedCreds = localStorage.getItem('fid_invoice_user_credentials') || '{}';
    const credentials = JSON.parse(storedCreds);
    credentials[email.toLowerCase().trim()] = password;
    localStorage.setItem('fid_invoice_user_credentials', JSON.stringify(credentials));

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
      } catch (err) {
        setIsLoading(false);
        setErrorMsg('Terjadi kesalahan saat mengirim email verifikasi.');
        setErrorType('other');
        setView('verify');
      }
    } else {
      setTimeout(() => {
        setIsLoading(false);
        setView('verify');
      }, 1200);
    }
  };`;

code = code.replace(/  const handleRegister = \(e: React\.FormEvent\) => \{[\s\S]*?    \}, 1200\);\s*\};/, replacement);

fs.writeFileSync('src/components/AuthPage.tsx', code);
