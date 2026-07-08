const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/BCA Rekening 8080507772 Terkoneksi/g, 'Rekening Bank Terkoneksi');
content = content.replace(/Buku Rekap & Verifikasi Pembayaran \(BCA Gateway\):/g, 'Buku Rekap & Verifikasi Pembayaran:');
content = content.replace(/Anda wajib mengonfirmasi bukti nominal transfer rekening BCA Anda terlebih dahulu/g, 'Anda wajib mengonfirmasi bukti nominal transfer rekening Anda terlebih dahulu');
content = content.replace(/const paymentSource = pay\.transferMethod \|\| \(isManual \? 'Transfer Manual' : 'BCA Manual'\);/g, "const paymentSource = pay.transferMethod || 'Transfer Manual';");
content = content.replace(/const senderBank = pay\.senderBank \|\| \(isManual \? 'E-Wallet \/ VA' : 'BCA'\);/g, "const senderBank = pay.senderBank || 'BCA';");
content = content.replace(/<p className="text-xs font-extrabold text-white">BANK BCA<\/p>/g, '<p className="text-xs font-extrabold text-white">BANK {pay.senderBank || \'BCA\'}</p>');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed static texts');
