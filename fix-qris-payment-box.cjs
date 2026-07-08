const fs = require('fs');
let content = fs.readFileSync('src/components/QrisPaymentBox.tsx', 'utf8');

// Add selectedBank to JSON.stringify in fetch body
content = content.replace(/isYearly\n\s*\}\)\n/g, 'isYearly,\n          selectedBank\n        })\n');

fs.writeFileSync('src/components/QrisPaymentBox.tsx', content);
console.log('Fixed QrisPaymentBox');
