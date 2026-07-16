const fs = require('fs');
let s = fs.readFileSync('server.ts', 'utf8');

s = s.replace(
  "if (error) {\n      console.error('[Server] Resend SDK Error:', error);\n      return res.status(400).json(error);\n    }",
  "if (error) {\n      console.error('[Server] Resend SDK Error:', error);\n      if (error.message === 'API key is invalid') {\n        return res.status(400).json({ message: 'API Key Resend tidak valid atau salah. Pastikan Anda menyalin key yang benar dari dashboard Resend (dimulai dengan re_).' });\n      }\n      return res.status(400).json(error);\n    }"
);

fs.writeFileSync('server.ts', s);
