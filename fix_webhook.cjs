const fs = require('fs');

let serverContent = fs.readFileSync('server.ts', 'utf8');

const webhookOld = `const { order_id, transaction_status, payment_type } = notification;`;
const webhookNew = `const order_id = notification.order?.invoice_number || notification.order_id;
    const transaction_status = notification.transaction?.status?.toLowerCase() === 'success' ? 'settlement' : notification.transaction_status;
    const payment_type = notification.transaction?.payment_type_identifier || notification.payment_type;`;

serverContent = serverContent.replace(webhookOld, webhookNew);
fs.writeFileSync('server.ts', serverContent);
console.log('Fixed Doku Webhook');
