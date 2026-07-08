const fs = require('fs');

let serverContent = fs.readFileSync('server.ts', 'utf8');

const regexToReplace = /const authHeader[\s\S]*?if \(!successFetch \|\| !responseData\) \{/m;

const newStatusLogic = `
  const targetPath = \`/orders/v1/status/\${orderId}\`;
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString().slice(0, 19) + "Z";
  
  const component = \`Client-Id:\${CLIENT_ID}\\nRequest-Id:\${requestId}\\nRequest-Timestamp:\${timestamp}\\nRequest-Target:\${targetPath}\\nDigest:\`;
  const signature = 'HMACSHA256=' + crypto.createHmac('sha256', SECRET_KEY).update(component).digest('base64');

  let successFetch = false;
  let responseData = null;

  try {
    const response = await fetch('https://api-sandbox.doku.com' + targetPath, {
      method: 'GET',
      headers: {
        'Client-Id': CLIENT_ID,
        'Request-Id': requestId,
        'Request-Timestamp': timestamp,
        'Signature': signature
      }
    });

    if (response.ok) {
      const respJson = await response.json();
      
      // Map Doku's response to our unified format
      if (respJson && respJson.order) {
        responseData = {
           transaction_status: respJson.transaction?.status?.toLowerCase() === 'success' ? 'success' : 'pending',
           payment_type: respJson.transaction?.payment_type_identifier || 'Doku',
           gross_amount: respJson.order.amount
        };
        successFetch = true;
      }
    } else {
      console.log('[Doku Status] Error fetching status:', await response.text());
    }
  } catch (err) {
    console.log('[Doku Status] Network error:', err.message);
  }

  // Fallback for simulation: If the user used the 'Simulate Settle' endpoint, it might manually set it to confirmed
  if (!successFetch && tx.status === 'confirmed') {
    responseData = { transaction_status: 'success', payment_type: 'Doku', gross_amount: tx.amount };
    successFetch = true;
  }

  if (!successFetch || !responseData) {
`;

serverContent = serverContent.replace(regexToReplace, newStatusLogic);

fs.writeFileSync('server.ts', serverContent);
console.log('Fixed Doku status check');
