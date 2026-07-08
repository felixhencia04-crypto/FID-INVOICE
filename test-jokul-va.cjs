const dokuLib = require('jokul-nodejs-library');
const axios = require('axios');
const CryptoJS = require("crypto-js");

async function test() {
  const CLIENT_ID = 'BRN-0229-1783394866076';
  const SECRET_KEY = 'doku_key_sandbox_24ff9b6f0f854b83a3af7a41a4280b25';

  const payload = {
    order: {
      invoice_number: "INV-12345678",
      amount: 10000
    },
    virtual_account_info: {
      expired_time: 60,
      reusable_status: true,
      info1: "A",
      info2: "B",
      info3: "C"
    },
    customer: {
      name: "Tamu",
      email: "tamu@test.com"
    },
    additional_info: {
        integration: {
            name: "nodejs-library",
            version: "2.0.0"
        }
    }
  };

  const request_id = require('crypto').randomUUID();
  const request_timestamp = new Date().toISOString().slice(0, 19) + "Z";
  const api_target = '/doku-virtual-account/v2/payment-code';

  var bodySha256 = CryptoJS.enc.Base64.stringify(CryptoJS.SHA256(JSON.stringify(payload)));
  var signatureComponents =
      "Client-Id:" + CLIENT_ID + "\n"
      + "Request-Id:" + request_id + "\n"
      + "Request-Timestamp:" + request_timestamp + "\n"
      + "Request-Target:" + api_target + "\n"
      + "Digest:" + bodySha256;
  var signature = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(signatureComponents, SECRET_KEY));
  const hmac = 'HMACSHA256=' + signature;

  try {
    const res = await axios.post('https://api-sandbox.doku.com' + api_target, payload, {
        headers: {
            'Signature': hmac,
            'Request-Id': request_id,
            'Client-Id': CLIENT_ID,
            'Request-Timestamp': request_timestamp,
            'Request-Target': api_target
        }
    });
    console.log("SUCCESS", res.data);
  } catch(e) {
    console.log("ERROR", e.response ? e.response.data : e.message);
  }
}
test();
