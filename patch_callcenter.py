import re

with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

old_update = """    // Update messages
    const chatKey = 'fid_invoice_chat_' + userId;
    const existingMsgs = JSON.parse(localStorage.getItem(chatKey) || '[]');
    const updatedMsgs = [...existingMsgs, newMsg];
    localStorage.setItem(chatKey, JSON.stringify(updatedMsgs));
    setMessages(updatedMsgs);"""

new_update = """    // Update messages
    const chatKey = 'fid_invoice_chat_' + userId;
    const updatedMsgs = [...messages, newMsg];
    localStorage.setItem(chatKey, JSON.stringify(updatedMsgs));
    setMessages(updatedMsgs);"""

content = content.replace(old_update, new_update)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)
