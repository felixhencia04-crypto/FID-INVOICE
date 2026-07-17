import re
with open('src/components/AuthPage.tsx', 'r') as f:
    content = f.read()

old_block = """      await setDoc(doc(db, 'users', user.uid), {
        ...newUser,
        active: true
      });
      
      setIsLoading(false);
      onAuthSuccess(newUser);"""

new_block = """      await setDoc(doc(db, 'users', user.uid), {
        ...newUser,
        active: true
      });
      
      const allUsersStr = localStorage.getItem('fid_invoice_all_users') || '[]';
      const allUsers = JSON.parse(allUsersStr);
      allUsers.push(newUser);
      localStorage.setItem('fid_invoice_all_users', JSON.stringify(allUsers));
      
      try {
        await fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: allUsers })
        });
      } catch (err) {
        console.warn('Failed to sync new email user to server:', err);
      }
      
      setIsLoading(false);
      onAuthSuccess(newUser);"""

content = content.replace(old_block, new_block)

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(content)
