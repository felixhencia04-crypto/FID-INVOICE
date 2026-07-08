const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/\.toUpperCase\n/g, '.toUpperCase()}\n');
content = content.replace(/\.toLowerCase\n/g, '.toLowerCase()}\n');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed JSX syntax error 11');
