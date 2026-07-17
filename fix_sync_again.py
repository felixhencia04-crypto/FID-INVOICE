import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

old_auth = """    localStorage.setItem('fid_invoice_all_users', JSON.stringify(currentAllUsers));
    fetch('/api/users/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: currentAllUsers, overwrite: true })
    }).catch(err => console.warn('Failed to sync users after login:', err));"""

new_auth = """    localStorage.setItem('fid_invoice_all_users', JSON.stringify(currentAllUsers));
    fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    }).catch(err => console.warn('Failed to sync user after login:', err));"""

content = content.replace(old_auth, new_auth)

with open('src/App.tsx', 'w') as f:
    f.write(content)
