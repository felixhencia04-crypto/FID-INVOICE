import re
with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

old_idx = "const targetIdx = indexList.findIndex((item: any) => item.userId === selectedChatId);"
new_idx = "const targetIdx = indexList.findIndex((item: any) => (item.userId === selectedChatId) || (item.id === selectedChatId));"

content = content.replace(old_idx, new_idx)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
