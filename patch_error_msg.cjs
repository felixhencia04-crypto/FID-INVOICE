const fs = require('fs');
let s = fs.readFileSync('server.ts', 'utf8');

s = s.replace(
  "return res.status(400).json({ error: 'Missing required parameters. Make sure Resend API Key is set in Admin Panel.' });",
  "return res.status(400).json({ message: 'Sistem belum dikonfigurasi sepenuhnya. Pemilik aplikasi harus menambahkan RESEND_API_KEY di pengaturan Environment Variables AI Studio agar email dapat dikirim.' });"
);

fs.writeFileSync('server.ts', s);
