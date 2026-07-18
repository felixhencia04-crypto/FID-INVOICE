import re

with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

# Remove the localStorage 'fid_invoice_support_chats' check from CallCenterChat
old_load = """      if (!isOpen) {
        const threadStr = localStorage.getItem('fid_invoice_support_chats') || '[]';
        const threads = JSON.parse(threadStr);
        const myThread = threads.find((t: any) => (t.userId === userId) || (t.id === userId));
        if (myThread && myThread.unreadForUser) {
          setUnreadCount(1);
        }
      }"""
content = content.replace(old_load, "")

# Add an onSnapshot for the thread document to listen to `unreadForUser`
old_snapshot_start = "    const q = query(collection(db, 'supportChats', userId, 'messages'));"
new_snapshot_start = """    // Listen to thread metadata for unreadForUser badge
    const threadUnsubscribe = onSnapshot(doc(db, 'supportChats', userId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.unreadForUser && !isOpen) {
          setUnreadCount(1);
        } else if (!data.unreadForUser) {
          setUnreadCount(0);
        }
      }
    }, (error) => {});

    const q = query(collection(db, 'supportChats', userId, 'messages'));"""
content = content.replace(old_snapshot_start, new_snapshot_start)

# Update cleanup for threadUnsubscribe
old_cleanup = "    return () => unsubscribe();"
new_cleanup = "    return () => {\n      unsubscribe();\n      if (typeof threadUnsubscribe === 'function') threadUnsubscribe();\n    };"
content = content.replace(old_cleanup, new_cleanup)

# When user opens the chat, set unreadForUser to false in Firestore
old_open = """  const handleOpenChat = () => {
    setIsOpen(true);
    setUnreadCount(0);"""
new_open = """  const handleOpenChat = () => {
    setIsOpen(true);
    setUnreadCount(0);
    // Mark as read in Firestore
    setDoc(doc(db, 'supportChats', userId), { unreadForUser: false }, { merge: true }).catch(() => {});"""
content = content.replace(old_open, new_open)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)

