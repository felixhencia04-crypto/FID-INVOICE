import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

# Add storage listener to AdminPanel for chatThreads
old_use_effect_threads = """    const q = query(collection(db, 'supportChats'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threads = snapshot.docs.map(d => d.data());
      threads.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
      localStorage.setItem('fid_invoice_support_chats', JSON.stringify(threads));
      setChatThreads(threads);
    }, (error) => {
      console.warn('Chat threads snapshot error:', error);
    });
    return () => unsubscribe();
  }, []);"""

new_use_effect_threads = """    const q = query(collection(db, 'supportChats'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threads = snapshot.docs.map(d => d.data());
      threads.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
      localStorage.setItem('fid_invoice_support_chats', JSON.stringify(threads));
      setChatThreads(threads);
    }, (error) => {
      console.warn('Chat threads snapshot error:', error);
    });

    // Fallback: Listen to localStorage changes across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fid_invoice_support_chats' && e.newValue) {
        try {
          const threads = JSON.parse(e.newValue);
          threads.sort((a: any, b: any) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
          setChatThreads(threads);
        } catch(err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);"""

content = content.replace(old_use_effect_threads, new_use_effect_threads)

# Add storage listener for chatMessages
old_use_effect_msgs = """    const q = query(collection(db, 'supportChats', selectedChatId, 'messages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => d.data());
      msgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);
      localStorage.setItem(`fid_invoice_chat_${selectedChatId}`, JSON.stringify(msgs));
      setChatMessages(msgs);
    }, (error) => {
      console.warn('Chat messages snapshot error:', error);
    });
    return () => unsubscribe();
  }, [selectedChatId]);"""

new_use_effect_msgs = """    const q = query(collection(db, 'supportChats', selectedChatId, 'messages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => d.data());
      msgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);
      localStorage.setItem(`fid_invoice_chat_${selectedChatId}`, JSON.stringify(msgs));
      setChatMessages(msgs);
    }, (error) => {
      console.warn('Chat messages snapshot error:', error);
    });

    // Fallback: Listen to localStorage changes for this specific chat
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `fid_invoice_chat_${selectedChatId}` && e.newValue) {
        try {
          const msgs = JSON.parse(e.newValue);
          msgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);
          setChatMessages(msgs);
        } catch(err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [selectedChatId]);"""

content = content.replace(old_use_effect_msgs, new_use_effect_msgs)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)

