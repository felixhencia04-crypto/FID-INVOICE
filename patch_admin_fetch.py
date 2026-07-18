import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

# Replace the onSnapshot effects for supportChats
old_effects = """  // Load support chat threads real-time
  useEffect(() => {
    const q = query(collection(db, 'supportChats'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threads = snapshot.docs.map(d => d.data());
      localStorage.setItem('fid_invoice_support_chats', JSON.stringify(threads));
      setChatThreads(threads.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
    });
    return () => unsubscribe();
  }, []);

  // Load active support chat messages real-time
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
  }, [selectedChatId]);"""

new_funcs = """  const loadChatThreads = async () => {
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

content = content.replace(old_effects, new_funcs)

old_interval = """    const interval = setInterval(() => {
      loadUsers();
      loadPendingPayments();
      loadNotifications();
    }, 1500);"""

new_interval = """    const interval = setInterval(() => {
      loadUsers();
      loadPendingPayments();
      loadChatThreads();
      loadNotifications();
      if (selectedChatId) {
        loadChatMessages(selectedChatId);
      }
    }, 1500);"""

content = content.replace(old_interval, new_interval)

old_click = """                        onClick={() => {
                          const idToSelect = thread.userId || thread.id;
                          setSelectedChatId(idToSelect);"""
new_click = """                        onClick={() => {
                          const idToSelect = thread.userId || thread.id;
                          setSelectedChatId(idToSelect);
                          loadChatMessages(idToSelect);"""
content = content.replace(old_click, new_click)

# Also fix handleSendChatReply
old_send = """    // Sync to Firestore
    if (threadMeta) {
      setDoc(doc(db, 'supportChats', selectedChatId), threadMeta).catch(() => {});
    }
    setDoc(doc(db, 'supportChats', selectedChatId, 'messages', newMsg.id), newMsg).catch(() => {});"""
    
new_send = """    // Sync to Server
    fetch(`/api/chats/${selectedChatId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: newMsg,
        threadMeta: threadMeta
      })
    }).catch(e => console.error(e));"""
    
content = content.replace(old_send, new_send)

# Replace updateDoc for unreadOwner
old_read = """                            localStorage.setItem('fid_invoice_support_chats', JSON.stringify(list));
                            updateDoc(doc(db, 'supportChats', idToSelect), { unreadForOwner: false }).catch(() => {});
                          }"""
new_read = """                            localStorage.setItem('fid_invoice_support_chats', JSON.stringify(list));
                            fetch('/api/chats/sync', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ threads: [list[idx]] })
                            }).catch(() => {});
                          }"""
content = content.replace(old_read, new_read)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
