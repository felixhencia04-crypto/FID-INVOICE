const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// I replaced:
// const btnRegex = /\{\/\* Detect if it is a Transfer Manual payment \*\/\}.*?<\/button>\n.*?\}\)/gs;
// Which probably left `()` or something.
// Let's just remove empty `()` or `()}` in that block
content = content.replace(/\(\)\}/g, '');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed JSX syntax error');
