import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

# Fix loadChatThreads
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

# Fix loadChatMessages
load_messages_old = """  const loadChatMessages = (userId: string) => {
    const messages = JSON.parse(localStorage.getItem('fid_invoice_chat_' + userId) || '[]');
    setChatMessages(messages);
  };"""

load_messages_new = """  const loadChatMessages = async (userId: string) => {
    try {
      const res = await fetch(`/api/chats/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const msgs = data.messages || [];
          localStorage.setItem(`fid_invoice_chat_${userId}`, JSON.stringify(msgs));
          setChatMessages(msgs);
          return;
        }
      }
    } catch(e) {}
    const messages = JSON.parse(localStorage.getItem('fid_invoice_chat_' + userId) || '[]');
    setChatMessages(messages);
  };"""

content = content.replace(load_messages_old, load_messages_new)


# Fix handleSendChatReply
send_reply_old = """    const indexStr = localStorage.getItem('fid_invoice_support_chats') || '[]';
    let indexList = JSON.parse(indexStr);
    const targetIdx = indexList.findIndex((item: any) => item.userId === selectedChatId);
    if (targetIdx > -1) {
      indexList[targetIdx] = {
        ...indexList[targetIdx],
        lastMessage: replyText,
        lastUpdated: new Date().toISOString(),
        unreadForOwner: false,
        unreadForUser: true
      };
      localStorage.setItem('fid_invoice_support_chats', JSON.stringify(indexList));
      setChatThreads(indexList.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
    }

    setReplyText('');"""

send_reply_new = """    const indexStr = localStorage.getItem('fid_invoice_support_chats') || '[]';
    let indexList = JSON.parse(indexStr);
    const targetIdx = indexList.findIndex((item: any) => item.userId === selectedChatId);
    let threadMeta = null;
    if (targetIdx > -1) {
      indexList[targetIdx] = {
        ...indexList[targetIdx],
        lastMessage: replyText,
        lastUpdated: new Date().toISOString(),
        unreadForOwner: false,
        unreadForUser: true
      };
      threadMeta = indexList[targetIdx];
      localStorage.setItem('fid_invoice_support_chats', JSON.stringify(indexList));
      setChatThreads(indexList.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
    }

    // Sync to server
    fetch(`/api/chats/${selectedChatId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMsg, threadMeta })
    }).catch(e => console.error(e));

    setReplyText('');"""

content = content.replace(send_reply_old, send_reply_new)


with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
