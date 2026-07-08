const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Fix getFullYear
content = content.replace(/today\.getFullYear-\$\{mm\}/g, 'today.getFullYear()}-${mm}');

// Fix the actual JSX error around line 2393
content = content.replace(/\{pay\.status === 'pending' \? \(\n\s*<div className="flex flex-wrap gap-1\.5 justify-center">\n\s*<button/g, "{pay.status === 'pending' ? (\n                                        <div className=\"flex flex-wrap gap-1.5 justify-center\">\n                                          <button");

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed JSX syntax error 2');
