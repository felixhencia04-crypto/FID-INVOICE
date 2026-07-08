const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  "  if (tx.status === 'applied') {\n    return tx;\n  }",
  "  if (tx.status === 'applied') {\n    return tx;\n  }\n\n  // Skip Doku API check for manual payments\n  if (tx.paymentType === 'Manual Transfer' || tx.paymentType === 'Simulasi Transfer / QRIS (Lunas)') {\n    return tx;\n  }"
);

fs.writeFileSync('server.ts', content);
console.log('patched');
