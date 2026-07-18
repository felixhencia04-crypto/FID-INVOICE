import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

# Replace fetch in handleSendChatReply
old_reply = re.search(r'// Sync to Server\s*fetch\(`/api/chats/\$\{selectedChatId\}/message`.*?\}\)\.catch\(e => console\.error\(e\)\);', content, re.DOTALL)
if old_reply:
    new_reply = """// Sync to Firestore
    if (threadMeta) {
      setDoc(doc(db, 'supportChats', selectedChatId), threadMeta).catch(() => {});
    }
    setDoc(doc(db, 'supportChats', selectedChatId, 'messages', newMsg.id), newMsg).catch(() => {});"""
    content = content.replace(old_reply.group(0), new_reply)
else:
    print("Could not find fetch for reply")

# Replace fetch in loadChatMessages
old_load = re.search(r'try \{\s*const res = await fetch\(`/api/chats/\$\{userId\}`\);.*?\} catch\(e\) \{\}', content, re.DOTALL)
if old_load:
    new_load = """try {
      const querySnapshot = await getDocs(collection(db, 'supportChats', userId, 'messages'));
      const msgs = querySnapshot.docs.map(d => d.data());
      msgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);
      localStorage.setItem(`fid_invoice_chat_${userId}`, JSON.stringify(msgs));
      setChatMessages(msgs);
    } catch(e) {}"""
    content = content.replace(old_load.group(0), new_load)
else:
    print("Could not find loadChatMessages fetch")

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
