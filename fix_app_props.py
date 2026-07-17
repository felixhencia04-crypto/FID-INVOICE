import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Remove onAddClient from ReceiptManagement
content = re.sub(r'(<ReceiptManagement[^>]*?)(\s*onAddClient=\{handleAddClient\})', r'\1', content, flags=re.DOTALL)
content = re.sub(r'(<ReceiptManagement[^>]*?)(\s*onAddProduct=\{handleAddProduct\})', r'\1', content, flags=re.DOTALL)

# Remove onAddProduct from ClientManagement
content = re.sub(r'(<ClientManagement[^>]*?)(\s*onAddProduct=\{handleAddProduct\})', r'\1', content, flags=re.DOTALL)
content = re.sub(r'(<ClientManagement[^>]*?)(\s*onAddClient=\{handleAddClient\})', r'\1', content, flags=re.DOTALL)

# Remove onAddClient from ProductsServices
content = re.sub(r'(<ProductsServices[^>]*?)(\s*onAddClient=\{handleAddClient\})', r'\1', content, flags=re.DOTALL)
content = re.sub(r'(<ProductsServices[^>]*?)(\s*onAddProduct=\{handleAddProduct\})', r'\1', content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
