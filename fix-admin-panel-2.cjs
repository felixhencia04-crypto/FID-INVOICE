const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// The block starts around line 2224. Let's use a regex to match it and remove it.
const blockRegex = /\{\/\* Import \/ Check Ad-hoc Transfer Manual Transaction Tool \*\/\}.*?<\/div>\n\n/gs;
content = content.replace(blockRegex, '');

// Also remove the "Cek Transfer Manual" button in the table
const btnRegex = /\{\/\* Detect if it is a Transfer Manual payment \*\/\}.*?<\/button>\n.*?\}\)/gs;
content = content.replace(btnRegex, '');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Fixed AdminPanel UI components');
