import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

old_block = """    setCurrentUser(user);
    localStorage.setItem('fid_invoice_active_session', JSON.stringify(user));
    loadUserData(user.id);"""

new_block = """    // Ensure user is in allUsers
    const currentAllUsers = JSON.parse(localStorage.getItem('fid_invoice_all_users') || '[]');
    const existingIdx = currentAllUsers.findIndex((u: any) => u.id === user.id);
    if (existingIdx === -1) {
      currentAllUsers.push(user);
      localStorage.setItem('fid_invoice_all_users', JSON.stringify(currentAllUsers));
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: currentAllUsers })
      }).catch(err => console.warn('Failed to sync users after login:', err));
    } else {
      // Update info just in case
      currentAllUsers[existingIdx] = { ...currentAllUsers[existingIdx], ...user };
      localStorage.setItem('fid_invoice_all_users', JSON.stringify(currentAllUsers));
    }

    setCurrentUser(user);
    localStorage.setItem('fid_invoice_active_session', JSON.stringify(user));
    loadUserData(user.id);"""

content = content.replace(old_block, new_block)

with open('src/App.tsx', 'w') as f:
    f.write(content)
