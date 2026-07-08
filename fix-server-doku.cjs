const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /async function syncTransactionWithDoku.*?return tx;\n\}/s;

const newFunc = `async function syncTransactionWithDoku(orderId: string, customPayload?: { userId?: string; userEmail?: string; fullName?: string }): Promise<TransactionRecord | null> {
  const payments = loadPayments();
  let tx = payments[orderId];
  if (!tx) return null;
  return tx;
}`;

if (regex.test(content)) {
  content = content.replace(regex, newFunc);
  fs.writeFileSync('server.ts', content);
  console.log('Fixed server.ts syncTransactionWithDoku');
} else {
  console.log('Failed to find syncTransactionWithDoku');
}
