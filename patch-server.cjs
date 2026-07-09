const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(`  app.post('/api/send-email', async (req, res) => {
  try {
    const { apiKey, from, to, subject, html } = req.body;
    if (!apiKey || !from || !to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const response = await fetch('https://api.resend.com/emails', {`, `  app.post('/api/send-email', async (req, res) => {
  try {
    const { apiKey, from, to, subject, html } = req.body;
    console.log('[Server] /api/send-email called with from:', from, 'to:', to);
    if (!apiKey || !from || !to || !subject || !html) {
      console.log('[Server] /api/send-email missing params');
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const response = await fetch('https://api.resend.com/emails', {`);

code = code.replace(`    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }`, `    const data = await response.json();
    console.log('[Server] Resend API responded with status:', response.status, 'data:', data);
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json(data);
    }`);

fs.writeFileSync('server.ts', code);
