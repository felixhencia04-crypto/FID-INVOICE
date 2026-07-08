const fs = require('fs');
let content = fs.readFileSync('src/components/PaymentHistorySection.tsx', 'utf8');

content = content.replace(
  /  const \[checkingOrderId, setCheckingOrderId\] = useState<string \| null>\(null\);\n/g,
  ''
);
content = content.replace(
  /  const \[simulatingOrderId, setSimulatingOrderId\] = useState<string \| null>\(null\);\n/g,
  ''
);

fs.writeFileSync('src/components/PaymentHistorySection.tsx', content);
console.log('Fixed PaymentHistorySection.tsx 3');
