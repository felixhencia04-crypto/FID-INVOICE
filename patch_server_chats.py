import re

with open('server.ts', 'r') as f:
    content = f.read()

# Fix in /api/chats/:id/message
old_msg = """  if (threadMeta) {
    const tIdx = data.threads.findIndex(t => t.id === threadId);
    if (tIdx > -1) {
      data.threads[tIdx] = { ...data.threads[tIdx], ...threadMeta, lastUpdated: message.timestamp };
    } else {
      data.threads.push({ ...threadMeta, id: threadId, lastUpdated: message.timestamp });
    }
  }"""

new_msg = """  if (threadMeta) {
    const tIdx = data.threads.findIndex(t => (t.userId === threadId) || (t.id === threadId));
    if (tIdx > -1) {
      data.threads[tIdx] = { ...data.threads[tIdx], ...threadMeta, lastUpdated: message.timestamp };
    } else {
      data.threads.push({ ...threadMeta, userId: threadId, lastUpdated: message.timestamp });
    }
  }"""

content = content.replace(old_msg, new_msg)

# Fix in /api/chats/sync
old_sync = """    threads.forEach(t => {
      const idx = data.threads.findIndex(dt => dt.id === t.id);
      if (idx > -1) {
        if (new Date(t.lastUpdated).getTime() > new Date(data.threads[idx].lastUpdated).getTime()) {
          data.threads[idx] = t;
        }
      } else {
        data.threads.push(t);
      }
    });"""

new_sync = """    threads.forEach(t => {
      const threadId = t.userId || t.id;
      const idx = data.threads.findIndex(dt => (dt.userId === threadId) || (dt.id === threadId));
      if (idx > -1) {
        if (new Date(t.lastUpdated).getTime() > new Date(data.threads[idx].lastUpdated).getTime()) {
          data.threads[idx] = t;
        }
      } else {
        data.threads.push(t);
      }
    });"""

content = content.replace(old_sync, new_sync)

with open('server.ts', 'w') as f:
    f.write(content)
