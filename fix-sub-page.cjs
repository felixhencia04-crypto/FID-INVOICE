const fs = require('fs');
let content = fs.readFileSync('src/components/SubscriptionPage.tsx', 'utf8');

content = content.replace(
  "            <QrisPaymentBox \n              amount={checkout.amount}\n              planName={checkout.isYearly ? `${checkout.plan} (Yearly)` : checkout.plan}\n              onPaymentSuccess={handlePaymentSuccess}\n              isDarkMode={false}\n            />",
  "            <QrisPaymentBox \n              amount={checkout.amount}\n              planName={checkout.isYearly ? `${checkout.plan} (Yearly)` : checkout.plan}\n              onPaymentSuccess={handlePaymentSuccess}\n              onClose={() => setCheckout(null)}\n              isDarkMode={false}\n            />"
);

fs.writeFileSync('src/components/SubscriptionPage.tsx', content);
console.log('Fixed sub page');
