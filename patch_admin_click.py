import re
with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

# Fix onClick for thread
old_click = """                        onClick={() => {
                          setSelectedChatId(thread.userId);
                          loadChatMessages(thread.userId);
                          
                          // Mark as read for owner
                          const list = JSON.parse(localStorage.getItem('fid_invoice_support_chats') || '[]');
                          const idx = list.findIndex((l: any) => l.userId === thread.userId);
                          if (idx > -1) {
                            list[idx].unreadForOwner = false;
                            localStorage.setItem('fid_invoice_support_chats', JSON.stringify(list));
                          }
                        }}"""

new_click = """                        onClick={() => {
                          const idToSelect = thread.userId || thread.id;
                          setSelectedChatId(idToSelect);
                          loadChatMessages(idToSelect);
                          
                          // Mark as read for owner
                          const list = JSON.parse(localStorage.getItem('fid_invoice_support_chats') || '[]');
                          const idx = list.findIndex((l: any) => (l.userId === idToSelect) || (l.id === idToSelect));
                          if (idx > -1) {
                            list[idx].unreadForOwner = false;
                            localStorage.setItem('fid_invoice_support_chats', JSON.stringify(list));
                          }
                        }}"""

content = content.replace(old_click, new_click)

# Fix key
old_key = """                    <div 
                      key={thread.userId}"""
                      
new_key = """                    <div 
                      key={thread.userId || thread.id}"""
content = content.replace(old_key, new_key)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
