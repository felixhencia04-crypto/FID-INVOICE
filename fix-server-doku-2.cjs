const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const lines = content.split('\n');
// Delete lines 215 to 301
const newLines = [...lines.slice(0, 214), ...lines.slice(301)];
fs.writeFileSync('server.ts', newLines.join('\n'));
console.log('Fixed server.ts');
