import re
with open('src/components/AuthPage.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "body: JSON.stringify({ users: allUsers })",
    "body: JSON.stringify({ users: allUsers, overwrite: true })"
)

content = content.replace(
    "fetch('/api/users/sync'",
    "fetch('/api/users/sync-all'"
)

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(content)

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "body: JSON.stringify({ users: currentAllUsers })",
    "body: JSON.stringify({ users: currentAllUsers, overwrite: true })"
)

content = content.replace(
    "fetch('/api/users/sync',",
    "fetch('/api/users/sync-all',"
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
