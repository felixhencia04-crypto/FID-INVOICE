import re
with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

read_old = """                          // Mark as read for owner
                          const list = JSON.parse(localStorage.getItem('fid_invoice_support_chats') || '[]');
                          const idx = list.findIndex((l: any) => (l.userId === idToSelect) || (l.id === idToSelect));
                          if (idx > -1) {
                            list[idx].unreadForOwner = false;
                            localStorage.setItem('fid_invoice_support_chats', JSON.stringify(list));
                          }"""
read_new = """                          // Mark as read for owner
                          const list = JSON.parse(localStorage.getItem('fid_invoice_support_chats') || '[]');
                          const idx = list.findIndex((l: any) => (l.userId === idToSelect) || (l.id === idToSelect));
                          if (idx > -1) {
                            list[idx].unreadForOwner = false;
                            localStorage.setItem('fid_invoice_support_chats', JSON.stringify(list));
                            updateDoc(doc(db, 'supportChats', idToSelect), { unreadForOwner: false }).catch(() => {});
                          }"""
content = content.replace(read_old, read_new)
with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
