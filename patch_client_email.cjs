const fs = require('fs');
let s = fs.readFileSync('src/utils/emailService.ts', 'utf8');

s = s.replace(
  "body: JSON.stringify({ ...payload, apiKey }),",
  "body: JSON.stringify({ ...payload }), // Server must handle apiKey"
);

fs.writeFileSync('src/utils/emailService.ts', s);
