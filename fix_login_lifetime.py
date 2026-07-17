import re
with open('src/components/AuthPage.tsx', 'r') as f:
    content = f.read()

old_block = """        const profile: UserProfile = {
          id: user.uid,
          fullName: userData.name || userData.fullName || 'User',
          businessName: userData.businessName || 'Bisnis Anda',
          email: user.email || '',
          phone: userData.phone || '',
          subscription: { plan: selectedPlan, status: "active", expiryDate: "2099-12-31", trialDaysRemaining: 0 },
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
          subscription: { plan: selectedPlan, status: "active", expiryDate: "2099-12-31", trialDaysRemaining: 0 },
        };
        onAuthSuccess(profile);"""

new_block = """        const profile: UserProfile = {
          id: user.uid,
          fullName: userData.name || userData.fullName || 'User',
          businessName: userData.businessName || 'Bisnis Anda',
          email: user.email || '',
          phone: userData.phone || '',
          subscription: userData.subscription || { plan: selectedPlan, status: "trial", expiryDate: new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0], trialDaysRemaining: 3 },
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
          subscription: { plan: selectedPlan, status: "trial", expiryDate: new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0], trialDaysRemaining: 3 },
        };
        onAuthSuccess(profile);"""

content = content.replace(old_block, new_block)

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(content)
