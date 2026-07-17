import re
with open('src/components/AuthPage.tsx', 'r') as f:
    content = f.read()

# Replace block 1 (Google Auth)
old_block_1 = """            const isOwnerEmail = email.toLowerCase().trim() === 'admin@fidinvoice.com';
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
          plan: selectedPlan,
          status: isOwnerEmail ? 'active' : 'trial',
          expiryDate: futureDate.toISOString().split('T')[0],
          trialDaysRemaining: isOwnerEmail ? 0 : 3
        }
      };"""

new_block_1 = """      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      
      const userProfile: UserProfile = {
        id: user.uid,
        email: email,
        fullName: fullName,
        businessName: `Bisnis ${fullName}`,
        phone: user.phoneNumber || '',
        profilePicture: photoUrl,
        subscription: {
          plan: selectedPlan,
          status: 'trial',
          expiryDate: futureDate.toISOString().split('T')[0],
          trialDaysRemaining: 3
        }
      };"""

content = content.replace(old_block_1, new_block_1)

# Replace block 2 (Email Auth)
old_block_2 = """      const isOwnerEmail = email.toLowerCase().trim() === 'admin@fidinvoice.com';
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
      };"""

new_block_2 = """      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 3);

      const newUser: UserProfile = {
        id: user.uid,
        fullName,
        businessName,
        email,
        phone,
        subscription: {
          plan: selectedPlan,
          status: 'trial',
          expiryDate: expiry.toISOString().split('T')[0],
          trialDaysRemaining: 3
        }
      };"""

content = content.replace(old_block_2, new_block_2)

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(content)
