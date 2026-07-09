const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');
const proxyEndpoint = `app.post('/api/send-email', async (req, res) => {
  try {
    const { apiKey, from, to, subject, html } = req.body;
    if (!apiKey || !from || !to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${apiKey}\`,
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error: any) {
    console.error('[Server Error] Resend proxy failed:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

`;
// insert proxy endpoint before the Vite middleware setup if it exists, or just before app.listen
server = server.replace("app.listen(PORT", proxyEndpoint + "app.listen(PORT");
fs.writeFileSync('server.ts', server);

let adminPanel = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
adminPanel = adminPanel.replace(`const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${resendApiKey}\`,
        },
        body: JSON.stringify({
          from: senderEmail || 'onboarding@resend.dev',
          to: testEmailDest,
          subject: 'Verifikasi Koneksi API Resend (FID INVOICE)',
          html: \`
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #10b981;">Koneksi Berhasil! ✅</h2>
              <p style="font-size: 14px; line-height: 1.6;">Selamat, koneksi API Key Resend Anda pada aplikasi <strong>FID INVOICE</strong> telah berhasil terverifikasi dan siap digunakan untuk pengiriman email asli ke inbox pelanggan secara otomatis.</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 12px; color: #64748b;">
                <p style="margin: 0;"><strong>Detail Pengujian:</strong></p>
                <p style="margin: 5px 0 0 0;">
                  • Alamat Pengirim: \${senderEmail || 'onboarding@resend.dev'}<br/>
                  • Waktu Pengujian: \${new Date().toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          \`
        })
      });`, `const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: resendApiKey,
          from: senderEmail || 'onboarding@resend.dev',
          to: testEmailDest,
          subject: 'Verifikasi Koneksi API Resend (FID INVOICE)',
          html: \`
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #10b981;">Koneksi Berhasil! ✅</h2>
              <p style="font-size: 14px; line-height: 1.6;">Selamat, koneksi API Key Resend Anda pada aplikasi <strong>FID INVOICE</strong> telah berhasil terverifikasi dan siap digunakan untuk pengiriman email asli ke inbox pelanggan secara otomatis.</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 12px; color: #64748b;">
                <p style="margin: 0;"><strong>Detail Pengujian:</strong></p>
                <p style="margin: 5px 0 0 0;">
                  • Alamat Pengirim: \${senderEmail || 'onboarding@resend.dev'}<br/>
                  • Waktu Pengujian: \${new Date().toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          \`
        })
      });`);
fs.writeFileSync('src/components/AdminPanel.tsx', adminPanel);

let emailService = fs.readFileSync('src/utils/emailService.ts', 'utf8');
emailService = emailService.replace(`const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${apiKey}\`,
      },
      body: JSON.stringify({
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html
      })
    });`, `const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html
      })
    });`);
fs.writeFileSync('src/utils/emailService.ts', emailService);
console.log('Update successful');
