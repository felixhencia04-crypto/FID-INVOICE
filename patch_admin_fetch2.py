import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

old_func = """  const loadChatMessages = async (userId: string) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'supportChats', userId, 'messages'));
      const msgs = querySnapshot.docs.map(d => d.data());
      msgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);
      localStorage.setItem(`fid_invoice_chat_${userId}`, JSON.stringify(msgs));
      setChatMessages(msgs);
    } catch(e) {}
  };"""

new_func = """  const loadChatMessages = async (userId: string) => {
    try {
      const res = await fetch(`/api/chats/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          data.messages.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);
          localStorage.setItem(`fid_invoice_chat_${userId}`, JSON.stringify(data.messages));
          setChatMessages(data.messages);
        }
      }
    } catch(e) {}
  };"""

content = content.replace(old_func, new_func)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
