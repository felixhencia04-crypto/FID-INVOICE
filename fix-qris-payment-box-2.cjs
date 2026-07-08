const fs = require('fs');
let content = fs.readFileSync('src/components/QrisPaymentBox.tsx', 'utf8');

const oldMessageLine = /const message = `Halo Admin, saya ingin konfirmasi pembayaran langganan aplikasi\.\\n\\n\*Order ID\*: \$\{orderId\}\\n\*Paket\*: \$\{planName\.toUpperCase\(\)\}\\n\*Total\*: Rp \$\{amount\.toLocaleString\('id-ID'\)\}\\n\*Nama\*: \$\{activeUser\?\.fullName \|\| 'Tamu'\}\\n\\nBerikut saya lampirkan bukti transfernya:`;/;

const newMessageLine = "const message = `Halo Admin, saya ingin konfirmasi pembayaran langganan aplikasi.\\n\\n*Order ID*: ${orderId}\\n*Paket*: ${planName.toUpperCase()}\\n*Total*: Rp ${amount.toLocaleString('id-ID')}\\n*Bank Tujuan*: ${currentBank.name}\\n*Nama*: ${activeUser?.fullName || 'Tamu'}\\n\\nBerikut saya lampirkan bukti transfernya:`;";

content = content.replace(oldMessageLine, newMessageLine);

fs.writeFileSync('src/components/QrisPaymentBox.tsx', content);
console.log('Fixed WhatsApp message');
