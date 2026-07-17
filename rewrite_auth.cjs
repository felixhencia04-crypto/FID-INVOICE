const fs = require('fs');

let src = fs.readFileSync('src/components/AuthPage.tsx', 'utf8');

// Replace handleLogin
src = src.replace(/const handleLogin = async \(e: React\.FormEvent\) => \{[\s\S]*?\};(\s*const handleRegister)/, `const handleLogin = async (e: React.FormEvent) => {
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.active === false) {
           setErrorMsg('Akun belum diverifikasi. Silakan cek email Anda untuk verifikasi, atau hubungi admin.');
           setErrorType('other');
           await signOut(auth);
           setIsLoading(false);
           return;
        }
        
        const profile: UserProfile = {
          id: user.uid,
          fullName: userData.name || userData.fullName || 'User',
          businessName: userData.businessName || 'Bisnis Anda',
          email: user.email || '',
          phone: userData.phone || '',
          avatarUrl: '',
          plan: userData.plan || 'starter'
        };
        onAuthSuccess(profile);
      } else {
        // Handle migration case if doc doesn't exist but auth does
        const profile: UserProfile = {
          id: user.uid,
          fullName: 'Migrated User',
          businessName: 'Bisnis Anda',
          email: user.email || '',
          phone: '',
          avatarUrl: '',
          plan: 'starter'
        };
        onAuthSuccess(profile);
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setErrorMsg('Email atau password salah.');
        setErrorType('other');
      } else {
        setErrorMsg(error.message || 'Terjadi kesalahan saat login.');
        setErrorType('other');
      }
    } finally {
      setIsLoading(false);
    }
  };$1`);

// Replace handleRegister
src = src.replace(/const handleRegister = async \(e: React\.FormEvent\) => \{[\s\S]*?\};(\s*const handleGoogleSignIn)/, `const handleRegister = async (e: React.FormEvent) => {
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await setDoc(doc(db, 'users', user.uid), {
         email: user.email,
         name: fullName,
         fullName: fullName,
         businessName,
         phone,
         role: 'user',
         plan: selectedPlan,
         active: true, // We allow auto-activation for now, or you can require email verification
         createdAt: new Date().toISOString()
      });
      
      const profile: UserProfile = {
          id: user.uid,
          fullName,
          businessName,
          email,
          phone,
          avatarUrl: '',
          plan: selectedPlan
      };
      
      // Optionally send a verification email via Resend
      if (hasResendConfigured()) {
         try {
           await sendVerificationEmail(email, fullName, businessName);
         } catch (e) {
           console.error('Failed to send welcome email', e);
         }
      }

      onAuthSuccess(profile);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg('Email sudah terdaftar. Silakan login.');
        setErrorType('other');
      } else if (error.code === 'auth/weak-password') {
        setErrorMsg('Password terlalu lemah. Minimal 6 karakter.');
        setErrorType('other');
      } else {
        setErrorMsg(error.message || 'Terjadi kesalahan saat registrasi.');
        setErrorType('other');
      }
    } finally {
      setIsLoading(false);
    }
  };$1`);
  
// Replace handleGoogleSignIn
src = src.replace(/const handleGoogleSignIn = async \(\) => \{[\s\S]*?\};(\s*const handleSimulatedReset)/, `const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let profile: UserProfile;
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        profile = {
          id: user.uid,
          fullName: userData.fullName || user.displayName || 'Google User',
          businessName: userData.businessName || \`Bisnis \${user.displayName || 'Baru'}\`,
          email: user.email || '',
          phone: userData.phone || '',
          avatarUrl: user.photoURL || '',
          plan: userData.plan || selectedPlan
        };
      } else {
        profile = {
          id: user.uid,
          fullName: user.displayName || 'Google User',
          businessName: \`Bisnis \${user.displayName || 'Baru'}\`,
          email: user.email || '',
          phone: '',
          avatarUrl: user.photoURL || '',
          plan: selectedPlan
        };
        await setDoc(doc(db, 'users', user.uid), {
           email: profile.email,
           fullName: profile.fullName,
           name: profile.fullName,
           businessName: profile.businessName,
           phone: profile.phone,
           role: 'user',
           plan: profile.plan,
           active: true,
           createdAt: new Date().toISOString()
        });
      }
      
      onAuthSuccess(profile);
    } catch (error) {
      console.error('Google sign-in error:', error);
      setErrorMsg('Gagal masuk dengan Google.');
      setErrorType('other');
    }
  };$1`);

fs.writeFileSync('src/components/AuthPage.tsx', src);
