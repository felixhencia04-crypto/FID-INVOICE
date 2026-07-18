import re

with open('server.ts', 'r') as f:
    content = f.read()

old_msg = """// Post a single message
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
  
  if (threadMeta) {
    const tIdx = data.threads.findIndex(t => (t.userId === threadId) || (t.id === threadId));
    if (tIdx > -1) {
      data.threads[tIdx] = { ...data.threads[tIdx], ...threadMeta, lastUpdated: message.timestamp };
    } else {
      data.threads.push({ ...threadMeta, userId: threadId, lastUpdated: message.timestamp });
    }
  }

  saveChats(data);
  return res.json({ success: true });
});"""

new_msg = """// Post messages
app.post('/api/chats/:id/message', (req, res) => {
  const threadId = req.params.id;
  const { message, messages, threadMeta } = req.body;
  const data = loadChats();
  
  if (!data.messages[threadId]) {
    data.messages[threadId] = [];
  }
  
  // Handle multiple messages
  if (messages && Array.isArray(messages)) {
    messages.forEach(msg => {
      if (!data.messages[threadId].some(m => m.id === msg.id)) {
        data.messages[threadId].push(msg);
      }
    });
  }
  
  // Handle single message
  if (message && !data.messages[threadId].some(m => m.id === message.id)) {
    data.messages[threadId].push(message);
  }
  
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

content = content.replace(old_msg, new_msg)

with open('server.ts', 'w') as f:
    f.write(content)
