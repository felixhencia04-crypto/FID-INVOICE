const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

if (!serverCode.includes('/api/chats')) {
  const chatEndpoints = `
// --- CHAT ENDPOINTS ---
const CHATS_FILE = path.join(process.cwd(), 'chats-db.json');

function loadChats() {
  try {
    if (fs.existsSync(CHATS_FILE)) {
      return JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[Server Error] Failed to read chats:', err);
  }
  return { threads: [], messages: {} };
}

function saveChats(data) {
  try {
    fs.writeFileSync(CHATS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[Server Error] Failed to write chats:', err);
  }
}

app.get('/api/chats', (req, res) => {
  const data = loadChats();
  return res.json({ success: true, threads: data.threads });
});

app.get('/api/chats/:id', (req, res) => {
  const data = loadChats();
  const threadId = req.params.id;
  return res.json({ success: true, messages: data.messages[threadId] || [] });
});

app.post('/api/chats/sync', (req, res) => {
  const { threads, messages } = req.body;
  const data = loadChats();
  
  // Merge threads
  if (threads && Array.isArray(threads)) {
    threads.forEach(t => {
      const idx = data.threads.findIndex(dt => dt.id === t.id);
      if (idx > -1) {
        if (new Date(t.lastUpdated).getTime() > new Date(data.threads[idx].lastUpdated).getTime()) {
          data.threads[idx] = t;
        }
      } else {
        data.threads.push(t);
      }
    });
  }

  // Merge messages
  if (messages && typeof messages === 'object') {
    Object.keys(messages).forEach(threadId => {
      if (!data.messages[threadId]) {
        data.messages[threadId] = messages[threadId];
      } else {
        // Append new messages
        const existingIds = new Set(data.messages[threadId].map(m => m.id));
        messages[threadId].forEach(m => {
          if (!existingIds.has(m.id)) {
            data.messages[threadId].push(m);
          }
        });
        // Sort by timestamp
        data.messages[threadId].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }
    });
  }

  saveChats(data);
  return res.json({ success: true, threads: data.threads, messages: data.messages });
});

// Post a single message
app.post('/api/chats/:id/message', (req, res) => {
  const threadId = req.params.id;
  const { message, threadMeta } = req.body;
  const data = loadChats();
  
  if (!data.messages[threadId]) {
    data.messages[threadId] = [];
  }
  
  // Prevent duplicate
  if (!data.messages[threadId].some(m => m.id === message.id)) {
    data.messages[threadId].push(message);
  }
  
  // Update thread meta if provided
  if (threadMeta) {
    const tIdx = data.threads.findIndex(t => t.id === threadId);
    if (tIdx > -1) {
      data.threads[tIdx] = { ...data.threads[tIdx], ...threadMeta, lastUpdated: message.timestamp };
    } else {
      data.threads.push({ ...threadMeta, id: threadId, lastUpdated: message.timestamp });
    }
  }

  saveChats(data);
  return res.json({ success: true });
});
`;

  serverCode = serverCode.replace('// --- ADMIN CONFIG ENDPOINTS ---', chatEndpoints + '\n// --- ADMIN CONFIG ENDPOINTS ---');
  fs.writeFileSync('server.ts', serverCode);
  console.log("Added chat endpoints to server.ts");
} else {
  console.log("Chat endpoints already exist.");
}
