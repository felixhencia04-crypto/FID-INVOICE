const fs = require('fs');
let content = fs.readFileSync('src/components/PaymentHistorySection.tsx', 'utf8');

// Replace via: {tx.paymentType} with via: {tx.paymentType.replace(/simulasi /i, '')}
// Actually, let's just use string replace.
content = content.replace(/via: \{tx\.paymentType\}/g, "via: {tx.paymentType.replace(/simulasi |simulated /gi, '')}");

fs.writeFileSync('src/components/PaymentHistorySection.tsx', content);
console.log('Fixed PaymentHistory UI');
