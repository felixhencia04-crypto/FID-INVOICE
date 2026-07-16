const fs = require('fs');
let content = fs.readFileSync('src/utils/emailService.ts', 'utf8');

content = content.replace(
  "async function dispatchEmail(payload: ResendEmailPayload): Promise<boolean> {\n  const { apiKey } = getResendConfig();",
  "async function dispatchEmail(payload: ResendEmailPayload): Promise<boolean> {\n  const { apiKey } = getResendConfig();\n  console.log('Dispatching email with API key prefix:', apiKey ? apiKey.substring(0, 6) + '...' : 'EMPTY');"
);

fs.writeFileSync('src/utils/emailService.ts', content);
