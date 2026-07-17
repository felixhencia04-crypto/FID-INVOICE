import re
with open('src/components/AuthPage.tsx', 'r') as f:
    content = f.read()

old_google = """          await fetch('/api/users/sync-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: allUsers, overwrite: true })
          });"""

new_google = """          await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: userProfile })
          });"""

content = content.replace(old_google, new_google)

old_email = """        await fetch('/api/users/sync-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: allUsers, overwrite: true })
        });"""

new_email = """        await fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: newUser })
        });"""

content = content.replace(old_email, new_email)

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(content)
