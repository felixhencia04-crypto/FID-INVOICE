const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// The line currently has `})` and then newline and `</div>`
content = content.replace(/\}\)\n\s*<\/div>/g, '})}\n                          </div>');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed JSX syntax error 8');
