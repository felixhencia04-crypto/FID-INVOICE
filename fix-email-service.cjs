const fs = require('fs');
let code = fs.readFileSync('src/utils/emailService.ts', 'utf8');

code = code.replace(`    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify(payload),
    });`, `    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        ...payload
      }),
    });`);

fs.writeFileSync('src/utils/emailService.ts', code);
