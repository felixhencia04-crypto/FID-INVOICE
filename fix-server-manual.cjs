const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /const \{ amount, planName, userId, userEmail, fullName, isYearly \} = req\.body;/g,
  'const { amount, planName, userId, userEmail, fullName, isYearly, selectedBank } = req.body;'
);

content = content.replace(
  /paymentType: 'Manual Transfer'\n\s*\};/g,
  "paymentType: `Transfer ${selectedBank || 'Manual'}`, senderBank: selectedBank || 'BCA'\n    };"
);

fs.writeFileSync('server.ts', content);
console.log('Fixed server.ts manual payment');
