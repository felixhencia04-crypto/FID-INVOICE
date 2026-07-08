const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/app\.post\('\/api\/doku\/webhook.*?\}\);\n/gs, '');
content = content.replace(/app\.post\('\/api\/doku\/token.*?\}\);\n/gs, '');
content = content.replace(/app\.post\('\/api\/doku\/check-status\/:orderId.*?\}\);\n/gs, '');
content = content.replace(/app\.post\('\/api\/doku\/simulate-settle\/:orderId.*?\}\);\n/gs, '');
content = content.replace(/app\.get\('\/api\/doku\/history\/:userId.*?\}\);\n/gs, '');

fs.writeFileSync('server.ts', content);
console.log('Cleaned up server endpoints');
