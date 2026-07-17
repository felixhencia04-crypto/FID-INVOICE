import re

# Fix App.tsx missing props
with open('src/App.tsx', 'r') as f:
    app_content = f.read()

app_content = re.sub(r'(<ClientManagement[^>]*?onDeleteClient=\{handleDeleteClient\})', r'\1\n            onAddClient={handleAddClient}\n            onEditClient={handleEditClient}', app_content, flags=re.DOTALL)
app_content = re.sub(r'(<ProductsServices[^>]*?onDeleteProduct=\{handleDeleteProduct\})', r'\1\n            onAddProduct={handleAddProduct}', app_content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(app_content)

# Fix AuthPage.tsx missing plan
with open('src/components/AuthPage.tsx', 'r') as f:
    auth_content = f.read()

auth_content = re.sub(r'(status:\s*(?:'\''|")active(?:'\''|")\s*\|\s*(?:'\''|")trial(?:'\''|"),)', r"plan: selectedPlan,\n            \1", auth_content)

with open('src/components/AuthPage.tsx', 'w') as f:
    f.write(auth_content)

# Fix QuotationManagement.tsx comma operator
with open('src/components/QuotationManagement.tsx', 'r') as f:
    qm_content = f.read()

qm_content = re.sub(r'onAddProduct\([^,]+,\s*(newProduct[^)]*)\)', r'onAddProduct(\1)', qm_content)

with open('src/components/QuotationManagement.tsx', 'w') as f:
    f.write(qm_content)

