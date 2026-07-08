const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/doku:\s*\{\s*merchantId: MERCHANT_ID,\s*hasClientKey: !!CLIENT_KEY,\s*hasServerKey: !!SECRET_KEY,\s*\}/g, "doku: { status: 'removed' }");

fs.writeFileSync('server.ts', content);
console.log('Fixed health endpoint');
