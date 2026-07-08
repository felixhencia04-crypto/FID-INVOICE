const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const oldRegex = /\/\/ Data for Payment Type Distribution.*?(?=const paymentMethodDataToRender)/s;
const newCode = `// Data for Payment Type Distribution
        const paymentMethodData = (() => {
          const bankTotals = {};
          pendingPayments.forEach(p => {
            if (p.status === 'confirmed' || p.status === 'applied') {
              const bankName = p.senderBank || 'BCA';
              bankTotals[bankName] = (bankTotals[bankName] || 0) + (p.amount || 0);
            }
          });
          
          const colors = {
            'BCA': '#3b82f6',
            'MANDIRI': '#eab308',
            'BSN': '#14b8a6',
            'Lainnya': '#6366f1'
          };
          
          return Object.entries(bankTotals).map(([bank, value]) => ({
            name: \`Transfer \${bank}\`,
            value,
            color: colors[bank] || colors['Lainnya']
          }));
        })();

        `;
        
content = content.replace(oldRegex, newCode);

const oldRenderRegex = /const paymentMethodDataToRender = paymentMethodData\.some.*?\];/s;
const newRenderCode = `const paymentMethodDataToRender = paymentMethodData.some(p => p.value > 0) ? paymentMethodData : [
          { name: 'Transfer BCA', value: 0, color: '#3b82f6' }
        ];`;
content = content.replace(oldRenderRegex, newRenderCode);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed AdminPanel chart');
