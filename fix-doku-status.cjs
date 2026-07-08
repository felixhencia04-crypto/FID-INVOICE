const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldLog = "console.log('[Doku Status] Error fetching status:', await response.text());";
const newLog = `const errText = await response.text();
      if (!errText.includes('invalid_request_error') && response.status !== 404) {
        console.log('[Doku Status] Error fetching status:', errText);
      }`;

content = content.replace(oldLog, newLog);

fs.writeFileSync('server.ts', content);
console.log('Fixed Doku Status error logging');
