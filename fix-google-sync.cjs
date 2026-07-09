const fs = require('fs');
let code = fs.readFileSync('src/components/AuthPage.tsx', 'utf8');

const replacement = `      if (existingUser) {
        onAuthSuccess(existingUser);
      } else {
        allUsers.push(userProfile);
        localStorage.setItem('fid_invoice_all_users', JSON.stringify(allUsers));
        
        // Sync to server immediately
        fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: userProfile })
        }).catch(err => console.error('Failed to sync new user to server:', err));

        // Dispatch custom window event for instant admin panel real-time sync
        window.dispatchEvent(new Event('fid_users_updated'));
        
        onAuthSuccess(userProfile);
      }`;

code = code.replace(/      if \(existingUser\) \{\s*onAuthSuccess\(existingUser\);\s*\} else \{\s*allUsers\.push\(userProfile\);\s*localStorage\.setItem\('fid_invoice_all_users', JSON\.stringify\(allUsers\)\);\s*onAuthSuccess\(userProfile\);\s*\}/, replacement);

fs.writeFileSync('src/components/AuthPage.tsx', code);
