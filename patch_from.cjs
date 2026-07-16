const fs = require('fs');
let s = fs.readFileSync('server.ts', 'utf8');

s = s.replace(
  "if (!from && config.resendSender) from = config.resendSender;",
  "if (!from && config.resendSender) from = config.resendSender;\n    if (from && !from.includes('<')) {\n      from = `FID INVOICE <${from}>`;\n    }"
);

fs.writeFileSync('server.ts', s);
