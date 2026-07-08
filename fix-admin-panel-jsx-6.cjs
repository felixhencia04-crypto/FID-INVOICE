const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/\$\{tier\.toUpperCase/g, '${tier.toUpperCase()}');
content = content.replace(/\.toUpperCase ditolak/g, '.toUpperCase()} ditolak');
content = content.replace(/\$\{orderId/g, '${orderId}');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed JSX syntax error 6');
