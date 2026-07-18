import re
with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

old_idx = "const targetIdx = threads.findIndex((t: any) => t.userId === userId);"
new_idx = "const targetIdx = threads.findIndex((t: any) => (t.userId === userId) || (t.id === userId));"

content = content.replace(old_idx, new_idx)

# Also fix checking unreadForUser in loadChatHistory
old_unread = "const myThread = threads.find((t: any) => t.userId === userId);"
new_unread = "const myThread = threads.find((t: any) => (t.userId === userId) || (t.id === userId));"

content = content.replace(old_unread, new_unread)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)
