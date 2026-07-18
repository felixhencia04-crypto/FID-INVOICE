import re

with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

# Replace the first fetch for user message
old_send = re.search(r'fetch\(`/api/chats/\$\{userId\}/message`.*?\}\)\.catch\(e => console\.error\(e\)\);', content, re.DOTALL)
if old_send:
    new_send = """    // Sync to Firestore
    setDoc(doc(db, 'supportChats', userId), threadInfo).catch(e => console.error(e));
    setDoc(doc(db, 'supportChats', userId, 'messages', newMsg.id), newMsg).catch(e => console.error(e));"""
    content = content.replace(old_send.group(0), new_send)
else:
    print("Could not find first fetch")

# Replace the second fetch for bot message
old_bot = re.search(r'fetch\(`/api/chats/\$\{userId\}/message`.*?\}\)\.catch\(e => console\.error\(e\)\);', content, re.DOTALL)
if old_bot:
    new_bot = """      // Sync to Firestore
      setDoc(doc(db, 'supportChats', userId), { ...threadInfo, unreadForOwner: false }).catch(e => console.error(e));
      setDoc(doc(db, 'supportChats', userId, 'messages', botMsg.id), botMsg).catch(e => console.error(e));"""
    content = content.replace(old_bot.group(0), new_bot)
else:
    print("Could not find second fetch")

# Replace loadChatHistory fetch
old_load = re.search(r'const loadChatHistory = async \(\) => \{.*?const stored = localStorage\.getItem\(chatKey\);', content, re.DOTALL)
if old_load:
    new_load = """const loadChatHistory = async () => {
    const chatKey = 'fid_invoice_chat_' + userId;
    
    // Check Firestore first
    try {
      const querySnapshot = await getDocs(collection(db, 'supportChats', userId, 'messages'));
      if (!querySnapshot.empty) {
        const msgs = querySnapshot.docs.map(d => d.data() as ChatMessage);
        msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);
        localStorage.setItem(chatKey, JSON.stringify(msgs));
        setMessages(msgs);
        return;
      }
    } catch(e) {}

    const stored = localStorage.getItem(chatKey);"""
    content = content.replace(old_load.group(0), new_load)
else:
    print("Could not find load chat fetch")

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)
