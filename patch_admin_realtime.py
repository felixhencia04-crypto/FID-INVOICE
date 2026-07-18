import re
with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

old_funcs = """  const loadChatThreads = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'supportChats'));
      const threads = querySnapshot.docs.map(d => d.data());
      localStorage.setItem('fid_invoice_support_chats', JSON.stringify(threads));
      setChatThreads(threads.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
    } catch (e) {}
  };

  // Load active support chat messages
  const loadChatMessages = async (userId: string) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'supportChats', userId, 'messages'));
      const msgs = querySnapshot.docs.map(d => d.data());
      msgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);
      localStorage.setItem(`fid_invoice_chat_${userId}`, JSON.stringify(msgs));
      setChatMessages(msgs);
    } catch(e) {}
  };"""

new_funcs = """  // Load support chat threads real-time
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

content = content.replace(old_funcs, new_funcs)

old_interval = """    const interval = setInterval(() => {
      loadUsers();
      loadPendingPayments();
      loadChatThreads();
      loadNotifications();
      if (selectedChatId) {
        loadChatMessages(selectedChatId);
      }
    }, 1500);"""

new_interval = """    const interval = setInterval(() => {
      loadUsers();
      loadPendingPayments();
      loadNotifications();
    }, 1500);"""

content = content.replace(old_interval, new_interval)

# We also need to fix where loadChatMessages was called on click
old_click = """                        onClick={() => {
                          const idToSelect = thread.userId || thread.id;
                          setSelectedChatId(idToSelect);
                          loadChatMessages(idToSelect);"""
new_click = """                        onClick={() => {
                          const idToSelect = thread.userId || thread.id;
                          setSelectedChatId(idToSelect);"""
content = content.replace(old_click, new_click)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
