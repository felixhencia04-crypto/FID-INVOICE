const fs = require('fs');

let serverContent = fs.readFileSync('server.ts', 'utf8');

const manualPaymentEndpoint = `
app.post('/api/payment/manual', async (req, res) => {
  try {
    const { amount, planName, userId, userEmail, fullName, isYearly } = req.body;

    if (!amount || !planName) {
      return res.status(400).json({ error: 'Amount and Plan Name are required' });
    }

    const orderId = \`FID-\${planName.toUpperCase().substring(0, 3)}-\${Date.now()}\`;

    console.log(\`[Manual Payment] Creating pending manual order: \${orderId}, Amount: \${amount}\`);

    // Persist pending transaction on server
    const payments = loadPayments();
    payments[orderId] = {
      orderId,
      userId: userId || 'guest',
      userEmail: userEmail || 'customer@example.com',
      fullName: fullName || 'Pelanggan',
      planName: planName,
      amount: Number(amount),
      isYearly: !!isYearly || planName.toLowerCase().includes('yearly'),
      status: 'pending',
      timestamp: new Date().toISOString(),
      paymentType: 'Manual Transfer'
    };
    savePayments(payments);

    res.json({ orderId });
  } catch (err) {
    console.error('[Server Error] Manual payment generation failed:', err);
    res.status(500).json({ error: 'Failed to generate manual payment order', details: err.message });
  }
});
`;

// Insert the new endpoint right before // Endpoint to generate Doku Jokul Transaction Token
serverContent = serverContent.replace('// Endpoint to generate Doku Jokul Transaction Token', manualPaymentEndpoint + '\n// Endpoint to generate Doku Jokul Transaction Token');

fs.writeFileSync('server.ts', serverContent);
console.log('Added manual payment endpoint');
