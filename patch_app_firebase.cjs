const fs = require('fs');
let s = fs.readFileSync('src/App.tsx', 'utf8');

s = s.replace(
  "import { AuthPage, LandingPage, QrisPaymentBox } from './components';",
  "import { AuthPage, LandingPage, QrisPaymentBox } from './components';\nimport { loadUserDataFromFirebase, saveUserDataToFirebase } from './lib/dataService';"
);

// We need to patch loadUserData to be async
s = s.replace(
  "const loadUserData = (userId: string) => {",
  "const loadUserData = async (userId: string) => {"
);

s = s.replace(
  /const key = `fid_invoice_user_\$\{userId\}_data`;\s*const savedData = localStorage\.getItem\(key\);\s*if \(savedData\) \{\s*const parsed = JSON\.parse\(savedData\);/g,
  `const parsed = await loadUserDataFromFirebase(userId);
    if (parsed) {`
);

s = s.replace(
  /const saveUserDataToStorage = \((.*?)\) => \{\s*const key = `fid_invoice_user_\$\{userId\}_data`;[\s\S]*?localStorage\.setItem\(key, JSON\.stringify\(dataToSave\)\);\s*\};/g,
  `const saveUserDataToStorage = ($1) => {
    const uniqueInvoices = updatedInvoices.filter((inv, idx, self) => self.findIndex(i => i.id === inv.id) === idx);
    const uniqueClients = updatedClients.filter((c, idx, self) => self.findIndex(i => i.id === c.id) === idx);
    const uniqueProducts = updatedProducts.filter((p, idx, self) => self.findIndex(i => i.id === p.id) === idx);
    const uniqueQuotations = (updatedQuotations || quotations).filter((q, idx, self) => self.findIndex(i => i.id === q.id) === idx);
    const dataToSave = {
      clients: uniqueClients,
      products: uniqueProducts,
      invoices: uniqueInvoices,
      quotations: uniqueQuotations
    };
    // Save to LocalStorage for offline fallback
    localStorage.setItem(\`fid_invoice_user_\${userId}_data\`, JSON.stringify(dataToSave));
    // Save to Firebase
    saveUserDataToFirebase(userId, dataToSave);
  };`
);

fs.writeFileSync('src/App.tsx', s);
