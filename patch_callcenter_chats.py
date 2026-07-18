import re
with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

# Replace loadMessages
load_old = """  const loadMessages = () => {
    if (!currentUser) return;
    const threadId = currentUser.id;
    const msgs = JSON.parse(localStorage.getItem(`fid_invoice_chat_${threadId}`) || '[]');
    setMessages(msgs);
  };"""

load_new = """  const loadMessages = async () => {
    if (!currentUser) return;
    const threadId = currentUser.id;
    try {
      const res = await fetch(`/api/chats/${threadId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const msgs = data.messages || [];
          localStorage.setItem(`fid_invoice_chat_${threadId}`, JSON.stringify(msgs));
          setMessages(msgs);
          return;
        }
      }
    } catch(e) {}
    const msgs = JSON.parse(localStorage.getItem(`fid_invoice_chat_${threadId}`) || '[]');
    setMessages(msgs);
  };"""
content = content.replace(load_old, load_new)

# Replace sendMessage
send_old = """    const updatedMsgs = [...messages, newMsg];
    setMessages(updatedMsgs);
    localStorage.setItem(`fid_invoice_chat_${threadId}`, JSON.stringify(updatedMsgs));

    // Update global threads for admin
    const allThreads = JSON.parse(localStorage.getItem('fid_invoice_support_chats') || '[]');
    const existingThreadIdx = allThreads.findIndex((t: any) => t.id === threadId);
    
    if (existingThreadIdx > -1) {
      allThreads[existingThreadIdx].lastMessage = text;
      allThreads[existingThreadIdx].lastUpdated = newMsg.timestamp;
      allThreads[existingThreadIdx].unreadAdmin = true;
    } else {
      allThreads.push({
        id: threadId,
        userName: currentUser.name,
        userEmail: currentUser.email,
        lastMessage: text,
        lastUpdated: newMsg.timestamp,
        unreadAdmin: true
      });
    }
    
    localStorage.setItem('fid_invoice_support_chats', JSON.stringify(allThreads));"""

send_new = """    const updatedMsgs = [...messages, newMsg];
    setMessages(updatedMsgs);
    localStorage.setItem(`fid_invoice_chat_${threadId}`, JSON.stringify(updatedMsgs));

    // Update global threads for admin
    const allThreads = JSON.parse(localStorage.getItem('fid_invoice_support_chats') || '[]');
    const existingThreadIdx = allThreads.findIndex((t: any) => t.id === threadId);
    
    let threadMeta;
    if (existingThreadIdx > -1) {
      allThreads[existingThreadIdx].lastMessage = text;
      allThreads[existingThreadIdx].lastUpdated = newMsg.timestamp;
      allThreads[existingThreadIdx].unreadAdmin = true;
      threadMeta = allThreads[existingThreadIdx];
    } else {
      threadMeta = {
        id: threadId,
        userName: currentUser.name,
        userEmail: currentUser.email,
        lastMessage: text,
        lastUpdated: newMsg.timestamp,
        unreadAdmin: true
      };
      allThreads.push(threadMeta);
    }
    
    localStorage.setItem('fid_invoice_support_chats', JSON.stringify(allThreads));
    
    // Sync to server
    fetch(`/api/chats/${threadId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMsg, threadMeta })
    }).catch(e => console.error(e));"""

content = content.replace(send_old, send_new)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)
