const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/const totalVal = paymentMethodDataToRender\.reduce\(\(s, curr\) => s \+ curr\.value, 0\);/g, 'const totalVal = paymentMethodDataToRender.reduce((s, curr) => s + (curr.value as number), 0);');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed TypeScript reduce error');
