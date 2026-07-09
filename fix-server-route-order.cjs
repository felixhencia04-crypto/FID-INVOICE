const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

const badRoute = `  app.post('/api/send-email', async (req, res) => {
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
});`;

server = server.replace(badRoute, "");

const insertPosition = `app.get('/api/doku/all-payments', async (req, res) => {`;
server = server.replace(insertPosition, badRoute + '\n\n' + insertPosition);

fs.writeFileSync('server.ts', server);
console.log('Fixed route order in server.ts');
