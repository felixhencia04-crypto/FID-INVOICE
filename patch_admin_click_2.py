import re
with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

content = content.replace("const isSelected = selectedChatId === thread.userId;", "const isSelected = selectedChatId === (thread.userId || thread.id);")
content = content.replace("key={thread.userId}", "key={thread.userId || thread.id}")

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
