import re
with open('src/components/QuotationManagement.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'onFeatureBlocked,\s*onAddClient,\s*onFeatureBlocked', 'onFeatureBlocked', content)

with open('src/components/QuotationManagement.tsx', 'w') as f:
    f.write(content)
