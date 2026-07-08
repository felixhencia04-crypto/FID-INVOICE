const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Endpoint to fetch full payment history for a user.*?\/\/ Start the server \(mounting Vite middleware in development\)/s;

const newEndpoints = `// Endpoint to fetch full payment history for a user
app.get('/api/payments/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const payments = loadPayments();
    const history = Object.values(payments)
      .filter((tx) => tx.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.json({ history });
  } catch (error) {
    console.error('[Server Error] Fetch history failed:', error);
    return res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

app.get('/api/doku/history/:userId', async (req, res) => {
  // Compatibility alias
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const payments = loadPayments();
    const history = Object.values(payments)
      .filter((tx) => tx.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.json({ history });
  } catch (error) {
    return res.status(500).json({ error: 'Failed' });
  }
});

// Endpoint to retrieve all transactions for application owner (admin panel)
app.get('/api/doku/all-payments', async (req, res) => {
  try {
    const payments = loadPayments();
    const allList = Object.values(payments).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return res.json({ success: true, payments: allList });
  } catch (error) {
    console.error('[Server Error] Fetch all payments failed:', error);
    return res.status(500).json({ error: 'Failed to retrieve all payments' });
  }
});

// Start the server (mounting Vite middleware in development)`;

if (regex.test(content)) {
  content = content.replace(regex, newEndpoints);
  fs.writeFileSync('server.ts', content);
  console.log('Fixed server.ts successfully using regex slice.');
} else {
  console.log('Regex did not match!');
}
