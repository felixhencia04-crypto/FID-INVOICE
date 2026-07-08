const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/Lanjutkan ke Pembayaran Bank BCA/g, 'Lanjutkan Pembayaran');

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed button text');
