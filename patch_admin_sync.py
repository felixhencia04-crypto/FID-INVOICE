import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

import_old = "import { getNotifications, saveNotifications, createNotification } from '../utils/notificationService';"
import_new = "import { getNotifications, saveNotifications, createNotification, syncNotifications } from '../utils/notificationService';"
content = content.replace(import_old, import_new)

load_old = """  // Load system notifications
  const loadNotifications = () => {
    setNotificationsList(getNotifications());
  };"""

load_new = """  // Load system notifications
  const loadNotifications = async () => {
    await syncNotifications();
    setNotificationsList(getNotifications());
  };"""
content = content.replace(load_old, load_new)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
