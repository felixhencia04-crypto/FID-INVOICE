import re

with open('src/components/NotificationCenter.tsx', 'r') as f:
    content = f.read()

import_old = "import { getNotifications, saveNotifications } from '../utils/notificationService';"
import_new = "import { getNotifications, saveNotifications, syncNotifications } from '../utils/notificationService';"
content = content.replace(import_old, import_new)

effect_old = """  useEffect(() => {
    loadNotifications();

    const handleUpdate = () => {
      loadNotifications();
    };"""

effect_new = """  useEffect(() => {
    syncNotifications().then(() => loadNotifications());

    const handleUpdate = () => {
      loadNotifications();
    };
    
    const interval = setInterval(() => {
      syncNotifications().then(() => loadNotifications());
    }, 2000);"""

content = content.replace(effect_old, effect_new)

effect_close_old = """    return () => {
      window.removeEventListener('fid_notifications_updated', handleUpdate);
    };
  }, [currentUser]);"""

effect_close_new = """    return () => {
      window.removeEventListener('fid_notifications_updated', handleUpdate);
      clearInterval(interval);
    };
  }, [currentUser]);"""

content = content.replace(effect_close_old, effect_close_new)

with open('src/components/NotificationCenter.tsx', 'w') as f:
    f.write(content)
