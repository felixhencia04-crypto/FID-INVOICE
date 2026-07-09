const fs = require('fs');

let code = fs.readFileSync('src/components/AuthPage.tsx', 'utf8');

const regex = /const userProfile[^]+?onAuthSuccess\(userProfile\);/m;
const replacement = `const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14); // 14 days trial
      
      const userProfile: UserProfile = {
        id: user.uid,
        email: email,
        fullName: fullName,
        businessName: \`Bisnis \${fullName}\`,
        phone: user.phoneNumber || '',
        profilePicture: photoUrl,
        subscription: {
          status: 'trial',
          plan: selectedPlan,
          expiryDate: futureDate.toISOString().split('T')[0],
          trialDaysRemaining: 14
        }
      };
      
      // We must also ensure it's saved to the global user list so loadUserData and admin panel work
      const allUsers = JSON.parse(localStorage.getItem('fid_invoice_all_users') || '[]');
      const existingUser = allUsers.find((u: any) => u.email === email);
      if (existingUser) {
        onAuthSuccess(existingUser);
      } else {
        allUsers.push(userProfile);
        localStorage.setItem('fid_invoice_all_users', JSON.stringify(allUsers));
        onAuthSuccess(userProfile);
      }`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/AuthPage.tsx', code);
