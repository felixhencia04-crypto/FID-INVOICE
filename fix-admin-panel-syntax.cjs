const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/isTransfer Manual/g, 'isManual');
content = content.replace(/Cek Transfer Manual/g, 'Cek Transfer');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed syntax error');
