import { AppNotification } from '../types';

export const getNotifications = (): AppNotification[] => {
  try {
    const list = localStorage.getItem('fid_invoice_notifications');
    return list ? JSON.parse(list) : [];
  } catch (e) {
    return [];
  }
};

export const saveNotifications = (notifications: AppNotification[]) => {
  localStorage.setItem('fid_invoice_notifications', JSON.stringify(notifications));
};

export const createNotification = (
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
};
