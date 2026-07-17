import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

old_block = """    // Save to LocalStorage for offline fallback
    try {
      localStorage.setItem(`fid_invoice_user_${userId}_data`, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('LocalStorage quota exceeded. Firebase sync will continue.', e);
    }
    // Save to Firebase
    const oldDataStr = localStorage.getItem(`fid_invoice_user_${userId}_data`);
    let oldData = null;
    if (oldDataStr) { try { oldData = JSON.parse(oldDataStr); } catch (e) {} }
    syncToFirebaseSubcollections(userId, oldData, dataToSave);"""

new_block = """    // Get old data for diffing BEFORE updating local storage
    const oldDataStr = localStorage.getItem(`fid_invoice_user_${userId}_data`);
    let oldData = null;
    if (oldDataStr) { try { oldData = JSON.parse(oldDataStr); } catch (e) {} }

    // Save to LocalStorage for offline fallback
    try {
      localStorage.setItem(`fid_invoice_user_${userId}_data`, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('LocalStorage quota exceeded. Firebase sync will continue.', e);
    }
    
    // Save to Firebase
    syncToFirebaseSubcollections(userId, oldData, dataToSave);"""

content = content.replace(old_block, new_block)

with open('src/App.tsx', 'w') as f:
    f.write(content)
