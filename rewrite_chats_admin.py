import re
with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

import_str = "import { UserProfile, AppNotification } from '../types';"
import_new = "import { UserProfile, AppNotification } from '../types';\nimport { db } from '../lib/firebase';\nimport { collection, doc, getDocs, setDoc, onSnapshot, query, updateDoc } from 'firebase/firestore';"
content = content.replace(import_str, import_new)

# loadChatThreads
thread_old = """  const loadChatThreads = async () => {
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
thread_new = """  const loadChatThreads = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'supportChats'));
      const threads = querySnapshot.docs.map(d => d.data());
      localStorage.setItem('fid_invoice_support_chats', JSON.stringify(threads));
      setChatThreads(threads.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
    } catch (e) {}
  };"""
content = content.replace(thread_old, thread_new)

# loadChatMessages
msg_old = """  const loadChatMessages = async (userId: string) => {
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
msg_new = """  const loadChatMessages = async (userId: string) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'supportChats', userId, 'messages'));
      const msgs = querySnapshot.docs.map(d => d.data());
      msgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);
      localStorage.setItem(`fid_invoice_chat_${userId}`, JSON.stringify(msgs));
      setChatMessages(msgs);
    } catch(e) {}
  };"""
content = content.replace(msg_old, msg_new)

# handleSendChatReply
send_old = """    // Sync to server
    fetch(`/api/chats/${selectedChatId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMsgs, threadMeta })
    }).catch(e => console.error(e));"""
send_new = """    // Sync to Firestore
    if (threadMeta) {
      setDoc(doc(db, 'supportChats', selectedChatId), threadMeta).catch(() => {});
    }
    setDoc(doc(db, 'supportChats', selectedChatId, 'messages', newMsg.id), newMsg).catch(() => {});"""
content = content.replace(send_old, send_new)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
