const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/Menunggu Verifikasi BCA/g, 'Menunggu Verifikasi Manual');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed text Menunggu Verifikasi');
