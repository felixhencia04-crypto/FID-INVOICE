const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/\n\s*\}\)\n\n\s*\{adminSection === 'notifications' && \(/g, '\n      })()}\n\n      {adminSection === \'notifications\' && (');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed JSX syntax error 9');
