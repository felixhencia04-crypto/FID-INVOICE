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

        // Since Google already verified the email, we don't need to send another email.
        // We just redirect them to create a password for local/backup access.
        setIsCreatingPassword(true);
        setView('verify');
        setIsLoading(false);
      }"""

new_else_block = """      if (existingUser) {
        onAuthSuccess(existingUser);
      } else {
        // Automatically register Google users since their email is verified
        allUsers.push(userProfile);
        localStorage.setItem('fid_invoice_all_users', JSON.stringify(allUsers));
        
        try {
          await setDoc(doc(db, 'users', user.uid), {
            ...userProfile,
            active: true
          });
        } catch (err) {
          console.error('Failed to save Google user to Firestore:', err);
        }

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
