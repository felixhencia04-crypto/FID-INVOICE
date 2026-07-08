const axios = require('axios');
const crypto = require('crypto');

const CLIENT_ID = 'BRN-0229-1783394866076';
const SECRET_KEY = 'SK-c1pC2u9lDrwLpYdVz05v';

const payload = {
  order: { amount: 10000, invoice_number: 'INV-' + Date.now() },
  payment: { payment_due_date: 60 }
};

const bodyStr = JSON.stringify(payload);
const targetPath = '/checkout/v1/payment';
const requestId = crypto.randomUUID();
const timestamp = new Date().toISOString().slice(0, 19) + "Z";

const digest = crypto.createHash('sha256').update(bodyStr).digest('base64');
const component = `Client-Id:${CLIENT_ID}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${targetPath}\nDigest:${digest}`;
const signature = 'HMACSHA256=' + crypto.createHmac('sha256', SECRET_KEY).update(component).digest('base64');

axios.post('https://api-sandbox.doku.com' + targetPath, bodyStr, {
    headers: {
        'Signature': signature,
        'Request-Id': requestId,
        'Client-Id': CLIENT_ID,
        'Request-Timestamp': timestamp,
        // no Request-Target header!
        'Content-Type': 'application/json'
    }
}).then(res => console.log("SUCCESS", res.data)).catch(err => console.log("ERROR", err.response?.data));
