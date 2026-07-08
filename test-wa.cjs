const fs = require('fs');

let content = fs.readFileSync('src/components/QrisPaymentBox.tsx', 'utf8');
if (content.includes('ADMIN_WHATSAPP')) {
  console.log('ADMIN_WHATSAPP found');
}
