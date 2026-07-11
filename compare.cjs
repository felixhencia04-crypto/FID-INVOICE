const fs = require('fs');
const quote = fs.readFileSync('src/components/QuotationManagement.tsx', 'utf8');
const inv = fs.readFileSync('src/components/InvoicePreviewPdf.tsx', 'utf8');

const qMatch = quote.match(/let logoBase64 = sanitizeBase64[\s\S]*?const doc = new jsPDF/)[0];
const iMatch = inv.match(/let logoBase64 = sanitizeBase64[\s\S]*?let signatureBase64 =/)[0];

console.log("=== QUOTATION ===");
console.log(qMatch);
console.log("\n=== INVOICE ===");
console.log(iMatch);
