import re

with open('src/components/NotificationCenter.tsx', 'r') as f:
    content = f.read()

dismiss_old = """  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const all = getNotifications();
    const updated = all.map(n => {
      if (n.id === id) {
        const dismissed = n.dismissedBy || [];
        if (!dismissed.includes(currentUser?.id || '')) {
          return { ...n, dismissedBy: [...dismissed, currentUser?.id || ''], showPopup: false };
        }
      }
      return n;
    });
    saveNotifications(updated);
    
    // Update local state immediately
    const relevant = updated.filter(n => n.targetUserId === 'all' || n.targetUserId === currentUser?.id);
    setNotifications(relevant);
    setUnreadCount(relevant.filter(n => !n.dismissedBy?.includes(currentUser?.id || '')).length);
  };"""

dismiss_new = """  const dismissNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const all = getNotifications();
    const updated = all.map(n => {
      if (n.id === id) {
        const dismissed = n.dismissedBy || [];
        if (!dismissed.includes(currentUser?.id || '')) {
          return { ...n, dismissedBy: [...dismissed, currentUser?.id || ''], showPopup: false };
        }
      }
      return n;
    });
    
    // Optimistic
    localStorage.setItem('fid_invoice_notifications', JSON.stringify(updated));
    const relevant = updated.filter(n => n.targetUserId === 'all' || n.targetUserId === currentUser?.id);
    setNotifications(relevant);
    setUnreadCount(relevant.filter(n => !n.dismissedBy?.includes(currentUser?.id || '')).length);

    await saveNotifications(updated);
  };"""

content = content.replace(dismiss_old, dismiss_new)

with open('src/components/NotificationCenter.tsx', 'w') as f:
    f.write(content)
