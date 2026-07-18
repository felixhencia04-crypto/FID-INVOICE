import re

with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

old_use_effect_msgs = """    const q = query(collection(db, 'supportChats', userId, 'messages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => d.data());
      msgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);
      localStorage.setItem(`fid_invoice_chat_${userId}`, JSON.stringify(msgs));
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    }, (error) => {
      console.warn('Chat error:', error);
    });

    return () => {
      unsubscribe();
      if (typeof threadUnsubscribe === 'function') threadUnsubscribe();
    };
  }, [isOpen, userId]);"""

new_use_effect_msgs = """    const q = query(collection(db, 'supportChats', userId, 'messages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => d.data());
      msgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);
      localStorage.setItem(`fid_invoice_chat_${userId}`, JSON.stringify(msgs));
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    }, (error) => {
      console.warn('Chat error:', error);
    });

    // Fallback: Listen to localStorage changes across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `fid_invoice_chat_${userId}` && e.newValue) {
        try {
          const msgs = JSON.parse(e.newValue);
          msgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);
          setMessages(msgs);
          setTimeout(scrollToBottom, 100);
        } catch(err) {}
      }
      
      // Update unread count if thread metadata changes
      if (e.key === 'fid_invoice_support_chats' && e.newValue) {
        try {
          const threads = JSON.parse(e.newValue);
          const myThread = threads.find((t: any) => t.userId === userId || t.id === userId);
          if (myThread && myThread.unreadForUser && !isOpen) {
            setUnreadCount(1);
          } else if (myThread && !myThread.unreadForUser) {
            setUnreadCount(0);
          }
        } catch(err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      if (typeof threadUnsubscribe === 'function') threadUnsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isOpen, userId]);"""

content = content.replace(old_use_effect_msgs, new_use_effect_msgs)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)

