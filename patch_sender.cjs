const fs = require('fs');

// Patch emailService.ts
let emailServiceContent = fs.readFileSync('src/utils/emailService.ts', 'utf8');
emailServiceContent = emailServiceContent.replace(
  "if (!sender) {",
  "if (!sender || sender === 'onboarding@resend.dev') {"
);
emailServiceContent = emailServiceContent.replace(
  "sender = 'onboarding@resend.dev';",
  "sender = 'noreply@fidinvoice.id';"
);
fs.writeFileSync('src/utils/emailService.ts', emailServiceContent);

// Patch AdminPanel.tsx
let adminPanelContent = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
adminPanelContent = adminPanelContent.replace(
  "const [senderEmail, setSenderEmail] = useState('onboarding@resend.dev');",
  "const [senderEmail, setSenderEmail] = useState('noreply@fidinvoice.id');"
);
adminPanelContent = adminPanelContent.replace(
  "from: senderEmail || 'onboarding@resend.dev',",
  "from: senderEmail || 'noreply@fidinvoice.id',"
);
adminPanelContent = adminPanelContent.replace(
  "• Alamat Pengirim: ${senderEmail || 'onboarding@resend.dev'}",
  "• Alamat Pengirim: ${senderEmail || 'noreply@fidinvoice.id'}"
);
fs.writeFileSync('src/components/AdminPanel.tsx', adminPanelContent);
