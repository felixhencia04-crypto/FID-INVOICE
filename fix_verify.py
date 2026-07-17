import re
with open('src/components/AuthPage.tsx', 'r') as f:
    content = f.read()

# Replace handleVerificationComplete
verify_logic = """  const handleVerificationComplete = async () => {
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
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const isOwnerEmail = email.toLowerCase().trim() === 'felix.hencia04@gmail.com' || email.toLowerCase().trim() === 'admin@fidinvoice.com';
      const expiry = new Date();
      if (isOwnerEmail) {
        expiry.setFullYear(expiry.getFullYear() + 20); // 20 years perpetual
      } else {
        expiry.setDate(expiry.getDate() + 3);
      }

      const newUser: UserProfile = {
        id: user.uid,
        fullName,
        businessName,
        email,
        phone,
        subscription: {
          plan: selectedPlan,
          status: isOwnerEmail ? 'active' : 'trial',
          expiryDate: expiry.toISOString().split('T')[0],
          trialDaysRemaining: isOwnerEmail ? 0 : 3
        }
      };
      
      await setDoc(doc(db, 'users', user.uid), {
        ...newUser,
        active: true
      });
      
      setIsLoading(false);
      onAuthSuccess(newUser);
      
    } catch (error: any) {
      setIsLoading(false);
      console.error("Firebase Auth Error:", error);
      setErrorMsg('Gagal membuat akun: ' + error.message);
      setErrorType('other');
    }
  };"""

content = re.sub(r'  const handleVerificationComplete = \(\) => \{.*?\n  \};\n', verify_logic + '\n\n', content, flags=re.DOTALL)

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(content)
