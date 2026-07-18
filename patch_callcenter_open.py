import re
with open('src/components/CallCenterChat.tsx', 'r') as f:
    content = f.read()

old_cond = "if (t.userId === userId) {"
new_cond = "if ((t.userId === userId) || (t.id === userId)) {"
content = content.replace(old_cond, new_cond)

with open('src/components/CallCenterChat.tsx', 'w') as f:
    f.write(content)
