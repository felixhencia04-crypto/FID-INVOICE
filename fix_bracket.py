import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("      localStorage.setItem(`fid_invoice_user_${userId}_data`, JSON.stringify(dataToSave));\n  };", "      localStorage.setItem(`fid_invoice_user_${userId}_data`, JSON.stringify(dataToSave));\n    }\n  };")

with open('src/App.tsx', 'w') as f:
    f.write(content)
