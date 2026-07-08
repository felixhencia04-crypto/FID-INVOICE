const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/curr\.value: value as number/g, 'curr.value');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed syntax error');
