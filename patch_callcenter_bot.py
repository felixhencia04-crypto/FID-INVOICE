import re

with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

old_bot = """      const currentMsgs = JSON.parse(localStorage.getItem(chatKey) || '[]');
      const finalMsgs = [...currentMsgs, botMsg];
      localStorage.setItem(chatKey, JSON.stringify(finalMsgs));
      setMessages(finalMsgs);"""

new_bot = """      setMessages(prev => {
        const finalMsgs = [...prev, botMsg];
        localStorage.setItem(chatKey, JSON.stringify(finalMsgs));
        return finalMsgs;
      });"""

content = content.replace(old_bot, new_bot)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)
