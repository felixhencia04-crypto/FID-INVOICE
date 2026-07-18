with open('src/utils/notificationService.ts', 'w') as f:
    f.write("""import { AppNotification } from '../types';
import { db } from '../lib/firebase';
import { collection, doc, getDocs, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

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
  
  // We don't batch update all, we only rely on createNotification and markDismissed.
  // This is kept for backward compatibility locally.
};

export const syncNotifications = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'notifications'));
    const notifs: AppNotification[] = [];
    querySnapshot.forEach((doc) => {
      notifs.push(doc.data() as AppNotification);
    });
    
    notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    localStorage.setItem('fid_invoice_notifications', JSON.stringify(notifs));
    window.dispatchEvent(new Event('fid_notifications_updated'));
  } catch(e) {
    console.error('Failed to sync notifications from Firestore:', e);
  }
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
    await setDoc(doc(db, 'notifications', notifId), newNotif);
  } catch (e) {
    console.error('Failed to create notification in Firestore:', e);
  }
  
  return newNotif;
};
""")
