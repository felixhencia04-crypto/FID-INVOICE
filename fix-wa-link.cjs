const fs = require('fs');

let content = fs.readFileSync('src/components/QrisPaymentBox.tsx', 'utf8');
content = content.replace(
  "const waUrl = \\`https://api.whatsapp.com/send?phone=\\${ADMIN_WHATSAPP}&text=\\${encodeURIComponent(message)}\\`;\\n      window.open(waUrl, '_blank');",
  "const waUrl = \\`https://api.whatsapp.com/send?phone=\\${ADMIN_WHATSAPP}&text=\\${encodeURIComponent(message)}\\`;\\n      window.open(waUrl, '_blank') || (window.location.href = waUrl);"
);
fs.writeFileSync('src/components/QrisPaymentBox.tsx', content);
