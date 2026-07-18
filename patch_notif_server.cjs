const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

if (!serverCode.includes('/api/notifications')) {
  const notifEndpoints = `
// --- NOTIFICATIONS ENDPOINTS ---
const NOTIFICATIONS_FILE = path.join(process.cwd(), 'notifications-db.json');

function loadNotifications() {
  try {
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      return JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[Server Error] Failed to read notifications:', err);
  }
  return [];
}

function saveNotifications(data) {
  try {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[Server Error] Failed to write notifications:', err);
  }
}

app.get('/api/notifications', (req, res) => {
  const data = loadNotifications();
  return res.json({ success: true, notifications: data });
});

app.post('/api/notifications', (req, res) => {
  const { notifications } = req.body;
  
  if (Array.isArray(notifications)) {
    const serverNotifs = loadNotifications();
    const existingIds = new Set(serverNotifs.map(n => n.id));
    
    let updated = false;
    notifications.forEach(n => {
      const idx = serverNotifs.findIndex(sn => sn.id === n.id);
      if (idx > -1) {
        // Merge dismissedBy array
        const mergedDismissedBy = Array.from(new Set([...(serverNotifs[idx].dismissedBy || []), ...(n.dismissedBy || [])]));
        if (serverNotifs[idx].dismissedBy?.length !== mergedDismissedBy.length) {
          serverNotifs[idx].dismissedBy = mergedDismissedBy;
          updated = true;
        }
      } else {
        serverNotifs.push(n);
        updated = true;
      }
    });

    if (updated) {
      serverNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveNotifications(serverNotifs);
    }
    return res.json({ success: true, notifications: serverNotifs });
  }
  
  return res.status(400).json({ error: 'Invalid notifications data' });
});
`;

  serverCode = serverCode.replace('// --- CHAT ENDPOINTS ---', notifEndpoints + '\n// --- CHAT ENDPOINTS ---');
  fs.writeFileSync('server.ts', serverCode);
  console.log("Added notifications endpoints to server.ts");
} else {
  console.log("Notifications endpoints already exist.");
}
