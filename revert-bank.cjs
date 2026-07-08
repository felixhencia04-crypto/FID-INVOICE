const fs = require('fs');
let content = fs.readFileSync('src/components/QrisPaymentBox.tsx', 'utf8');

content = content.replace(/'BRI'/g, "'BSN'");
content = content.replace(/BRI:/g, "BSN:");
content = content.replace(/Bank Rakyat Indonesia/g, "Bank Syariah Nasional");

fs.writeFileSync('src/components/QrisPaymentBox.tsx', content);
console.log('Fixed bank BRI to BSN in QrisPaymentBox');

let adminContent = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
adminContent = adminContent.replace(/'BRI'/g, "'BSN'");
adminContent = adminContent.replace(/=== 'BRI'/g, "=== 'BSN'");
fs.writeFileSync('src/components/AdminPanel.tsx', adminContent);
console.log('Fixed bank BRI to BSN in AdminPanel');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/BRI\)/g, "BSN)");
fs.writeFileSync('src/App.tsx', appContent);
console.log('Fixed bank BRI to BSN in App.tsx');

let subContent = fs.readFileSync('src/components/SubscriptionPage.tsx', 'utf8');
subContent = subContent.replace(/BRI\)/g, "BSN)");
fs.writeFileSync('src/components/SubscriptionPage.tsx', subContent);
console.log('Fixed bank BRI to BSN in SubscriptionPage.tsx');

