const fs = require('fs');

let content = fs.readFileSync('src/utils/emailService.ts', 'utf8');

content = content.replace(
  "export const getResendConfig = () => {\n  let apiKey = localStorage.getItem('fid_invoice_resend_api_key') || '';",
  "export const getResendConfig = () => {\n  let apiKey = localStorage.getItem('fid_invoice_resend_api_key') || '';\n  if (apiKey === 're_A4USDQuQ_Pd19U6MeRHMa82F9ws3oZMUV' || apiKey === 're_dwdDmrFu_JhnanLyHXXxmymXzZYbTG5ne') {\n    apiKey = '';\n    localStorage.removeItem('fid_invoice_resend_api_key');\n  }"
);

fs.writeFileSync('src/utils/emailService.ts', content);
