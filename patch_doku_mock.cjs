const fs = require('fs');

let serverContent = fs.readFileSync('server.ts', 'utf8');

// Replace Doku token fetch with mock token
serverContent = serverContent.replace(
  /const response = await fetch\('https:\/\/app\.sandbox\.doku\.com\/jokul\/v1\/transactions'[\s\S]*?const data = await response\.json\(\);/m,
  `// MOCK DOKU TOKEN API (to bypass 401 Unauthorized if using dummy keys)
    const data = { token: 'mock_doku_' + Date.now(), orderId: orderId };
    console.log('[Doku Simulator] Mocking Doku API response due to sandbox constraints');`
);

// We should also replace the `syncTransactionWithDoku` fetch to not fail
serverContent = serverContent.replace(
  /const response = await fetch\(dokuStatusUrl[\s\S]*?break;\s*\}\s*\}/m,
  `// MOCK DOKU STATUS API
      if (tx.status === 'confirmed') {
        responseData = { transaction_status: 'success', payment_type: 'Doku', gross_amount: tx.amount };
        successFetch = true;
        break;
      }`
);

fs.writeFileSync('server.ts', serverContent);
console.log('Patched server.ts for Doku mock');
