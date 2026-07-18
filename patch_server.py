import sys
with open('server.ts', 'r') as f:
    content = f.read()

import re

# We will just replace the entire app.post('/api/chats/:id/message') block
pattern = r"app\.post\('/api/chats/:id/message', \(req, res\) => \{.*?(?=\n// --- ADMIN CONFIG ENDPOINTS ---)"

new_code = """app.post('/api/chats/:id/message', (req, res) => {
  const threadId = req.params.id;
  const { message, messages, threadMeta } = req.body;
  const data = loadChats();
  
  if (!data.messages[threadId]) {
    data.messages[threadId] = [];
  }
  
  if (messages && Array.isArray(messages)) {
    messages.forEach(msg => {
      if (!data.messages[threadId].some(m => m.id === msg.id)) {
        data.messages[threadId].push(msg);
      }
    });
  }
  
  if (message && !data.messages[threadId].some(m => m.id === message.id)) {
    data.messages[threadId].push(message);
  }
  
  // Sort messages
  data.messages[threadId].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);

  if (threadMeta) {
    const tIdx = data.threads.findIndex(t => (t.userId === threadId) || (t.id === threadId));
    if (tIdx > -1) {
      data.threads[tIdx] = { ...data.threads[tIdx], ...threadMeta, lastUpdated: new Date().toISOString() };
    } else {
      data.threads.push({ ...threadMeta, userId: threadId, lastUpdated: new Date().toISOString() });
    }
  }

  saveChats(data);
  return res.json({ success: true, messages: data.messages[threadId] });
});"""

new_content = re.sub(pattern, new_code, content, flags=re.DOTALL)
if new_content == content:
    print("Failed to patch server.ts!")
    sys.exit(1)

with open('server.ts', 'w') as f:
    f.write(new_content)
print("Successfully patched server.ts!")
