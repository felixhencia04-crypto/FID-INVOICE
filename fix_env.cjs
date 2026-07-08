const fs = require('fs');

let envContent = fs.readFileSync('.env.example', 'utf8');

envContent = envContent.replace(/DOKU_MERCHANT_ID=".*"/, 'DOKU_CLIENT_ID="BRN-0229-1783394866076"');
envContent = envContent.replace(/DOKU_SERVER_KEY=".*"/, 'DOKU_SECRET_KEY="SK-c1pC2u9lDrwLpYdVz05v"');

fs.writeFileSync('.env.example', envContent);
console.log('Fixed .env.example');
