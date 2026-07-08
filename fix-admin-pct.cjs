const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/const pct = \(p\.value \/ totalVal\) \* 100;/g, 'const pct = ((p.value as number) / totalVal) * 100;');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed TypeScript pct error');
