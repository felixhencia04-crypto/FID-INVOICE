const fs = require('fs');

const files = [
  'server.ts',
  'src/App.tsx',
  'src/components/AdminPanel.tsx',
  'src/components/PaymentHistorySection.tsx',
  '.env.example'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replacements
  content = content.replace(/midtrans/g, 'doku');
  content = content.replace(/Midtrans/g, 'Doku');
  content = content.replace(/MIDTRANS/g, 'DOKU');
  
  fs.writeFileSync(file, content);
});
console.log('Replaced all occurrences of Midtrans with Doku');
