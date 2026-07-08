const crypto = require('crypto');
const { execSync } = require('child_process');

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

const curlCmd = `curl -v -s -X POST https://api-sandbox.doku.com${targetPath} \\
-H "Client-Id: ${CLIENT_ID}" \\
-H "Request-Id: ${requestId}" \\
-H "Request-Timestamp: ${timestamp}" \\
-H "Signature: ${signature}" \\
-H "Content-Type: application/json" \\
-d '${bodyStr}'`;

console.log(curlCmd);
try {
  const output = execSync(curlCmd, { encoding: 'utf8' });
  console.log("SUCCESS:", output);
} catch (e) {
  console.log("FAILED:", e.stdout);
}
