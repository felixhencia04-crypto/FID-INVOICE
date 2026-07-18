import re

with open('src/lib/firebase.ts', 'r') as f:
    content = f.read()

original_config = """const firebaseConfig = {
  apiKey: "AIzaSyBVBSJFkzaw1PUzDb1CXkuSFbrHFB5xODQ",
  authDomain: "fid-invoice.firebaseapp.com",
  projectId: "fid-invoice",
  storageBucket: "fid-invoice.firebasestorage.app",
  messagingSenderId: "406345521579",
  appId: "1:406345521579:web:c6797723f5d09de5821aee",
  measurementId: "G-3JGTSVQNZG"
};"""

content = re.sub(r'const firebaseConfig = \{.*?\};', original_config, content, flags=re.DOTALL)
content = content.replace('export const db = getFirestore(app, "ai-studio-fidinvoice-113f2c1e-5b42-4330-b445-295795b85286");', 'export const db = getFirestore(app);')

with open('src/lib/firebase.ts', 'w') as f:
    f.write(content)
