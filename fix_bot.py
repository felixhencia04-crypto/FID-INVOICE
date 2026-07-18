import re
with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

old_bot = """      // Sync bot message to Server
            // Sync to Firestore
      setDoc(doc(db, 'supportChats', userId), { ...threadInfo, unreadForOwner: false }).catch(e => console.error(e));
      setDoc(doc(db, 'supportChats', userId, 'messages', botMsg.id), botMsg).catch(e => console.error(e));"""

new_bot = """      // Sync bot message to Server
      fetch(`/api/chats/${userId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: botMsg,
          threadMeta: { ...threadInfo, unreadForOwner: false }
        })
      }).catch(e => console.error(e));"""

content = content.replace(old_bot, new_bot)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)
