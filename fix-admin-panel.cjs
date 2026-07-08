const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// 1. Rename Doku Gateway to Transfer Manual in metrics
content = content.replace(/Doku Gateway/g, 'Transfer Manual');
content = content.replace(/Doku QRIS/g, 'Transfer Manual');
content = content.replace(/Doku/g, 'Transfer Manual');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed AdminPanel strings');
