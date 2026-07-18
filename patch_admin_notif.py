import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

old_code = """    setDoc(doc(db, 'supportChats', selectedChatId, 'messages', newMsg.id), newMsg).catch(() => {});

    // Create persistent notification for the user
    createNotification(
      'info',
      'Pesan Baru dari Support',
      `Ada balasan baru dari Andi (Supervisor Customer Experience): "${replyText.length > 50 ? replyText.substring(0, 50) + '...' : replyText}"`,
      selectedChatId
    );

    setReplyText('');"""

new_code = """    setDoc(doc(db, 'supportChats', selectedChatId, 'messages', newMsg.id), newMsg).catch(() => {});

    setReplyText('');"""

content = content.replace(old_code, new_code)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
