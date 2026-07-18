import re

with open('src/utils/notificationService.ts', 'r') as f:
    content = f.read()

# Make saveNotifications async
save_old = """export const saveNotifications = (notifications: AppNotification[]) => {
  localStorage.setItem('fid_invoice_notifications', JSON.stringify(notifications));
  
  // Sync to server in background
  fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notifications })
  }).catch(e => console.error(e));
};"""

save_new = """export const saveNotifications = async (notifications: AppNotification[]) => {
  localStorage.setItem('fid_invoice_notifications', JSON.stringify(notifications));
  
  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifications })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.notifications) {
        localStorage.setItem('fid_invoice_notifications', JSON.stringify(data.notifications));
        window.dispatchEvent(new Event('fid_notifications_updated'));
      }
    }
  } catch (e) {
    console.error(e);
  }
};"""

content = content.replace(save_old, save_new)

# Make createNotification async
create_old = """export const createNotification = (
  type: 'info' | 'success' | 'warning' | 'maintenance',
  title: string,
  message: string,
  targetUserId: string = 'all'
): AppNotification => {
  const notifications = getNotifications();
  const newNotif: AppNotification = {
    id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 7),
    type,
    title,
    message,
    targetUserId,
    createdAt: new Date().toISOString(),
    dismissedBy: [],
    showPopup: true
  };
  notifications.unshift(newNotif);
  saveNotifications(notifications);
  
  // Dispatch custom event so that active UI updates immediately
  window.dispatchEvent(new Event('fid_notifications_updated'));
  return newNotif;
};"""

create_new = """export const createNotification = async (
  type: 'info' | 'success' | 'warning' | 'maintenance',
  title: string,
  message: string,
  targetUserId: string = 'all'
): Promise<AppNotification> => {
  const notifications = getNotifications();
  const newNotif: AppNotification = {
    id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 7),
    type,
    title,
    message,
    targetUserId,
    createdAt: new Date().toISOString(),
    dismissedBy: [],
    showPopup: true
  };
  notifications.unshift(newNotif);
  
  // Optimistic UI update
  localStorage.setItem('fid_invoice_notifications', JSON.stringify(notifications));
  window.dispatchEvent(new Event('fid_notifications_updated'));
  
  await saveNotifications(notifications);
  return newNotif;
};"""

content = content.replace(create_old, create_new)

with open('src/utils/notificationService.ts', 'w') as f:
    f.write(content)
