import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

# Add a one-time sync from localStorage to Firestore for legacy chats
sync_logic = """  // Load support chat threads using Firestore onSnapshot
  useEffect(() => {
    // ONE-TIME SYNC: migrate local/legacy chats to Firestore if they exist
    try {
      const localThreads = JSON.parse(localStorage.getItem('fid_invoice_support_chats') || '[]');
      if (localThreads.length > 0) {
        localThreads.forEach(async (t: any) => {
          const id = t.userId || t.id;
          if (id) {
            await setDoc(doc(db, 'supportChats', id), t, { merge: true }).catch(() => {});
            
            // Also sync messages
            const msgs = JSON.parse(localStorage.getItem(`fid_invoice_chat_${id}`) || '[]');
            msgs.forEach(async (m: any) => {
              await setDoc(doc(db, 'supportChats', id, 'messages', m.id), m, { merge: true }).catch(() => {});
            });
          }
        });
      }
    } catch(e) {}

    const q = query(collection(db, 'supportChats'));"""

content = content.replace("  // Load support chat threads using Firestore onSnapshot\n  useEffect(() => {\n    const q = query(collection(db, 'supportChats'));", sync_logic)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
