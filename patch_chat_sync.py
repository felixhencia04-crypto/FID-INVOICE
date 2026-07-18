import re

# Update CallCenterChat.tsx
with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

send_old = """    fetch(`/api/chats/${userId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMsg, threadMeta: threadInfo })
    }).catch(e => console.error(e));"""

send_new = """    fetch(`/api/chats/${userId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMsgs, threadMeta: threadInfo })
    }).catch(e => console.error(e));"""

content = content.replace(send_old, send_new)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)

# Update AdminPanel.tsx
with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

admin_old = """    // Sync to server
    fetch(`/api/chats/${selectedChatId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMsg, threadMeta })
    }).catch(e => console.error(e));"""

admin_new = """    // Sync to server
    fetch(`/api/chats/${selectedChatId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMsgs, threadMeta })
    }).catch(e => console.error(e));"""

content = content.replace(admin_old, admin_new)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
