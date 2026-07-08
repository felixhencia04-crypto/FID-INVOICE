const fs = require('fs');
let content = fs.readFileSync('src/components/PaymentHistorySection.tsx', 'utf8');

// Remove handleCheckStatus and handleSimulateSettle blocks
content = content.replace(
  /const handleCheckStatus = async.*?};/gs,
  ''
);

content = content.replace(
  /const handleSimulateSettle = async.*?};/gs,
  ''
);

fs.writeFileSync('src/components/PaymentHistorySection.tsx', content);
console.log('Fixed PaymentHistorySection.tsx 2');
