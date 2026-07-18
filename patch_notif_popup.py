import re
with open('src/components/NotificationCenter.tsx', 'r') as f:
    content = f.read()

old_popup = """        // Turn off popup flag so it doesn't show again
        latest.showPopup = false;
        saveNotifications(notifications);"""

new_popup = """        // Turn off popup flag so it doesn't show again
        latest.showPopup = false;
        localStorage.setItem('fid_invoice_notifications', JSON.stringify(notifications));
        // Sync to firestore to prevent repeated popups
        updateDoc(doc(db, 'notifications', latest.id), { showPopup: false }).catch(() => {});"""

content = content.replace(old_popup, new_popup)
with open('src/components/NotificationCenter.tsx', 'w') as f:
    f.write(content)
