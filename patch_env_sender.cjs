const fs = require('fs');
let s = fs.readFileSync('server.ts', 'utf8');

s = s.replace(
  "if (!from && config.resendSender) from = config.resendSender;",
  "if (!from && config.resendSender) from = config.resendSender;\n    if (!from && process.env.RESEND_SENDER_EMAIL) from = process.env.RESEND_SENDER_EMAIL;"
);

fs.writeFileSync('server.ts', s);
