const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldQrisApp = `<QrisPaymentBox 
                amount={selectedRenewPlan === 'professional' ? (renewBillingPeriod === 'yearly' ? 950000 : 99000) : (renewBillingPeriod === 'yearly' ? 1900000 : 199000)}
                planName={renewBillingPeriod === 'yearly' ? \`\${selectedRenewPlan} (Yearly)\` : selectedRenewPlan}
                onPaymentSuccess={handleSimulatePaymentSuccess}
                onClose={() => setQrisStep(false)}
                isDarkMode={true}
              />`;

const newQrisApp = `<QrisPaymentBox 
                amount={selectedRenewPlan === 'professional' ? (renewBillingPeriod === 'yearly' ? 950000 : 99000) : (renewBillingPeriod === 'yearly' ? 1900000 : 199000)}
                planName={renewBillingPeriod === 'yearly' ? \`\${selectedRenewPlan} (Yearly)\` : selectedRenewPlan}
                onPaymentSuccess={handleSimulatePaymentSuccess}
                onClose={() => setQrisStep(false)}
                isDarkMode={true}
                userName={currentUser?.fullName || 'Tamu'}
                userEmail={currentUser?.email}
                userId={currentUser?.id}
              />`;

content = content.replace(oldQrisApp, newQrisApp);
fs.writeFileSync('src/App.tsx', content);

let subContent = fs.readFileSync('src/components/SubscriptionPage.tsx', 'utf8');
const oldQrisSub = `<QrisPaymentBox 
              amount={checkout.amount}
              planName={checkout.isYearly ? \`\${checkout.plan} (Yearly)\` : checkout.plan}
              onPaymentSuccess={handlePaymentSuccess}
              onClose={() => setCheckout(null)}
              isDarkMode={false}
            />`;

const newQrisSub = `<QrisPaymentBox 
              amount={checkout.amount}
              planName={checkout.isYearly ? \`\${checkout.plan} (Yearly)\` : checkout.plan}
              onPaymentSuccess={handlePaymentSuccess}
              onClose={() => setCheckout(null)}
              isDarkMode={false}
              userName={user?.fullName || 'Tamu'}
              userEmail={user?.email}
              userId={user?.id}
            />`;

subContent = subContent.replace(oldQrisSub, newQrisSub);
fs.writeFileSync('src/components/SubscriptionPage.tsx', subContent);
console.log('Passed user props to QrisPaymentBox');
