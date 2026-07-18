import re

with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

old_user = """    // Update messages
    const chatKey = 'fid_invoice_chat_' + userId;
    const updatedMsgs = [...messages, newMsg];
    localStorage.setItem(chatKey, JSON.stringify(updatedMsgs));
    setMessages(updatedMsgs);"""

new_user = """    // Update messages
    const chatKey = 'fid_invoice_chat_' + userId;
    setMessages(prev => {
        const updatedMsgs = [...prev, newMsg];
        localStorage.setItem(chatKey, JSON.stringify(updatedMsgs));
        return updatedMsgs;
    });"""

content = content.replace(old_user, new_user)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)
