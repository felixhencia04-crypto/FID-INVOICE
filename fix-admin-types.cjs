const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Fix 1733: const bankTotals: Record<string, number> = {};
content = content.replace(/const bankTotals = \{\};/g, 'const bankTotals: Record<string, number> = {};');

// Fix colors mapping
content = content.replace(/const colors = \{/g, 'const colors: Record<string, string> = {');

// Fix 1750 value casting
content = content.replace(/value,/g, 'value: value as number,');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed AdminPanel types');
