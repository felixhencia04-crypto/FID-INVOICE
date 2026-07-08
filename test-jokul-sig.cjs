const crypto = require('crypto');
const body = {
    "order": {
        "invoice_number": "INV-20210219082233",
        "amount": 150000
    },
    "payment": {
        "payment_due_date": 60
    }
};

const clientId = "Client-Id";
const requestId = "Request-Id";
const timestamp = "2021-02-19T08:22:33Z";
const requestTarget = "/checkout/v1/payment";
const secret = "Secret-Key";

const digest = crypto.createHash('sha256').update(JSON.stringify(body)).digest('base64');
const component = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;

console.log(component);
