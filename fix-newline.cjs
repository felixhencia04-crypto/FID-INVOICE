const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace('};\n\\n\\n  // Centrally handle navigation with subscription guards', '};\n\n  // Centrally handle navigation with subscription guards');

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed newline error');
