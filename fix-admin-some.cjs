const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/paymentMethodData\.some\(p => p\.value > 0\)/g, 'paymentMethodData.some(p => (p.value as number) > 0)');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed TypeScript some > 0 error');
