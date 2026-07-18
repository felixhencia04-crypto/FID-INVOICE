import re
with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

# Replace loadChatThreads
load_threads_old = """  const loadChatThreads = () => {
    const threads = JSON.parse(localStorage.getItem('fid_invoice_support_chats') || '[]');
    setChatThreads(threads.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
  };"""

load_threads_new = """  const loadChatThreads = async () => {
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const threads = data.threads || [];
          localStorage.setItem('fid_invoice_support_chats', JSON.stringify(threads));
          setChatThreads(threads.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
          return;
        }
      }
    } catch (e) {}
    const threads = JSON.parse(localStorage.getItem('fid_invoice_support_chats') || '[]');
    setChatThreads(threads.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
  };"""

content = content.replace(load_threads_old, load_threads_new)

# Replace loadChatMessages
load_messages_old = """  const loadChatMessages = (threadId: string) => {
    const msgs = JSON.parse(localStorage.getItem(`fid_invoice_chat_${threadId}`) || '[]');
    setChatMessages(msgs);
  };"""

load_messages_new = """  const loadChatMessages = async (threadId: string) => {
    try {
      const res = await fetch(`/api/chats/${threadId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const msgs = data.messages || [];
          localStorage.setItem(`fid_invoice_chat_${threadId}`, JSON.stringify(msgs));
          setChatMessages(msgs);
          return;
        }
      }
    } catch(e) {}
    const msgs = JSON.parse(localStorage.getItem(`fid_invoice_chat_${threadId}`) || '[]');
    setChatMessages(msgs);
  };"""

content = content.replace(load_messages_old, load_messages_new)

# Replace sendMessage
send_message_old = """    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: 'admin',
      text: replyText,
      timestamp: new Date().toISOString()
    };

    const updatedMsgs = [...chatMessages, newMsg];
    setChatMessages(updatedMsgs);
    localStorage.setItem(`fid_invoice_chat_${selectedChatId}`, JSON.stringify(updatedMsgs));

    // Update thread meta
    const updatedThreads = chatThreads.map(t => {
      if (t.id === selectedChatId) {
        return {
          ...t,
          lastMessage: replyText,
          lastUpdated: newMsg.timestamp,
          unreadUser: true // Mark as unread for the user
        };
      }
      return t;
    });
    setChatThreads(updatedThreads);
    localStorage.setItem('fid_invoice_support_chats', JSON.stringify(updatedThreads));"""

send_message_new = """    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: 'admin',
      text: replyText,
      timestamp: new Date().toISOString()
    };

    const updatedMsgs = [...chatMessages, newMsg];
    setChatMessages(updatedMsgs);
    localStorage.setItem(`fid_invoice_chat_${selectedChatId}`, JSON.stringify(updatedMsgs));

    // Update thread meta
    const updatedThreads = chatThreads.map(t => {
      if (t.id === selectedChatId) {
        return {
          ...t,
          lastMessage: replyText,
          lastUpdated: newMsg.timestamp,
          unreadUser: true // Mark as unread for the user
        };
      }
      return t;
    });
    setChatThreads(updatedThreads);
    localStorage.setItem('fid_invoice_support_chats', JSON.stringify(updatedThreads));

    // Sync to server
    const targetThread = updatedThreads.find(t => t.id === selectedChatId);
    fetch(`/api/chats/${selectedChatId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMsg, threadMeta: targetThread })
    }).catch(e => console.error(e));"""

content = content.replace(send_message_old, send_message_new)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
