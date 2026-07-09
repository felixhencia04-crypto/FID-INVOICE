const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(`        headers: {
          'Authorization': \`Bearer \${resendApiKey}\`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          from: senderEmail || 'onboarding@resend.dev',
          to: testEmailDest,`, `        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: resendApiKey,
          from: senderEmail || 'onboarding@resend.dev',
          to: testEmailDest,`);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
