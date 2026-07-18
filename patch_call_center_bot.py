import re

with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

bot_reply_old = "setDoc(doc(db, 'supportChats', userId), { ...threadInfo, unreadForOwner: false }).catch(e => console.error(e));"
bot_reply_new = "setDoc(doc(db, 'supportChats', userId), { ...threadInfo, unreadForOwner: true, lastMessage: replyText.substring(0, 60) + '...' }).catch(e => console.error(e));"

content = content.replace(bot_reply_old, bot_reply_new)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)

