import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    """    // Sync to backend server
    fetch('/api/users/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: newProfile })
    })""",
    """    // Sync to backend server
    fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: newProfile })
    })"""
)

content = content.replace(
    """    // Sync to backend server
    fetch('/api/users/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: updatedUser })
    })""",
    """    // Sync to backend server
    fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: updatedUser })
    })"""
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
