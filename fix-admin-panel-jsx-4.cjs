const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/adminOrderIdInput\.trim ditemukan/g, 'adminOrderIdInput.trim()} ditemukan');
content = content.replace(/\.toUpperCase \(/g, '.toUpperCase()} (');
content = content.replace(/\.toUpperCase\)\./g, '.toUpperCase()}).');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed JSX syntax error 4');
