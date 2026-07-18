import re
with open('src/components/NotificationCenter.tsx', 'r') as f:
    content = f.read()

# I will replace `saveNotifications(updated)` with Firestore call.
# Actually let's just make it call `setDoc(doc(db, 'notifications', n.id), n)` or similar.
# It's better if we just import db and doc, updateDoc, arrayUnion from firestore in NotificationCenter.tsx.

import_str = "import { getNotifications, saveNotifications, syncNotifications } from '../utils/notificationService';"
import_new = "import { getNotifications, saveNotifications, syncNotifications } from '../utils/notificationService';\nimport { db } from '../lib/firebase';\nimport { doc, updateDoc, arrayUnion } from 'firebase/firestore';"
content = content.replace(import_str, import_new)

# Let's find handleMarkAllRead
old_mark_all = """  const handleMarkAllRead = async () => {
    if (!currentUser) return;

    const all = getNotifications();
    let changed = false;
    const updated = all.map(n => {
      const matchesTarget = n.targetUserId === 'all' || n.targetUserId === currentUser.id;
      if (matchesTarget && !n.dismissedBy.includes(currentUser.id)) {
        changed = true;
        return {
          ...n,
          dismissedBy: [...n.dismissedBy, currentUser.id]
        };
      }
      return n;
    });

    if (changed) {
      await saveNotifications(updated);
      loadNotifications();
    }
  };"""

new_mark_all = """  const handleMarkAllRead = async () => {
    if (!currentUser) return;

    const all = getNotifications();
    let changed = false;
    const updated = all.map(n => {
      const matchesTarget = n.targetUserId === 'all' || n.targetUserId === currentUser.id;
      if (matchesTarget && !n.dismissedBy.includes(currentUser.id)) {
        changed = true;
        
        // Background sync to firestore
        updateDoc(doc(db, 'notifications', n.id), {
          dismissedBy: arrayUnion(currentUser.id)
        }).catch(() => {});
        
        return {
          ...n,
          dismissedBy: [...n.dismissedBy, currentUser.id]
        };
      }
      return n;
    });

    if (changed) {
      localStorage.setItem('fid_invoice_notifications', JSON.stringify(updated));
      loadNotifications();
    }
  };"""
content = content.replace(old_mark_all, new_mark_all)

# Let's find handleRead
old_read = """  const handleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    const all = getNotifications();
    const updated = all.map(n => {
      if (n.id === id) {
        if (!n.dismissedBy.includes(currentUser.id)) {
          return {
            ...n,
            dismissedBy: [...n.dismissedBy, currentUser.id]
          };
        }
      }
      return n;
    });
    await saveNotifications(updated);
    loadNotifications();
  };"""
new_read = """  const handleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    const all = getNotifications();
    const updated = all.map(n => {
      if (n.id === id) {
        if (!n.dismissedBy.includes(currentUser.id)) {
          // Sync to firestore
          updateDoc(doc(db, 'notifications', n.id), {
            dismissedBy: arrayUnion(currentUser.id)
          }).catch(() => {});
          
          return {
            ...n,
            dismissedBy: [...n.dismissedBy, currentUser.id]
          };
        }
      }
      return n;
    });
    localStorage.setItem('fid_invoice_notifications', JSON.stringify(updated));
    loadNotifications();
  };"""
content = content.replace(old_read, new_read)

with open('src/components/NotificationCenter.tsx', 'w') as f:
    f.write(content)
