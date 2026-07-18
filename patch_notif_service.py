import re

with open('src/utils/notificationService.ts', 'r') as f:
    content = f.read()

# Replace saveNotifications
save_old = """export const saveNotifications = (notifications: AppNotification[]) => {
  localStorage.setItem('fid_invoice_notifications', JSON.stringify(notifications));
};"""

save_new = """export const saveNotifications = (notifications: AppNotification[]) => {
  localStorage.setItem('fid_invoice_notifications', JSON.stringify(notifications));
  
  // Sync to server in background
  fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notifications })
  }).catch(e => console.error(e));
};

export const syncNotifications = async () => {
  try {
    const res = await fetch('/api/notifications');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.notifications) {
        localStorage.setItem('fid_invoice_notifications', JSON.stringify(data.notifications));
        window.dispatchEvent(new Event('fid_notifications_updated'));
      }
    }
  } catch(e) {}
};"""

content = content.replace(save_old, save_new)

with open('src/utils/notificationService.ts', 'w') as f:
    f.write(content)
