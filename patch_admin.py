import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

old_update = """    const chatKey = 'fid_invoice_chat_' + selectedChatId;
    const existingMsgs = JSON.parse(localStorage.getItem(chatKey) || '[]');
    const updatedMsgs = [...existingMsgs, newMsg];
    localStorage.setItem(chatKey, JSON.stringify(updatedMsgs));
    setChatMessages(updatedMsgs);"""

new_update = """    const chatKey = 'fid_invoice_chat_' + selectedChatId;
    const updatedMsgs = [...chatMessages, newMsg];
    localStorage.setItem(chatKey, JSON.stringify(updatedMsgs));
    setChatMessages(updatedMsgs);"""

content = content.replace(old_update, new_update)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
