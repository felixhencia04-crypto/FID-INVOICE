const fs = require('fs');

let content = fs.readFileSync('src/utils/emailService.ts', 'utf8');

// Add apiKey to interface
content = content.replace(
  "export interface ResendEmailPayload {\n  from: string;\n  to: string;\n  subject: string;\n  html: string;\n}",
  "export interface ResendEmailPayload {\n  from: string;\n  to: string;\n  subject: string;\n  html: string;\n  apiKey?: string;\n}"
);

// Update dispatchEmail
content = content.replace(
  "async function dispatchEmail(payload: ResendEmailPayload): Promise<boolean> {\n  // We no longer require the client to provide the API key.\n  // The server will use its globally saved config.\n  try {",
  "async function dispatchEmail(payload: ResendEmailPayload): Promise<boolean> {\n  const { apiKey } = getResendConfig();\n  try {"
);

content = content.replace(
  "body: JSON.stringify(payload),",
  "body: JSON.stringify({ ...payload, apiKey }),"
);

fs.writeFileSync('src/utils/emailService.ts', content);
