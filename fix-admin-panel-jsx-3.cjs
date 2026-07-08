const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/\.toUpperCase Anda/g, '.toUpperCase()} Anda');
content = content.replace(/\.toLowerCase Anda/g, '.toLowerCase()} Anda');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed JSX syntax error 3');
