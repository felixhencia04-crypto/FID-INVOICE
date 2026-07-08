const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldLogic = `    if (isSubscriptionExpired() && !isEditExisting && !isReceiptUpdate) {
      if (newInv.invoiceNumber.startsWith('KW-')) {
        setBlockedFeatureMessage('Pembuatan Kuitansi Baru');
      } else {
        setBlockedFeatureMessage('Pembuatan Invoice Baru');
      }
      return;
    }`;

const newLogic = `    if (isSubscriptionExpired() && !isEditExisting && !isReceiptUpdate) {
      if (newInv.invoiceNumber.startsWith('KW-')) {
        setBlockedFeatureMessage('Pembuatan Kuitansi Baru');
      } else {
        setBlockedFeatureMessage('Pembuatan Invoice Baru');
      }
      return;
    }
    
    // Enforce Starter invoice limits
    if (!isEditExisting && !isReceiptUpdate && currentUser.subscription.plan === 'starter' && invoices.length >= 5) {
      setBlockedFeatureMessage('Batas Pembuatan Invoice (Starter: Max 5)');
      return;
    }`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('src/App.tsx', content);
console.log('Fixed invoice limit logic');
