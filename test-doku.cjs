const crypto = require('crypto');
function generateDokuSignature(clientId, secretKey, requestId, timestamp, requestBody) {
  const digest = crypto.createHash('sha256').update(typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)).digest('base64');
  const component = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:/checkout/v1/payment\nDigest:${digest}`;
  const signature = 'HMACSHA256=' + crypto.createHmac('sha256', secretKey).update(component).digest('base64');
  return signature;
}
console.log(generateDokuSignature('client', 'secret', 'req', '2020-01-01T00:00:00Z', {}));
