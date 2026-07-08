const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/'SaaS Paket Saya'/g, "'Paket Saya'");

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed menu name');
