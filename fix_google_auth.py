import re
with open('src/components/AuthPage.tsx', 'r') as f:
    content = f.read()

old_else_block = """      if (existingUser) {
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
      }"""

new_else_block = """      if (existingUser) {
        onAuthSuccess(existingUser);
      } else {
        // Automatically register Google users since their email is verified
        allUsers.push(userProfile);
        localStorage.setItem('fid_invoice_all_users', JSON.stringify(allUsers));
        
        // Sync to server
        try {
          await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: allUsers })
          });
        } catch (err) {
          console.warn('Failed to sync new Google user to server:', err);
        }
        
        onAuthSuccess(userProfile);
      }"""

content = content.replace(old_else_block, new_else_block)

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(content)
