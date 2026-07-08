const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/\{thread\.userName\.substring\(0, 2\)\.toUpperCase\n/g, '{thread.userName.substring(0, 2).toUpperCase()}\n');
content = content.replace(/\{msg\.senderName\.substring\(0, 2\)\.toUpperCase\n/g, '{msg.senderName.substring(0, 2).toUpperCase()}\n'); // just in case

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed JSX syntax error 10');
