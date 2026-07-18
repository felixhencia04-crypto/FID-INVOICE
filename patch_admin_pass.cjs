const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

if (!serverCode.includes('/api/admin/config')) {
  const configEndpoints = `
// --- ADMIN CONFIG ENDPOINTS ---
app.get('/api/admin/config', (req, res) => {
  try {
    let config = {};
    if (fs.existsSync(CONFIG_FILE)) {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
    return res.json({ success: true, config });
  } catch (err) {
    console.error('[Server Error] Failed to read config:', err);
    return res.status(500).json({ error: 'Failed to read config' });
  }
});

app.post('/api/admin/config', (req, res) => {
  try {
    let config = {};
    if (fs.existsSync(CONFIG_FILE)) {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
    const newConfig = { ...config, ...req.body };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    return res.json({ success: true });
  } catch (err) {
    console.error('[Server Error] Failed to save config:', err);
    return res.status(500).json({ error: 'Failed to save config' });
  }
});
`;
  serverCode = serverCode.replace('// --- USER DATABASE ENDPOINTS ---', configEndpoints + '\n// --- USER DATABASE ENDPOINTS ---');
  fs.writeFileSync('server.ts', serverCode);
  console.log("Added admin config endpoints to server.ts");
} else {
  console.log("Admin config endpoints already exist.");
}
