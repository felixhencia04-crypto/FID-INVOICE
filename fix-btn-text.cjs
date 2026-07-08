const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/Lanjutkan Pembayaran/g, 'Lanjutkan Pembayaran (BCA, Mandiri, BRI)');

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed button text to include all 3 banks');
