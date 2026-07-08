const crypto = require('crypto');
const CryptoJS = require('crypto-js');

const bodyStr = JSON.stringify({
  order: { amount: 10000, invoice_number: 'INV-123456789' },
  payment: { payment_due_date: 60 }
});

const nodeHash = crypto.createHash('sha256').update(bodyStr).digest('base64');
const cryptoJsHash = CryptoJS.enc.Base64.stringify(CryptoJS.SHA256(bodyStr));

console.log("Node:", nodeHash);
console.log("CryptoJS:", cryptoJsHash);

const CLIENT_ID = 'BRN-0229-1783394866076';
const SECRET_KEY = 'SK-c1pC2u9lDrwLpYdVz05v';
const targetPath = '/checkout/v1/payment';
const requestId = 'req-123';
const timestamp = '2020-01-01T00:00:00Z';
const digest = nodeHash;

const component = `Client-Id:${CLIENT_ID}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${targetPath}\nDigest:${digest}`;

const nodeHmac = crypto.createHmac('sha256', SECRET_KEY).update(component).digest('base64');
const cryptoJsHmac = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(component, SECRET_KEY));

console.log("Node HMAC:", nodeHmac);
console.log("CryptoJS HMAC:", cryptoJsHmac);
