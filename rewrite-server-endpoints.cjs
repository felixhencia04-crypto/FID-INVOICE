const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// I will just replace the whole section from line 473 down to line 600 (or whatever the end is)
// Wait, I can just use a regex to replace everything from `// Endpoint to fetch full payment history for a user` to `// Vite middleware for development`

const match = content.match(/\/\/ Endpoint to fetch full payment history for a user.*?(?=\/\/ Vite middleware for development)/s);
if (match) {
  const newEndpoints = `// Endpoint to fetch full payment history for a user
app.get('/api/doku/history/:userId', async (req, res) => {
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

`;
  
  content = content.replace(match[0], newEndpoints);
  fs.writeFileSync('server.ts', content);
  console.log('Successfully replaced endpoints');
} else {
  console.log('Could not find the target section');
}
