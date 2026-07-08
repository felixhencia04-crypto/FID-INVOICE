const crypto = require('crypto');

async function test(secretToUse) {
  const CLIENT_ID = 'BRN-0229-1783394866076';
  const SECRET_KEY = secretToUse;

  const orderId = `FID-STA-12345`;
  const amount = 50000;
  
  const dokuPayload = {
    order: {
      amount: Number(amount),
      invoice_number: orderId
    },
    payment: {
      payment_due_date: 60
    },
    customer: {
      id: 'guest',
      name: 'Pelanggan',
      email: 'customer@example.com'
    }
  };

  const targetPath = '/checkout/v1/payment';
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString().slice(0, 19) + "Z";
  const bodyString = JSON.stringify(dokuPayload);
  
  const digest = crypto.createHash('sha256').update(bodyString).digest('base64');
  const component = `Client-Id:${CLIENT_ID}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${targetPath}\nDigest:${digest}`;
  const signature = 'HMACSHA256=' + crypto.createHmac('sha256', SECRET_KEY).update(component).digest('base64');

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
  console.log(`With secret: ${secretToUse}`);
  console.log('Status:', response.status);
  console.log('Response:', responseText);
}
test('SK-c1pC2u9lDrwLpYdVz05v');
test('doku_key_sandbox_24ff9b6f0f854b83a3af7a41a4280b25');
