import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

old_auth = """    const existingIdx = currentAllUsers.findIndex((u: any) => u.id === user.id);
    if (existingIdx === -1) {
      currentAllUsers.push(user);
      localStorage.setItem('fid_invoice_all_users', JSON.stringify(currentAllUsers));
      fetch('/api/users/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: currentAllUsers, overwrite: true })
      }).catch(err => console.warn('Failed to sync users after login:', err));
    } else {
      // Update info just in case
      currentAllUsers[existingIdx] = { ...currentAllUsers[existingIdx], ...user };
      localStorage.setItem('fid_invoice_all_users', JSON.stringify(currentAllUsers));
    }"""

new_auth = """    const existingIdx = currentAllUsers.findIndex((u: any) => u.id === user.id);
    if (existingIdx === -1) {
      currentAllUsers.push(user);
    } else {
      currentAllUsers[existingIdx] = { ...currentAllUsers[existingIdx], ...user };
    }
    
    localStorage.setItem('fid_invoice_all_users', JSON.stringify(currentAllUsers));
    fetch('/api/users/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: currentAllUsers, overwrite: true })
    }).catch(err => console.warn('Failed to sync users after login:', err));"""

content = content.replace(old_auth, new_auth)

with open('src/App.tsx', 'w') as f:
    f.write(content)
