const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "              <QrisPaymentBox \n                amount={selectedRenewPlan === 'professional' ? (renewBillingPeriod === 'yearly' ? 950000 : 99000) : (renewBillingPeriod === 'yearly' ? 1900000 : 199000)}\n                planName={renewBillingPeriod === 'yearly' ? `${selectedRenewPlan} (Yearly)` : selectedRenewPlan}\n                onPaymentSuccess={handleSimulatePaymentSuccess}\n                isDarkMode={true}\n              />",
  "              <QrisPaymentBox \n                amount={selectedRenewPlan === 'professional' ? (renewBillingPeriod === 'yearly' ? 950000 : 99000) : (renewBillingPeriod === 'yearly' ? 1900000 : 199000)}\n                planName={renewBillingPeriod === 'yearly' ? `${selectedRenewPlan} (Yearly)` : selectedRenewPlan}\n                onPaymentSuccess={handleSimulatePaymentSuccess}\n                onClose={() => setQrisStep(false)}\n                isDarkMode={true}\n              />"
);

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed App.tsx');
