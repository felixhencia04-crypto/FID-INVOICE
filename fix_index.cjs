const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// Remove mock script
content = content.replace(/<script>\s*\/\/ Mock Doku Jokul[\s\S]*?<\/script>\s*/m, '');

fs.writeFileSync('index.html', content);
console.log('Fixed index.html');
