const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldApprove = `app.post('/api/doku/admin-approve', (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const payments = loadPayments();
    if (payments[orderId]) {
      payments[orderId].status = 'applied';
      savePayments(payments);
      console.log(\`[Admin Server ACC] Transaction \${orderId} manually approved by Admin.\`);
      return res.json({ success: true, transaction: payments[orderId] });
    }

    return res.status(404).json({ error: 'Transaction not found' });
  } catch (error: any) {
    console.error('[Server Error] Admin approve failed:', error);
    return res.status(500).json({ error: 'Failed to approve transaction' });
  }
});`;

const newApprove = `app.post('/api/doku/admin-approve', (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const payments = loadPayments();
    const tx = payments[orderId];
    if (tx) {
      tx.status = 'confirmed';
      applySubscriptionOnServer(tx);
      savePayments(payments);
      console.log(\`[Admin Server ACC] Transaction \${orderId} manually approved and applied by Admin.\`);
      return res.json({ success: true, transaction: tx });
    }

    return res.status(404).json({ error: 'Transaction not found' });
  } catch (error: any) {
    console.error('[Server Error] Admin approve failed:', error);
    return res.status(500).json({ error: 'Failed to approve transaction' });
  }
});`;

if (content.includes(oldApprove)) {
  content = content.replace(oldApprove, newApprove);
  fs.writeFileSync('server.ts', content);
  console.log('Fixed admin-approve');
} else {
  console.log('Could not find exact block, will replace manually');
}
