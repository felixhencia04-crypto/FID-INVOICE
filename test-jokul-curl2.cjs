const crypto = require('crypto');
const axios = require('axios');

async function doIt() {
  const CLIENT_ID = 'BRN-1234';
  const SECRET_KEY = 'SK-c1pC2u9lDrwLpYdVz05v';

  const payload = {
    order: {
      amount: 10000,
      invoice_number: 'INV-123456789'
    },
    payment: {
      payment_due_date: 60
    }
  };

  const bodyStr = JSON.stringify(payload);
  const targetPath = '/checkout/v1/payment';
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString().slice(0, 19) + "Z";
  
  const digest = crypto.createHash('sha256').update(bodyStr).digest('base64');
  const component = `Client-Id:${CLIENT_ID}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${targetPath}\nDigest:${digest}`;
  const signature = 'HMACSHA256=' + crypto.createHmac('sha256', SECRET_KEY).update(component).digest('base64');

  try {
    const res = await axios.post('https://api-sandbox.doku.com' + targetPath, payload, {
      headers: {
        'Client-Id': CLIENT_ID,
        'Request-Id': requestId,
        'Request-Timestamp': timestamp,
        'Signature': signature
      }
    });
    console.log("SUCCESS:", res.data);
  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);
  }
}
doIt();
