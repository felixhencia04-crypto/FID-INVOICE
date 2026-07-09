const fs = require('fs');
let code = fs.readFileSync('src/components/AuthPage.tsx', 'utf8');

code = code.replace(/futureDate\.setDate\(futureDate\.getDate\(\) \+ 14\); \/\/ 14 days trial/g, 'futureDate.setDate(futureDate.getDate() + 3); // 3 days trial');
code = code.replace(/trialDaysRemaining: 14/g, 'trialDaysRemaining: 3');

fs.writeFileSync('src/components/AuthPage.tsx', code);
