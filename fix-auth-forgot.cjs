const fs = require('fs');
let code = fs.readFileSync('src/components/AuthPage.tsx', 'utf8');

const replacement = `  const handleForgotSubmit = async (e: React.FormEvent) => {
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
      } catch (err) {
        setIsLoading(false);
        setErrorMsg('Terjadi kesalahan jaringan saat mengirim email.');
        setErrorType('other');
        setShowForgotSimulator(true);
      }
    } else {
      setTimeout(() => {
        setIsLoading(false);
        if (!(lowerEmail in credentials)) {
          setSuccessMsg(\`Email baru terdeteksi. Sistem sandbox telah mendaftarkan '\${email}' secara otomatis agar Anda dapat mensimulasikan pemulihan sandi!\`);
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
  };`;

code = code.replace(/  const handleForgotSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?  const strength = getPasswordStrength\(\);/, replacement + '\n  const strength = getPasswordStrength();');

fs.writeFileSync('src/components/AuthPage.tsx', code);
