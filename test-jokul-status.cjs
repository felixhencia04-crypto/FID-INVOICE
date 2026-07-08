const axios = require('axios');
const crypto = require('crypto');

const CLIENT_ID = 'BRN-0229-1783394866076';
const SECRET_KEY = 'SK-c1pC2u9lDrwLpYdVz05v';

async function testStatusSignature(desc, getComponentStr) {
  const targetPath = '/orders/v1/status/FID-STA-1783397678392';
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString().slice(0, 19) + "Z";

  const component = getComponentStr(CLIENT_ID, requestId, timestamp, targetPath);
  const signature = 'HMACSHA256=' + crypto.createHmac('sha256', SECRET_KEY).update(component).digest('base64');

  try {
    const res = await axios.get('https://api-sandbox.doku.com' + targetPath, {
        headers: {
            'Signature': signature,
            'Request-Id': requestId,
            'Client-Id': CLIENT_ID,
            'Request-Timestamp': timestamp
        }
    });
    console.log(desc, "SUCCESS", res.status);
  } catch(err) {
    console.log(desc, "ERROR", err.response?.data?.error?.message || err.message);
  }
}

async function run() {
  await testStatusSignature('1. With empty Digest:', (c, r, t, p) => `Client-Id:${c}\nRequest-Id:${r}\nRequest-Timestamp:${t}\nRequest-Target:${p}\nDigest:`);
  await testStatusSignature('2. Without Digest:', (c, r, t, p) => `Client-Id:${c}\nRequest-Id:${r}\nRequest-Timestamp:${t}\nRequest-Target:${p}`);
  
  const emptyHash = crypto.createHash('sha256').update('').digest('base64');
  await testStatusSignature('3. With empty string Hash:', (c, r, t, p) => `Client-Id:${c}\nRequest-Id:${r}\nRequest-Timestamp:${t}\nRequest-Target:${p}\nDigest:${emptyHash}`);
}
run();
