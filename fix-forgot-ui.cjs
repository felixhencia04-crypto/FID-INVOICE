const fs = require('fs');
let code = fs.readFileSync('src/components/AuthPage.tsx', 'utf8');

// Hide the simulated inbox text when Resend is configured for forgot password too, just to be safe
code = code.replace(/\{showForgotSimulator && \(/, '{showForgotSimulator && !hasResendConfigured() && (');

fs.writeFileSync('src/components/AuthPage.tsx', code);
