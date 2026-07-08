const fs = require('fs');

let serverContent = fs.readFileSync('server.ts', 'utf8');

// 1. Update ENV keys
serverContent = serverContent.replace(
  /const MERCHANT_ID = process\.env\.DOKU_MERCHANT_ID \|\| '.*?';/g,
  "const CLIENT_ID = process.env.DOKU_CLIENT_ID || 'BRN-0229-1783394866076';"
);
serverContent = serverContent.replace(
  /const SERVER_KEY = process\.env\.DOKU_SERVER_KEY \|\| '.*?';/g,
  "const SECRET_KEY = process.env.DOKU_SECRET_KEY || 'SK-c1pC2u9lDrwLpYdVz05v';"
);

// 2. Add crypto import at top if not exists
if (!serverContent.includes('import crypto')) {
  serverContent = "import crypto from 'crypto';\n" + serverContent;
}

// 3. Rewrite /api/doku/token
const newDokuToken = `
app.post('/api/doku/token', async (req, res) => {
  try {
    const { amount, planName, userId, userEmail, fullName, isYearly } = req.body;

    if (!amount || !planName) {
      return res.status(400).json({ error: 'Amount and Plan Name are required' });
    }

    const orderId = \`FID-\${planName.toUpperCase().substring(0, 3)}-\${Date.now()}\`;
    
    const dokuPayload = {
      order: {
        amount: Number(amount),
        invoice_number: orderId
      },
      payment: {
        payment_due_date: 60
      },
      customer: {
        id: userId || 'guest',
        name: fullName || 'Pelanggan',
        email: userEmail || 'customer@example.com'
      }
    };

    const targetPath = '/checkout/v1/payment';
    const requestId = crypto.randomUUID();
    const timestamp = new Date().toISOString().slice(0, 19) + "Z";
    const bodyString = JSON.stringify(dokuPayload);
    
    const digest = crypto.createHash('sha256').update(bodyString).digest('base64');
    const component = \`Client-Id:\${CLIENT_ID}\\nRequest-Id:\${requestId}\\nRequest-Timestamp:\${timestamp}\\nRequest-Target:\${targetPath}\\nDigest:\${digest}\`;
    const signature = 'HMACSHA256=' + crypto.createHmac('sha256', SECRET_KEY).update(component).digest('base64');

    console.log(\`[Doku] Creating checkout for Order: \${orderId}, Amount: \${amount}\`);
    
    const response = await fetch('https://api-sandbox.doku.com' + targetPath, {
      method: 'POST',
      headers: {
        'Client-Id': CLIENT_ID,
        'Request-Id': requestId,
        'Request-Timestamp': timestamp,
        'Signature': signature,
        'Content-Type': 'application/json'
      },
      body: bodyString
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(\`[Doku Error] Status \${response.status}:\`, responseText);
      return res.status(500).json({ error: 'Failed to create transaction with Doku', details: responseText });
    }

    const data = JSON.parse(responseText);
    const paymentUrl = data.response?.payment?.url;

    if (!paymentUrl) {
      return res.status(500).json({ error: 'Failed to parse Doku payment URL', details: data });
    }

    console.log(\`[Doku Success] Checkout URL created: \${paymentUrl}\`);

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
      timestamp: new Date().toISOString()
    };
    savePayments(payments);

    res.json({ paymentUrl, orderId });
  } catch (err) {
    console.error('[Server Error] Doku checkout generation failed:', err);
    res.status(500).json({ error: 'Failed to generate Doku checkout URL', details: err.message });
  }
});
`;

serverContent = serverContent.replace(/app\.post\('\/api\/doku\/token', async \(req, res\) => {[\s\S]*?res\.status\(500\)\.json\({ error: 'Failed to generate Doku Jokul transaction token', details: err\.message \|\| String\(err\) }\);\s*\}\s*}\);/m, newDokuToken);
// Wait, my previous regex might not match exactly.
// Let's replace by splitting.

fs.writeFileSync('server.ts.new', serverContent);
