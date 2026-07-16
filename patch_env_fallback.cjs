const fs = require('fs');
let s = fs.readFileSync('server.ts', 'utf8');

s = s.replace(
  "if (!apiKey && config.resendApiKey) apiKey = config.resendApiKey;",
  "if (!apiKey && config.resendApiKey) apiKey = config.resendApiKey;\n    if (!apiKey && process.env.RESEND_API_KEY) apiKey = process.env.RESEND_API_KEY;"
);

fs.writeFileSync('server.ts', s);
