import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

old_auth_success = """  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('fid_invoice_active_session', JSON.stringify(user));
    loadUserData(user.id);"""

new_auth_success = """  const handleAuthSuccess = async (user: UserProfile) => {
    // Heal incorrectly given lifetime plans
    if (user.subscription.expiryDate === '2099-12-31' && user.email.toLowerCase().trim() !== 'admin@fidinvoice.com') {
      const fixedExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      user.subscription.expiryDate = fixedExpiry;
      user.subscription.status = 'trial';
      user.subscription.trialDaysRemaining = 3;
      
      const allUsers = JSON.parse(localStorage.getItem('fid_invoice_all_users') || '[]');
      const userIdx = allUsers.findIndex((u: any) => u.id === user.id);
      if (userIdx !== -1) {
        allUsers[userIdx] = user;
        localStorage.setItem('fid_invoice_all_users', JSON.stringify(allUsers));
      }
      
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('./lib/firebase');
        await updateDoc(doc(db, 'users', user.id), {
          subscription: user.subscription
        });
      } catch (err) {
        console.warn('Failed to heal user subscription in Firestore:', err);
      }
    }

    setCurrentUser(user);
    localStorage.setItem('fid_invoice_active_session', JSON.stringify(user));
    loadUserData(user.id);"""

content = content.replace(old_auth_success, new_auth_success)

with open('src/App.tsx', 'w') as f:
    f.write(content)
