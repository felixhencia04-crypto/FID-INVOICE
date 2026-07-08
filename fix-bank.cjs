const fs = require('fs');
let content = fs.readFileSync('src/components/QrisPaymentBox.tsx', 'utf8');

content = content.replace(/'BSN'/g, "'BRI'");
content = content.replace(/BSN:/g, "BRI:");
content = content.replace(/Bank Syariah Nasional/g, "Bank Rakyat Indonesia");

fs.writeFileSync('src/components/QrisPaymentBox.tsx', content);
console.log('Fixed bank BSN to BRI in QrisPaymentBox');

let adminContent = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
adminContent = adminContent.replace(/'BSN'/g, "'BRI'");
fs.writeFileSync('src/components/AdminPanel.tsx', adminContent);
console.log('Fixed bank BSN to BRI in AdminPanel');
