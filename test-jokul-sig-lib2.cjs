const dokuLib = require('jokul-nodejs-library');
const CryptoJS = require("crypto-js");

const CLIENT_ID = 'BRN-0229-1783394866076';
const SECRET_KEY = 'doku_key_sandbox_24ff9b6f0f854b83a3af7a41a4280b25';

const payload = {
  order: { amount: 10000, invoice_number: 'INV-' + Date.now() },
  payment: { payment_due_date: 60 }
};

const setupConfiguration = {
    client_id: CLIENT_ID,
    shared_key: SECRET_KEY,
    request_id: require('crypto').randomUUID(),
    request_timestamp: new Date().toISOString().slice(0, 19) + "Z",
    api_target: '/checkout/v1/payment'
};

var bodySha256 = CryptoJS.enc.Base64.stringify(CryptoJS.SHA256(JSON.stringify(payload)));
var signatureComponents =
    "Client-Id:" + setupConfiguration.client_id + "\n"
    + "Request-Id:" + setupConfiguration.request_id + "\n"
    + "Request-Timestamp:" + setupConfiguration.request_timestamp + "\n"
    + "Request-Target:" + setupConfiguration.api_target + "\n"
    + "Digest:" + bodySha256;
var signature = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(signatureComponents, setupConfiguration.shared_key));
const hmac = 'HMACSHA256=' + signature;

const axios = require('axios');
axios.post('https://api-sandbox.doku.com' + setupConfiguration.api_target, payload, {
    headers: {
        'Signature': hmac,
        'Request-Id': setupConfiguration.request_id,
        'Client-Id': setupConfiguration.client_id,
        'Request-Timestamp': setupConfiguration.request_timestamp,
        'Request-Target': setupConfiguration.api_target
    }
}).then(res => console.log("SUCCESS", res.data)).catch(err => console.log("ERROR", err.response.data));
