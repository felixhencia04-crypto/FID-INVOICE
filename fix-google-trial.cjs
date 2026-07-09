const fs = require('fs');
let code = fs.readFileSync('src/components/AuthPage.tsx', 'utf8');

const replacement = `      const isOwnerEmail = email.toLowerCase().trim() === 'felix.hencia04@gmail.com' || email.toLowerCase().trim() === 'admin@fidinvoice.com';
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
        businessName: \`Bisnis \${fullName}\`,
        phone: user.phoneNumber || '',
        profilePicture: photoUrl,
        subscription: {
          status: isOwnerEmail ? 'active' : 'trial',
          plan: isOwnerEmail ? 'enterprise' : selectedPlan,
          expiryDate: futureDate.toISOString().split('T')[0],
          trialDaysRemaining: isOwnerEmail ? 0 : 3
        }
      };`;

code = code.replace(/const futureDate = new Date\(\);[\s\S]*?trialDaysRemaining: 3\s*\}\s*\};/m, replacement);

fs.writeFileSync('src/components/AuthPage.tsx', code);
