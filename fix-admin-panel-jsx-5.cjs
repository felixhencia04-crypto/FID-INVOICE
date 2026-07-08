const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/\$\{adminOrderIdInput\.trim/g, '${adminOrderIdInput.trim()}');
content = content.replace(/\$\{orderId/g, '${orderId}'); // wait, just fixing the ones I broke.
content = content.replace(/cleanPlan\.toUpperCase Anda/g, 'cleanPlan.toUpperCase()} Anda'); // Check if any other. Wait I already replaced toUpperCase Anda.

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed JSX syntax error 5');
