with open('src/utils/notificationService.ts', 'w') as f:
    f.write("""import { AppNotification } from '../types';

export const getNotifications = (): AppNotification[] => {
  try {
    const list = localStorage.getItem('fid_invoice_notifications');
    return list ? JSON.parse(list) : [];
  } catch (e) {
    return [];
  }
};

export const saveNotifications = async (notifications: AppNotification[]) => {
  localStorage.setItem('fid_invoice_notifications', JSON.stringify(notifications));
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifications })
    });
  } catch (e) {}
};

export const syncNotifications = async () => {
  try {
    const res = await fetch('/api/notifications');
    if (res.ok) {
      const data = await res.json();
      if (data.notifications) {
        localStorage.setItem('fid_invoice_notifications', JSON.stringify(data.notifications));
        window.dispatchEvent(new Event('fid_notifications_updated'));
      }
    }
  } catch(e) {}
};

export const createNotification = async (
  type: 'info' | 'success' | 'warning' | 'maintenance',
  title: string,
  message: string,
  targetUserId: string = 'all'
): Promise<AppNotification> => {
  
  const notifId = 'notif_' + Date.now() + Math.random().toString(36).substring(2, 7);
  const newNotif: AppNotification = {
    id: notifId,
    type,
    title,
    message,
    targetUserId,
    createdAt: new Date().toISOString(),
    dismissedBy: [],
    showPopup: true
  };
  
  const notifications = getNotifications();
  notifications.unshift(newNotif);
  
  // Optimistic UI update
  localStorage.setItem('fid_invoice_notifications', JSON.stringify(notifications));
  window.dispatchEvent(new Event('fid_notifications_updated'));
  
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifications: [newNotif] })
    });
  } catch (e) {}
  
  return newNotif;
};
""")
