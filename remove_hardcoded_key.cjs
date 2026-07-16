const fs = require('fs');

let content = fs.readFileSync('src/utils/emailService.ts', 'utf8');

content = content.replace(
  "  // If not configured or if it is the old invalid key, auto-seed the provided Resend API Key\n  if (!apiKey || apiKey === 're_A4USDQuQ_Pd19U6MeRHMa82F9ws3oZMUV' || apiKey === 're_dwdDmrFu_JhnanLyHXXxmymXzZYbTG5ne') {\n    apiKey = 're_dwdDmrFu_JhnanLyHXXxmymXzZYbTG5ne'; // Currently invalid per Resend, but updating as requested\n    localStorage.setItem('fid_invoice_resend_api_key', apiKey);\n  }",
  ""
);

fs.writeFileSync('src/utils/emailService.ts', content);
