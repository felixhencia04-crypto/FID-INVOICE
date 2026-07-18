import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

import_old = "import { collection, doc, setDoc, query, updateDoc } from 'firebase/firestore';"
import_new = "import { collection, doc, getDocs, setDoc, onSnapshot, query, updateDoc } from 'firebase/firestore';"
content = content.replace(import_old, import_new)

fetch_old = """  // Load support chat threads
  const loadChatThreads = async () => {
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        if (data.threads) {
          localStorage.setItem('fid_invoice_support_chats', JSON.stringify(data.threads));
          setChatThreads(data.threads.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
        }
      }
    } catch (e) {}
  };

  const loadChatMessages = async (userId: string) => {
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

fetch_new = """  // Load support chat threads using Firestore onSnapshot
  useEffect(() => {
    const q = query(collection(db, 'supportChats'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threads = snapshot.docs.map(d => d.data());
      threads.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
      localStorage.setItem('fid_invoice_support_chats', JSON.stringify(threads));
      setChatThreads(threads);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedChatId) return;
    const q = query(collection(db, 'supportChats', selectedChatId, 'messages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => d.data());
      msgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);
      localStorage.setItem(`fid_invoice_chat_${selectedChatId}`, JSON.stringify(msgs));
      setChatMessages(msgs);
    });
    return () => unsubscribe();
  }, [selectedChatId]);

  const loadChatThreads = () => {};
  const loadChatMessages = (userId: string) => {};"""

content = content.replace(fetch_old, fetch_new)

# Also remove the sync call inside handleSendReply
sync_old = """    // Sync to backend server
    fetch('/api/chats/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threads: [threadMeta],
        messages: {
          [selectedChatId]: [newMsg]
        }
      })
    }).catch(err => console.error('Failed to sync chat to server:', err));"""

content = content.replace(sync_old, "")

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
