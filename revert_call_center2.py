import re

with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

# Replace send user msg
old_str = """    // Sync to Firestore
    setDoc(doc(db, 'supportChats', userId), threadInfo).catch(e => console.error(e));
    setDoc(doc(db, 'supportChats', userId, 'messages', newMsg.id), newMsg).catch(e => console.error(e));"""

new_str = """    fetch(`/api/chats/${userId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMsgs, threadMeta: threadInfo })
    }).catch(e => console.error(e));"""

content = content.replace(old_str, new_str)

# Replace bot msg
old_bot = """      // Sync bot message to Firestore
      setDoc(doc(db, 'supportChats', userId), { ...threadInfo, unreadForOwner: false }).catch(e => console.error(e));
      setDoc(doc(db, 'supportChats', userId, 'messages', botMsg.id), botMsg).catch(e => console.error(e));"""

new_bot = """      // Sync bot message to Server
      fetch(`/api/chats/${userId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMsgs2,
          threadMeta: { ...threadInfo, unreadForOwner: false }
        })
      }).catch(e => console.error(e));"""

content = content.replace(old_bot, new_bot)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)
