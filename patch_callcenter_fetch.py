import re

with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

old_fetch_1 = """        fetch(`/api/chats/${userId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMsgs, threadMeta: threadInfo })
    }).catch(e => console.error(e));"""

new_fetch_1 = """    setDoc(doc(db, 'supportChats', userId), threadInfo).catch(e => console.error(e));
    setDoc(doc(db, 'supportChats', userId, 'messages', newMsg.id), newMsg).catch(e => console.error(e));"""

content = content.replace(old_fetch_1, new_fetch_1)

old_fetch_2 = """      // Sync bot message to Server
      fetch(`/api/chats/${userId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: botMsg,
          threadMeta: { ...threadInfo, unreadForOwner: false }
        })
      }).catch(e => console.error(e));"""

new_fetch_2 = """      // Sync bot message to Firestore
      setDoc(doc(db, 'supportChats', userId), { ...threadInfo, unreadForOwner: false }).catch(e => console.error(e));
      setDoc(doc(db, 'supportChats', userId, 'messages', botMsg.id), botMsg).catch(e => console.error(e));"""

content = content.replace(old_fetch_2, new_fetch_2)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)

