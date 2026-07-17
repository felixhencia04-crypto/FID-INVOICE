import re

with open('src/components/QuotationManagement.tsx', 'r') as f:
    content = f.read()

content = content.replace('  onFeatureBlocked,\n  onAddClient,\n  onAddProduct?: (featureName: string) => void;', '  onFeatureBlocked?: (featureName: string) => void;')
content = content.replace('  onFeatureBlocked,\n  onAddClient,\n  onAddProduct\n}: QuotationManagementProps) {', '  onFeatureBlocked,\n  onAddClient,\n  onAddProduct\n}: QuotationManagementProps) {')

with open('src/components/QuotationManagement.tsx', 'w') as f:
    f.write(content)
